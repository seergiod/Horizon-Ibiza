import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { hashPassword } from "../lib/auth.js";
import * as XLSX from "xlsx";
import multer from "multer";
import { z } from "zod";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth);

const createUserSchema = z.object({
  nombre:    z.string().min(1),
  apellidos: z.string().default(""),
  dni:       z.string().optional().nullable(),
  email:     z.string().email(),
  username:  z.string().min(2),
  telefono:  z.string().optional().nullable(),
  password:  z.string().min(6),
  rol:       z.enum(["admin", "empleado"]).default("empleado"),
  estado:    z.enum(["activo", "inactivo"]).default("activo"),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
});

/* ── GET /api/users ── */
router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        nombre: usersTable.nombre,
        apellidos: usersTable.apellidos,
        dni: usersTable.dni,
        email: usersTable.email,
        username: usersTable.username,
        telefono: usersTable.telefono,
        rol: usersTable.rol,
        estado: usersTable.estado,
        fecha_creacion: usersTable.fecha_creacion,
      })
      .from(usersTable)
      .orderBy(usersTable.fecha_creacion);
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/* ── GET /api/users/:id ── */
router.get("/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
  const [user] = await db
    .select({
      id: usersTable.id,
      nombre: usersTable.nombre,
      apellidos: usersTable.apellidos,
      dni: usersTable.dni,
      email: usersTable.email,
      username: usersTable.username,
      telefono: usersTable.telefono,
      rol: usersTable.rol,
      estado: usersTable.estado,
      fecha_creacion: usersTable.fecha_creacion,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id));
  if (!user) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
  res.json(user);
});

/* ── POST /api/users ── */
router.post("/users", requireAdmin, async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  const { password, ...rest } = parsed.data;
  try {
    const [created] = await db.insert(usersTable).values({
      ...rest,
      password_hash: await hashPassword(password),
    }).returning({
      id: usersTable.id, nombre: usersTable.nombre, email: usersTable.email,
      username: usersTable.username, rol: usersTable.rol, estado: usersTable.estado,
      fecha_creacion: usersTable.fecha_creacion,
    });
    res.status(201).json(created);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      res.status(409).json({ error: "El email, username o DNI ya existe" });
    } else {
      res.status(500).json({ error: "Error al crear usuario" });
    }
  }
});

/* ── PUT /api/users/:id ── */
router.put("/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  const { password, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (password) updateData.password_hash = await hashPassword(password);

  try {
    const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning({
      id: usersTable.id, nombre: usersTable.nombre, email: usersTable.email,
      username: usersTable.username, rol: usersTable.rol, estado: usersTable.estado,
    });
    if (!updated) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

/* ── DELETE /api/users/:id ── */
router.delete("/users/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
  if (!deleted) { res.status(404).json({ error: "Usuario no encontrado" }); return; }
  res.json({ ok: true });
});

/* ── POST /api/users/import ── */
router.post("/users/import", requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "Archivo requerido" }); return; }

  const dryRun = req.query.dryrun === "true";

  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

    const preview: Array<{
      row: number;
      data: Record<string, string>;
      errors: string[];
      willImport: boolean;
    }> = [];

    const importRows: Array<typeof usersTable.$inferInsert> = [];
    const seenEmails = new Set<string>();
    const seenDnis = new Set<string>();
    const seenUsernames = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const data: Record<string, string> = {
        nombre:    String(raw.nombre ?? raw.Nombre ?? "").trim(),
        apellidos: String(raw.apellidos ?? raw.Apellidos ?? "").trim(),
        dni:       String(raw.dni ?? raw.DNI ?? raw.Dni ?? "").trim(),
        email:     String(raw.email ?? raw.Email ?? raw.EMAIL ?? "").trim().toLowerCase(),
        username:  String(raw.username ?? raw.Username ?? raw.usuario ?? "").trim(),
        telefono:  String(raw.telefono ?? raw.Telefono ?? raw.phone ?? "").trim(),
        rol:       String(raw.rol ?? raw.Rol ?? raw.role ?? "empleado").trim().toLowerCase(),
        password:  String(raw.password ?? raw.contraseña ?? raw.Password ?? "").trim(),
      };

      const errors: string[] = [];
      if (!data.nombre) errors.push("Nombre requerido");
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("Email inválido");
      if (!data.username) data.username = data.email.split("@")[0];
      if (!["admin", "empleado"].includes(data.rol)) data.rol = "empleado";
      if (seenEmails.has(data.email)) errors.push("Email duplicado en el archivo");
      if (data.dni && seenDnis.has(data.dni)) errors.push("DNI duplicado en el archivo");
      if (seenUsernames.has(data.username)) {
        data.username = `${data.username}_${i + 1}`;
      }

      seenEmails.add(data.email);
      if (data.dni) seenDnis.add(data.dni);
      seenUsernames.add(data.username);

      const willImport = errors.length === 0;
      preview.push({ row: i + 2, data, errors, willImport });

      if (willImport && !dryRun) {
        importRows.push({
          nombre:        data.nombre,
          apellidos:     data.apellidos,
          dni:           data.dni || null,
          email:         data.email,
          username:      data.username,
          telefono:      data.telefono || null,
          password_hash: await hashPassword(data.password || "cambiar123"),
          rol:           data.rol as "admin" | "empleado",
          estado:        "activo",
        });
      }
    }

    let inserted = 0;
    let skipped = 0;

    if (!dryRun && importRows.length > 0) {
      for (const row of importRows) {
        try {
          await db.insert(usersTable).values(row);
          inserted++;
        } catch {
          skipped++;
        }
      }
    }

    const valid = preview.filter(r => r.willImport).length;
    const invalid = preview.filter(r => !r.willImport).length;

    res.json({
      total: rows.length,
      valid,
      invalid,
      inserted: dryRun ? 0 : inserted,
      skipped: dryRun ? 0 : skipped,
      dryRun,
      preview: preview.slice(0, 50),
    });
  } catch (err) {
    res.status(500).json({ error: "Error al procesar el archivo" });
  }
});

export default router;

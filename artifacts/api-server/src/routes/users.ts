import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, or, and } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { hashPassword } from "../lib/auth.js";
import { respondError, Errors, AppError } from "../lib/errors.js";
import { rateLimit } from "../lib/rate-limit.js";
import * as XLSX from "xlsx";
import multer from "multer";
import { z } from "zod";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(requireAuth);

const phoneRegex = /^\+?[\d\s\-().]{6,25}$/;

const createUserSchema = z.object({
  nombre:    z.string().min(1, "El nombre es obligatorio").transform(s => s.trim()),
  apellidos: z.string().default("").transform(s => s.trim()),
  dni:       z.string().transform(s => s.trim()).optional().nullable(),
  email:     z.string().email("Introduce un email válido").transform(s => s.trim().toLowerCase()),
  username:  z.string().min(2, "El usuario debe tener al menos 2 caracteres").transform(s => s.trim()),
  telefono:  z.string()
    .transform(s => s.trim())
    .refine(v => !v || phoneRegex.test(v), "Formato de teléfono inválido (ej: +34 6XX XXX XXX)")
    .optional().nullable(),
  password:  z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
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
  } catch (err) {
    respondError(res, Errors.DB_ERROR("usuarios", "obtener"));
  }
});

/* ── GET /api/users/:id ── */
router.get("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      respondError(res, Errors.INVALID_ID);
      return;
    }
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
    if (!user) {
      respondError(res, Errors.NOT_FOUND("Usuario"));
      return;
    }
    res.json(user);
  } catch (err) {
    respondError(res, Errors.DB_ERROR("usuario", "obtener"));
  }
});

/* ── POST /api/users ── */
// Rate limit: 10 user creations per 15 minutes per IP
router.post(
  "/users",
  requireAdmin,
  rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 10 }),
  async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      respondError(res, Errors.INVALID_DATA(parsed.error.issues));
      return;
    }
    const { password, ...rest } = parsed.data;
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
      respondError(res, new AppError("DUPLICATE_KEY", "El email, username o DNI ya existe", 409));
    } else {
      respondError(res, Errors.DB_ERROR("usuario", "crear"));
    }
  }
});

/* ── PUT /api/users/:id ── */
router.put("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      respondError(res, Errors.INVALID_ID);
      return;
    }
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      respondError(res, Errors.INVALID_DATA(parsed.error.issues));
      return;
    }
    const { password, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (password) updateData.password_hash = await hashPassword(password);
    const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, id)).returning({
      id: usersTable.id, nombre: usersTable.nombre, email: usersTable.email,
      username: usersTable.username, rol: usersTable.rol, estado: usersTable.estado,
    });
    if (!updated) {
      respondError(res, Errors.NOT_FOUND("Usuario"));
      return;
    }
    res.json(updated);
  } catch (err) {
    respondError(res, Errors.DB_ERROR("usuario", "actualizar"));
  }
});

/* ── DELETE /api/users/:id ── */
router.delete("/users/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      respondError(res, Errors.INVALID_ID);
      return;
    }
    const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, id)).returning({ id: usersTable.id });
    if (!deleted) {
      respondError(res, Errors.NOT_FOUND("Usuario"));
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    respondError(res, Errors.DB_ERROR("usuario", "eliminar"));
  }
});

/* ── POST /api/users/import ── */
router.post("/users/import", requireAdmin, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      respondError(res, new AppError("NO_FILE", "Archivo requerido", 400));
      return;
    }

  const dryRun = req.query.dryrun === "true";

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
    respondError(res, Errors.PARSE_ERROR());
  }
});

export default router;

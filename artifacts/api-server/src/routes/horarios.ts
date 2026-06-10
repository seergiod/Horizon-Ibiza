import { Router } from "express";
import { db, horarioVersionesTable, turnosTable, usersTable } from "@workspace/db";
import { eq, desc, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { respondError, Errors, AppError } from "../lib/errors.js";
import multer from "multer";
import { z } from "zod";
import { logger } from "../lib/logger.js";

const router = Router();
router.use(requireAuth);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const turnoSchema = z.object({
  empleado_nombre: z.string().min(1),
  user_id:         z.number().nullable().optional(),
  dia:             z.string().min(1),
  seccion:         z.string().nullable().optional(),
  hora_inicio:     z.string().nullable().optional(),
  hora_fin:        z.string().nullable().optional(),
  estado:          z.enum(["trabaja", "libre", "modificado"]).default("trabaja"),
  turno_tipo:      z.string().nullable().optional(),
  notas:           z.string().nullable().optional(),
});

const guardarVersionSchema = z.object({
  semana_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nombre:        z.string().optional(),
  notas:         z.string().optional(),
  turnos:        z.array(turnoSchema).min(1),
});

/* ── GET /api/horarios/versiones ── */
router.get("/horarios/versiones", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(horarioVersionesTable)
      .orderBy(desc(horarioVersionesTable.fecha_creacion));
    res.json(rows);
  } catch {
    respondError(res, Errors.DB_ERROR("versiones", "obtener"));
  }
});

/* ── GET /api/horarios/versiones/:id ── */
router.get("/horarios/versiones/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { respondError(res, Errors.INVALID_ID); return; }

    const [version] = await db
      .select()
      .from(horarioVersionesTable)
      .where(eq(horarioVersionesTable.id, id));

    if (!version) { respondError(res, Errors.NOT_FOUND("Versión")); return; }

    const turnos = await db
      .select()
      .from(turnosTable)
      .where(eq(turnosTable.version_id, id));

    res.json({ ...version, turnos });
  } catch {
    respondError(res, Errors.DB_ERROR("versión", "obtener"));
  }
});

/* ── GET /api/horarios/mios ── */
router.get("/horarios/mios", async (req, res) => {
  try {
    const user = (req as typeof req & { user: { id: number; username: string } }).user;

    const [dbUser] = await db
      .select({ id: usersTable.id, nombre: usersTable.nombre, apellidos: usersTable.apellidos })
      .from(usersTable)
      .where(eq(usersTable.id, user.id));

    if (!dbUser) { respondError(res, Errors.NOT_FOUND("Usuario")); return; }

    const nombreCompleto = `${dbUser.nombre} ${dbUser.apellidos}`.trim().toUpperCase();
    const primerNombre   = dbUser.nombre.toUpperCase();

    const latestVersion = await db
      .select()
      .from(horarioVersionesTable)
      .orderBy(desc(horarioVersionesTable.fecha_creacion))
      .limit(1);

    if (latestVersion.length === 0) { res.json({ version: null, turnos: [] }); return; }

    const version = latestVersion[0];
    const allTurnos = await db
      .select()
      .from(turnosTable)
      .where(eq(turnosTable.version_id, version.id));

    const misTurnos = allTurnos.filter(t => {
      const n = t.empleado_nombre.toUpperCase();
      return n === nombreCompleto || n === primerNombre || n.includes(primerNombre);
    });

    res.json({ version, turnos: misTurnos });
  } catch {
    respondError(res, Errors.DB_ERROR("horarios", "obtener"));
  }
});

/* ── POST /api/horarios/versiones ── admin only ── */
router.post("/horarios/versiones", requireAdmin, async (req, res) => {
  try {
    const parsed = guardarVersionSchema.safeParse(req.body);
    if (!parsed.success) {
      respondError(res, Errors.INVALID_DATA(parsed.error.flatten()));
      return;
    }

    const user = (req as typeof req & { user: { id: number } }).user;
    const { semana_inicio, nombre, notas, turnos } = parsed.data;

    const prevVersions = await db
      .select({ id: horarioVersionesTable.id })
      .from(horarioVersionesTable)
      .where(eq(horarioVersionesTable.semana_inicio, semana_inicio))
      .orderBy(desc(horarioVersionesTable.fecha_creacion))
      .limit(1);

    const [newVersion] = await db
      .insert(horarioVersionesTable)
      .values({ semana_inicio, nombre: nombre ?? `Semana ${semana_inicio}`, notas, creado_por: user.id })
      .returning();

    let cambios: string[] = [];

    if (prevVersions.length > 0) {
      const prevTurnos = await db
        .select()
        .from(turnosTable)
        .where(eq(turnosTable.version_id, prevVersions[0].id));

      turnos.forEach(t => {
        const prev = prevTurnos.find(
          p => p.empleado_nombre.toUpperCase() === t.empleado_nombre.toUpperCase() && p.dia === t.dia
        );
        if (prev && (prev.hora_inicio !== t.hora_inicio || prev.hora_fin !== t.hora_fin || prev.estado !== t.estado)) {
          t.estado = "modificado";
          cambios.push(`${t.empleado_nombre} ${t.dia}`);
        }
      });
    }

    if (turnos.length > 0) {
      await db.insert(turnosTable).values(
        turnos.map(t => ({
          version_id:      newVersion.id,
          empleado_nombre: t.empleado_nombre,
          user_id:         t.user_id ?? null,
          dia:             t.dia,
          seccion:         t.seccion ?? null,
          hora_inicio:     t.hora_inicio ?? null,
          hora_fin:        t.hora_fin ?? null,
          estado:          t.estado,
          turno_tipo:      t.turno_tipo ?? null,
          notas:           t.notas ?? null,
          es_cambio:       t.estado === "modificado",
        }))
      );
    }

    if (cambios.length > 0) {
      void enviarSmsAEmpleados(cambios, semana_inicio);
    }

    res.status(201).json({ ...newVersion, cambios });
  } catch (err) {
    logger.error({ err }, "Error guardando versión de horario");
    respondError(res, Errors.DB_ERROR("horario", "guardar"));
  }
});

/* ── DELETE /api/horarios/versiones/:id ── admin only ── */
router.delete("/horarios/versiones/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { respondError(res, Errors.INVALID_ID); return; }
    await db.delete(turnosTable).where(eq(turnosTable.version_id, id));
    await db.delete(horarioVersionesTable).where(eq(horarioVersionesTable.id, id));
    res.json({ ok: true });
  } catch {
    respondError(res, Errors.DB_ERROR("versión", "eliminar"));
  }
});

/* ── SMS helper (Twilio, optional) ── */
async function enviarSmsAEmpleados(cambios: string[], semana: string) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    logger.info({ cambios }, "SMS omitido: credenciales Twilio no configuradas");
    return;
  }

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(sid, token);

    const nombres = [...new Set(cambios.map(c => c.split(" ")[0]))];

    const empleados = await db
      .select({ nombre: usersTable.nombre, telefono: usersTable.telefono })
      .from(usersTable)
      .where(inArray(usersTable.nombre, nombres));

    for (const emp of empleados) {
      if (!emp.telefono) continue;
      try {
        await client.messages.create({
          body: `Hola ${emp.nombre}, tu horario de la semana del ${semana} ha sido modificado. Revisa la app.`,
          from,
          to: emp.telefono,
        });
        logger.info({ nombre: emp.nombre }, "SMS enviado");
      } catch (e) {
        logger.warn({ nombre: emp.nombre, err: e }, "Error enviando SMS");
      }
    }
  } catch (e) {
    logger.warn({ err: e }, "Error inicializando Twilio");
  }
}

export default router;

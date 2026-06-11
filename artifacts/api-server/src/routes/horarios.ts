import { Router } from "express";
import { db, horarioVersionesTable, turnosTable, usersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { respondError, Errors } from "../lib/errors.js";
import multer from "multer";
import { z } from "zod";
import { logger } from "../lib/logger.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();
router.use(["/horarios", "/horarios/*path"], requireAuth);

/* ── In-memory background job store ── */
type JobStatus = "pending" | "processing" | "done" | "error";

interface TurnoResult {
  empleado_nombre: string;
  dia: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: "trabaja" | "libre" | "vacaciones";
  seccion: string | null;
  notas: null;
}

interface Job {
  status: JobStatus;
  message: string;
  result?: { turnos: TurnoResult[]; raw: string };
  error?: string;
  createdAt: number;
}

const jobStore = new Map<string, Job>();

// Clean up jobs older than 15 minutes
setInterval(() => {
  const cutoff = Date.now() - 15 * 60 * 1000;
  for (const [id, job] of jobStore) {
    if (job.createdAt < cutoff) jobStore.delete(id);
  }
}, 60_000);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const turnoSchema = z.object({
  empleado_nombre: z.string().min(1),
  user_id:         z.number().nullable().optional(),
  dia:             z.string().min(1),
  seccion:         z.string().nullable().optional(),
  hora_inicio:     z.string().nullable().optional(),
  hora_fin:        z.string().nullable().optional(),
  estado:          z.enum(["trabaja", "libre", "modificado", "vacaciones"]).default("trabaja"),
  turno_tipo:      z.string().nullable().optional(),
  notas:           z.string().nullable().optional(),
});

const guardarVersionSchema = z.object({
  semana_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nombre:        z.string().optional(),
  notas:         z.string().optional(),
  turnos:        z.array(turnoSchema).min(1),
});

/* ── Helper: process image with Gemini (runs in background) ── */
async function processImageJob(jobId: string, rawBuffer: Buffer, apiKey: string, mimeType: string) {
  const job = jobStore.get(jobId);
  if (!job) return;

  job.status = "processing";
  job.message = "Analizando imagen con IA…";

  const base64 = rawBuffer.toString("base64");

  const PROMPT = `Analiza este cuadrante de horarios de hostelería. Devuelve ÚNICAMENTE un array JSON válido sin bloques markdown.

REGLAS DE PROCESAMIENTO OBLIGATORIAS:
1. ANÁLISIS POR COLUMNA: Debes procesar CADA COLUMNA de empleados de forma independiente. No asumas que porque un empleado tenga el mismo nombre que otro, sus horarios son iguales.
2. NOMBRES ÚNICOS: Cada empleado DEBE llevar su sección entre paréntesis: 'Nombre (Sección)'. Ejemplo: 'Sergio (sala tarde)' y 'Sergio (piscina)'.
3. LECTURA CELDA A CELDA: Para CADA DÍA de la semana, mira físicamente la celda correspondiente a ese empleado en esa columna específica.
   - Si la celda tiene una 'X': estado 'vacaciones', inicio '', fin ''.
   - Si dice 'LIBRE': estado 'libre', inicio '', fin ''.
   - Si tiene horas (ej: 09:00 a 17:00): estado 'trabaja', inicio '09:00', fin '17:00'.
4. NO GENERALIZAR: Prohibido aplicar el horario de una columna a otra aunque los nombres sean iguales. Si una columna tiene 'X' y la otra tiene horario, respeta estrictamente lo que hay en cada columna.

FORMATO JSON:
[{"empleado": "Nombre (Seccion)", "dia": "lunes", "inicio": "HH:MM", "fin": "HH:MM", "estado": "trabaja/libre/vacaciones", "seccion": "nombre seccion"}]`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const geminiCall = model.generateContent([
      { inlineData: { mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data: base64 } },
      { text: PROMPT },
    ]);

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Gemini tardó demasiado. Prueba con una imagen más pequeña o inténtalo de nuevo."));
      }, 120_000);
    });

    const result = await Promise.race([geminiCall, timeoutPromise]);
    const rawText = result.response.text() ?? "";
    logger.info({ jobId, rawLength: rawText.length }, "Respuesta recibida de Gemini");

    const cleaned = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      job.status = "error";
      job.error = "El modelo no devolvió JSON válido";
      return;
    }

    let parsed: Array<Record<string, string>>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      job.status = "error";
      job.error = "La respuesta del modelo no es JSON válido";
      return;
    }

    const estadoValido = (s: string): "trabaja" | "libre" | "vacaciones" => {
      const lower = s.toLowerCase().trim();
      if (lower === "libre") return "libre";
      if (lower === "vacaciones" || lower === "x" || lower === "ausencia") return "vacaciones";
      return "trabaja";
    };

    const turnos: TurnoResult[] = parsed.map(t => ({
      empleado_nombre: (t.empleado ?? t.empleado_nombre ?? "").toString().trim(),
      dia:             (t.dia ?? "").toString().toLowerCase().trim(),
      hora_inicio:     (t.inicio ?? t.hora_inicio ?? "").toString().trim() || null,
      hora_fin:        (t.fin ?? t.hora_fin ?? "").toString().trim() || null,
      estado:          estadoValido(t.estado ?? ""),
      seccion:         (t.seccion ?? "").toString().trim() || null,
      notas:           null,
    }));

    job.status = "done";
    job.message = `Extracción completada — ${turnos.length} turnos`;
    job.result = { turnos, raw: rawText };
  } catch (err) {
    logger.error({ jobId, err }, "Error procesando imagen con Gemini");
    job.status = "error";
    job.error = err instanceof Error ? err.message : "Error desconocido al procesar la imagen";
  }
}

/* ── POST /api/horarios/procesar-imagen ── admin only ── */
/* Returns { jobId } immediately; processing runs in background */
router.post("/horarios/procesar-imagen", requireAdmin, upload.single("imagen"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No se recibió ninguna imagen" });
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GOOGLE_API_KEY no configurada" });
    return;
  }

  const jobId = crypto.randomUUID();

  jobStore.set(jobId, {
    status: "pending",
    message: "Imagen recibida, iniciando análisis…",
    createdAt: Date.now(),
  });

  // Fire and forget — client polls for result
  processImageJob(jobId, req.file.buffer, apiKey, req.file.mimetype || "image/jpeg");

  res.json({ jobId });
});

/* ── GET /api/horarios/jobs/:id ── admin only ── */
router.get("/horarios/jobs/:id", requireAdmin, (req, res) => {
  const job = jobStore.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: "Job no encontrado o expirado" });
    return;
  }
  res.json({
    status:  job.status,
    message: job.message,
    result:  job.result,
    error:   job.error,
  });
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
      logger.info({ cambios }, "Cambios detectados en horario — notificación WhatsApp disponible desde el panel admin");
    }

    res.status(201).json({ ...newVersion, cambios });
  } catch (err) {
    logger.error({ err }, "Error guardando versión de horario");
    respondError(res, Errors.DB_ERROR("horario", "guardar"));
  }
});

/* ── PATCH /api/horarios/turnos/:id ── admin only ── */
const patchTurnoSchema = z.object({
  hora_inicio: z.string().nullable().optional(),
  hora_fin:    z.string().nullable().optional(),
  estado:      z.enum(["trabaja", "libre", "modificado", "vacaciones"]).optional(),
  seccion:     z.string().nullable().optional(),
  notas:       z.string().nullable().optional(),
});

router.patch("/horarios/turnos/:id", requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) { respondError(res, Errors.INVALID_ID); return; }

    const parsed = patchTurnoSchema.safeParse(req.body);
    if (!parsed.success) {
      respondError(res, Errors.INVALID_DATA(parsed.error.flatten()));
      return;
    }

    const [updated] = await db
      .update(turnosTable)
      .set({ ...parsed.data, es_cambio: true })
      .where(eq(turnosTable.id, id))
      .returning();

    if (!updated) { respondError(res, Errors.NOT_FOUND("Turno")); return; }
    res.json(updated);
  } catch (err) {
    logger.error({ err }, "Error actualizando turno");
    respondError(res, Errors.DB_ERROR("turno", "actualizar"));
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

export default router;

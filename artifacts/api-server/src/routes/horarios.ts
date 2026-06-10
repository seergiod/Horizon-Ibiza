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
router.use(requireAuth);

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

/* ── POST /api/horarios/procesar-imagen ── admin only ── */
router.post("/horarios/procesar-imagen", requireAdmin, upload.single("imagen"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No se recibió ninguna imagen" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY no configurada" });
    return;
  }

  try {
    const base64 = req.file.buffer.toString("base64");
    const mimeType = (req.file.mimetype || "image/jpeg") as "image/jpeg" | "image/png" | "image/webp" | "image/gif";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const PROMPT = `Analiza este cuadrante de horarios de hostelería. Devuélveme ÚNICAMENTE un array JSON válido. Cero texto extra.
REGLAS:
- Nombres duplicados: NO fusiones empleados que se llamen igual si están en columnas/secciones distintas. Crea objetos separados diferenciados por su 'seccion'.
- Celdas con "X" o "Cruz": Significa ausencia. Setea "estado": "vacaciones", "inicio": "", "fin": "".
- Celdas con "LIBRE": Setea "estado": "libre", "inicio": "", "fin": "".
- Celdas con Horario: Setea "estado": "trabaja" y extrae las horas (HH:MM).
- "dia" debe ser uno de: lunes, martes, miércoles, jueves, viernes, sábado, domingo
- Cruza cuidadosamente cada fila (día) con cada columna (empleado)
- Solo incluye filas con información real, no filas vacías
FORMATO ESTRICTO:
[{"empleado": "Nombre", "dia": "lunes", "inicio": "HH:MM", "fin": "HH:MM", "estado": "trabaja/libre/vacaciones", "seccion": "sala mañana/cocina/etc"}]`;

    // Race the Gemini call against a 55-second timeout so we always respond
    // before the Replit proxy (60 s) cuts the connection and returns a 502.
    const TIMEOUT_MS = 55_000;

    const geminiCall = model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      { text: PROMPT },
    ]);

    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Gemini tardó demasiado (>55 s). Prueba con una imagen más pequeña o inténtalo de nuevo."));
      }, TIMEOUT_MS);
    });

    const result = await Promise.race([geminiCall, timeoutPromise]);

    const rawText = result.response.text() ?? "";
    logger.info({ rawLength: rawText.length }, "Respuesta recibida de Gemini");

    // Strip markdown code blocks if present, then extract JSON array
    const cleaned = rawText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.warn({ rawText }, "No se encontró JSON en la respuesta");
      res.status(422).json({ error: "El modelo no devolvió JSON válido", raw: rawText });
      return;
    }

    let parsed: Array<Record<string, string>>;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      logger.warn({ raw: jsonMatch[0] }, "JSON inválido tras limpieza");
      res.status(422).json({ error: "La respuesta del modelo no es JSON válido", raw: rawText });
      return;
    }

    const estadoValido = (s: string): "trabaja" | "libre" | "vacaciones" => {
      const lower = s.toLowerCase().trim();
      if (lower === "libre") return "libre";
      if (lower === "vacaciones" || lower === "x" || lower === "ausencia") return "vacaciones";
      return "trabaja";
    };

    const turnos = parsed.map(t => ({
      empleado_nombre: (t.empleado ?? t.empleado_nombre ?? "").toString().trim(),
      dia:             (t.dia ?? "").toString().toLowerCase().trim(),
      hora_inicio:     (t.inicio ?? t.hora_inicio ?? "").toString().trim() || null,
      hora_fin:        (t.fin ?? t.hora_fin ?? "").toString().trim() || null,
      estado:          estadoValido(t.estado ?? ""),
      seccion:         (t.seccion ?? "").toString().trim() || null,
      notas:           null,
    }));

    res.json({ turnos, raw: rawText });
  } catch (err) {
    logger.error({ err }, "Error procesando imagen con Gemini");
    const msg = err instanceof Error ? err.message : "Error desconocido";
    res.status(500).json({ error: `Error al procesar la imagen: ${msg}` });
  }
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

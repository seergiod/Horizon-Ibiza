import { Router } from "express";
import { db, reservasTable, insertReservaSchema } from "@workspace/db";
import { eq, desc, and, gte, lte, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { broadcast } from "../lib/websocket.js";
import { respondError, Errors } from "../lib/errors.js";
import { rateLimit } from "../lib/rate-limit.js";
import { logger } from "../lib/logger.js";
import { sanitizeQuery } from "../lib/pii.js";

const router = Router();
router.use(requireAuth);

/* ── GET /api/reservas/calendar?month=MM&year=YYYY ── */
router.get("/reservas/calendar", async (req, res) => {
  try {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year  = Number(req.query.year)  || new Date().getFullYear();

    const pad = (n: number) => String(n).padStart(2, "0");
    const firstDay = `${year}-${pad(month)}-01`;
    const lastDay  = `${year}-${pad(month)}-31`;

    const rows = await db
      .select({
        fecha:   reservasTable.fecha_reserva,
        count:   sql<number>`cast(count(*) as int)`,
        personas: sql<number>`cast(sum(${reservasTable.personas}) as int)`,
      })
      .from(reservasTable)
      .where(
        and(
          gte(reservasTable.fecha_reserva, firstDay),
          lte(reservasTable.fecha_reserva, lastDay),
        ),
      )
      .groupBy(reservasTable.fecha_reserva)
      .orderBy(reservasTable.fecha_reserva);

    const byDay: Record<string, { count: number; personas: number }> = {};
    for (const r of rows) {
      byDay[r.fecha] = { count: r.count, personas: r.personas ?? 0 };
    }

    res.json(byDay);
  } catch (err) {
    respondError(res, Errors.DB_ERROR("calendario", "obtener"));
  }
});

/* ── GET /api/reservas?limit=20&offset=0&estado=&fecha=&q= ── */
router.get("/reservas", async (req, res) => {
  try {
    const { fecha, estado, q, limit, offset } = req.query;
    const pageLimit = Math.min(Number(limit) || 20, 100);
    const pageOffset = Number(offset) || 0;

    // Log con sanitización de PII
    if (q) {
      logger.debug(sanitizeQuery({ q }), "Búsqueda de reservas");
    }

    const conditions = [];
    if (estado) conditions.push(eq(reservasTable.estado, estado as "pendiente" | "confirmada" | "cancelada" | "completada"));
    if (fecha)  conditions.push(eq(reservasTable.fecha_reserva, fecha as string));
    if (q) {
      conditions.push(
        or(
          ilike(reservasTable.cliente, `%${String(q)}%`),
          ilike(reservasTable.telefono, `%${String(q)}%`),
        )!,
      );
    }

    const whereClause = conditions.length ? and(...conditions) : undefined;

    // Obtener total en paralelo
    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(*) as int)` })
      .from(reservasTable)
      .where(whereClause);

    // Obtener página
    const rows = await db
      .select()
      .from(reservasTable)
      .where(whereClause)
      .orderBy(desc(reservasTable.fecha_creacion))
      .limit(pageLimit)
      .offset(pageOffset);

    res.json({
      items: rows,
      total,
      limit: pageLimit,
      offset: pageOffset,
      hasMore: pageOffset + pageLimit < total,
    });
  } catch (err) {
    respondError(res, Errors.DB_ERROR("reservas", "obtener"));
  }
});

/* ── GET /api/reservas/:id ── */
router.get("/reservas/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      respondError(res, Errors.INVALID_ID);
      return;
    }
    const [row] = await db.select().from(reservasTable).where(eq(reservasTable.id, id));
    if (!row) {
      respondError(res, Errors.NOT_FOUND("Reserva"));
      return;
    }
    res.json(row);
  } catch (err) {
    respondError(res, Errors.DB_ERROR("reserva", "obtener"));
  }
});

/* ── POST /api/reservas ── */
// Rate limit: 5 reservations per 15 minutes per IP
router.post(
  "/reservas",
  rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5, message: "Demasiadas solicitudes. Intenta de nuevo en 15 minutos." }),
  async (req, res) => {
  try {
    const parsed = insertReservaSchema.safeParse(req.body);
    if (!parsed.success) {
      respondError(res, Errors.INVALID_DATA(parsed.error.issues));
      return;
    }
    const [created] = await db.insert(reservasTable).values(parsed.data).returning();
    broadcast("reserva_nueva", created);
    res.status(201).json(created);
  } catch (err) {
    respondError(res, Errors.DB_ERROR("reserva", "crear"));
  }
});

/* ── PUT /api/reservas/:id ── */
router.put("/reservas/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      respondError(res, Errors.INVALID_ID);
      return;
    }
    const updateSchema = insertReservaSchema.partial();
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      respondError(res, Errors.INVALID_DATA(parsed.error.issues));
      return;
    }
    const [updated] = await db.update(reservasTable).set(parsed.data).where(eq(reservasTable.id, id)).returning();
    if (!updated) {
      respondError(res, Errors.NOT_FOUND("Reserva"));
      return;
    }
    broadcast("reserva_actualizada", updated);
    res.json(updated);
  } catch (err) {
    respondError(res, Errors.DB_ERROR("reserva", "actualizar"));
  }
});

/* ── DELETE /api/reservas/:id ── */
router.delete("/reservas/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      respondError(res, Errors.INVALID_ID);
      return;
    }
    const [deleted] = await db.delete(reservasTable).where(eq(reservasTable.id, id)).returning();
    if (!deleted) {
      respondError(res, Errors.NOT_FOUND("Reserva"));
      return;
    }
    broadcast("reserva_eliminada", { id });
    res.json({ ok: true });
  } catch (err) {
    respondError(res, Errors.DB_ERROR("reserva", "eliminar"));
  }
});

export default router;

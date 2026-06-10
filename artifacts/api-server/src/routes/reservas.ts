import { Router } from "express";
import { db, reservasTable, insertReservaSchema } from "@workspace/db";
import { eq, desc, and, gte, lte, ilike, or, sql } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { broadcast } from "../lib/websocket.js";

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
    res.status(500).json({ error: "Error al obtener calendario" });
  }
});

/* ── GET /api/reservas ── */
router.get("/reservas", async (req, res) => {
  try {
    const { fecha, estado, q } = req.query as Record<string, string>;
    const conditions = [];
    if (estado) conditions.push(eq(reservasTable.estado, estado as "pendiente" | "confirmada" | "cancelada" | "completada"));
    if (fecha)  conditions.push(eq(reservasTable.fecha_reserva, fecha));
    if (q) {
      conditions.push(
        or(
          ilike(reservasTable.cliente, `%${q}%`),
          ilike(reservasTable.telefono, `%${q}%`),
        )!,
      );
    }
    const rows = await db
      .select()
      .from(reservasTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(reservasTable.fecha_creacion));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Error al obtener reservas" });
  }
});

/* ── GET /api/reservas/:id ── */
router.get("/reservas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
  const [row] = await db.select().from(reservasTable).where(eq(reservasTable.id, id));
  if (!row) { res.status(404).json({ error: "Reserva no encontrada" }); return; }
  res.json(row);
});

/* ── POST /api/reservas ── */
router.post("/reservas", async (req, res) => {
  const parsed = insertReservaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  try {
    const [created] = await db.insert(reservasTable).values(parsed.data).returning();
    broadcast("reserva_nueva", created);
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: "Error al crear reserva" });
  }
});

/* ── PUT /api/reservas/:id ── */
router.put("/reservas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
  const updateSchema = insertReservaSchema.partial();
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos", details: parsed.error.issues });
    return;
  }
  try {
    const [updated] = await db.update(reservasTable).set(parsed.data).where(eq(reservasTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Reserva no encontrada" }); return; }
    broadcast("reserva_actualizada", updated);
    res.json(updated);
  } catch {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

/* ── DELETE /api/reservas/:id ── */
router.delete("/reservas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const [deleted] = await db.delete(reservasTable).where(eq(reservasTable.id, id)).returning();
    if (!deleted) { res.status(404).json({ error: "Reserva no encontrada" }); return; }
    broadcast("reserva_eliminada", { id });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

export default router;

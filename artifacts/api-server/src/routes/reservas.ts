import { Router } from "express";
import { db, reservasTable, insertReservaSchema } from "@workspace/db";
import { eq, desc, and, gte, lte, ilike, or } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { broadcast } from "../lib/websocket.js";
import { z } from "zod";

const router = Router();

router.use(requireAuth);

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
  } catch (err) {
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
  } catch (err) {
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
    const [updated] = await db
      .update(reservasTable)
      .set(parsed.data)
      .where(eq(reservasTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Reserva no encontrada" }); return; }
    broadcast("reserva_actualizada", updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar" });
  }
});

/* ── DELETE /api/reservas/:id ── */
router.delete("/reservas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const [deleted] = await db
      .delete(reservasTable)
      .where(eq(reservasTable.id, id))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Reserva no encontrada" }); return; }
    broadcast("reserva_eliminada", { id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

export default router;

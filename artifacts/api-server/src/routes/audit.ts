import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db/schema";
import { desc, sql, eq, gte } from "drizzle-orm";
import { requireAdmin } from "../middleware/auth.js";
import { logger } from "../lib/logger.js";
import type { Request } from "express";

const router = Router();

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

/* ── POST /api/audit/log  (public — fire-and-forget from frontend) ── */
router.post("/audit/log", async (req, res) => {
  const { evento, detalle } = req.body ?? {};
  if (!evento || typeof evento !== "string") {
    res.status(400).json({ error: "evento requerido" });
    return;
  }
  try {
    await db.insert(auditLogsTable).values({
      evento:  evento.slice(0, 60),
      detalle: detalle ? String(detalle).slice(0, 120) : null,
      ip:      clientIp(req),
    });
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Error guardando audit log");
    res.json({ ok: false });
  }
});

/* ── GET /api/admin/metrics  (admin only) ── */
router.get("/admin/metrics", requireAdmin, async (_req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [visitasHoy, notificaciones, ultimas10] = await Promise.all([
      // Total visits today
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogsTable)
        .where(sql`${auditLogsTable.evento} = 'VISITA_WEB' AND ${auditLogsTable.timestamp} >= ${startOfDay}`),

      // Notification ranking by employee
      db
        .select({
          empleado: auditLogsTable.detalle,
          total:    sql<number>`count(*)::int`,
        })
        .from(auditLogsTable)
        .where(eq(auditLogsTable.evento, "NOTIFICACION_ENVIADA"))
        .groupBy(auditLogsTable.detalle)
        .orderBy(desc(sql`count(*)`))
        .limit(20),

      // Last 10 actions
      db
        .select()
        .from(auditLogsTable)
        .orderBy(desc(auditLogsTable.timestamp))
        .limit(10),
    ]);

    res.json({
      visitasHoy:      visitasHoy[0]?.count ?? 0,
      notificaciones:  notificaciones.map(n => ({ empleado: n.empleado ?? "—", total: n.total })),
      ultimas10,
    });
  } catch (err) {
    logger.error({ err }, "Error leyendo métricas");
    res.status(500).json({ error: "Error al obtener métricas" });
  }
});

export default router;

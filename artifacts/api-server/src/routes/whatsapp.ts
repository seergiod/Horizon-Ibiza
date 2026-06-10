import { Router } from "express";
import { parseWhatsAppReservation } from "../lib/whatsapp-parser.js";
import { db, reservasTable } from "@workspace/db";
import { broadcast } from "../lib/websocket.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/* ── POST /api/whatsapp/parse  — parse sin guardar ── */
router.post("/whatsapp/parse", requireAuth, (req, res) => {
  const { message } = req.body ?? {};
  if (!message) { res.status(400).json({ error: "Campo 'message' requerido" }); return; }
  const result = parseWhatsAppReservation(String(message));
  if (!result) { res.status(422).json({ error: "No se pudo parsear el mensaje" }); return; }
  res.json(result);
});

/* ── POST /api/whatsapp/webhook  — webhook público (sin auth) ── */
router.post("/whatsapp/webhook", async (req, res) => {
  const secret = req.headers["x-webhook-secret"];
  if (secret !== (process.env.WEBHOOK_SECRET ?? "")) {
    res.status(401).json({ error: "Webhook secreto inválido" }); return;
  }
  const body = req.body ?? {};
  const text: string = body.message ?? body.text ?? body.body ?? "";
  const parsed = parseWhatsAppReservation(text);
  if (!parsed || !parsed.cliente || !parsed.telefono) {
    res.status(422).json({ error: "Mensaje no reconocido como reserva" }); return;
  }
  try {
    const [created] = await db.insert(reservasTable).values({
      cliente:       parsed.cliente!,
      fecha_reserva: parsed.fecha_reserva!,
      hora_reserva:  parsed.hora_reserva!,
      personas:      parsed.personas ?? 2,
      zona:          parsed.zona,
      vista:         parsed.vista,
      telefono:      parsed.telefono!,
      comentarios:   parsed.comentarios,
      estado:        "pendiente",
      fuente:        "whatsapp",
    }).returning();
    broadcast("reserva_nueva", created);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: "Error al guardar reserva" });
  }
});

export default router;

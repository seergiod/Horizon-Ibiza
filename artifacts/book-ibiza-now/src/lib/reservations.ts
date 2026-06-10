import { z } from "zod";

export const reservationSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(5),
  partySize: z.number().int().min(1),
  reservationAt: z.date(),
  notes: z.string().optional(),
  locale: z.string().optional(),
});

export type ReservationData = z.infer<typeof reservationSchema>;

export async function createReservation(data: ReservationData): Promise<{ id: number; token: string }> {
  const d = data.reservationAt;
  const fecha = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
  const hora = [
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
  ].join(":");

  const res = await fetch("/api/reservas/public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cliente:       data.name.trim(),
      telefono:      data.phone.trim(),
      personas:      data.partySize,
      fecha_reserva: fecha,
      hora_reserva:  hora,
      comentarios:   data.notes?.trim() || null,
      fuente:        "web",
      estado:        "pendiente",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(body?.message ?? "No se pudo enviar la reserva. Por favor, inténtalo de nuevo.");
  }

  return res.json() as Promise<{ id: number; token: string }>;
}

export async function confirmReservation(id: number, token: string, phone: string): Promise<void> {
  const res = await fetch("/api/reservas/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, token, phone }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body?.error ?? "No se pudo confirmar la reserva.");
  }
}

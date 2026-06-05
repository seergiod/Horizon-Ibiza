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

export async function createReservation(_data: ReservationData): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
}

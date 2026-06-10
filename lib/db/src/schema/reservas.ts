import {
  pgTable, serial, text, timestamp, integer, pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const estadoEnum = pgEnum("estado_reserva", [
  "pendiente",
  "confirmada",
  "cancelada",
  "completada",
]);

export const reservasTable = pgTable("reservas", {
  id:              serial("id").primaryKey(),
  cliente:         text("cliente").notNull(),
  fecha_reserva:   text("fecha_reserva").notNull(),
  hora_reserva:    text("hora_reserva").notNull(),
  personas:        integer("personas").notNull().default(2),
  zona:            text("zona"),
  vista:           text("vista"),
  telefono:        text("telefono").notNull(),
  comentarios:     text("comentarios"),
  estado:          estadoEnum("estado").notNull().default("pendiente"),
  fuente:          text("fuente").default("manual"),
  fecha_creacion:  timestamp("fecha_creacion").defaultNow().notNull(),
});

export const insertReservaSchema = createInsertSchema(reservasTable).omit({
  id: true,
  fecha_creacion: true,
});

export const selectReservaSchema = createSelectSchema(reservasTable);

export type InsertReserva = z.infer<typeof insertReservaSchema>;
export type Reserva = typeof reservasTable.$inferSelect;

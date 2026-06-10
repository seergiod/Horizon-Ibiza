import {
  pgTable, serial, text, timestamp, integer, pgEnum, index,
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
}, (table) => ({
  // Índices para búsquedas frecuentes
  idxFechaReserva:  index("idx_fecha_reserva").on(table.fecha_reserva),
  idxEstado:        index("idx_estado").on(table.estado),
  idxCliente:       index("idx_cliente").on(table.cliente),
  idxFechaCreacion: index("idx_fecha_creacion").on(table.fecha_creacion),
  // Índice compuesto para filtros combinados (estado + fecha)
  idxEstadoFecha:   index("idx_estado_fecha").on(table.estado, table.fecha_reserva),
}));

const trimStr = (s: string) => s.trim();

export const insertReservaSchema = createInsertSchema(reservasTable, {
  cliente:       s => s.min(1, "El nombre del cliente es obligatorio").transform(trimStr),
  fecha_reserva: s => s.min(1, "La fecha es obligatoria").transform(trimStr),
  hora_reserva:  s => s.min(1, "La hora es obligatoria").transform(trimStr),
  telefono:      s => s
    .transform(trimStr)
    .refine(v => v.length >= 6, "El teléfono debe tener al menos 6 dígitos")
    .refine(v => /^\+?[\d\s\-().]{6,25}$/.test(v), "Formato de teléfono inválido (ej: +34 6XX XXX XXX)"),
  comentarios:   s => s.transform(trimStr).optional().nullable(),
  zona:          s => s.transform(trimStr).optional().nullable(),
  vista:         s => s.transform(trimStr).optional().nullable(),
  fuente:        s => s.transform(trimStr).optional().nullable(),
}).omit({
  id: true,
  fecha_creacion: true,
});

export const selectReservaSchema = createSelectSchema(reservasTable);

export type InsertReserva = z.infer<typeof insertReservaSchema>;
export type Reserva = typeof reservasTable.$inferSelect;

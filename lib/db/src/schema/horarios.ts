import {
  pgTable, serial, text, timestamp, integer, boolean, pgEnum,
} from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const estadoTurnoEnum = pgEnum("estado_turno", ["trabaja", "libre", "modificado", "vacaciones"]);

export const horarioVersionesTable = pgTable("horario_versiones", {
  id:             serial("id").primaryKey(),
  semana_inicio:  text("semana_inicio").notNull(),
  nombre:         text("nombre"),
  notas:          text("notas"),
  creado_por:     integer("creado_por").references(() => usersTable.id),
  fecha_creacion: timestamp("fecha_creacion").defaultNow().notNull(),
});

export const turnosTable = pgTable("turnos", {
  id:               serial("id").primaryKey(),
  version_id:       integer("version_id").references(() => horarioVersionesTable.id, { onDelete: "cascade" }).notNull(),
  empleado_nombre:  text("empleado_nombre").notNull(),
  user_id:          integer("user_id").references(() => usersTable.id),
  dia:              text("dia").notNull(),
  seccion:          text("seccion"),
  hora_inicio:      text("hora_inicio"),
  hora_fin:         text("hora_fin"),
  estado:           estadoTurnoEnum("estado").notNull().default("trabaja"),
  turno_tipo:       text("turno_tipo"),
  notas:            text("notas"),
  es_cambio:        boolean("es_cambio").default(false),
  fecha_creacion:   timestamp("fecha_creacion").defaultNow().notNull(),
});

export type HorarioVersion = typeof horarioVersionesTable.$inferSelect;
export type InsertHorarioVersion = typeof horarioVersionesTable.$inferInsert;
export type Turno = typeof turnosTable.$inferSelect;
export type InsertTurno = typeof turnosTable.$inferInsert;

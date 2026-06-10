import {
  pgTable, serial, text, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const rolUsuarioEnum = pgEnum("rol_usuario", ["admin", "empleado"]);
export const estadoUsuarioEnum = pgEnum("estado_usuario", ["activo", "inactivo"]);

export const usersTable = pgTable("users", {
  id:             serial("id").primaryKey(),
  nombre:         text("nombre").notNull(),
  apellidos:      text("apellidos").notNull().default(""),
  dni:            text("dni").unique(),
  email:          text("email").notNull().unique(),
  username:       text("username").notNull().unique(),
  telefono:       text("telefono"),
  password_hash:  text("password_hash").notNull(),
  rol:            rolUsuarioEnum("rol").notNull().default("empleado"),
  estado:         estadoUsuarioEnum("estado").notNull().default("activo"),
  fecha_creacion: timestamp("fecha_creacion").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  fecha_creacion: true,
});

export const selectUserSchema = createSelectSchema(usersTable).omit({ password_hash: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type PublicUser = Omit<User, "password_hash">;

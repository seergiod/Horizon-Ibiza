import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id:        serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  evento:    text("evento").notNull(),
  detalle:   text("detalle"),
  ip:        text("ip"),
});

export type AuditLog = typeof auditLogsTable.$inferSelect;
export type InsertAuditLog = typeof auditLogsTable.$inferInsert;

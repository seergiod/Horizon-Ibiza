---
name: Reservation system architecture
description: How the Horizon Ibiza reservation system is wired together across services.
---

# Reservation System Architecture

## Routing (key insight)
From `curl http://localhost:80/api/healthz` → `{"status":"ok"}`. The Replit proxy exposes the api-server (port 8080) at `/api/*` on the shared host. The frontend (port 21110) gets everything else. This means React can call `fetch('/api/reservas')` with no proxy config needed.

**Why:** Discovered by probing — there is no vite proxy. Both services are transparently co-routed by Replit's reverse proxy through port 80.

**How to apply:** Frontend API client always uses `/api` as BASE, never a full URL or port.

## WebSocket
- Server: `ws` package attached to `http.createServer(app)` in `index.ts`
- Path: `/ws?token=<jwt>` — auth happens at connection time
- Client connects to `wss://${window.location.host}/ws?token=...`
- Falls back gracefully (retry every 5s) if connection fails

## DB Schema
- Table: `reservas` in PostgreSQL via Drizzle ORM (`lib/db`)
- Enum: `estado_reserva` (pendiente, confirmada, cancelada, completada)
- Migration: `pnpm --filter @workspace/db run push-force`

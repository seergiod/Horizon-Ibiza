import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import { verifyToken } from "./auth.js";

let wss: WebSocketServer | null = null;

export function initWebSocket(server: Server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? "/", `http://localhost`);
    const token = url.searchParams.get("token");
    const payload = token ? verifyToken(token) : null;

    if (!payload) {
      ws.close(4001, "Unauthorized");
      return;
    }

    (ws as WebSocket & { role: string }).role = payload.role;

    ws.send(JSON.stringify({ type: "connected", message: "Dashboard conectado" }));
  });
}

export function broadcast(event: string, data: unknown) {
  if (!wss) return;
  const message = JSON.stringify({ type: event, data, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

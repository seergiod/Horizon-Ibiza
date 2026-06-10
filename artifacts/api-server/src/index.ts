import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { initWebSocket } from "./lib/websocket.js";
import { seedDefaultUsers } from "./lib/seed.js";

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required but was not provided.");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`);

const server = http.createServer(app);
initWebSocket(server);

await seedDefaultUsers();

server.listen(port, () => {
  logger.info({ port }, "Server listening");
});

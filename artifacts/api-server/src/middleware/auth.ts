import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/auth.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "No autorizado" });
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Token inválido o expirado" });
    return;
  }
  (req as Request & { user: typeof payload }).user = payload;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as Request & { user?: { role: string } }).user;
  if (user?.role !== "admin") {
    res.status(403).json({ error: "Solo administradores" });
    return;
  }
  next();
}

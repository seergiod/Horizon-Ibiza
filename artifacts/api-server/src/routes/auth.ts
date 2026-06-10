import { Router } from "express";
import { authenticate, signToken } from "../lib/auth.js";

const router = Router();

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};
  if (!username || !password) {
    res.status(400).json({ error: "Credenciales requeridas" });
    return;
  }
  const payload = await authenticate(String(username), String(password));
  if (!payload) {
    res.status(401).json({ error: "Credenciales incorrectas" });
    return;
  }
  const token = signToken(payload);
  res.json({ token, role: payload.role, username: payload.username });
});

export default router;

import { Router } from "express";
import { authenticate, signToken, signRefreshToken, verifyRefreshToken } from "../lib/auth.js";
import { respondError, Errors } from "../lib/errors.js";
import { rateLimit } from "../lib/rate-limit.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Store for invalidated refresh tokens (in production, use Redis)
const invalidatedTokens = new Set<string>();

// Rate limit: 5 login attempts per 15 minutes per IP
router.post(
  "/auth/login",
  rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 5, message: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos." }),
  async (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    if (!username || !password) {
      respondError(res, new Error("Credenciales requeridas"));
      return;
    }
    const payload = await authenticate(String(username), String(password));
    if (!payload) {
      respondError(res, Errors.UNAUTHORIZED);
      return;
    }
    const token = signToken(payload);
    const refreshToken = signRefreshToken(payload);
    res.json({ token, refreshToken, role: payload.role, username: payload.username });
  } catch (err) {
    respondError(res, Errors.DB_ERROR("usuario", "autenticar"));
  }
});

// POST /auth/refresh - obtener nuevo access token con refresh token
router.post("/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) {
      respondError(res, new Error("Refresh token requerido"));
      return;
    }

    if (invalidatedTokens.has(String(refreshToken))) {
      respondError(res, Errors.UNAUTHORIZED);
      return;
    }

    const payload = verifyRefreshToken(String(refreshToken));
    if (!payload) {
      respondError(res, Errors.UNAUTHORIZED);
      return;
    }

    const newToken = signToken(payload);
    res.json({ token: newToken });
  } catch (err) {
    respondError(res, Errors.DB_ERROR("token", "refrescar"));
  }
});

// POST /auth/logout - invalidar refresh token
router.post("/auth/logout", requireAuth, async (req, res) => {
  try {
    const { refreshToken } = req.body ?? {};
    if (refreshToken) {
      invalidatedTokens.add(String(refreshToken));
      // Limpiar tokens viejos de Set (en producción usar Redis con TTL)
      if (invalidatedTokens.size > 10000) {
        invalidatedTokens.clear();
      }
    }
    res.json({ ok: true });
  } catch (err) {
    respondError(res, err);
  }
});

export default router;

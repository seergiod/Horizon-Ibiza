import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Simple in-memory rate limiter.
 * For production, use Redis-based solution like redis-rate-limiter or express-rate-limit with RedisStore
 */
export function rateLimit(options: {
  windowMs?: number; // milliseconds
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
  message?: string;
}) {
  const windowMs = options.windowMs ?? 60 * 1000; // 1 minute default
  const maxRequests = options.maxRequests ?? 30;
  const keyGenerator = options.keyGenerator ?? ((req: Request) => req.ip ?? "unknown");
  const message = options.message ?? "Too many requests, please try again later.";

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const record = store[key];

    if (!record || now > record.resetTime) {
      // Reset: new window or first request
      store[key] = { count: 1, resetTime: now + windowMs };
      next();
      return;
    }

    record.count++;
    if (record.count > maxRequests) {
      logger.warn({ key, ip: req.ip }, "Rate limit exceeded");
      res.status(429).json({
        error: message,
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

import type { Response } from "express";
import { logger } from "./logger";

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export class AppError extends Error implements ApiError {
  code: string;
  statusCode: number;
  details?: unknown;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: unknown,
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "AppError";
  }
}

export function respondError(res: Response, error: unknown) {
  if (error instanceof AppError) {
    logger.warn(
      { code: error.code, statusCode: error.statusCode },
      error.message,
    );
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
    });
  } else if (error instanceof Error) {
    logger.error({ stack: error.stack }, error.message);
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    });
  } else {
    logger.error({ error }, "Error desconocido");
    res.status(500).json({
      error: "Error interno del servidor",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
}

// Common errors
export const Errors = {
  INVALID_ID: new AppError(
    "INVALID_ID",
    "ID inválido",
    400,
  ),
  NOT_FOUND: (resource: string) =>
    new AppError("NOT_FOUND", `${resource} no encontrado`, 404),
  UNAUTHORIZED: new AppError(
    "UNAUTHORIZED",
    "No autorizado",
    401,
  ),
  FORBIDDEN: new AppError(
    "FORBIDDEN",
    "Solo administradores",
    403,
  ),
  INVALID_DATA: (details?: unknown) =>
    new AppError("INVALID_DATA", "Datos inválidos", 400, details),
  PARSE_ERROR: (details?: unknown) =>
    new AppError("PARSE_ERROR", "Error al procesar datos", 400, details),
  DB_ERROR: (resource: string, operation: string) =>
    new AppError(
      "DB_ERROR",
      `Error al ${operation} ${resource}`,
      500,
    ),
} as const;

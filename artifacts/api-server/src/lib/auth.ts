import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required but was not provided. Set it to a strong random string.",
  );
}

const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET;

export interface AuthPayload {
  username: string;
  role: "admin" | "empleado";
  userId?: number;
}

export async function authenticate(identifier: string, password: string): Promise<AuthPayload | null> {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(
      or(
        eq(usersTable.username, identifier),
        eq(usersTable.email, identifier),
        eq(usersTable.dni, identifier),
      ),
    )
    .limit(1);

  if (!user || user.estado !== "activo") return null;

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return null;

  return {
    username: user.username,
    role: user.rol as "admin" | "empleado",
    userId: user.id,
  };
}

export function signToken(payload: AuthPayload, expiresIn = "12h"): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function signRefreshToken(payload: AuthPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, or } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET ?? "horizon-dashboard-secret-dev";

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

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

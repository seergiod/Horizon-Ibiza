import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "horizon-dashboard-secret-dev";

export interface AuthPayload {
  username: string;
  role: "admin" | "empleado";
}

const USERS: Record<string, { password: string; role: "admin" | "empleado" }> = {
  admin: {
    password: process.env.DASHBOARD_ADMIN_PASS ?? "admin123",
    role: "admin",
  },
  empleado: {
    password: process.env.DASHBOARD_EMPLOYEE_PASS ?? "empleado123",
    role: "empleado",
  },
};

export function authenticate(username: string, password: string): AuthPayload | null {
  const user = USERS[username];
  if (!user || user.password !== password) return null;
  return { username, role: user.role };
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

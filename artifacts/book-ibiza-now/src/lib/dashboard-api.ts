const BASE = "/api";

export interface Reserva {
  id: number;
  cliente: string;
  fecha_reserva: string;
  hora_reserva: string;
  personas: number;
  zona: string | null;
  vista: string | null;
  telefono: string;
  comentarios: string | null;
  estado: "pendiente" | "confirmada" | "cancelada" | "completada";
  fuente: string | null;
  fecha_creacion: string;
}
export type EstadoReserva = Reserva["estado"];

export interface DashUser {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string | null;
  email: string;
  username: string;
  telefono: string | null;
  rol: "admin" | "empleado";
  estado: "activo" | "inactivo";
  fecha_creacion: string;
}

export interface CalendarDay {
  count: number;
  personas: number;
}

export interface PaginatedReservas {
  items: Reserva[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

let _token: string | null = null;

export function setToken(t: string | null) {
  _token = t;
  if (t) localStorage.setItem("hz_token", t);
  else localStorage.removeItem("hz_token");
}

export function getToken(): string | null {
  if (_token) return _token;
  _token = localStorage.getItem("hz_token");
  return _token;
}

export function clearAuth() { setToken(null); _token = null; }

function headers(extra?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    ...extra,
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/* ── Auth ── */
export async function login(username: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handle<{ token: string; role: string; username: string }>(res);
}

/* ── Reservas ── */
export async function listReservas(params?: { fecha?: string; estado?: string; q?: string; limit?: number; offset?: number }) {
  const sp = new URLSearchParams();
  if (params?.fecha) sp.set("fecha", params.fecha);
  if (params?.estado) sp.set("estado", params.estado);
  if (params?.q) sp.set("q", params.q);
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));
  const res = await fetch(`${BASE}/reservas?${sp}`, { headers: headers() });
  return handle<PaginatedReservas>(res);
}

export async function createReserva(data: Omit<Reserva, "id" | "fecha_creacion">) {
  const res = await fetch(`${BASE}/reservas`, { method: "POST", headers: headers(), body: JSON.stringify(data) });
  return handle<Reserva>(res);
}

export async function updateReserva(id: number, data: Partial<Reserva>) {
  const res = await fetch(`${BASE}/reservas/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(data) });
  return handle<Reserva>(res);
}

export async function deleteReserva(id: number) {
  const res = await fetch(`${BASE}/reservas/${id}`, { method: "DELETE", headers: headers() });
  return handle<{ ok: boolean }>(res);
}

export async function parseWhatsApp(message: string) {
  const res = await fetch(`${BASE}/whatsapp/parse`, { method: "POST", headers: headers(), body: JSON.stringify({ message }) });
  return handle<Partial<Reserva>>(res);
}

export async function getCalendar(month: number, year: number) {
  const res = await fetch(`${BASE}/reservas/calendar?month=${month}&year=${year}`, { headers: headers() });
  return handle<Record<string, CalendarDay>>(res);
}

/* ── Users ── */
export async function listUsers() {
  const res = await fetch(`${BASE}/users`, { headers: headers() });
  return handle<DashUser[]>(res);
}

export async function createUser(data: {
  nombre: string; apellidos: string; dni?: string; email: string;
  username: string; telefono?: string; password: string;
  rol: "admin" | "empleado"; estado: "activo" | "inactivo";
}) {
  const res = await fetch(`${BASE}/users`, { method: "POST", headers: headers(), body: JSON.stringify(data) });
  return handle<DashUser>(res);
}

export async function updateUser(id: number, data: Partial<DashUser & { password?: string }>) {
  const res = await fetch(`${BASE}/users/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(data) });
  return handle<DashUser>(res);
}

export async function deleteUser(id: number) {
  const res = await fetch(`${BASE}/users/${id}`, { method: "DELETE", headers: headers() });
  return handle<{ ok: boolean }>(res);
}

export async function importUsers(file: File, dryRun = false) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/users/import?dryrun=${dryRun}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    body: form,
  });
  return handle<{
    total: number; valid: number; invalid: number;
    inserted: number; skipped: number; dryRun: boolean;
    preview: Array<{ row: number; data: Record<string, string>; errors: string[]; willImport: boolean }>;
  }>(res);
}

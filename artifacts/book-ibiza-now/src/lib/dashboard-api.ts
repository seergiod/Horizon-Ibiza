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

/* ── Horarios ── */
export interface HorarioVersion {
  id: number;
  semana_inicio: string;
  nombre: string | null;
  notas: string | null;
  fecha_creacion: string;
}

export interface Turno {
  id: number;
  version_id: number;
  empleado_nombre: string;
  user_id: number | null;
  dia: string;
  seccion: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: "trabaja" | "libre" | "modificado";
  turno_tipo: string | null;
  notas: string | null;
  es_cambio: boolean | null;
}

export interface TurnoInput {
  empleado_nombre: string;
  dia: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  estado: "trabaja" | "libre" | "modificado";
  seccion: string | null;
  notas: string | null;
}

export async function getVersionesHorario() {
  const res = await fetch(`${BASE}/horarios/versiones`, { headers: headers() });
  return handle<HorarioVersion[]>(res);
}

export async function getVersionHorario(id: number) {
  const res = await fetch(`${BASE}/horarios/versiones/${id}`, { headers: headers() });
  return handle<HorarioVersion & { turnos: Turno[] }>(res);
}

export async function getMisHorarios() {
  const res = await fetch(`${BASE}/horarios/mios`, { headers: headers() });
  return handle<{ version: HorarioVersion | null; turnos: Turno[] }>(res);
}

export interface GeminiJob {
  status: "pending" | "processing" | "done" | "error";
  message: string;
  result?: { turnos: TurnoInput[]; raw: string };
  error?: string;
}

/** Start background Gemini processing; returns jobId immediately */
export async function iniciarProcesamientoImagen(file: File): Promise<string> {
  const form = new FormData();
  form.append("imagen", file);
  const res = await fetch(`${BASE}/horarios/procesar-imagen`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    body: form,
  });
  const data = await handle<{ jobId: string }>(res);
  return data.jobId;
}

/** Poll job status */
export async function pollJob(jobId: string): Promise<GeminiJob> {
  const res = await fetch(`${BASE}/horarios/jobs/${jobId}`, { headers: headers() });
  return handle<GeminiJob>(res);
}

/** @deprecated use iniciarProcesamientoImagen + pollJob */
export async function procesarImagenHorario(file: File) {
  const form = new FormData();
  form.append("imagen", file);
  const res = await fetch(`${BASE}/horarios/procesar-imagen`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    body: form,
  });
  const data = await handle<{ jobId: string }>(res);
  // Poll until done
  const jobId = data.jobId;
  while (true) {
    await new Promise(r => setTimeout(r, 2000));
    const job = await pollJob(jobId);
    if (job.status === "done" && job.result) return job.result;
    if (job.status === "error") throw new Error(job.error ?? "Error desconocido");
  }
}

export async function guardarVersionHorario(data: {
  semana_inicio: string;
  nombre?: string;
  notas?: string;
  turnos: TurnoInput[];
}) {
  const res = await fetch(`${BASE}/horarios/versiones`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handle<HorarioVersion & { cambios: string[] }>(res);
}

export interface AuditLog {
  id: number;
  timestamp: string;
  evento: string;
  detalle: string | null;
  ip: string | null;
}

export interface Metrics {
  visitasHoy:     number;
  notificaciones: { empleado: string; total: number }[];
  ultimas10:      AuditLog[];
}

export async function logEvent(evento: string, detalle?: string): Promise<void> {
  try {
    await fetch(`${BASE}/audit/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evento, detalle }),
    });
  } catch {
    // fire-and-forget — never throw
  }
}

export async function getMetrics(): Promise<Metrics> {
  const res = await fetch(`${BASE}/admin/metrics`, { headers: headers() });
  return handle<Metrics>(res);
}

export async function actualizarTurno(id: number, data: {
  hora_inicio?: string | null;
  hora_fin?: string | null;
  estado?: "trabaja" | "libre" | "modificado" | "vacaciones";
  seccion?: string | null;
  notas?: string | null;
}) {
  const res = await fetch(`${BASE}/horarios/turnos/${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handle<Turno>(res);
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

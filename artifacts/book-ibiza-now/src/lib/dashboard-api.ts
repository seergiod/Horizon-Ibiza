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

function headers() {
  return {
    "Content-Type": "application/json",
    ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function login(username: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handle<{ token: string; role: string; username: string }>(res);
}

export async function listReservas(params?: {
  fecha?: string;
  estado?: string;
  q?: string;
}) {
  const sp = new URLSearchParams();
  if (params?.fecha) sp.set("fecha", params.fecha);
  if (params?.estado) sp.set("estado", params.estado);
  if (params?.q) sp.set("q", params.q);
  const res = await fetch(`${BASE}/reservas?${sp}`, { headers: headers() });
  return handle<Reserva[]>(res);
}

export async function createReserva(data: Omit<Reserva, "id" | "fecha_creacion">) {
  const res = await fetch(`${BASE}/reservas`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handle<Reserva>(res);
}

export async function updateReserva(id: number, data: Partial<Reserva>) {
  const res = await fetch(`${BASE}/reservas/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(data),
  });
  return handle<Reserva>(res);
}

export async function deleteReserva(id: number) {
  const res = await fetch(`${BASE}/reservas/${id}`, {
    method: "DELETE",
    headers: headers(),
  });
  return handle<{ ok: boolean }>(res);
}

export async function parseWhatsApp(message: string) {
  const res = await fetch(`${BASE}/whatsapp/parse`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ message }),
  });
  return handle<Partial<Reserva>>(res);
}

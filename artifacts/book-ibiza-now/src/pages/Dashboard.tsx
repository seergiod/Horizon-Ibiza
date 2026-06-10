import { useState, useEffect, useRef, useCallback } from "react";
import {
  login, listReservas, updateReserva, deleteReserva,
  parseWhatsApp, createReserva, setToken, getToken,
  type Reserva, type EstadoReserva,
} from "@/lib/dashboard-api";

/* ── helpers ── */
const ESTADO_LABELS: Record<EstadoReserva, string> = {
  pendiente:   "Pendiente",
  confirmada:  "Confirmada",
  cancelada:   "Cancelada",
  completada:  "Completada",
};
const ESTADO_COLORS: Record<EstadoReserva, string> = {
  pendiente:  "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
  confirmada: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
  cancelada:  "bg-red-500/20 text-red-300 ring-1 ring-red-500/30",
  completada: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

/* ── Login screen ── */
function LoginScreen({ onLogin }: { onLogin: (t: string, role: string) => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const data = await login(user, pass);
      setToken(data.token);
      onLogin(data.token, data.role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080f1e" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold tracking-tight text-white mb-1">Horizon Ibiza</div>
          <div className="text-sm text-slate-400 font-medium tracking-widest uppercase">Panel de empleados</div>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl p-8 flex flex-col gap-5" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.07)" }}>
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Usuario</label>
            <input
              type="text" value={user} onChange={e => setUser(e.target.value)} required
              className="rounded-lg px-3 py-2.5 text-sm text-white outline-none transition-all"
              style={{ background: "#162040", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="admin"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contraseña</label>
            <input
              type="password" value={pass} onChange={e => setPass(e.target.value)} required
              className="rounded-lg px-3 py-2.5 text-sm text-white outline-none"
              style={{ background: "#162040", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="mt-1 rounded-xl py-3 text-sm font-bold text-white transition-opacity disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}
          >
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-600 mt-6">
          admin / admin123 &nbsp;·&nbsp; empleado / empleado123
        </p>
      </div>
    </div>
  );
}

/* ── WhatsApp Parser Modal ── */
function WhatsAppModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (r: Partial<Reserva>) => void;
}) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Partial<Reserva> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true); setError("");
    try {
      const result = await parseWhatsApp(text);
      setParsed(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al parsear");
    } finally { setLoading(false); }
  }

  const EXAMPLE = `📅 Fecha de reserva: 15/08/2026
⏰ Horario: 20:30
👤 Cliente: María García
👥 Cantidad de personas: 4
🏢 Zona elegida: Terraza
🌊 Ubicación (vista): Vista al mar
📞 Teléfono: +34 612 345 678
💬 Comentarios adicionales: Celebración de cumpleaños`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col gap-5 p-6" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-lg">Parsear WhatsApp</div>
            <div className="text-xs text-slate-400 mt-0.5">Pega el mensaje de reserva aquí</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <button
          onClick={() => setText(EXAMPLE)}
          className="text-xs text-cyan-400 hover:text-cyan-300 text-left underline underline-offset-2"
        >
          Usar mensaje de ejemplo
        </button>

        <textarea
          rows={8} value={text} onChange={e => setText(e.target.value)}
          className="rounded-xl p-3 text-sm text-slate-200 resize-none outline-none w-full"
          style={{ background: "#162040", border: "1px solid rgba(255,255,255,0.1)" }}
          placeholder="Pega aquí el mensaje de WhatsApp..."
        />

        {error && <div className="text-sm text-red-400">{error}</div>}

        {parsed && (
          <div className="rounded-xl p-4 flex flex-col gap-2 text-sm" style={{ background: "#162040" }}>
            <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1">Datos extraídos</div>
            {Object.entries(parsed).map(([k, v]) => v != null && (
              <div key={k} className="flex gap-2">
                <span className="text-slate-400 w-32 shrink-0 capitalize">{k.replace(/_/g, " ")}</span>
                <span className="text-white">{String(v)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleParse} disabled={loading || !text.trim()}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white transition-opacity disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}
          >
            {loading ? "Parseando…" : "Parsear"}
          </button>
          {parsed && (
            <button
              onClick={() => { onSave(parsed); onClose(); }}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
            >
              Guardar reserva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── New Reservation Modal ── */
function NewReservationModal({ initial, onClose, onSaved }: {
  initial?: Partial<Reserva>;
  onClose: () => void;
  onSaved: (r: Reserva) => void;
}) {
  const [form, setForm] = useState({
    cliente: initial?.cliente ?? "",
    fecha_reserva: initial?.fecha_reserva ?? "",
    hora_reserva: initial?.hora_reserva ?? "20:00",
    personas: initial?.personas ?? 2,
    zona: initial?.zona ?? "",
    vista: initial?.vista ?? "",
    telefono: initial?.telefono ?? "",
    comentarios: initial?.comentarios ?? "",
    estado: (initial?.estado ?? "pendiente") as EstadoReserva,
    fuente: initial?.fuente ?? "manual",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const r = await createReserva({
        ...form,
        personas: Number(form.personas),
        zona: form.zona || null,
        vista: form.vista || null,
        comentarios: form.comentarios || null,
        fuente: form.fuente || "manual",
      });
      onSaved(r);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setLoading(false); }
  }

  const input = "rounded-lg px-3 py-2 text-sm text-white outline-none w-full";
  const inputStyle = { background: "#162040", border: "1px solid rgba(255,255,255,0.1)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4 my-4" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <div className="text-white font-bold text-lg">Nueva Reserva</div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        {error && <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Cliente *</label>
              <input required className={input} style={inputStyle} value={form.cliente} onChange={e => set("cliente", e.target.value)} placeholder="Nombre del cliente" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Fecha *</label>
              <input required type="date" className={input} style={inputStyle} value={form.fecha_reserva} onChange={e => set("fecha_reserva", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Hora *</label>
              <input required type="time" className={input} style={inputStyle} value={form.hora_reserva} onChange={e => set("hora_reserva", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Personas *</label>
              <input required type="number" min="1" max="30" className={input} style={inputStyle} value={form.personas} onChange={e => set("personas", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Teléfono *</label>
              <input required className={input} style={inputStyle} value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+34 6XX XXX XXX" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Zona</label>
              <input className={input} style={inputStyle} value={form.zona} onChange={e => set("zona", e.target.value)} placeholder="Terraza, Interior..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Vista</label>
              <input className={input} style={inputStyle} value={form.vista} onChange={e => set("vista", e.target.value)} placeholder="Vista al mar..." />
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Comentarios</label>
              <textarea rows={2} className={`${input} resize-none`} style={inputStyle} value={form.comentarios} onChange={e => set("comentarios", e.target.value)} placeholder="Alergias, ocasiones especiales..." />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Estado</label>
              <select className={input} style={inputStyle} value={form.estado} onChange={e => set("estado", e.target.value)}>
                {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="mt-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}
          >
            {loading ? "Guardando…" : "Crear reserva"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export function Dashboard() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [role, setRole] = useState<string>("");
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: "", fecha: "", estado: "" });
  const [showWA, setShowWA] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [waInitial, setWaInitial] = useState<Partial<Reserva> | undefined>();
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [notification, setNotification] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    try {
      const data = await listReservas({
        q: filters.q || undefined,
        fecha: filters.fecha || undefined,
        estado: filters.estado || undefined,
      });
      setReservas(data);
    } catch {
      // silent
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { if (authed) load(); }, [authed, load]);

  /* WebSocket */
  useEffect(() => {
    if (!authed) return;
    const token = getToken();
    if (!token) return;

    function connect() {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const url = `${proto}://${window.location.host}/ws?token=${encodeURIComponent(token!)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setWsStatus("connecting");

      ws.onopen = () => setWsStatus("connected");
      ws.onclose = () => {
        setWsStatus("disconnected");
        retryRef.current = setTimeout(connect, 5000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "reserva_nueva") {
            setReservas(prev => [msg.data, ...prev]);
            setNotification(`Nueva reserva: ${msg.data.cliente}`);
            setTimeout(() => setNotification(null), 4000);
          } else if (msg.type === "reserva_actualizada") {
            setReservas(prev => prev.map(r => r.id === msg.data.id ? msg.data : r));
          } else if (msg.type === "reserva_eliminada") {
            setReservas(prev => prev.filter(r => r.id !== msg.data.id));
          }
        } catch { /* ignore */ }
      };
    }

    connect();
    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [authed]);

  async function handleEstadoChange(id: number, estado: EstadoReserva) {
    try {
      const updated = await updateReserva(id, { estado });
      setReservas(prev => prev.map(r => r.id === id ? updated : r));
    } catch { /* ignore */ }
  }

  async function handleDelete(id: number, nombre: string) {
    if (!confirm(`¿Eliminar la reserva de ${nombre}?`)) return;
    await deleteReserva(id);
    setReservas(prev => prev.filter(r => r.id !== id));
  }

  function handleWASave(data: Partial<Reserva>) {
    setWaInitial(data);
    setShowNew(true);
  }

  function handleLogout() {
    setToken(null);
    setAuthed(false);
    setReservas([]);
  }

  if (!authed) {
    return (
      <LoginScreen onLogin={(t, r) => { setToken(t); setRole(r); setAuthed(true); }} />
    );
  }

  const stats = {
    total: reservas.length,
    pendientes: reservas.filter(r => r.estado === "pendiente").length,
    confirmadas: reservas.filter(r => r.estado === "confirmada").length,
    hoy: reservas.filter(r => r.fecha_reserva === new Date().toISOString().slice(0, 10)).length,
  };

  return (
    <div className="min-h-screen font-[var(--font-sans)]" style={{ background: "#080f1e", color: "#e2e8f0" }}>
      {/* Notification toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl"
          style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>
          🔔 {notification}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: "rgba(8,15,30,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <div className="text-lg font-bold text-white tracking-tight">Horizon <span style={{ color: "#06b6d4" }}>Dashboard</span></div>
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${wsStatus === "connected" ? "bg-emerald-500/20 text-emerald-400" : wsStatus === "connecting" ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"}`}>
            {wsStatus === "connected" ? "● En vivo" : wsStatus === "connecting" ? "○ Conectando" : "○ Offline"}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:block">{role === "admin" ? "👑 Admin" : "👤 Empleado"}</span>
          <button onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            Salir
          </button>
        </div>
      </header>

      <main className="p-4 sm:p-6 max-w-7xl mx-auto flex flex-col gap-6">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, color: "#06b6d4" },
            { label: "Pendientes", value: stats.pendientes, color: "#f59e0b" },
            { label: "Confirmadas", value: stats.confirmadas, color: "#10b981" },
            { label: "Hoy", value: stats.hoy, color: "#6366f1" },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 flex flex-col gap-1"
              style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-400 font-medium uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Buscar cliente o teléfono…"
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
            style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <input
            type="date"
            value={filters.fecha}
            onChange={e => setFilters(f => ({ ...f, fecha: e.target.value }))}
            className="rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none"
            style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }}
          />
          <select
            value={filters.estado}
            onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))}
            className="rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none"
            style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={() => setShowWA(true)}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white whitespace-nowrap"
              style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}>
              📱 WhatsApp
            </button>
            <button onClick={() => { setWaInitial(undefined); setShowNew(true); }}
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-white whitespace-nowrap"
              style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>
              + Nueva
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <span className="animate-pulse">Cargando reservas…</span>
            </div>
          ) : reservas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <div className="text-5xl opacity-30">🍽️</div>
              <div className="text-sm">No hay reservas con estos filtros</div>
              <button onClick={() => setFilters({ q: "", fecha: "", estado: "" })}
                className="text-xs text-cyan-400 hover:text-cyan-300 underline">
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["Cliente", "Fecha", "Hora", "Pax", "Zona", "Teléfono", "Estado", "Fuente", ""].map(h => (
                      <th key={h} className="text-left text-xs font-semibold uppercase tracking-widest text-slate-500 px-4 py-3 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reservas.map(r => (
                    <tr key={r.id} className="transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap">
                        <div>{r.cliente}</div>
                        {r.comentarios && (
                          <div className="text-[11px] text-slate-500 mt-0.5 max-w-[160px] truncate" title={r.comentarios}>
                            💬 {r.comentarios}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{r.fecha_reserva}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{r.hora_reserva}</td>
                      <td className="px-4 py-3 text-slate-300">{r.personas}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {r.zona && <span>{r.zona}</span>}
                        {r.vista && <span className="text-slate-500"> · {r.vista}</span>}
                        {!r.zona && !r.vista && <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <a href={`tel:${r.telefono}`} className="text-cyan-400 hover:text-cyan-300 transition-colors">
                          {r.telefono}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={r.estado}
                          onChange={e => handleEstadoChange(r.id, e.target.value as EstadoReserva)}
                          className={`text-xs font-semibold rounded-full px-2.5 py-1 outline-none cursor-pointer ${ESTADO_COLORS[r.estado]}`}
                          style={{ background: "transparent" }}
                        >
                          {Object.entries(ESTADO_LABELS).map(([k, v]) => (
                            <option key={k} value={k} style={{ background: "#0f1d35", color: "#e2e8f0" }}>{v}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-slate-500 capitalize">{r.fuente ?? "manual"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(r.id, r.cliente)}
                          className="text-slate-600 hover:text-red-400 transition-colors text-base leading-none"
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-600 text-center">
          {reservas.length} reserva{reservas.length !== 1 ? "s" : ""} · Última actualización: {new Date().toLocaleTimeString("es-ES")}
        </p>
      </main>

      {showWA && <WhatsAppModal onClose={() => setShowWA(false)} onSave={handleWASave} />}
      {showNew && (
        <NewReservationModal
          initial={waInitial}
          onClose={() => { setShowNew(false); setWaInitial(undefined); }}
          onSaved={r => setReservas(prev => [r, ...prev])}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import {
  listReservas, updateReserva, deleteReserva,
  parseWhatsApp, createReserva, getToken,
  type Reserva, type EstadoReserva, type PaginatedReservas,
} from "@/lib/dashboard-api";

export const ESTADO_LABELS: Record<EstadoReserva, string> = {
  pendiente:  "Pendiente",
  confirmada: "Confirmada",
  cancelada:  "Cancelada",
  completada: "Completada",
};
export const ESTADO_COLORS: Record<EstadoReserva, string> = {
  pendiente:  "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30",
  confirmada: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30",
  cancelada:  "bg-red-500/20 text-red-300 ring-1 ring-red-500/30",
  completada: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/30",
};

/* ── WhatsApp Parser Modal ── */
function WhatsAppModal({ onClose, onSave }: { onClose: () => void; onSave: (r: Partial<Reserva>) => void }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<Partial<Reserva> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const EXAMPLE = `📅 Fecha de reserva: 15/08/2026\n⏰ Horario: 20:30\n👤 Cliente: María García\n👥 Cantidad de personas: 4\n🏢 Zona elegida: Terraza\n🌊 Ubicación (vista): Vista al mar\n📞 Teléfono: +34 612 345 678\n💬 Comentarios adicionales: Celebración de cumpleaños`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-lg rounded-2xl flex flex-col gap-5 p-6" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <div><div className="text-white font-bold text-lg">Parsear WhatsApp</div><div className="text-xs text-slate-400 mt-0.5">Pega el mensaje de reserva</div></div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        <button onClick={() => setText(EXAMPLE)} className="text-xs text-cyan-400 hover:text-cyan-300 text-left underline underline-offset-2">Usar mensaje de ejemplo</button>
        <textarea rows={8} value={text} onChange={e => setText(e.target.value)} className="rounded-xl p-3 text-sm text-slate-200 resize-none outline-none w-full" style={{ background: "#162040", border: "1px solid rgba(255,255,255,0.1)" }} placeholder="Pega aquí el mensaje de WhatsApp..." />
        {error && <div className="text-sm text-red-400">{error}</div>}
        {parsed && (
          <div className="rounded-xl p-4 flex flex-col gap-2 text-sm" style={{ background: "#162040" }}>
            <div className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-1">Datos extraídos</div>
            {Object.entries(parsed).map(([k, v]) => v != null && (<div key={k} className="flex gap-2"><span className="text-slate-400 w-32 shrink-0 capitalize">{k.replace(/_/g, " ")}</span><span className="text-white">{String(v)}</span></div>))}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={async () => { setLoading(true); setError(""); try { setParsed(await parseWhatsApp(text)); } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); } finally { setLoading(false); } }} disabled={loading || !text.trim()} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-40" style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>{loading ? "Parseando…" : "Parsear"}</button>
          {parsed && <button onClick={() => { onSave(parsed); onClose(); }} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500">Guardar reserva</button>}
        </div>
      </div>
    </div>
  );
}

/* ── Validation helpers ── */
const PHONE_RE = /^\+?[\d\s\-().]{6,25}$/;

function validateReserva(f: { cliente: string; fecha_reserva: string; hora_reserva: string; personas: number | string; telefono: string }) {
  const errs: Record<string, string> = {};
  if (!f.cliente.trim())        errs.cliente       = "El nombre del cliente es obligatorio";
  if (!f.fecha_reserva)         errs.fecha_reserva = "La fecha es obligatoria";
  if (!f.hora_reserva)          errs.hora_reserva  = "La hora es obligatoria";
  const p = Number(f.personas);
  if (!p || p < 1 || p > 30)   errs.personas      = "Entre 1 y 30 personas";
  const tel = f.telefono.trim();
  if (!tel)                     errs.telefono      = "El teléfono es obligatorio";
  else if (!PHONE_RE.test(tel)) errs.telefono      = "Formato inválido (ej: +34 612 345 678)";
  return errs;
}

/* ── Field wrapper ── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">{label}</label>
      {children}
      {error && <span className="text-[10px] text-red-400 font-medium">{error}</span>}
    </div>
  );
}

/* ── New/Edit Reservation Modal ── */
function ReservaModal({ initial, onClose, onSaved }: { initial?: Partial<Reserva>; onClose: () => void; onSaved: (r: Reserva) => void }) {
  const [form, setForm] = useState({
    cliente:       initial?.cliente       ?? "",
    fecha_reserva: initial?.fecha_reserva ?? "",
    hora_reserva:  initial?.hora_reserva  ?? "20:00",
    personas:      initial?.personas      ?? 2,
    zona:          initial?.zona          ?? "",
    vista:         initial?.vista         ?? "",
    telefono:      initial?.telefono      ?? "",
    comentarios:   initial?.comentarios   ?? "",
    estado:        (initial?.estado       ?? "pendiente") as EstadoReserva,
    fuente:        initial?.fuente        ?? "manual",
  });
  const [touched, setTouched]   = useState<Record<string, boolean>>({});
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState("");

  const fieldErrors = validateReserva(form);
  const hasErrors   = Object.keys(fieldErrors).length > 0;

  function set(k: string, v: unknown) {
    setForm(f => ({ ...f, [k]: v }));
    setTouched(t => ({ ...t, [k]: true }));
  }
  function err(k: string) { return touched[k] ? fieldErrors[k] : undefined; }

  const inp = "rounded-lg px-3 py-2 text-sm text-white outline-none w-full";
  const sty = (field: string) => ({
    background: "#162040",
    border: `1px solid ${touched[field] && fieldErrors[field] ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)"}`,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ cliente: true, fecha_reserva: true, hora_reserva: true, personas: true, telefono: true });
    if (hasErrors) return;
    setLoading(true); setError("");
    try {
      const r = await createReserva({
        ...form,
        personas:    Number(form.personas),
        zona:        form.zona        || null,
        vista:       form.vista       || null,
        comentarios: form.comentarios || null,
        fuente:      form.fuente      || "manual",
      });
      onSaved(r); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally { setLoading(false); }
  }

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
            <div className="col-span-2">
              <Field label="Cliente *" error={err("cliente")}>
                <input className={inp} style={sty("cliente")} value={form.cliente}
                  onChange={e => set("cliente", e.target.value)}
                  onBlur={() => setTouched(t => ({ ...t, cliente: true }))} />
              </Field>
            </div>
            <Field label="Fecha *" error={err("fecha_reserva")}>
              <input type="date" className={inp} style={sty("fecha_reserva")} value={form.fecha_reserva}
                onChange={e => set("fecha_reserva", e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, fecha_reserva: true }))} />
            </Field>
            <Field label="Hora *" error={err("hora_reserva")}>
              <input type="time" className={inp} style={sty("hora_reserva")} value={form.hora_reserva}
                onChange={e => set("hora_reserva", e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, hora_reserva: true }))} />
            </Field>
            <Field label="Personas *" error={err("personas")}>
              <input type="number" min="1" max="30" className={inp} style={sty("personas")} value={form.personas}
                onChange={e => set("personas", e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, personas: true }))} />
            </Field>
            <Field label="Teléfono *" error={err("telefono")}>
              <input className={inp} style={sty("telefono")} value={form.telefono}
                placeholder="+34 612 345 678"
                onChange={e => set("telefono", e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, telefono: true }))} />
            </Field>
            <Field label="Zona">
              <input className={inp} style={sty("zona")} value={form.zona} onChange={e => set("zona", e.target.value)} />
            </Field>
            <Field label="Vista">
              <input className={inp} style={sty("vista")} value={form.vista} onChange={e => set("vista", e.target.value)} />
            </Field>
            <div className="col-span-2">
              <Field label="Comentarios">
                <textarea rows={2} className={`${inp} resize-none`} style={sty("comentarios")} value={form.comentarios} onChange={e => set("comentarios", e.target.value)} />
              </Field>
            </div>
            <Field label="Estado">
              <select className={inp} style={sty("estado")} value={form.estado} onChange={e => set("estado", e.target.value)}>
                {Object.entries(ESTADO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>
          <button type="submit" disabled={loading}
            className="mt-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>
            {loading ? "Guardando…" : "Crear reserva"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function ReservasList({ wsRef }: { wsRef?: React.RefObject<WebSocket | null> }) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: "", fecha: "", estado: "" });
  const [showWA, setShowWA] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [waInitial, setWaInitial] = useState<Partial<Reserva> | undefined>();
  const [notification, setNotification] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    try { 
      const result = await listReservas({ q: filters.q || undefined, fecha: filters.fecha || undefined, estado: filters.estado || undefined }); 
      setReservas(result.items); 
    }
    catch { /* silent */ } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!wsRef?.current) return;
    const ws = wsRef.current;
    const handler = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "reserva_nueva") { setReservas(p => [msg.data, ...p]); setNotification(`Nueva: ${msg.data.cliente}`); setTimeout(() => setNotification(null), 4000); }
        else if (msg.type === "reserva_actualizada") setReservas(p => p.map(r => r.id === msg.data.id ? msg.data : r));
        else if (msg.type === "reserva_eliminada") setReservas(p => p.filter(r => r.id !== msg.data.id));
      } catch { /* ignore */ }
    };
    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [wsRef]);

  const stats = { total: reservas.length, pendientes: reservas.filter(r => r.estado === "pendiente").length, confirmadas: reservas.filter(r => r.estado === "confirmada").length, hoy: reservas.filter(r => r.fecha_reserva === new Date().toISOString().slice(0, 10)).length };

  return (
    <div className="flex flex-col gap-6">
      {notification && <div className="fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl" style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>🔔 {notification}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{ label: "Total", value: stats.total, color: "#06b6d4" }, { label: "Pendientes", value: stats.pendientes, color: "#f59e0b" }, { label: "Confirmadas", value: stats.confirmadas, color: "#10b981" }, { label: "Hoy", value: stats.hoy, color: "#6366f1" }].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input type="search" placeholder="Buscar cliente o teléfono…" value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white outline-none" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }} />
        <input type="date" value={filters.fecha} onChange={e => setFilters(f => ({ ...f, fecha: e.target.value }))} className="rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }} />
        <select value={filters.estado} onChange={e => setFilters(f => ({ ...f, estado: e.target.value }))} className="rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }}>
          <option value="">Todos</option>{Object.entries(ESTADO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => setShowWA(true)} className="rounded-xl px-4 py-2.5 text-sm font-bold whitespace-nowrap" style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}>📱 WhatsApp</button>
          <button onClick={() => { setWaInitial(undefined); setShowNew(true); }} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white whitespace-nowrap" style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>+ Nueva</button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
        {loading ? <div className="flex items-center justify-center py-20 text-slate-400"><span className="animate-pulse">Cargando…</span></div>
          : reservas.length === 0 ? <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500"><div className="text-5xl opacity-30">🍽️</div><div className="text-sm">No hay reservas</div><button onClick={() => setFilters({ q: "", fecha: "", estado: "" })} className="text-xs text-cyan-400 underline">Limpiar filtros</button></div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>{["Cliente", "Fecha", "Hora", "Pax", "Zona", "Teléfono", "Estado", "Fuente", ""].map(h => <th key={h} className="text-left text-xs font-semibold uppercase tracking-widest text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>
                  {reservas.map(r => (
                    <tr key={r.id} className="hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-4 py-3 font-medium text-white whitespace-nowrap"><div>{r.cliente}</div>{r.comentarios && <div className="text-[11px] text-slate-500 mt-0.5 max-w-[160px] truncate" title={r.comentarios}>💬 {r.comentarios}</div>}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{r.fecha_reserva}</td>
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{r.hora_reserva}</td>
                      <td className="px-4 py-3 text-slate-300">{r.personas}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{r.zona ?? <span className="text-slate-600">—</span>}{r.vista && <span className="text-slate-500"> · {r.vista}</span>}</td>
                      <td className="px-4 py-3 whitespace-nowrap"><a href={`tel:${r.telefono}`} className="text-cyan-400 hover:text-cyan-300">{r.telefono}</a></td>
                      <td className="px-4 py-3">
                        <select value={r.estado} onChange={e => updateReserva(r.id, { estado: e.target.value as EstadoReserva }).then(u => setReservas(p => p.map(x => x.id === r.id ? u : x)))} className={`text-xs font-semibold rounded-full px-2.5 py-1 outline-none cursor-pointer ${ESTADO_COLORS[r.estado]}`} style={{ background: "transparent" }}>
                          {Object.entries(ESTADO_LABELS).map(([k, v]) => <option key={k} value={k} style={{ background: "#0f1d35", color: "#e2e8f0" }}>{v}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3"><span className="text-[11px] text-slate-500 capitalize">{r.fuente ?? "manual"}</span></td>
                      <td className="px-4 py-3"><button onClick={() => { if (confirm(`¿Eliminar reserva de ${r.cliente}?`)) deleteReserva(r.id).then(() => setReservas(p => p.filter(x => x.id !== r.id))); }} className="text-slate-600 hover:text-red-400 text-base leading-none">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      <p className="text-xs text-slate-600 text-center">{reservas.length} reserva{reservas.length !== 1 ? "s" : ""}</p>

      {showWA && <WhatsAppModal onClose={() => setShowWA(false)} onSave={d => { setWaInitial(d); setShowNew(true); }} />}
      {showNew && <ReservaModal initial={waInitial} onClose={() => { setShowNew(false); setWaInitial(undefined); }} onSaved={r => setReservas(p => [r, ...p])} />}
    </div>
  );
}

import { useState, useEffect } from "react";
import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown, Phone, Users, Clock, MapPin, FileText, Calendar, MessageSquare } from "lucide-react";
import { getCalendar, listReservas, updateReserva, type CalendarDay, type Reserva, type EstadoReserva } from "@/lib/dashboard-api";
import { toast } from "sonner";

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

const ESTADO_COLORS: Record<EstadoReserva, { bg: string; text: string }> = {
  confirmada: { bg: "rgba(16,185,129,0.18)",  text: "#6ee7b7" },
  pendiente:  { bg: "rgba(245,158,11,0.18)",  text: "#fcd34d" },
  cancelada:  { bg: "rgba(239,68,68,0.16)",   text: "#fca5a5" },
  completada: { bg: "rgba(6,182,212,0.16)",   text: "#67e8f9" },
};

function occupancy(count: number) {
  if (count === 0) return { label: "", bg: "transparent", text: "text-slate-500", dot: "" };
  if (count <= 3)  return { label: "baja",  bg: "rgba(16,185,129,0.12)", text: "text-emerald-300", dot: "bg-emerald-400" };
  if (count <= 7)  return { label: "media", bg: "rgba(245,158,11,0.12)", text: "text-amber-300",   dot: "bg-amber-400" };
  return             { label: "alta",  bg: "rgba(239,68,68,0.12)",   text: "text-red-300",     dot: "bg-red-400" };
}

function fmtDatetime(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

/* ── Accordion card for each reservation ── */
function ReservaAccordionItem({ r, onEstadoChange }: { r: Reserva; onEstadoChange: (updated: Reserva) => void }) {
  const ec = ESTADO_COLORS[r.estado];

  async function handleEstado(newEstado: string) {
    try {
      const updated = await updateReserva(r.id, { estado: newEstado as EstadoReserva });
      onEstadoChange(updated);
      toast.success("Estado actualizado", { description: `${r.cliente} → ${newEstado}` });
    } catch { toast.error("Error al actualizar estado"); }
  }

  return (
    <Accordion.Item
      value={String(r.id)}
      className="rounded-xl overflow-hidden"
      style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Trigger — always visible */}
      <Accordion.Trigger
        className="w-full flex items-center justify-between px-4 py-3 group transition-colors hover:bg-white/[0.02]"
        style={{ cursor: "pointer" }}
      >
        <div className="flex items-center gap-3 min-w-0 text-left">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{r.cliente}</div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.hora_reserva}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{r.personas} pax</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: ec.bg, color: ec.text }}>
            {r.estado}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </div>
      </Accordion.Trigger>

      {/* Content — expanded */}
      <Accordion.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
        <div className="px-4 pb-4 space-y-3">
          <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {r.telefono && (
              <a href={`tel:${r.telefono}`} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>{r.telefono}</span>
              </a>
            )}
            <div className="flex items-center gap-2 text-slate-300">
              <Users className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span>{r.personas} persona{r.personas !== 1 ? "s" : ""}</span>
            </div>
            {r.zona && (
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span>{r.zona}{r.vista ? ` · ${r.vista}` : ""}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              <span className="text-xs">Creada: {fmtDatetime(r.fecha_creacion)}</span>
            </div>
          </div>

          {r.comentarios && (
            <div className="flex gap-2 text-sm text-slate-300 rounded-lg p-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-slate-500 mt-0.5" />
              <span className="text-xs leading-relaxed">{r.comentarios}</span>
            </div>
          )}

          {/* Estado selector */}
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={r.estado}
              onChange={e => handleEstado(e.target.value)}
              className="text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
              style={{ background: ec.bg, color: ec.text, border: "none" }}
              onClick={e => e.stopPropagation()}
            >
              <option value="pendiente"  style={{ background: "#0f1d35", color: "#e2e8f0" }}>Pendiente</option>
              <option value="confirmada" style={{ background: "#0f1d35", color: "#e2e8f0" }}>Confirmada</option>
              <option value="completada" style={{ background: "#0f1d35", color: "#e2e8f0" }}>Completada</option>
              <option value="cancelada"  style={{ background: "#0f1d35", color: "#e2e8f0" }}>Cancelada</option>
            </select>
          </div>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}

/* ── Main Calendar ── */
export function CalendarView() {
  const today = new Date();
  const [month, setMonth]     = useState(today.getMonth() + 1);
  const [year, setYear]       = useState(today.getFullYear());
  const [data, setData]       = useState<Record<string, CalendarDay>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay]   = useState<string | null>(null);
  const [dayReservas, setDayReservas]   = useState<Reserva[]>([]);
  const [dayLoading, setDayLoading]     = useState(false);

  useEffect(() => {
    setLoading(true);
    getCalendar(month, year)
      .then(setData).catch(() => {})
      .finally(() => setLoading(false));
    setSelectedDay(null);
  }, [month, year]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  async function handleDayClick(dateStr: string) {
    if (selectedDay === dateStr) { setSelectedDay(null); return; }
    setSelectedDay(dateStr);
    setDayLoading(true);
    try {
      const res = await listReservas({ fecha: dateStr, limit: 100 });
      setDayReservas(res.items);
    } catch { setDayReservas([]); }
    finally { setDayLoading(false); }
  }

  function handleEstadoChange(updated: Reserva) {
    setDayReservas(prev => prev.map(r => r.id === updated.id ? updated : r));
  }

  const firstDow = new Date(year, month - 1, 1).getDay();
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const pad = (n: number) => String(n).padStart(2, "0");
  const totalReservas = Object.values(data).reduce((s, d) => s + d.count, 0);
  const totalPersonas = Object.values(data).reduce((s, d) => s + d.personas, 0);
  const diasOcupados  = Object.keys(data).length;
  const masOcupado    = Object.entries(data).sort((a, b) => b[1].count - a[1].count)[0];

  return (
    <div className="flex flex-col gap-6">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{MONTHS_ES[month - 1]} {year}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{totalReservas} reservas · {totalPersonas} personas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }}>‹</button>
          <button onClick={() => { setMonth(today.getMonth() + 1); setYear(today.getFullYear()); }} className="px-3 h-9 rounded-xl text-xs font-semibold text-slate-300 hover:text-white" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }}>Hoy</button>
          <button onClick={nextMonth} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white transition-colors" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }}>›</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Reservas",      value: totalReservas, color: "#06b6d4" },
          { label: "Personas",      value: totalPersonas, color: "#6366f1" },
          { label: "Días ocupados", value: diasOcupados,  color: "#f59e0b" },
          { label: "Día top",       value: masOcupado ? `${masOcupado[0].slice(8)} — ${masOcupado[1].count}r` : "—", color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-slate-400">
        {[{ color: "bg-emerald-400", label: "Baja (1–3)" }, { color: "bg-amber-400", label: "Media (4–7)" }, { color: "bg-red-400", label: "Alta (8+)" }].map(l => (
          <div key={l.label} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${l.color}`} />{l.label}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-7 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {DAYS_ES.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">{d}</div>
          ))}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 animate-pulse">Cargando calendario…</div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="min-h-[72px] p-2" style={{ borderRight: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }} />;
              const dateStr  = `${year}-${pad(month)}-${pad(day)}`;
              const info     = data[dateStr];
              const occ      = occupancy(info?.count ?? 0);
              const isToday  = dateStr === today.toISOString().slice(0, 10);
              const isSel    = selectedDay === dateStr;
              return (
                <div
                  key={i}
                  onClick={() => handleDayClick(dateStr)}
                  className="min-h-[72px] p-2 cursor-pointer transition-all relative flex flex-col gap-1"
                  style={{
                    background: isSel ? "rgba(6,182,212,0.12)" : occ.bg,
                    border: `1px solid ${isSel ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isToday ? "text-cyan-400" : "text-slate-300"}`}>{day}</span>
                    {isToday && <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">Hoy</span>}
                  </div>
                  {info && (
                    <>
                      <div className={`text-xs font-semibold ${occ.text}`}>{info.count} res.</div>
                      <div className="text-[10px] text-slate-500">{info.personas}p</div>
                      <div className={`mt-auto w-full h-1 rounded-full ${occ.dot}`} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail panel — accordion */}
      {selectedDay && (
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "#0f1d35", border: "1px solid rgba(6,182,212,0.2)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-bold text-base">
                {new Date(selectedDay + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {data[selectedDay]?.count ?? 0} reservas · {data[selectedDay]?.personas ?? 0} personas
              </div>
            </div>
            <button onClick={() => setSelectedDay(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">✕</button>
          </div>

          {dayLoading ? (
            <div className="text-slate-400 text-sm animate-pulse py-4">Cargando reservas…</div>
          ) : dayReservas.length === 0 ? (
            <div className="text-slate-500 text-sm py-4 text-center">No hay reservas para este día</div>
          ) : (
            <Accordion.Root type="multiple" className="flex flex-col gap-2">
              {dayReservas
                .sort((a, b) => a.hora_reserva.localeCompare(b.hora_reserva))
                .map(r => (
                  <ReservaAccordionItem key={r.id} r={r} onEstadoChange={handleEstadoChange} />
                ))}
            </Accordion.Root>
          )}
        </div>
      )}
    </div>
  );
}

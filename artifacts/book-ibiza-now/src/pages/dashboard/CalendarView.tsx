import { useState, useEffect } from "react";
import { getCalendar, listReservas, type CalendarDay, type Reserva } from "@/lib/dashboard-api";

const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function occupancy(count: number): { label: string; bg: string; text: string; dot: string } {
  if (count === 0) return { label: "", bg: "transparent", text: "text-slate-500", dot: "" };
  if (count <= 3)  return { label: "baja",  bg: "rgba(16,185,129,0.12)", text: "text-emerald-300", dot: "bg-emerald-400" };
  if (count <= 7)  return { label: "media", bg: "rgba(245,158,11,0.12)", text: "text-amber-300",   dot: "bg-amber-400" };
  return             { label: "alta",  bg: "rgba(239,68,68,0.12)",   text: "text-red-300",     dot: "bg-red-400" };
}

export function CalendarView() {
  const today = new Date();
  const [month, setMonth]   = useState(today.getMonth() + 1);
  const [year, setYear]     = useState(today.getFullYear());
  const [data, setData]     = useState<Record<string, CalendarDay>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dayReservas, setDayReservas] = useState<Reserva[]>([]);
  const [dayLoading, setDayLoading]   = useState(false);

  useEffect(() => {
    setLoading(true);
    getCalendar(month, year)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
    setSelectedDay(null);
  }, [month, year]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  async function handleDayClick(dateStr: string) {
    if (selectedDay === dateStr) { setSelectedDay(null); return; }
    setSelectedDay(dateStr);
    setDayLoading(true);
    try { setDayReservas(await listReservas({ fecha: dateStr })); }
    catch { setDayReservas([]); }
    finally { setDayLoading(false); }
  }

  /* Build grid */
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const startOffset = firstDow === 0 ? 6 : firstDow - 1; // Mon-first
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
          { label: "Reservas",    value: totalReservas, color: "#06b6d4" },
          { label: "Personas",    value: totalPersonas, color: "#6366f1" },
          { label: "Días ocupados", value: diasOcupados, color: "#f59e0b" },
          { label: "Día top",     value: masOcupado ? `${masOcupado[0].slice(8)} — ${masOcupado[1].count}r` : "—", color: "#10b981" },
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
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {DAYS_ES.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold uppercase tracking-widest text-slate-500">{d}</div>
          ))}
        </div>
        {/* Cells */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 animate-pulse">Cargando calendario…</div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="min-h-[80px] p-2" style={{ borderRight: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }} />;
              const dateStr = `${year}-${pad(month)}-${pad(day)}`;
              const info = data[dateStr];
              const occ  = occupancy(info?.count ?? 0);
              const isToday = dateStr === today.toISOString().slice(0, 10);
              const isSelected = selectedDay === dateStr;
              return (
                <div
                  key={i}
                  onClick={() => handleDayClick(dateStr)}
                  className="min-h-[80px] p-2 cursor-pointer transition-all relative flex flex-col gap-1"
                  style={{
                    background: isSelected ? "rgba(6,182,212,0.12)" : occ.bg,
                    border: `1px solid ${isSelected ? "rgba(6,182,212,0.4)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${isToday ? "text-cyan-400" : "text-slate-300"}`}>{day}</span>
                    {isToday && <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">Hoy</span>}
                  </div>
                  {info && (
                    <>
                      <div className={`text-xs font-semibold ${occ.text}`}>{info.count} reserva{info.count !== 1 ? "s" : ""}</div>
                      <div className="text-[11px] text-slate-500">{info.personas} personas</div>
                      <div className={`mt-auto w-full h-1 rounded-full ${occ.dot}`} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day detail panel */}
      {selectedDay && (
        <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "#0f1d35", border: "1px solid rgba(6,182,212,0.2)" }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-bold">Reservas del {selectedDay}</div>
              <div className="text-xs text-slate-400 mt-0.5">{data[selectedDay]?.count ?? 0} reservas · {data[selectedDay]?.personas ?? 0} personas</div>
            </div>
            <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          {dayLoading ? (
            <div className="text-slate-400 text-sm animate-pulse">Cargando…</div>
          ) : dayReservas.length === 0 ? (
            <div className="text-slate-500 text-sm">No hay reservas para este día</div>
          ) : (
            <div className="flex flex-col gap-2">
              {dayReservas.map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-xl p-3" style={{ background: "#162040" }}>
                  <div>
                    <div className="text-white text-sm font-medium">{r.cliente}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{r.hora_reserva} · {r.personas} pax{r.zona ? ` · ${r.zona}` : ""}</div>
                  </div>
                  <div className={`text-xs font-semibold rounded-full px-2.5 py-1 ${
                    r.estado === "confirmada" ? "bg-emerald-500/20 text-emerald-300" :
                    r.estado === "pendiente"  ? "bg-amber-500/20 text-amber-300" :
                    r.estado === "cancelada"  ? "bg-red-500/20 text-red-300" :
                    "bg-sky-500/20 text-sky-300"
                  }`}>{r.estado}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

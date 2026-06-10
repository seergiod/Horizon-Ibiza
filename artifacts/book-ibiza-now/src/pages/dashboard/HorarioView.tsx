import { useState, useEffect } from "react";
import { getMisHorarios, getVersionesHorario, getVersionHorario } from "@/lib/dashboard-api";

const DIAS_ORDER = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

interface Turno {
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

interface Version {
  id: number;
  semana_inicio: string;
  nombre: string | null;
  notas: string | null;
  fecha_creacion: string;
}

function TurnoChip({ t }: { t: Turno }) {
  const colors = {
    trabaja:   { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", text: "#10b981" },
    libre:     { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)", text: "#94a3b8" },
    modificado:{ bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.3)",  text: "#f87171" },
  };
  const c = colors[t.estado] ?? colors.trabaja;

  return (
    <div className="rounded-lg px-2.5 py-2 text-xs flex flex-col gap-0.5 relative"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      {t.es_cambio && (
        <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1 py-0.5 rounded-full"
          style={{ background: "#ef4444", color: "white" }}>cambio</span>
      )}
      {t.estado === "libre" ? (
        <span className="font-semibold" style={{ color: c.text }}>LIBRE</span>
      ) : (
        <>
          {(t.hora_inicio || t.hora_fin) && (
            <span className="font-bold" style={{ color: c.text }}>
              {t.hora_inicio ?? "?"} – {t.hora_fin ?? "?"}
            </span>
          )}
          {t.seccion && <span className="text-slate-500">{t.seccion}</span>}
          {t.notas && <span className="text-slate-600 truncate max-w-[120px]">{t.notas}</span>}
        </>
      )}
    </div>
  );
}

/* ── Mi Horario (employee view) ── */
function MiHorario() {
  const [version, setVersion] = useState<Version | null>(null);
  const [turnos,  setTurnos]  = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    getMisHorarios()
      .then(d => { setVersion(d.version); setTurnos(d.turnos); })
      .catch(() => setError("Error al cargar tu horario"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 text-sm p-8 text-center">Cargando horario…</div>;
  if (error)   return <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl">{error}</div>;
  if (!version) return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">📅</div>
      <p className="text-slate-400">Aún no hay horario publicado</p>
    </div>
  );

  const hayCambios = turnos.some(t => t.es_cambio);

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Mi horario</h2>
          <p className="text-sm text-slate-400 mt-0.5">{version.nombre ?? `Semana del ${version.semana_inicio}`}</p>
        </div>
        {hayCambios && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
            ⚠ Hay cambios en tu horario
          </div>
        )}
      </div>

      {turnos.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-sm">No tienes turnos asignados esta semana</div>
      ) : (
        <div className="flex flex-col gap-2">
          {DIAS_ORDER.map(dia => {
            const ts = turnos.filter(t => t.dia.toLowerCase() === dia.toLowerCase());
            return (
              <div key={dia} className="rounded-xl p-4 flex items-center gap-4"
                style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-24 flex-shrink-0">
                  <div className="text-sm font-bold text-white capitalize">{dia}</div>
                </div>
                <div className="flex flex-wrap gap-2 flex-1">
                  {ts.length === 0
                    ? <span className="text-xs text-slate-600">—</span>
                    : ts.map((t, i) => <TurnoChip key={i} t={t} />)
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-4 text-xs text-slate-500 mt-2 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500/30 inline-block" />trabaja</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-600/50 inline-block" />libre</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500/30 inline-block" />modificado</span>
      </div>
    </div>
  );
}

/* ── Vista completa admin ── */
function VistaAdmin() {
  const [versiones,  setVersiones]  = useState<Version[]>([]);
  const [selId,      setSelId]      = useState<number | null>(null);
  const [turnos,     setTurnos]     = useState<Turno[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingV,   setLoadingV]   = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    getVersionesHorario()
      .then(vs => {
        setVersiones(vs);
        if (vs.length > 0) setSelId(vs[0].id);
      })
      .catch(() => setError("Error al cargar versiones"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selId) return;
    setLoadingV(true);
    getVersionHorario(selId)
      .then(d => setTurnos(d.turnos))
      .catch(() => setError("Error al cargar turnos"))
      .finally(() => setLoadingV(false));
  }, [selId]);

  if (loading) return <div className="text-slate-400 text-sm p-8 text-center">Cargando…</div>;
  if (error)   return <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl">{error}</div>;

  const selVersion = versiones.find(v => v.id === selId);
  const empleados  = [...new Set(turnos.map(t => t.empleado_nombre))].sort();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Horarios publicados</h2>
        {versiones.length > 0 && (
          <select value={selId ?? ""} onChange={e => setSelId(Number(e.target.value))}
            className="text-sm text-white rounded-xl px-3 py-2 outline-none"
            style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.1)" }}>
            {versiones.map(v => (
              <option key={v.id} value={v.id} style={{ background: "#0f1d35" }}>
                {v.nombre ?? `Semana ${v.semana_inicio}`} — {new Date(v.fecha_creacion).toLocaleDateString("es")}
              </option>
            ))}
          </select>
        )}
      </div>

      {versiones.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-slate-400">Aún no hay horarios. Ve a "Subir Horario" para añadir uno.</p>
        </div>
      )}

      {loadingV && <div className="text-slate-400 text-sm text-center py-8">Cargando turnos…</div>}

      {!loadingV && selVersion && turnos.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-sm font-bold text-white">{selVersion.nombre ?? `Semana ${selVersion.semana_inicio}`}</span>
            <span className="text-xs text-slate-500">{empleados.length} empleados · {turnos.length} turnos</span>
            {turnos.some(t => t.es_cambio) && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>cambios detectados</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="px-3 py-2 text-left text-slate-500 font-bold uppercase tracking-widest sticky left-0" style={{ background: "#0a1628", minWidth: 120 }}>Día</th>
                  {empleados.map(e => (
                    <th key={e} className="px-3 py-2 text-left font-bold text-slate-300 whitespace-nowrap">{e}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIAS_ORDER.map(dia => {
                  const row = empleados.map(emp => turnos.find(t => t.dia.toLowerCase() === dia && t.empleado_nombre === emp));
                  return (
                    <tr key={dia} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td className="px-3 py-2 font-medium text-white capitalize sticky left-0" style={{ background: "#0a1628" }}>{dia}</td>
                      {row.map((t, i) => (
                        <td key={i} className="px-2 py-1.5 whitespace-nowrap">
                          {t ? <TurnoChip t={t} /> : <span className="text-slate-700">—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Router ── */
export function HorarioView({ role }: { role: string }) {
  const [tab, setTab] = useState<"mio" | "todos">(role === "admin" ? "todos" : "mio");

  return (
    <div className="flex flex-col gap-5">
      {role === "admin" && (
        <div className="flex gap-1 p-1 rounded-xl w-fit" style={{ background: "rgba(255,255,255,0.04)" }}>
          {[{ k: "todos" as const, l: "Vista completa" }, { k: "mio" as const, l: "Mi horario" }].map(({ k, l }) => (
            <button key={k} onClick={() => setTab(k)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === k
                ? { background: "rgba(6,182,212,0.15)", color: "#22d3ee" }
                : { color: "#64748b" }}>
              {l}
            </button>
          ))}
        </div>
      )}
      {tab === "mio" ? <MiHorario /> : <VistaAdmin />}
    </div>
  );
}

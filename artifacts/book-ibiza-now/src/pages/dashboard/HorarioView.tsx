import { useState, useEffect, useRef } from "react";
import { getMisHorarios, getVersionesHorario, getVersionHorario, listUsers, actualizarTurno, logEvent, type DashUser } from "@/lib/dashboard-api";

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
  estado: "trabaja" | "libre" | "modificado" | "vacaciones";
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

const ESTADO_COLORS = {
  trabaja:    { bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.3)",  text: "#10b981" },
  libre:      { bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)", text: "#94a3b8" },
  modificado: { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.3)",   text: "#f87171" },
  vacaciones: { bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.3)",  text: "#fbbf24" },
};

function TurnoChip({ t }: { t: Turno }) {
  const c = ESTADO_COLORS[t.estado] ?? ESTADO_COLORS.trabaja;
  return (
    <div className="rounded-lg px-2.5 py-2 text-xs flex flex-col gap-0.5 relative"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      {t.es_cambio && (
        <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1 py-0.5 rounded-full"
          style={{ background: "#ef4444", color: "white" }}>cambio</span>
      )}
      {t.estado === "libre" ? (
        <span className="font-semibold" style={{ color: c.text }}>LIBRE</span>
      ) : t.estado === "vacaciones" ? (
        <span className="font-semibold" style={{ color: c.text }}>VACACIONES</span>
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

/* ── Inline edit popover (admin only) ── */
function EditPopover({ turno, onSave, onClose }: {
  turno: Turno;
  onSave: (updated: Turno) => void;
  onClose: () => void;
}) {
  const [estado,     setEstado]     = useState(turno.estado);
  const [horaIn,    setHoraIn]     = useState(turno.hora_inicio ?? "");
  const [horaFin,   setHoraFin]    = useState(turno.hora_fin ?? "");
  const [seccion,   setSeccion]    = useState(turno.seccion ?? "");
  const [notas,     setNotas]      = useState(turno.notas ?? "");
  const [saving,    setSaving]     = useState(false);
  const [error,     setError]      = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const updated = await actualizarTurno(turno.id, {
        estado,
        hora_inicio: horaIn || null,
        hora_fin:    horaFin || null,
        seccion:     seccion || null,
        notas:       notas || null,
      });
      onSave(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full rounded-lg px-2 py-1.5 text-xs text-white outline-none";
  const inputStyle = { background: "#0f1d35", border: "1px solid rgba(255,255,255,0.1)" };
  const labelCls = "text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5";

  return (
    <div ref={ref} className="absolute z-50 rounded-xl p-3 flex flex-col gap-2.5 shadow-2xl"
      style={{ background: "#0a1e38", border: "1px solid rgba(6,182,212,0.3)", minWidth: 200, top: "100%", left: 0 }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white">Editar turno</span>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-base leading-none">×</button>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className={labelCls}>Estado</span>
        <select value={estado} onChange={e => setEstado(e.target.value as Turno["estado"])}
          className={inputCls} style={inputStyle}>
          <option value="trabaja"    style={{ background: "#0f1d35" }}>Trabaja</option>
          <option value="libre"      style={{ background: "#0f1d35" }}>Libre</option>
          <option value="vacaciones" style={{ background: "#0f1d35" }}>Vacaciones</option>
          <option value="modificado" style={{ background: "#0f1d35" }}>Modificado</option>
        </select>
      </div>

      {(estado === "trabaja" || estado === "modificado") && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5">
            <span className={labelCls}>Inicio</span>
            <input type="time" value={horaIn} onChange={e => setHoraIn(e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={labelCls}>Fin</span>
            <input type="time" value={horaFin} onChange={e => setHoraFin(e.target.value)}
              className={inputCls} style={inputStyle} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        <span className={labelCls}>Sección</span>
        <input value={seccion} onChange={e => setSeccion(e.target.value)}
          className={inputCls} style={inputStyle} placeholder="sala mañana…" />
      </div>

      <div className="flex flex-col gap-0.5">
        <span className={labelCls}>Notas</span>
        <input value={notas} onChange={e => setNotas(e.target.value)}
          className={inputCls} style={inputStyle} placeholder="Opcional…" />
      </div>

      {error && <p className="text-[10px] text-red-400">{error}</p>}

      <button onClick={handleSave} disabled={saving}
        className="py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-all"
        style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>
        {saving ? "Guardando…" : "Guardar cambio"}
      </button>
    </div>
  );
}

/* ── Celda editable ── */
function TurnoCell({ turnos, dia, empleado, isAdmin, onUpdate }: {
  turnos: Turno[];
  dia: string;
  empleado: string;
  isAdmin: boolean;
  onUpdate: (updated: Turno) => void;
}) {
  const [editing, setEditing] = useState<Turno | null>(null);

  const cellTurnos = turnos.filter(
    t => t.dia.toLowerCase() === dia && t.empleado_nombre === empleado
  );

  if (cellTurnos.length === 0) {
    return (
      <td className="px-2 py-1.5 whitespace-nowrap">
        <span className="text-slate-700">—</span>
      </td>
    );
  }

  return (
    <td className="px-2 py-1.5 whitespace-nowrap">
      <div className="flex flex-col gap-1">
        {cellTurnos.map(t => (
          <div key={t.id} className="relative group">
            <TurnoChip t={t} />
            {isAdmin && (
              <button
                onClick={() => setEditing(editing?.id === t.id ? null : t)}
                className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] px-1 py-0.5 rounded font-bold"
                style={{ background: "rgba(6,182,212,0.25)", color: "#22d3ee" }}
                title="Editar turno">
                ✎
              </button>
            )}
            {editing?.id === t.id && (
              <EditPopover
                turno={t}
                onSave={updated => { onUpdate(updated); setEditing(null); }}
                onClose={() => setEditing(null)}
              />
            )}
          </div>
        ))}
      </div>
    </td>
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
      .then(d => { setVersion(d.version); setTurnos(d.turnos as Turno[]); })
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
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500/30 inline-block" />vacaciones</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500/30 inline-block" />modificado</span>
      </div>
    </div>
  );
}

/* ── WhatsApp send button per employee ── */
function WhatsAppBtn({ empleado, turnos, semana, users }: {
  empleado: string;
  turnos: Turno[];
  semana: string;
  users: DashUser[];
}) {
  const user = users.find(u =>
    `${u.nombre} ${u.apellidos}`.toUpperCase().includes(empleado.toUpperCase()) ||
    empleado.toUpperCase().includes(u.nombre.toUpperCase())
  );
  const telefono = user?.telefono?.replace(/\D/g, "");

  function buildMensaje() {
    const lineas = DIAS_ORDER.map(dia => {
      const ts = turnos.filter(t => t.dia.toLowerCase() === dia && t.empleado_nombre === empleado);
      if (ts.length === 0) return null;
      const t = ts[0];
      if (t.estado === "libre")      return `${dia.charAt(0).toUpperCase() + dia.slice(1)}: Libre`;
      if (t.estado === "vacaciones") return `${dia.charAt(0).toUpperCase() + dia.slice(1)}: Vacaciones 🏖️`;
      const horario = (t.hora_inicio && t.hora_fin) ? `${t.hora_inicio} – ${t.hora_fin}` : "Turno";
      const sec = t.seccion ? ` (${t.seccion})` : "";
      return `${dia.charAt(0).toUpperCase() + dia.slice(1)}: ${horario}${sec}`;
    }).filter(Boolean);

    const nombre = user?.nombre ?? empleado.split(" ")[0];
    return `¡Hola ${nombre}! 👋 Aquí tienes tu horario de esta semana en Horizon Ibiza:\n\n${lineas.join("\n")}\n\n¡Cualquier duda, avísame! 🏖️`;
  }

  function handleSend() {
    const texto = buildMensaje();
    const encoded = encodeURIComponent(texto);
    const url = telefono
      ? `https://wa.me/${telefono}?text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
    const seccion = turnos.find(t => t.empleado_nombre === empleado && t.seccion)?.seccion;
    const label = seccion ? `${empleado} (${seccion})` : empleado;
    logEvent("NOTIFICACION_ENVIADA", label);
  }

  return (
    <button
      onClick={handleSend}
      title={telefono ? `Enviar WhatsApp a ${telefono}` : "Sin teléfono — abrirá WhatsApp Web para pegar el mensaje"}
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all hover:opacity-80"
      style={{ background: "rgba(37,211,102,0.15)", color: "#25D366" }}>
      <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      Enviar
    </button>
  );
}

/* ── Vista completa admin ── */
function VistaAdmin() {
  const [versiones,  setVersiones]  = useState<Version[]>([]);
  const [selId,      setSelId]      = useState<number | null>(null);
  const [turnos,     setTurnos]     = useState<Turno[]>([]);
  const [users,      setUsers]      = useState<DashUser[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingV,   setLoadingV]   = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    Promise.all([getVersionesHorario(), listUsers()])
      .then(([vs, us]) => {
        setVersiones(vs);
        setUsers(us);
        if (vs.length > 0) setSelId(vs[0].id);
      })
      .catch(() => setError("Error al cargar datos"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selId) return;
    setLoadingV(true);
    getVersionHorario(selId)
      .then(d => setTurnos(d.turnos as Turno[]))
      .catch(() => setError("Error al cargar turnos"))
      .finally(() => setLoadingV(false));
  }, [selId]);

  function handleTurnoUpdate(updated: Turno) {
    setTurnos(prev => prev.map(t => t.id === updated.id ? updated : t));
  }

  if (loading) return <div className="text-slate-400 text-sm p-8 text-center">Cargando…</div>;
  if (error)   return <div className="text-red-400 text-sm p-4 bg-red-500/10 rounded-xl">{error}</div>;

  const selVersion = versiones.find(v => v.id === selId);
  const empleados  = [...new Set(turnos.map(t => t.empleado_nombre))].sort();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Horarios publicados</h2>
          <p className="text-xs text-slate-500 mt-0.5">Pasa el ratón sobre una celda y pulsa ✎ para editar (solo admins)</p>
        </div>
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
          <div className="px-4 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
                    <th key={e} className="px-3 py-2 text-left font-bold text-slate-300 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span>{e}</span>
                        <WhatsAppBtn empleado={e} turnos={turnos} semana={selVersion.semana_inicio} users={users} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DIAS_ORDER.map(dia => (
                  <tr key={dia} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-3 py-2 font-medium text-white capitalize sticky left-0" style={{ background: "#0a1628" }}>{dia}</td>
                    {empleados.map(emp => (
                      <TurnoCell
                        key={emp}
                        turnos={turnos}
                        dia={dia}
                        empleado={emp}
                        isAdmin={true}
                        onUpdate={handleTurnoUpdate}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-slate-500 flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500/30 inline-block" />trabaja</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-600/50 inline-block" />libre</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-500/30 inline-block" />vacaciones</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500/30 inline-block" />modificado</span>
      </div>
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

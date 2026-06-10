import { useState, useEffect, useCallback } from "react";
import { getMetrics, type Metrics } from "@/lib/dashboard-api";

const EVENTO_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  VISITA_WEB:           { icon: "🌐", label: "Visita web",     color: "#06b6d4" },
  NOTIFICACION_ENVIADA: { icon: "💬", label: "Notificación",   color: "#25D366" },
};

function EventoBadge({ evento }: { evento: string }) {
  const cfg = EVENTO_LABELS[evento] ?? { icon: "•", label: evento, color: "#94a3b8" };
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${cfg.color}22`, color: cfg.color }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-2" style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
      </div>
      <span className="text-3xl font-black" style={{ color }}>{value}</span>
    </div>
  );
}

export function AuditPanel() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      setMetrics(await getMetrics());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar métricas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-slate-400 text-sm p-8 text-center">Cargando métricas…</div>;
  if (error)   return <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>;
  if (!metrics) return null;

  const maxNotif = Math.max(...metrics.notificaciones.map(n => n.total), 1);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Panel de Auditoría</h2>
          <p className="text-sm text-slate-400 mt-0.5">Actividad de empleados y tráfico web</p>
        </div>
        <button onClick={load}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:opacity-80"
          style={{ background: "rgba(6,182,212,0.12)", color: "#22d3ee", border: "1px solid rgba(6,182,212,0.2)" }}>
          ↻ Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Visitas hoy"       value={metrics.visitasHoy}                icon="🌐" color="#06b6d4" />
        <StatCard label="Empleados activos" value={metrics.notificaciones.length}     icon="👥" color="#a78bfa" />
        <StatCard label="Notificaciones"    value={metrics.notificaciones.reduce((s, n) => s + n.total, 0)} icon="💬" color="#25D366" />
      </div>

      {/* Notification ranking */}
      {metrics.notificaciones.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-sm font-bold text-white">Ranking de notificaciones por empleado</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {metrics.notificaciones.map((n, i) => (
              <div key={n.empleado} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-5 text-right font-bold">{i + 1}</span>
                <span className="text-xs text-white w-40 truncate flex-shrink-0">{n.empleado}</span>
                <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.round((n.total / maxNotif) * 100)}%`,
                      background: "linear-gradient(90deg,#25D366,#128C7E)",
                    }} />
                </div>
                <span className="text-xs font-bold text-slate-300 w-8 text-right">{n.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {metrics.notificaciones.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-4xl mb-2">💬</div>
          <p className="text-slate-400 text-sm">Aún no hay notificaciones enviadas</p>
          <p className="text-slate-600 text-xs mt-1">Se registran al pulsar "Enviar" en la vista de horarios</p>
        </div>
      )}

      {/* Last 10 actions */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-sm font-bold text-white">Últimas 10 acciones</span>
        </div>
        {metrics.ultimas10.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No hay actividad registrada aún</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-slate-500">Fecha / Hora</th>
                  <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-slate-500">Evento</th>
                  <th className="px-4 py-2 text-left font-bold uppercase tracking-widest text-slate-500">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {metrics.ultimas10.map(log => (
                  <tr key={log.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("es-ES", {
                        day: "2-digit", month: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2.5">
                      <EventoBadge evento={log.evento} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-300">{log.detalle ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

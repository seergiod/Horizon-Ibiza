import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { getToken } from "@/lib/dashboard-api";

interface Stats {
  total: number;
  porEstado: { estado: string; count: number }[];
  porDia:    { fecha: string; count: number }[];
  porHora:   { hora: string; count: number }[];
  porPersonas: { personas: number; count: number }[];
  porFuente: { fuente: string; count: number }[];
}

const ESTADO_COLOR: Record<string, string> = {
  confirmada:  "#10b981",
  pendiente:   "#f59e0b",
  cancelada:   "#ef4444",
  completada:  "#06b6d4",
};
const ESTADO_LABEL: Record<string, string> = {
  confirmada: "Confirmadas", pendiente: "Pendientes",
  cancelada: "Canceladas", completada: "Completadas",
};

const CARD_STYLE: React.CSSProperties = {
  background: "#0f1d35",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 16,
  padding: "20px 24px",
};

const CHART_STYLE: React.CSSProperties = {
  ...CARD_STYLE,
  padding: "20px 8px 12px 8px",
};

const AXIS_PROPS = {
  tick:  { fill: "#64748b", fontSize: 11 },
  axisLine: { stroke: "rgba(255,255,255,0.06)" },
  tickLine: false,
};

const TOOLTIP_STYLE = {
  contentStyle: { background: "#0f1d35", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 13 },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};

function KPI({ label, value, sub, color = "#06b6d4" }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div style={CARD_STYLE}>
      <div className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#64748b" }}>{label}</div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: "#475569" }}>{sub}</div>}
    </div>
  );
}

function formatDia(fecha: string) {
  const d = new Date(fecha + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${getToken() ?? ""}` },
    })
      .then(r => {
        if (!r.ok) throw new Error("Error al cargar estadísticas");
        return r.json() as Promise<Stats>;
      })
      .then(data => { setStats(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <span className="animate-pulse">Cargando estadísticas…</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center py-24 text-red-400 text-sm">{error ?? "Error desconocido"}</div>
    );
  }

  const confirmadas  = stats.porEstado.find(e => e.estado === "confirmada")?.count ?? 0;
  const pendientes   = stats.porEstado.find(e => e.estado === "pendiente")?.count  ?? 0;
  const web          = stats.porFuente.find(f => f.fuente === "web")?.count         ?? 0;
  const tasaConf     = stats.total > 0 ? Math.round((confirmadas / stats.total) * 100) : 0;

  const paxTotal = stats.porPersonas.reduce((s, p) => s + p.personas * p.count, 0);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total reservas"      value={stats.total}     sub="histórico"                    color="#e2e8f0" />
        <KPI label="Confirmadas"         value={confirmadas}     sub={`${tasaConf}% tasa`}          color="#10b981" />
        <KPI label="Pendientes"          value={pendientes}      sub="sin confirmar"                color="#f59e0b" />
        <KPI label="Desde web"           value={web}             sub={`${stats.total - web} manuales`} color="#8b5cf6" />
      </div>

      {/* Reservas últimos 30 días */}
      <div style={CHART_STYLE}>
        <div className="text-sm font-semibold text-slate-300 mb-4 px-4">Reservas por día (últimos 30 días)</div>
        {stats.porDia.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-sm">Sin datos en este período</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.porDia} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
              <XAxis dataKey="fecha" tickFormatter={formatDia} {...AXIS_PROPS} interval="preserveStartEnd" />
              <YAxis {...AXIS_PROPS} allowDecimals={false} width={28} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v, "Reservas"]} labelFormatter={formatDia} />
              <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Hora pico + Estado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por hora */}
        <div style={CHART_STYLE}>
          <div className="text-sm font-semibold text-slate-300 mb-4 px-4">Reservas por hora</div>
          {stats.porHora.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.porHora} margin={{ left: 0, right: 16, top: 4, bottom: 0 }}>
                <XAxis dataKey="hora" {...AXIS_PROPS} />
                <YAxis {...AXIS_PROPS} allowDecimals={false} width={28} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v, "Reservas"]} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por estado — donut */}
        <div style={CHART_STYLE}>
          <div className="text-sm font-semibold text-slate-300 mb-2 px-4">Estado de reservas</div>
          {stats.porEstado.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={stats.porEstado}
                  dataKey="count"
                  nameKey="estado"
                  cx="50%" cy="50%"
                  innerRadius={48} outerRadius={72}
                  paddingAngle={3}
                >
                  {stats.porEstado.map(entry => (
                    <Cell key={entry.estado} fill={ESTADO_COLOR[entry.estado] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE.contentStyle}
                  formatter={(v: number, _: string, p: { payload?: { estado?: string } }) => [v, ESTADO_LABEL[p.payload?.estado ?? ""] ?? p.payload?.estado ?? ""]}
                />
                <Legend
                  formatter={(value: string) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{ESTADO_LABEL[value] ?? value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Por personas */}
      <div style={CHART_STYLE}>
        <div className="text-sm font-semibold text-slate-300 mb-1 px-4">
          Reservas por número de comensales
          <span className="ml-3 text-xs font-normal text-slate-500">{paxTotal.toLocaleString()} pax en total</span>
        </div>
        {stats.porPersonas.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-sm">Sin datos</div>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={stats.porPersonas} margin={{ left: 0, right: 16, top: 12, bottom: 0 }}>
              <XAxis dataKey="personas" tickFormatter={v => `${v} pax`} {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} allowDecimals={false} width={28} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v, "Reservas"]} labelFormatter={v => `${v} comensales`} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

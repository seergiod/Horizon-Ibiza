import { useState, useEffect, useRef } from "react";
import { Routes, Route, NavLink, Navigate, useNavigate, useLocation } from "react-router-dom";
import { login, setToken, getToken, clearAuth } from "@/lib/dashboard-api";
import { ReservasList } from "./dashboard/ReservasList";
import { CalendarView } from "./dashboard/CalendarView";
import { AdminUsers } from "./dashboard/AdminUsers";
import { AdminImport } from "./dashboard/AdminImport";

/* ── Login Screen ── */
function LoginScreen({ onLogin }: { onLogin: (token: string, role: string) => void }) {
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
      setError(err instanceof Error ? err.message : "Credenciales incorrectas");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#080f1e" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold tracking-tight text-white mb-1">Horizon Ibiza</div>
          <div className="text-sm text-slate-400 font-medium tracking-widest uppercase">Panel de empleados</div>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl p-8 flex flex-col gap-5" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.07)" }}>
          {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Usuario</label>
            <input type="text" value={user} onChange={e => setUser(e.target.value)} required className="rounded-lg px-3 py-2.5 text-sm text-white outline-none" style={{ background: "#162040", border: "1px solid rgba(255,255,255,0.1)" }} placeholder="admin" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contraseña</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required className="rounded-lg px-3 py-2.5 text-sm text-white outline-none" style={{ background: "#162040", border: "1px solid rgba(255,255,255,0.1)" }} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="mt-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50" style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>
            {loading ? "Entrando…" : "Iniciar sesión"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-600 mt-5">admin / admin123 · empleado / empleado123</p>
      </div>
    </div>
  );
}

/* ── Sidebar ── */
const NAV_ITEMS = [
  { path: "/dashboard/reservas",      icon: "📋", label: "Reservas",  adminOnly: false },
  { path: "/dashboard/calendar",      icon: "📅", label: "Calendario", adminOnly: false },
  { path: "/dashboard/admin/users",   icon: "👥", label: "Usuarios",  adminOnly: true },
  { path: "/dashboard/admin/import",  icon: "📥", label: "Importar",  adminOnly: true },
];

function Sidebar({ role, onLogout, mobileOpen, onClose }: {
  role: string; onLogout: () => void; mobileOpen: boolean; onClose: () => void;
}) {
  const items = NAV_ITEMS.filter(n => !n.adminOnly || role === "admin");
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:relative lg:z-auto ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 220, background: "#080f1e", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        {/* Brand */}
        <div className="px-5 py-5 flex items-center gap-2">
          <div className="text-base font-bold text-white tracking-tight">Horizon <span style={{ color: "#06b6d4" }}>Dashboard</span></div>
        </div>

        {/* Role badge */}
        <div className="px-5 mb-4">
          <div className="text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5" style={{ background: role === "admin" ? "rgba(139,92,246,0.2)" : "rgba(59,130,246,0.2)", color: role === "admin" ? "#c4b5fd" : "#93c5fd" }}>
            {role === "admin" ? "👑" : "👤"} {role === "admin" ? "Administrador" : "Empleado"}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 flex flex-col gap-1">
          {role === "admin" && (
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1 mt-1">Principal</div>
          )}
          {items.slice(0, 2).map(item => (
            <NavLink key={item.path} to={item.path} onClick={onClose}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"}`}
              style={({ isActive }) => isActive ? { background: "rgba(6,182,212,0.15)", color: "#22d3ee" } : undefined}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}

          {role === "admin" && items.length > 2 && (
            <>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 px-3 mb-1 mt-3">Administración</div>
              {items.slice(2).map(item => (
                <NavLink key={item.path} to={item.path} onClick={onClose}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? "text-white" : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"}`}
                  style={({ isActive }) => isActive ? { background: "rgba(139,92,246,0.15)", color: "#c4b5fd" } : undefined}
                >
                  <span>{item.icon}</span> {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all">
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

/* ── Authenticated Layout ── */
function DashboardLayout({ role, onLogout, wsStatus }: { role: string; onLogout: () => void; wsStatus: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const pageTitle: Record<string, string> = {
    "/dashboard/reservas":     "Reservas",
    "/dashboard/calendar":     "Calendario",
    "/dashboard/admin/users":  "Gestión de usuarios",
    "/dashboard/admin/import": "Importar usuarios",
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#080f1e", color: "#e2e8f0" }}>
      <Sidebar role={role} onLogout={onLogout} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 gap-3"
          style={{ background: "rgba(8,15,30,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-400 hover:text-white text-xl">☰</button>
            <h1 className="font-bold text-white text-sm sm:text-base">{pageTitle[pathname] ?? "Dashboard"}</h1>
          </div>
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest hidden sm:block ${wsStatus === "connected" ? "bg-emerald-500/20 text-emerald-400" : wsStatus === "connecting" ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"}`}>
            {wsStatus === "connected" ? "● En vivo" : wsStatus === "connecting" ? "○ Conectando" : "○ Offline"}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Routes>
            <Route path="reservas" element={<ReservasList />} />
            <Route path="calendar" element={<CalendarView />} />
            {role === "admin" && <>
              <Route path="admin/users"  element={<AdminUsers />} />
              <Route path="admin/import" element={<AdminImport />} />
            </>}
            <Route path="*" element={<Navigate to="/dashboard/reservas" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ── Root Dashboard component ── */
export function Dashboard() {
  const [authed, setAuthed] = useState(() => !!getToken());
  const [role, setRole]     = useState<string>(() => {
    const t = getToken();
    if (!t) return "";
    try {
      const p = JSON.parse(atob(t.split(".")[1]));
      return p.role ?? "";
    } catch { return ""; }
  });
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!authed) return;
    const token = getToken();
    if (!token) return;

    function connect() {
      const proto = window.location.protocol === "https:" ? "wss" : "ws";
      const url   = `${proto}://${window.location.host}/ws?token=${encodeURIComponent(token!)}`;
      const ws    = new WebSocket(url);
      wsRef.current = ws;
      setWsStatus("connecting");
      ws.onopen  = () => setWsStatus("connected");
      ws.onclose = () => { setWsStatus("disconnected"); retryRef.current = setTimeout(connect, 5000); };
      ws.onerror = () => ws.close();
    }
    connect();
    return () => { if (retryRef.current) clearTimeout(retryRef.current); wsRef.current?.close(); };
  }, [authed]);

  function handleLogout() { clearAuth(); setAuthed(false); setRole(""); wsRef.current?.close(); }

  if (!authed) {
    return <LoginScreen onLogin={(t, r) => { setRole(r); setAuthed(true); }} />;
  }

  return <DashboardLayout role={role} onLogout={handleLogout} wsStatus={wsStatus} />;
}

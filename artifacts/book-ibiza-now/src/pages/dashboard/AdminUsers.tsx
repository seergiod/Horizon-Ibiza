import { useState, useEffect } from "react";
import { listUsers, createUser, updateUser, deleteUser, type DashUser } from "@/lib/dashboard-api";

const ROL_COLORS = {
  admin:    "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30",
  empleado: "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30",
};
const ESTADO_COLORS = {
  activo:   "bg-emerald-500/20 text-emerald-300",
  inactivo: "bg-slate-500/20 text-slate-400",
};

const EMPTY = { nombre: "", apellidos: "", dni: "", email: "", username: "", telefono: "", password: "", rol: "empleado" as "admin" | "empleado", estado: "activo" as "activo" | "inactivo" };

const PHONE_RE = /^\+?[\d\s\-().]{6,25}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUser(f: typeof EMPTY, isEdit: boolean) {
  const errs: Record<string, string> = {};
  if (!f.nombre.trim())              errs.nombre   = "El nombre es obligatorio";
  if (!f.email.trim())               errs.email    = "El email es obligatorio";
  else if (!EMAIL_RE.test(f.email))  errs.email    = "Introduce un email válido (con @)";
  if (!f.username.trim())            errs.username  = "El usuario es obligatorio";
  else if (f.username.trim().length < 2) errs.username = "Mínimo 2 caracteres";
  const tel = f.telefono.trim();
  if (tel && !PHONE_RE.test(tel))    errs.telefono = "Formato inválido (ej: +34 612 345 678)";
  if (!isEdit && !f.password)        errs.password  = "La contraseña es obligatoria";
  else if (f.password && f.password.length < 6) errs.password = "Mínimo 6 caracteres";
  return errs;
}

function UField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 font-semibold uppercase tracking-widest">{label}</label>
      {children}
      {error && <span className="text-[10px] text-red-400 font-medium">{error}</span>}
    </div>
  );
}

function UserModal({ user, onClose, onSaved }: {
  user: Partial<DashUser & { password: string }> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user?.id;
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY, ...(user ?? {}) });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const fieldErrors = validateUser(form, isEdit);

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
    const allTouched = Object.fromEntries(["nombre", "email", "username", "telefono", "password"].map(k => [k, true]));
    setTouched(allTouched);
    if (Object.keys(fieldErrors).length > 0) return;
    setLoading(true); setError("");
    try {
      if (isEdit) {
        const patch: Record<string, unknown> = {
          nombre: form.nombre, apellidos: form.apellidos,
          dni: form.dni || undefined, email: form.email,
          username: form.username, telefono: form.telefono || undefined,
          rol: form.rol, estado: form.estado,
        };
        if (form.password) patch.password = form.password;
        await updateUser(user!.id!, patch as Parameters<typeof updateUser>[1]);
      } else {
        await createUser(form);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4 my-4" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center justify-between">
          <div className="text-white font-bold text-lg">{isEdit ? "Editar usuario" : "Nuevo usuario"}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        {error && <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</div>}
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <UField label="Nombre *" error={err("nombre")}>
            <input className={inp} style={sty("nombre")} value={form.nombre}
              onChange={e => set("nombre", e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, nombre: true }))} />
          </UField>
          <UField label="Apellidos">
            <input className={inp} style={sty("apellidos")} value={form.apellidos}
              onChange={e => set("apellidos", e.target.value)} />
          </UField>
          <UField label="DNI">
            <input className={inp} style={sty("dni")} value={form.dni}
              placeholder="12345678A" onChange={e => set("dni", e.target.value)} />
          </UField>
          <UField label="Teléfono" error={err("telefono")}>
            <input className={inp} style={sty("telefono")} value={form.telefono}
              placeholder="+34 612 345 678"
              onChange={e => set("telefono", e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, telefono: true }))} />
          </UField>
          <div className="col-span-2">
            <UField label="Email *" error={err("email")}>
              <input type="email" className={inp} style={sty("email")} value={form.email}
                onChange={e => set("email", e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, email: true }))} />
            </UField>
          </div>
          <UField label="Usuario *" error={err("username")}>
            <input className={inp} style={sty("username")} value={form.username}
              onChange={e => set("username", e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, username: true }))} />
          </UField>
          <UField label={`Contraseña${isEdit ? " (dejar vacío)" : " *"}`} error={err("password")}>
            <input type="password" className={inp} style={sty("password")} value={form.password}
              placeholder={isEdit ? "Sin cambios" : "Mínimo 6 caracteres"}
              onChange={e => set("password", e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))} />
          </UField>
          <UField label="Rol">
            <select className={inp} style={sty("rol")} value={form.rol} onChange={e => set("rol", e.target.value)}>
              <option value="empleado">Empleado</option>
              <option value="admin">Admin</option>
            </select>
          </UField>
          <UField label="Estado">
            <select className={inp} style={sty("estado")} value={form.estado} onChange={e => set("estado", e.target.value)}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </UField>
          <div className="col-span-2">
            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>
              {loading ? "Guardando…" : (isEdit ? "Actualizar" : "Crear usuario")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminUsers() {
  const [users, setUsers] = useState<DashUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState<Partial<DashUser & { password: string }> | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = async () => { setLoading(true); try { setUsers(await listUsers()); } catch { } finally { setLoading(false); }; };
  useEffect(() => { load(); }, []);

  async function handleDelete(u: DashUser) {
    if (!confirm(`¿Eliminar al usuario ${u.nombre} ${u.apellidos}? Esta acción no se puede deshacer.`)) return;
    await deleteUser(u.id);
    setUsers(p => p.filter(x => x.id !== u.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Gestión de usuarios</h2>
          <p className="text-xs text-slate-400 mt-1">{users.length} usuario{users.length !== 1 ? "s" : ""} registrados</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowModal(true); }} className="rounded-xl px-4 py-2.5 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>+ Nuevo usuario</button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 animate-pulse">Cargando usuarios…</div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-500"><div className="text-4xl opacity-30">👥</div><div className="text-sm">No hay usuarios</div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["Nombre", "Email / Usuario", "DNI", "Teléfono", "Rol", "Estado", "Alta", ""].map(h => (
                    <th key={h} className="text-left text-xs font-semibold uppercase tracking-widest text-slate-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td className="px-4 py-3 font-medium text-white whitespace-nowrap">{u.nombre} {u.apellidos}</td>
                    <td className="px-4 py-3">
                      <div className="text-slate-300">{u.email}</div>
                      <div className="text-xs text-slate-500">@{u.username}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.dni ?? <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3 text-slate-400">{u.telefono ?? <span className="text-slate-600">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 capitalize ${ROL_COLORS[u.rol]}`}>{u.rol}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 capitalize ${ESTADO_COLORS[u.estado]}`}>{u.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(u.fecha_creacion).toLocaleDateString("es-ES")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditUser(u); setShowModal(true); }} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium">Editar</button>
                        <button onClick={() => handleDelete(u)} className="text-xs text-slate-600 hover:text-red-400 transition-colors font-medium">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          user={editUser}
          onClose={() => { setShowModal(false); setEditUser(null); }}
          onSaved={load}
        />
      )}
    </div>
  );
}

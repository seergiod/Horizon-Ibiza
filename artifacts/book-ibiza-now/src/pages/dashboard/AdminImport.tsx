import { useState, useRef } from "react";
import { importUsers } from "@/lib/dashboard-api";

type PreviewRow = {
  row: number;
  data: Record<string, string>;
  errors: string[];
  willImport: boolean;
};

type ImportResult = {
  total: number; valid: number; invalid: number;
  inserted: number; skipped: number; dryRun: boolean;
  preview: PreviewRow[];
};

const TEMPLATE_CSV = `nombre,apellidos,dni,email,username,telefono,rol,password
Ana,García,12345678A,ana@horizon.com,ana,+34 600111222,empleado,pass123
Carlos,López,87654321B,carlos@horizon.com,carlos,+34 600333444,empleado,pass456`;

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "plantilla_usuarios.csv";
  a.click(); URL.revokeObjectURL(url);
}

export function AdminImport() {
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState<ImportResult | null>(null);
  const [result, setResult]           = useState<ImportResult | null>(null);
  const [loading, setLoading]         = useState<"preview" | "import" | null>(null);
  const [error, setError]             = useState("");
  const [dragOver, setDragOver]       = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f); setPreview(null); setResult(null); setError("");
  }

  async function handlePreview() {
    if (!file) return;
    setLoading("preview"); setError("");
    try { setPreview(await importUsers(file, true)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al previsualizar"); }
    finally { setLoading(null); }
  }

  async function handleImport() {
    if (!file) return;
    setLoading("import"); setError("");
    try { setResult(await importUsers(file, false)); setPreview(null); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al importar"); }
    finally { setLoading(null); }
  }

  function reset() { setFile(null); setPreview(null); setResult(null); setError(""); }

  const previewData = preview ?? result;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white">Importación masiva</h2>
        <p className="text-xs text-slate-400 mt-1">Sube un archivo CSV o Excel con los datos de los usuarios</p>
      </div>

      {/* Template download */}
      <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-3xl">📄</div>
        <div className="flex-1">
          <div className="text-white font-medium text-sm">Plantilla CSV</div>
          <div className="text-xs text-slate-400 mt-0.5">Descarga la plantilla con las columnas requeridas</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">nombre, apellidos, dni, email, username, telefono, rol, password</div>
        </div>
        <button onClick={downloadTemplate} className="rounded-xl px-4 py-2 text-xs font-bold" style={{ background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.3)", color: "#22d3ee" }}>Descargar</button>
      </div>

      {/* Drop zone */}
      {!result && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className="rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all"
          style={{
            background: dragOver ? "rgba(6,182,212,0.08)" : "#0f1d35",
            border: `2px dashed ${dragOver ? "rgba(6,182,212,0.5)" : file ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.1)"}`,
          }}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <div className="text-4xl">{file ? "📊" : "📥"}</div>
          {file ? (
            <div className="text-center">
              <div className="text-white font-medium">{file.name}</div>
              <div className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-slate-300 font-medium">Arrastra tu archivo aquí</div>
              <div className="text-xs text-slate-500 mt-1">o haz clic para seleccionar · CSV, XLS, XLSX</div>
            </div>
          )}
        </div>
      )}

      {error && <div className="text-sm text-red-400 bg-red-500/10 rounded-xl px-4 py-3">{error}</div>}

      {/* Action buttons */}
      {file && !result && (
        <div className="flex gap-3">
          <button onClick={handlePreview} disabled={!!loading} className="flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.1)" }}>
            {loading === "preview" ? "Analizando…" : "🔍 Previsualizar"}
          </button>
          {preview && preview.valid > 0 && (
            <button onClick={handleImport} disabled={!!loading} className="flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40" style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>
              {loading === "import" ? "Importando…" : `✅ Importar ${preview.valid} usuario${preview.valid !== 1 ? "s" : ""}`}
            </button>
          )}
          <button onClick={reset} className="rounded-xl px-4 py-3 text-sm text-slate-400 hover:text-white" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>Cancelar</button>
        </div>
      )}

      {/* Result summary */}
      {result && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total filas",    value: result.total,    color: "#06b6d4" },
              { label: "Importados",     value: result.inserted, color: "#10b981" },
              { label: "Válidos",        value: result.valid,    color: "#6366f1" },
              { label: "Con errores",    value: result.invalid,  color: result.invalid > 0 ? "#ef4444" : "#64748b" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <button onClick={reset} className="rounded-xl py-3 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>Nueva importación</button>
        </div>
      )}

      {/* Preview table */}
      {previewData && previewData.preview.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-white">Vista previa</div>
            <div className="flex gap-2 text-xs">
              <span className="text-emerald-400">{previewData.valid} válidos</span>
              {previewData.invalid > 0 && <span className="text-red-400">{previewData.invalid} con errores</span>}
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    {["#", "Nombre", "Email", "Usuario", "Rol", "Estado"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold uppercase tracking-widest text-slate-500 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview.map(row => (
                    <tr key={row.row} className="hover:bg-white/[0.02]" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: !row.willImport ? "rgba(239,68,68,0.05)" : undefined }}>
                      <td className="px-4 py-2.5 text-slate-500 text-xs">{row.row}</td>
                      <td className="px-4 py-2.5 text-slate-300">{row.data.nombre} {row.data.apellidos}</td>
                      <td className="px-4 py-2.5 text-slate-300">{row.data.email}</td>
                      <td className="px-4 py-2.5 text-slate-400">@{row.data.username}</td>
                      <td className="px-4 py-2.5"><span className="text-xs capitalize text-slate-300">{row.data.rol}</span></td>
                      <td className="px-4 py-2.5">
                        {row.willImport
                          ? <span className="text-xs text-emerald-400 font-medium">✓ OK</span>
                          : <div className="flex flex-col gap-0.5">{row.errors.map((e, i) => <span key={i} className="text-xs text-red-400">✗ {e}</span>)}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

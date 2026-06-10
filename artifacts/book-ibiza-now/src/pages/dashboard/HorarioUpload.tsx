import { useState, useRef, useCallback } from "react";
import { guardarVersionHorario } from "@/lib/dashboard-api";

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

interface TurnoEdit {
  empleado_nombre: string;
  dia: string;
  hora_inicio: string;
  hora_fin: string;
  estado: "trabaja" | "libre" | "modificado";
  seccion: string;
  notas: string;
}

function getMonday(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d.setDate(diff));
  return mon.toISOString().split("T")[0];
}

function parseTiempoDesdeTextoOCR(texto: string): TurnoEdit[] {
  const lineas = texto.split("\n").map(l => l.trim()).filter(Boolean);
  const turnos: TurnoEdit[] = [];

  const TIME_RX   = /(\d{1,2}[:h]\d{2})/gi;
  const LIBRE_RX  = /\bLIBRE\b/i;
  const empleados: string[] = [];

  for (const linea of lineas) {
    const upper = linea.toUpperCase();
    const esDia = DIAS.some(d => upper.startsWith(d.toUpperCase()));
    if (esDia) continue;

    const tiempos = linea.match(TIME_RX);
    if (!tiempos && !LIBRE_RX.test(linea)) {
      const palabras = linea.split(/[\s,;|]+/).filter(p => /^[A-ZÁÉÍÓÚÑ]{2,}$/.test(p) && !["LIBRE", "PISCINA", "BUFFET", "SALA", "TARDE", "MAÑANA", "COCINA", "JUNIO", "JULIO", "AGOSTO"].includes(p));
      empleados.push(...palabras);
    }
  }

  const empleadosUnicos = [...new Set(empleados)].slice(0, 30);

  for (const linea of lineas) {
    const upper = linea.toUpperCase();
    const dia = DIAS.find(d => upper.startsWith(d.toUpperCase()));
    if (!dia) continue;

    const tiempos = [...linea.matchAll(/(\d{1,2}[:h]\d{2})/gi)].map(m => m[0].replace("h", ":"));
    const libres  = LIBRE_RX.test(linea);

    if (tiempos.length >= 2) {
      for (let i = 0; i < tiempos.length - 1; i += 2) {
        const empNombre = empleadosUnicos[Math.floor(i / 2)] ?? `Empleado ${Math.floor(i / 2) + 1}`;
        turnos.push({
          empleado_nombre: empNombre,
          dia,
          hora_inicio: tiempos[i],
          hora_fin: tiempos[i + 1],
          estado: "trabaja",
          seccion: "",
          notas: "",
        });
      }
    } else if (libres) {
      empleadosUnicos.forEach(emp => {
        turnos.push({ empleado_nombre: emp, dia, hora_inicio: "", hora_fin: "", estado: "libre", seccion: "", notas: "" });
      });
    }
  }

  return turnos;
}

function TurnoRow({ t, idx, onChange, onDelete }: {
  t: TurnoEdit; idx: number;
  onChange: (idx: number, field: keyof TurnoEdit, val: string) => void;
  onDelete: (idx: number) => void;
}) {
  const estadoColor = t.estado === "trabaja" ? "#10b981" : t.estado === "libre" ? "#64748b" : "#ef4444";
  return (
    <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <td className="px-2 py-1.5">
        <input value={t.empleado_nombre} onChange={e => onChange(idx, "empleado_nombre", e.target.value)}
          className="w-full text-xs text-white bg-transparent border-0 outline-none" placeholder="Nombre" />
      </td>
      <td className="px-2 py-1.5">
        <select value={t.dia} onChange={e => onChange(idx, "dia", e.target.value)}
          className="text-xs text-white bg-transparent border-0 outline-none cursor-pointer">
          {DIAS.map(d => <option key={d} value={d} style={{ background: "#0f1d35" }}>{d}</option>)}
        </select>
      </td>
      <td className="px-2 py-1.5">
        <input value={t.hora_inicio} onChange={e => onChange(idx, "hora_inicio", e.target.value)}
          className="w-20 text-xs text-white bg-transparent border-0 outline-none" placeholder="08:00" />
      </td>
      <td className="px-2 py-1.5">
        <input value={t.hora_fin} onChange={e => onChange(idx, "hora_fin", e.target.value)}
          className="w-20 text-xs text-white bg-transparent border-0 outline-none" placeholder="16:00" />
      </td>
      <td className="px-2 py-1.5">
        <select value={t.estado} onChange={e => onChange(idx, "estado", e.target.value as TurnoEdit["estado"])}
          className="text-xs font-bold border-0 outline-none cursor-pointer rounded-full px-2 py-0.5"
          style={{ background: `${estadoColor}22`, color: estadoColor }}>
          <option value="trabaja" style={{ background: "#0f1d35" }}>trabaja</option>
          <option value="libre"   style={{ background: "#0f1d35" }}>libre</option>
          <option value="modificado" style={{ background: "#0f1d35" }}>modificado</option>
        </select>
      </td>
      <td className="px-2 py-1.5">
        <input value={t.seccion} onChange={e => onChange(idx, "seccion", e.target.value)}
          className="w-full text-xs text-slate-400 bg-transparent border-0 outline-none" placeholder="sala mañana…" />
      </td>
      <td className="px-2 py-1.5 text-center">
        <button onClick={() => onDelete(idx)} className="text-slate-600 hover:text-red-400 text-base leading-none transition-colors">×</button>
      </td>
    </tr>
  );
}

export function HorarioUpload() {
  const [file,        setFile]        = useState<File | null>(null);
  const [imgURL,      setImgURL]      = useState<string | null>(null);
  const [ocrText,     setOcrText]     = useState<string>("");
  const [ocrLoading,  setOcrLoading]  = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [turnos,      setTurnos]      = useState<TurnoEdit[]>([]);
  const [semana,      setSemana]      = useState(() => getMonday(new Date()));
  const [nombre,      setNombre]      = useState("");
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");
  const [dragOver,    setDragOver]    = useState(false);
  const [showOcr,     setShowOcr]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
    setOcrText(""); setTurnos([]); setSaved(false); setError("");
    const url = URL.createObjectURL(f);
    setImgURL(url);
  }

  async function runOCR() {
    if (!file) return;
    setOcrLoading(true); setOcrProgress(0); setError("");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("spa+eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") setOcrProgress(Math.round(m.progress * 100));
        },
      });
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      setOcrText(text);
      const parsed = parseTiempoDesdeTextoOCR(text);
      setTurnos(parsed.length > 0 ? parsed : getDefaultTurnos());
    } catch (e) {
      setError("Error al procesar la imagen. Por favor, completa el horario manualmente.");
      setTurnos(getDefaultTurnos());
    } finally {
      setOcrLoading(false); setOcrProgress(0);
    }
  }

  function getDefaultTurnos(): TurnoEdit[] {
    return DIAS.map(dia => ({
      empleado_nombre: "", dia, hora_inicio: "", hora_fin: "",
      estado: "trabaja" as const, seccion: "", notas: "",
    }));
  }

  function addFila() {
    setTurnos(prev => [...prev, { empleado_nombre: "", dia: "lunes", hora_inicio: "", hora_fin: "", estado: "trabaja", seccion: "", notas: "" }]);
  }

  function updateTurno(idx: number, field: keyof TurnoEdit, val: string) {
    setTurnos(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
  }

  function deleteTurno(idx: number) {
    setTurnos(prev => prev.filter((_, i) => i !== idx));
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  }, []);

  async function handleGuardar() {
    if (turnos.length === 0) { setError("Añade al menos un turno antes de guardar."); return; }
    const valid = turnos.filter(t => t.empleado_nombre.trim());
    if (valid.length === 0) { setError("Cada fila debe tener un nombre de empleado."); return; }
    setSaving(true); setError("");
    try {
      await guardarVersionHorario({
        semana_inicio: semana,
        nombre: nombre || `Semana ${semana}`,
        turnos: valid.map(t => ({
          empleado_nombre: t.empleado_nombre.trim(),
          dia: t.dia,
          hora_inicio: t.hora_inicio || null,
          hora_fin:    t.hora_fin    || null,
          estado:      t.estado,
          seccion:     t.seccion    || null,
          notas:       t.notas      || null,
        })),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Subir horario</h2>
          <p className="text-sm text-slate-400 mt-0.5">Sube una foto del horario y el sistema extrae los datos con OCR</p>
        </div>
        {turnos.length > 0 && (
          <button onClick={handleGuardar} disabled={saving || saved}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all"
            style={{ background: saved ? "#10b98133" : "linear-gradient(135deg,#10b981,#059669)", color: saved ? "#10b981" : "white" }}>
            {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar horario"}
          </button>
        )}
      </div>

      {/* Semana + nombre */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Semana (lunes)</label>
          <input type="date" value={semana} onChange={e => setSemana(e.target.value)}
            className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-400">Nombre (opcional)</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder={`Semana ${semana}`}
            className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
            style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }} />
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className="rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
        style={{
          minHeight: 160, border: `2px dashed ${dragOver ? "#06b6d4" : "rgba(255,255,255,0.1)"}`,
          background: dragOver ? "rgba(6,182,212,0.05)" : "rgba(255,255,255,0.02)",
        }}>
        {imgURL ? (
          <img src={imgURL} alt="Horario" className="max-h-64 max-w-full rounded-xl object-contain" />
        ) : (
          <>
            <div className="text-4xl">📷</div>
            <div className="text-sm text-slate-400">Arrastra una foto aquí o haz clic para seleccionar</div>
            <div className="text-xs text-slate-600">PNG, JPG, WEBP hasta 20MB</div>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>

      {/* OCR Button */}
      {imgURL && turnos.length === 0 && (
        <div className="flex gap-3">
          <button onClick={runOCR} disabled={ocrLoading}
            className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg,#06b6d4,#2563eb)" }}>
            {ocrLoading ? (
              <><span className="animate-spin">⟳</span> Procesando… {ocrProgress}%</>
            ) : "🔍 Extraer horario con OCR"}
          </button>
          <button onClick={() => setTurnos(getDefaultTurnos())}
            className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 transition-all hover:text-white"
            style={{ background: "rgba(255,255,255,0.05)" }}>
            Rellenar manualmente
          </button>
        </div>
      )}

      {/* OCR progress bar */}
      {ocrLoading && (
        <div className="w-full rounded-full overflow-hidden" style={{ height: 4, background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${ocrProgress}%`, background: "linear-gradient(90deg,#06b6d4,#2563eb)" }} />
        </div>
      )}

      {error && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
      {saved && <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">✓ Horario guardado correctamente. Los empleados ya pueden verlo.</div>}

      {/* OCR raw text toggle */}
      {ocrText && (
        <div>
          <button onClick={() => setShowOcr(v => !v)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            {showOcr ? "▲ Ocultar" : "▼ Ver"} texto extraído por OCR
          </button>
          {showOcr && (
            <pre className="mt-2 text-xs text-slate-400 rounded-xl p-4 overflow-auto max-h-48 whitespace-pre-wrap"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {ocrText}
            </pre>
          )}
        </div>
      )}

      {/* Editable table */}
      {turnos.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-sm font-bold text-white">Turnos ({turnos.length})</span>
            <button onClick={addFila} className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-80" style={{ background: "rgba(6,182,212,0.15)", color: "#22d3ee" }}>
              + Añadir fila
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="px-2 py-2 text-left">Empleado</th>
                  <th className="px-2 py-2 text-left">Día</th>
                  <th className="px-2 py-2 text-left">Inicio</th>
                  <th className="px-2 py-2 text-left">Fin</th>
                  <th className="px-2 py-2 text-left">Estado</th>
                  <th className="px-2 py-2 text-left">Sección</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t, i) => (
                  <TurnoRow key={i} t={t} idx={i} onChange={updateTurno} onDelete={deleteTurno} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

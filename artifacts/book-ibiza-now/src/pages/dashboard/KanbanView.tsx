import { useState, useEffect, useCallback } from "react";
import {
  DndContext, DragOverlay, useDroppable, useDraggable,
  PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { listReservas, updateReserva, type Reserva, type EstadoReserva } from "@/lib/dashboard-api";

/* ── Column config ── */
const COLS: Array<{ id: EstadoReserva; label: string; color: string; ring: string; glow: string }> = [
  { id: "pendiente",  label: "Pendientes",  color: "#f59e0b", ring: "rgba(245,158,11,0.25)", glow: "rgba(245,158,11,0.06)" },
  { id: "confirmada", label: "Confirmadas", color: "#10b981", ring: "rgba(16,185,129,0.25)",  glow: "rgba(16,185,129,0.06)" },
  { id: "completada", label: "Completadas", color: "#06b6d4", ring: "rgba(6,182,212,0.25)",   glow: "rgba(6,182,212,0.06)"  },
  { id: "cancelada",  label: "Canceladas",  color: "#ef4444", ring: "rgba(239,68,68,0.2)",    glow: "rgba(239,68,68,0.05)"  },
];

/* ── Card (draggable) ── */
function KanbanCard({ r, ghost = false }: { r: Reserva; ghost?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `card-${r.id}` });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`rounded-xl p-3.5 select-none ${ghost ? "shadow-2xl cursor-grabbing" : "cursor-grab active:cursor-grabbing"}`}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging && !ghost ? 0.25 : 1,
        background: ghost ? "#1a2e50" : "#0f1d35",
        border: ghost ? "1px solid rgba(6,182,212,0.35)" : "1px solid rgba(255,255,255,0.07)",
        transition: "opacity 0.12s, border-color 0.12s",
        rotate: ghost ? "1.5deg" : undefined,
      }}
    >
      <div className="font-semibold text-white text-sm leading-tight">{r.cliente}</div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-xs text-slate-400">
        <span>🕐 {r.hora_reserva}</span>
        <span>👥 {r.personas} pax</span>
        {r.zona && <span>📍 {r.zona}</span>}
      </div>
      {r.telefono && (
        <div className="mt-1 text-[11px] text-slate-500">{r.telefono}</div>
      )}
      <div className="mt-1 text-[11px] text-slate-600">{r.fecha_reserva}</div>
      {r.fuente === "web" && (
        <span className="mt-1.5 inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.18)", color: "#a5b4fc" }}>🌐 WEB</span>
      )}
    </div>
  );
}

/* ── Column (droppable) ── */
function KanbanColumn({ col, cards, activeId }: { col: typeof COLS[0]; cards: Reserva[]; activeId: number | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div className="flex flex-col min-w-[220px] flex-1" style={{ maxWidth: 320 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
          <span className="text-sm font-bold text-slate-200">{col.label}</span>
        </div>
        <span className="text-xs font-semibold rounded-full px-2.5 py-0.5" style={{ background: `${col.color}22`, color: col.color }}>
          {cards.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2.5 flex-1 rounded-2xl p-3 transition-all duration-150"
        style={{
          background: isOver ? col.glow : "#0a1628",
          border: `1.5px ${isOver ? "solid" : "dashed"} ${isOver ? col.ring : "rgba(255,255,255,0.06)"}`,
          minHeight: 200,
        }}
      >
        {cards.map(r => (
          <KanbanCard key={r.id} r={r} />
        ))}
        {cards.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-xs py-8">
            Sin reservas
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Kanban ── */
export function KanbanView() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading]   = useState(true);
  const [activeId, setActiveId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const load = useCallback(async () => {
    try {
      const res = await listReservas({ limit: 500 });
      setReservas(res.items);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Listen to WS broadcasts from Dashboard parent */
  useEffect(() => {
    function onWs(e: Event) {
      const msg = (e as CustomEvent).detail as { type: string; data?: Reserva };
      if (msg.type === "reserva_actualizada" && msg.data) {
        setReservas(prev => prev.map(r => r.id === msg.data!.id ? msg.data! : r));
      }
      if (msg.type === "reserva_nueva" && msg.data) {
        setReservas(prev => prev.some(r => r.id === msg.data!.id) ? prev : [msg.data!, ...prev]);
      }
    }
    window.addEventListener("ws-message", onWs);
    return () => window.removeEventListener("ws-message", onWs);
  }, []);

  function handleDragStart(e: DragStartEvent) {
    setActiveId(Number(String(e.active.id).replace("card-", "")));
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const cardId     = Number(String(active.id).replace("card-", ""));
    const newEstado  = String(over.id) as EstadoReserva;
    const reserva    = reservas.find(r => r.id === cardId);
    if (!reserva || reserva.estado === newEstado) return;

    const oldEstado = reserva.estado;
    const colLabel  = COLS.find(c => c.id === newEstado)?.label ?? newEstado;

    /* Optimistic update */
    setReservas(prev => prev.map(r => r.id === cardId ? { ...r, estado: newEstado } : r));

    try {
      await updateReserva(cardId, { estado: newEstado });
      toast.success(`Reserva movida a ${colLabel}`, { description: reserva.cliente });
    } catch {
      setReservas(prev => prev.map(r => r.id === cardId ? { ...r, estado: oldEstado } : r));
      toast.error("No se pudo actualizar la reserva");
    }
  }

  const activeReserva = activeId ? reservas.find(r => r.id === activeId) : null;

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-400 animate-pulse">Cargando reservas…</div>;
  }

  const cols = COLS.map(col => ({ ...col, cards: reservas.filter(r => r.estado === col.id) }));
  const total = reservas.length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Kanban de reservas</h2>
          <p className="text-xs text-slate-400 mt-0.5">{total} reserva{total !== 1 ? "s" : ""} en total · arrastra para cambiar estado</p>
        </div>
        <button
          onClick={() => { setLoading(true); load(); }}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl text-slate-300 hover:text-white transition-colors"
          style={{ background: "#0f1d35", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          ↻ Actualizar
        </button>
      </div>

      {/* Board */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {cols.map(col => (
            <KanbanColumn key={col.id} col={col} cards={col.cards} activeId={activeId} />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 150, easing: "ease" }}>
          {activeReserva ? <KanbanCard r={activeReserva} ghost /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

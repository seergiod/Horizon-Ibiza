---
name: Kanban + notifications
description: Kanban board with dnd-kit, WS event bus, sonner toasts in Dashboard
---

## Kanban board
- Route: `/dashboard/kanban` → `KanbanView.tsx`
- Library: `@dnd-kit/core` + `@dnd-kit/utilities` (no @dnd-kit/sortable needed for cross-column)
- Pattern: `useDroppable` per column (id = estado), `useDraggable` per card (id = `card-{id}`)
- Optimistic update + revert on error; calls `updateReserva(id, { estado })`
- `PointerSensor` with `activationConstraint: { distance: 8 }` prevents click triggering drag

## WS event bus
- Dashboard.tsx `ws.onmessage` dispatches `window.dispatchEvent(new CustomEvent("ws-message", { detail: parsed }))` 
- Child components listen with `window.addEventListener("ws-message", handler)`
- Types expected: `{ type: "reserva_actualizada"|"reserva_nueva", data: Reserva }`

## Sonner toasts
- `<Toaster theme="dark" position="top-right" richColors closeButton />` lives in DashboardLayout return
- Import `toast` from `sonner` in any component; no provider wrapping needed

## Calendar accordion
- Uses `@radix-ui/react-accordion` primitives (`import * as Accordion from "@radix-ui/react-accordion"`)
- `type="multiple"` allows multiple items open simultaneously
- Estado can be changed inline via select inside accordion content → calls `updateReserva` + toast

**Why:** Centralized WS event bus avoids prop-drilling the WebSocket ref to every dashboard child.

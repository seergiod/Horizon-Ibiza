import type { InsertReserva } from "@workspace/db";

/**
 * Parsea un mensaje de texto de WhatsApp con formato de reserva.
 * Tolerante a variaciones de emoji, espacios y mayúsculas.
 */
export function parseWhatsAppReservation(text: string): Partial<InsertReserva> | null {
  if (!text?.trim()) return null;

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  function extract(patterns: RegExp[]): string | undefined {
    for (const line of lines) {
      for (const pattern of patterns) {
        const m = line.match(pattern);
        if (m?.[1]?.trim()) return m[1].trim();
      }
    }
    return undefined;
  }

  const cliente = extract([
    /(?:cliente|client|name|nombre)\s*[:\-–]?\s*(.+)/i,
    /👤\s*(?:cliente)?\s*[:\-–]?\s*(.+)/i,
  ]);

  const fechaRaw = extract([
    /(?:fecha\s*(?:de\s*reserva)?|date|fecha)\s*[:\-–]?\s*(.+)/i,
    /📅\s*(?:fecha\s*(?:de\s*reserva)?)?\s*[:\-–]?\s*(.+)/i,
  ]);

  const hora = extract([
    /(?:horario|hora|time)\s*[:\-–]?\s*(.+)/i,
    /⏰\s*(?:horario|hora)?\s*[:\-–]?\s*(.+)/i,
  ]);

  const personasRaw = extract([
    /(?:personas?|people|guests?|adultos?)\s*[:\-–]?\s*(.+)/i,
    /👥\s*(?:cantidad\s*de\s*personas?)?\s*[:\-–]?\s*(.+)/i,
  ]);

  const zona = extract([
    /(?:zona\s*(?:elegida)?|zone|area|sección)\s*[:\-–]?\s*(.+)/i,
    /🏢\s*(?:zona\s*elegida)?\s*[:\-–]?\s*(.+)/i,
  ]);

  const vista = extract([
    /(?:ubicaci[oó]n\s*(?:vista)?|vista|view)\s*[:\-–]?\s*(.+)/i,
    /🌊\s*(?:ubicaci[oó]n\s*\(vista\))?\s*[:\-–]?\s*(.+)/i,
  ]);

  const telefono = extract([
    /(?:tel[eé]fono|phone|tel|móvil)\s*[:\-–]?\s*(.+)/i,
    /📞\s*(?:tel[eé]fono)?\s*[:\-–]?\s*(.+)/i,
  ]);

  const comentarios = extract([
    /(?:comentarios?\s*(?:adicionales?)?|notes?|comments?)\s*[:\-–]?\s*(.+)/i,
    /💬\s*(?:comentarios?\s*adicionales?)?\s*[:\-–]?\s*(.+)/i,
  ]);

  if (!cliente && !telefono) return null;

  const personas = personasRaw
    ? parseInt(personasRaw.replace(/[^\d]/g, "")) || 2
    : 2;

  const fechaNormalised = fechaRaw
    ? fechaRaw.replace(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/, (_m, d, mo, y) => {
        const year = y.length === 2 ? `20${y}` : y;
        return `${year}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
      })
    : new Date().toISOString().slice(0, 10);

  return {
    cliente: cliente ?? "Desconocido",
    fecha_reserva: fechaNormalised,
    hora_reserva: hora ?? "20:00",
    personas,
    zona: zona ?? undefined,
    vista: vista ?? undefined,
    telefono: telefono ?? "—",
    comentarios: comentarios && !/ninguno|none/i.test(comentarios) ? comentarios : undefined,
    estado: "pendiente",
    fuente: "whatsapp",
  };
}

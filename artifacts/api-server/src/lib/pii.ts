/**
 * Utilidades para sanitizar PII (Personally Identifiable Information)
 * Evita que números de teléfono y datos sensibles se logueen accidentalmente
 */

/**
 * Reemplaza números de teléfono con máscara
 * "+34 612 345 678" → "+34 612 *** ***"
 */
export function maskPhone(phone?: string | null): string {
  if (!phone) return "***";
  return phone.replace(/(\+\d{1,3}\s?\d{1,3})\s?(\d{2,4})\s?(\d{2,4})\s?(\d{1,4})/g, "$1 *** ***");
}

/**
 * Sanitiza objeto de búsqueda de querystring
 * Ej: { q: "612345678" } → { q: "***" }
 */
export function sanitizeQuery(query: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...query };
  if (sanitized.q && typeof sanitized.q === "string") {
    // Si parece un teléfono (solo dígitos y espacios), sanitizar
    if (/^[\d\s+-]+$/.test(sanitized.q)) {
      sanitized.q = maskPhone(sanitized.q);
    }
  }
  return sanitized;
}

/**
 * Sanitiza objeto de request body para logging
 * Reemplaza password, creditCard, phone, etc.
 */
export function sanitizeBody(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;

  const obj = body as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes("password") ||
      lowerKey.includes("token") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("apikey")
    ) {
      sanitized[key] = "***";
    } else if (
      lowerKey.includes("phone") ||
      lowerKey.includes("telefono")
    ) {
      sanitized[key] = maskPhone(value as string);
    } else if (
      lowerKey.includes("email") ||
      lowerKey.includes("dni")
    ) {
      // Parcialmente visible: john@example.com → j***@example.com
      if (typeof value === "string") {
        const parts = value.split("@");
        if (parts.length === 2) {
          sanitized[key] = `${parts[0][0]}***@${parts[1]}`;
        } else {
          sanitized[key] = `${value.slice(0, 2)}${"*".repeat(Math.max(0, value.length - 4))}`;
        }
      } else {
        sanitized[key] = value;
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

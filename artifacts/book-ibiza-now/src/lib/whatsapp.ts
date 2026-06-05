import { SITE } from "@/content/site";

export function buildWhatsAppUrl(message: string, _locale?: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${SITE.whatsappNumber}?text=${encoded}`;
}

export function helpMessage(_locale?: string): string {
  return `Hello! I'd like to get information about reservations at ${SITE.name}.`;
}

export function reservationMessage({
  locale: _locale,
  name,
  partySize,
  when,
  notes,
}: {
  locale?: string;
  name: string;
  partySize: number;
  when: string;
  notes?: string;
}): string {
  let msg = `Hello! I'd like to reserve a table at ${SITE.name}.\n\nName: ${name}\nGuests: ${partySize}\nDate & time: ${when}`;
  if (notes) msg += `\nNotes: ${notes}`;
  return msg;
}

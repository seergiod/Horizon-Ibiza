import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createReservation, confirmReservation, reservationSchema } from "@/lib/reservations";
import { RESERVE_DEFAULTS } from "@/content/site";
import { track } from "@/lib/track";
import { buildWhatsAppUrl, reservationMessage } from "@/lib/whatsapp";
import type { Locale } from "@/i18n";

function todayPlus(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(RESERVE_DEFAULTS.defaultHour, 0, 0, 0);
  return d;
}

function toDateInput(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const TIME_SLOTS = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"];

export interface PendingVerify {
  id: number;
  token: string;
  waUrl: string;
}

export function useReserveForm() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language?.slice(0, 2) as Locale) || "en";
  const navigate = useNavigate();

  const initial = useMemo(() => todayPlus(0), []);
  const [date, setDate] = useState(toDateInput(initial));
  const [time, setTime] = useState("21:00");
  const [partySize, setPartySize] = useState<number>(RESERVE_DEFAULTS.defaultPartySize);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const [pendingVerify, setPendingVerify] = useState<PendingVerify | null>(null);
  const [confirmPhone, setConfirmPhone] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleStart() {
    if (!hasStarted) { track("reserve_form_start"); setHasStarted(true); }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    track("reserve_form_submit", { partySize, time });

    const reservationAt = new Date(`${date}T${time}:00`);
    const parsed = reservationSchema.safeParse({ name, phone, partySize, reservationAt, notes: notes || undefined, locale });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const path = first?.path[0];
      const errorMap: Record<string, string> = {
        name: t("reserve.errors.name"),
        phone: t("reserve.errors.phone"),
        reservationAt: t("reserve.errors.when"),
      };
      setError(errorMap[String(path)] ?? t("reserve.errors.generic"));
      return;
    }

    setSubmitting(true);
    try {
      const { id, token } = await createReservation(parsed.data);
      track("reservation_submitted", { partySize, locale, time });

      const when = reservationAt.toLocaleString(locale, {
        weekday: "short", day: "numeric", month: "short",
        hour: "2-digit", minute: "2-digit",
      });
      const waUrl = buildWhatsAppUrl(
        reservationMessage({ locale, name, partySize, when, notes: notes || undefined }),
        locale,
      );
      sessionStorage.setItem("horizon-wa-url", waUrl);

      setPendingVerify({ id, token, waUrl });
      setConfirmPhone("");
      setConfirmError(null);
    } catch (err) {
      console.error(err);
      setError(t("reserve.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  async function onConfirmPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingVerify) return;
    if (!confirmPhone.trim()) { setConfirmError("Introduce tu número de teléfono"); return; }

    setConfirming(true);
    setConfirmError(null);
    try {
      await confirmReservation(pendingVerify.id, pendingVerify.token, confirmPhone);
      track("reservation_confirmed", { locale });
      navigate("/reserve?sent=1");
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : "Error al confirmar. Comprueba el número.");
    } finally {
      setConfirming(false);
    }
  }

  function cancelVerify() {
    setPendingVerify(null);
    setConfirmPhone("");
    setConfirmError(null);
  }

  return {
    date, setDate, time, setTime, partySize, setPartySize,
    name, setName, phone, setPhone, notes, setNotes,
    submitting, error, hasStarted, handleStart, onSubmit,
    pendingVerify, confirmPhone, setConfirmPhone,
    confirmError, confirming, onConfirmPhone, cancelVerify,
    locale,
  };
}

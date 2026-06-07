import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, CalendarDays, Clock, Users, User, Phone } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { createReservation, reservationSchema } from "@/lib/reservations";
import { RESERVE_DEFAULTS } from "@/content/site";
import { track } from "@/lib/track";
import { buildWhatsAppUrl, reservationMessage } from "@/lib/whatsapp";
import { Stagger, StaggerItem } from "@/components/Motion";
import { ease } from "@/lib/motion";
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

const TIME_SLOTS = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"];

const inputClass =
  "h-12 w-full rounded-xl border border-input bg-white px-4 text-base text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:shadow-sm";

export function ReserveForm() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language?.slice(0, 2) as Locale) || "en";
  const navigate = useNavigate();
  const reduce = useReducedMotion();
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
      const map: Record<string, string> = {
        name: t("reserve.errors.name"),
        phone: t("reserve.errors.phone"),
        reservationAt: t("reserve.errors.when"),
      };
      setError(map[String(path)] ?? t("reserve.errors.generic"));
      return;
    }
    setSubmitting(true);
    try {
      await createReservation(parsed.data);
      track("reservation_submitted", { partySize, locale, time });
      const when = reservationAt.toLocaleString(locale, {
        weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      });
      const waUrl = buildWhatsAppUrl(
        reservationMessage({ locale, name, partySize, when, notes: notes || undefined }),
        locale,
      );
      sessionStorage.setItem("horizon-wa-url", waUrl);
      navigate("/reserve?sent=1");
    } catch (err) {
      console.error(err);
      setError(t("reserve.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stagger className="space-y-4" onClick={handleStart}>
      <StaggerItem>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <CalendarDays className="h-3 w-3" />{t("reserve.date")}
            </label>
            <input type="date" value={date} min={toDateInput(new Date())}
              onChange={(e) => setDate(e.target.value)} required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <Clock className="h-3 w-3" />{t("reserve.time")}
            </label>
            <select value={time} onChange={(e) => setTime(e.target.value)} required className={inputClass}>
              {TIME_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              <option value="custom">{t("reserve.otherTime")}</option>
            </select>
            <AnimatePresence>
              {time === "custom" && (
                <motion.input type="time" defaultValue="20:00" onChange={(e) => setTime(e.target.value)}
                  required
                  initial={reduce ? {} : { opacity: 0, height: 0 }}
                  animate={reduce ? {} : { opacity: 1, height: "auto" }}
                  exit={reduce ? {} : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: ease.out }}
                  className={inputClass + " mt-2"} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </StaggerItem>
      <StaggerItem>
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Users className="h-3 w-3" />{t("reserve.party")}
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {RESERVE_DEFAULTS.partySizes.map((n) => {
              const active = partySize === n;
              return (
                <motion.button type="button" key={n} onClick={() => setPartySize(n)}
                  className={`h-12 rounded-xl border text-base font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-border bg-white text-foreground hover:border-primary/40 hover:bg-secondary"
                  }`}
                  aria-pressed={active}
                  whileHover={reduce ? {} : { scale: active ? 1.04 : 1.06 }}
                  whileTap={reduce ? {} : { scale: 0.93 }}
                  animate={reduce ? {} : active ? { scale: 1.04 } : { scale: 1 }}
                  transition={{ duration: 0.14, ease: ease.out }}
                >{n}</motion.button>
              );
            })}
          </div>
        </div>
      </StaggerItem>
      <StaggerItem>
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <User className="h-3 w-3" />{t("reserve.name")}
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            onFocus={handleStart} required maxLength={120} autoComplete="name"
            placeholder="e.g. John Smith" className={inputClass} />
        </div>
      </StaggerItem>
      <StaggerItem>
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            <Phone className="h-3 w-3" />{t("reserve.phone")}
          </label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            required maxLength={40} inputMode="tel" autoComplete="tel"
            placeholder="+34 / +44 / +1…" className={inputClass} />
        </div>
      </StaggerItem>
      <StaggerItem>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {t("reserve.notes")}
            <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground/60">
              ({t("reserve.optional")})
            </span>
          </label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            maxLength={300} rows={2} placeholder={t("reserve.notesPlaceholder")}
            className="w-full rounded-xl border border-input bg-white px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
        </div>
      </StaggerItem>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={reduce ? {} : { opacity: 0, y: -6, scale: 0.98 }}
            animate={reduce ? {} : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? {} : { opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: ease.out }}
            className="rounded-xl bg-destructive/8 px-4 py-3 text-sm font-medium text-destructive"
          >{error}</motion.p>
        )}
      </AnimatePresence>
      <StaggerItem>
        <motion.button type="submit" disabled={submitting}
          className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-xl text-base font-semibold text-white shadow-[var(--shadow-cta)] disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ backgroundImage: "var(--gradient-sunset)" }}
          whileHover={reduce || submitting ? {} : { scale: 1.01 }}
          whileTap={reduce || submitting ? {} : { scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
        >
          <AnimatePresence mode="wait">
            {submitting ? (
              <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />{t("reserve.sending")}
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {t("reserve.submit")}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </StaggerItem>
      <StaggerItem>
        <p className="text-center text-xs text-muted-foreground">{t("reserve.reassurance")}</p>
      </StaggerItem>
    </Stagger>
  );
}

import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ArrowLeft, CalendarCheck } from "lucide-react";
import { motion } from "framer-motion";
import { ReserveForm } from "@/components/ReserveForm";
import { buildWhatsAppUrl, helpMessage } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";
import { track } from "@/lib/track";
import { PageTransition, Reveal } from "@/components/Motion";
import { ease } from "@/lib/motion";
import type { Locale } from "@/i18n";

export function Reserve() {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language?.slice(0, 2) as Locale) || "en";
  const [searchParams] = useSearchParams();
  const sent = searchParams.get("sent") === "1";

  if (sent) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-screen-sm px-5 pt-10 pb-24 flex flex-col items-center">
          <motion.div
            className="w-full rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: ease.expOut }}
          >
            <motion.div
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 280, damping: 22 }}
            >
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </motion.div>

            <motion.h1
              className="mt-6 font-display text-3xl text-foreground text-balance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: ease.expOut }}
            >
              {t("reserve.successTitle")}
            </motion.h1>

            <motion.p
              className="mt-3 text-sm text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              {t("reserve.successBody")}
            </motion.p>

            <motion.div
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-primary/8 px-4 py-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.4 }}
            >
              <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium text-primary">
                {locale === "es" ? "Reserva registrada en el sistema" :
                 locale === "fr" ? "Réservation enregistrée dans le système" :
                 locale === "de" ? "Reservierung im System gespeichert" :
                 "Reservation logged in our system"}
              </span>
            </motion.div>

            <motion.div
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
              >
                <ArrowLeft className="h-3.5 w-3.5" />{t("reserve.backHome")}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-screen-md px-5 pt-8 pb-36">
        <Reveal className="mb-6">
          <h1 className="font-display text-4xl text-foreground text-balance">{t("reserve.title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{t("reserve.subtitle")}</p>
        </Reveal>
        <ReserveForm />
        <Reveal delay={0.15} className="mt-5">
          <motion.a
            href={buildWhatsAppUrl(helpMessage(locale), locale)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { source: "reserve_help" })}
            className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 text-left transition-colors hover:bg-secondary/40"
            whileHover={{ x: 3 }}
            transition={{ duration: 0.18 }}
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{t("cta.helpWhatsapp")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("reserve.whatsappSub")}</p>
            </div>
          </motion.a>
        </Reveal>
      </div>
    </PageTransition>
  );
}

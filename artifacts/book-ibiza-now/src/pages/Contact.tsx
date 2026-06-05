import { useTranslation } from "react-i18next";
import { MessageCircle, MapPin, Phone, Clock } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SITE } from "@/content/site";
import { buildWhatsAppUrl, helpMessage } from "@/lib/whatsapp";
import { track } from "@/lib/track";
import { PageTransition, Reveal, Stagger, StaggerItem } from "@/components/Motion";
import { ease } from "@/lib/motion";
import type { Locale } from "@/i18n";

export function Contact() {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const locale = (i18n.language?.slice(0, 2) as Locale) || "en";
  const mapsQuery = encodeURIComponent(`${SITE.name}, ${SITE.address.street}, ${SITE.address.area}, ${SITE.address.city}`);

  const contactItems = [
    {
      icon: <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />,
      label: t("contact.address"),
      content: (
        <>
          <p className="mt-1 text-base text-foreground">{SITE.address.street}</p>
          <p className="text-sm text-muted-foreground">{SITE.address.area}, {SITE.address.city}</p>
          <a href={`https://maps.google.com/?q=${mapsQuery}`} target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-semibold text-primary transition-opacity hover:opacity-70">
            {t("contact.getDirections")} →
          </a>
        </>
      ),
    },
    {
      icon: <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />,
      label: t("contact.title"),
      content: <p className="mt-1 text-base text-foreground">{t("contact.hours")}</p>,
    },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-screen-md px-5 pt-8 pb-24">
        <Reveal>
          <h1 className="font-display text-5xl text-foreground">{t("contact.title")}</h1>
          <p className="mt-2 text-base text-muted-foreground">{t("contact.subtitle")}</p>
        </Reveal>
        <Reveal delay={0.1} className="mt-6 overflow-hidden rounded-3xl border border-border/60 bg-card">
          <iframe
            title="Map"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
            loading="lazy"
            className="aspect-[4/3] w-full"
          />
        </Reveal>
        <Stagger className="mt-6 space-y-3">
          {contactItems.map(({ icon, label, content }) => (
            <StaggerItem key={label}>
              <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:bg-secondary/40">
                {icon}
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                  {content}
                </div>
              </div>
            </StaggerItem>
          ))}
          <StaggerItem>
            <a href={`tel:+${SITE.whatsappNumber}`}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:bg-secondary/40">
              <Phone className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("cta.callUs")}</p>
                <p className="mt-1 text-base font-semibold text-foreground">{SITE.phoneDisplay}</p>
              </div>
            </a>
          </StaggerItem>
          <StaggerItem>
            <motion.a
              href={buildWhatsAppUrl(helpMessage(locale), locale)}
              target="_blank" rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { source: "contact_page" })}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:bg-secondary/40"
              whileHover={reduce ? {} : { x: 4 }} transition={{ duration: 0.18, ease: ease.out }}
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">WhatsApp</p>
                <p className="mt-1 text-base font-semibold text-foreground">{SITE.phoneDisplay}</p>
              </div>
            </motion.a>
          </StaggerItem>
        </Stagger>
      </div>
    </PageTransition>
  );
}

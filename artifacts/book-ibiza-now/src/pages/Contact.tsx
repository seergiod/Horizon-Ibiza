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
      icon: <MapPin className="h-4 w-4 shrink-0 text-primary" />,
      label: t("contact.address"),
      content: (
        <>
          <p className="mt-1 text-[15px] font-semibold text-foreground">{SITE.address.street}</p>
          <p className="text-[13px] text-muted-foreground">{SITE.address.area}, {SITE.address.city}</p>
          <a
            href={`https://maps.google.com/?q=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-opacity hover:opacity-70"
          >
            {t("contact.getDirections")} →
          </a>
        </>
      ),
    },
    {
      icon: <Clock className="h-4 w-4 shrink-0 text-primary" />,
      label: t("contact.title"),
      content: <p className="mt-1 text-[15px] font-semibold text-foreground">{t("contact.hours")}</p>,
    },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-screen-md px-5 pt-8 pb-24">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-2">Find us</p>
          <h1 className="text-5xl font-bold tracking-tight text-foreground">{t("contact.title")}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">{t("contact.subtitle")}</p>
        </Reveal>

        {/* Map */}
        <Reveal delay={0.1} className="mt-7 overflow-hidden rounded-2xl shadow-[0_4px_24px_0_oklch(0.52_0.24_263_/_0.10)]">
          <iframe
            title="Map"
            src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
            loading="lazy"
            className="aspect-[4/3] w-full"
          />
        </Reveal>

        {/* Contact cards */}
        <Stagger className="mt-5 space-y-2.5">
          {contactItems.map(({ icon, label, content }) => (
            <StaggerItem key={label}>
              <div className="flex items-start gap-4 rounded-2xl bg-secondary/60 px-5 py-4 transition-colors hover:bg-secondary">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                  {content}
                </div>
              </div>
            </StaggerItem>
          ))}

          <StaggerItem>
            <a
              href={`tel:+${SITE.whatsappNumber}`}
              className="flex items-center gap-4 rounded-2xl bg-secondary/60 px-5 py-4 transition-colors hover:bg-secondary"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{t("cta.callUs")}</p>
                <p className="mt-1 text-[15px] font-bold text-foreground">{SITE.phoneDisplay}</p>
              </div>
            </a>
          </StaggerItem>

          <StaggerItem>
            <motion.a
              href={buildWhatsAppUrl(helpMessage(locale), locale)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { source: "contact_page" })}
              className="flex items-center gap-4 rounded-2xl bg-[#25D366]/8 px-5 py-4 transition-colors hover:bg-[#25D366]/14"
              whileHover={reduce ? {} : { x: 3 }}
              transition={{ duration: 0.18, ease: ease.out }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">WhatsApp</p>
                <p className="mt-1 text-[15px] font-bold text-foreground">{SITE.phoneDisplay}</p>
              </div>
            </motion.a>
          </StaggerItem>
        </Stagger>
      </div>
    </PageTransition>
  );
}

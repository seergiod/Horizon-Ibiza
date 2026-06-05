import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { SITE } from "@/content/site";
import { buildWhatsAppUrl, helpMessage } from "@/lib/whatsapp";
import { track } from "@/lib/track";
import { Reveal, Stagger, StaggerItem } from "@/components/Motion";
import type { Locale } from "@/i18n";

export function Footer() {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const locale = (i18n.language?.slice(0, 2) as Locale) || "en";

  return (
    <footer className="mt-16 border-t border-border/60 bg-secondary/40 px-4 pb-32 pt-10 text-sm text-muted-foreground">
      <div className="mx-auto max-w-screen-md">
        <Stagger className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <StaggerItem>
            <div className="space-y-1.5">
              <p className="font-display text-2xl text-foreground">{SITE.name}</p>
              <p>{SITE.address.street}</p>
              <p>{SITE.address.area}, {SITE.address.city}</p>
              <a href={`tel:+${SITE.whatsappNumber}`} className="block hover:text-foreground transition-colors">
                {SITE.phoneDisplay}
              </a>
            </div>
          </StaggerItem>
          <StaggerItem>
            <nav className="flex flex-col gap-2 text-sm">
              {[
                { to: "/menu", label: t("nav.menu") },
                { to: "/contact", label: t("nav.contact") },
                { to: "/sunset-dinner-ibiza", label: "Sunset dinner Ibiza" },
                { to: "/sea-view-restaurant-ibiza", label: "Sea-view restaurant Ibiza" },
                { to: "/romantic-restaurant-ibiza", label: "Romantic restaurant Ibiza" },
              ].map(({ to, label }) => (
                <Link key={to} to={to} className="hover:text-foreground transition-colors">
                  {label}
                </Link>
              ))}
            </nav>
          </StaggerItem>
        </Stagger>
        <Reveal delay={0.2} className="mt-6">
          <motion.a
            href={buildWhatsAppUrl(helpMessage(locale), locale)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("whatsapp_click", { source: "footer" })}
            className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            whileHover={reduce ? {} : { scale: 1.04 }}
            whileTap={reduce ? {} : { scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </motion.a>
        </Reveal>
        <Reveal delay={0.25}>
          <p className="mt-6 text-xs">{t("footer.rights", { year: new Date().getFullYear() })}</p>
        </Reveal>
      </div>
    </footer>
  );
}

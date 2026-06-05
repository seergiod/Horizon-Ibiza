import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { SITE } from "@/content/site";
import { buildWhatsAppUrl, helpMessage } from "@/lib/whatsapp";
import { track } from "@/lib/track";
import { Reveal } from "@/components/Motion";
import { ease } from "@/lib/motion";
import type { Locale } from "@/i18n";

const mapsQuery = encodeURIComponent(
  `${SITE.name}, ${SITE.address.street}, ${SITE.address.area}, ${SITE.address.city}`,
);

const SOCIALS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: (locale: string) =>
      buildWhatsAppUrl(helpMessage(locale as Locale), locale as Locale),
    trackSource: "footer_whatsapp",
    bg: "#25D366",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.558 4.121 1.533 5.854L0 24l6.335-1.54A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.812 9.812 0 01-5.015-1.376l-.36-.214-3.727.906.945-3.635-.235-.374A9.817 9.817 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
      </svg>
    ),
  },
  {
    id: "instagram",
    label: "Instagram",
    href: () => "https://www.instagram.com/horizonibiza/",
    trackSource: "footer_instagram",
    bg: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    href: () => "https://www.facebook.com/horizonibiza/",
    trackSource: "footer_facebook",
    bg: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "maps",
    label: "Maps",
    href: () => `https://maps.google.com/?q=${mapsQuery}`,
    trackSource: "footer_maps",
    bg: "#fff",
    textColor: "#EA4335",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth="0">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335"/>
      </svg>
    ),
  },
];

export function Footer() {
  const { t, i18n } = useTranslation();
  const reduce = useReducedMotion();
  const locale = (i18n.language?.slice(0, 2) as Locale) || "en";

  return (
    <footer className="mt-16 overflow-hidden border-t border-border/40 bg-foreground pb-28 pt-12 text-sm">
      <div className="mx-auto max-w-screen-md px-5">

        {/* Brand + tagline */}
        <Reveal>
          <p className="font-display text-3xl text-background/90 sm:text-4xl">{SITE.name}</p>
          <p className="mt-1 text-[12px] uppercase tracking-[0.22em] text-background/40">
            Mediterranean · Figueretas · Ibiza
          </p>
        </Reveal>

        {/* Social buttons */}
        <Reveal delay={0.08} className="mt-7">
          <div className="flex flex-wrap gap-3">
            {SOCIALS.map(({ id, label, href, trackSource, bg, textColor, icon }) => (
              <motion.a
                key={id}
                href={href(locale)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track(id + "_click", { source: trackSource })}
                aria-label={label}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold shadow-sm"
                style={{
                  background: bg,
                  color: textColor ?? "#fff",
                }}
                whileHover={reduce ? {} : { scale: 1.06, y: -2 }}
                whileTap={reduce ? {} : { scale: 0.94 }}
                transition={{ duration: 0.18, ease: ease.out }}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </motion.a>
            ))}
          </div>
        </Reveal>

        {/* Divider */}
        <div className="mt-10 border-t border-background/10" />

        {/* Info + nav */}
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          <Reveal delay={0.1}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-background/40 mb-3">
              {t("contact.address")}
            </p>
            <address className="not-italic space-y-1 text-background/65 leading-relaxed">
              <p>{SITE.address.street}</p>
              <p>{SITE.address.area}, {SITE.address.city}</p>
              <p>{SITE.address.region} · {SITE.address.country}</p>
            </address>
            <div className="mt-3 space-y-1">
              <a
                href={`tel:+${SITE.whatsappNumber}`}
                className="block text-background/65 transition-colors hover:text-background/90"
              >
                {SITE.phoneDisplay}
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="block text-background/65 transition-colors hover:text-background/90"
              >
                {SITE.email}
              </a>
            </div>
            <p className="mt-3 text-background/50">{t("contact.hours")}</p>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-background/40 mb-3">
              Menu
            </p>
            <nav className="flex flex-col gap-2.5">
              {[
                { to: "/menu", label: t("nav.menu") },
                { to: "/reserve", label: t("nav.reserve") },
                { to: "/contact", label: t("nav.contact") },
                { to: "/sunset-dinner-ibiza", label: "Sunset dinner Ibiza" },
                { to: "/sea-view-restaurant-ibiza", label: "Sea-view restaurant Ibiza" },
                { to: "/romantic-restaurant-ibiza", label: "Romantic restaurant Ibiza" },
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="text-background/55 transition-colors hover:text-background/90"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </Reveal>
        </div>

        {/* Bottom bar */}
        <Reveal delay={0.18}>
          <div className="mt-10 flex flex-col gap-1.5 border-t border-background/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-background/35">
              {t("footer.rights", { year: new Date().getFullYear() })}
            </p>
            <a
              href={`https://maps.google.com/?q=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-background/35 transition-colors hover:text-background/60"
              onClick={() => track("maps_click", { source: "footer_bottom" })}
            >
              {SITE.address.street}, {SITE.address.city}
            </a>
          </div>
        </Reveal>
      </div>
    </footer>
  );
}

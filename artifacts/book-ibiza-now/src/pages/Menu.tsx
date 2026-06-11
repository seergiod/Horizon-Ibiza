import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CARTA, type CartaItem, type Subcategory, type MenuTab, type Badge } from "@/content/menu";
import { UrgencyStrip } from "@/components/UrgencyStrip";
import { Reveal, PageTransition } from "@/components/Motion";
import { track } from "@/lib/track";
import { ease } from "@/lib/motion";

/* ── Badge chip ─────────────────────────────────────────── */
const BADGE_CONFIG: Record<Badge, { label: string; color: string }> = {
  chef:       { label: "Chef's Choice",      color: "bg-amber-50 text-amber-700 border-amber-200" },
  traveller:  { label: "Traveller's Choice", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  specialty:  { label: "Specialty",          color: "bg-sky-50 text-sky-700 border-sky-200" },
  ibicencan:  { label: "Ibicencan",          color: "bg-violet-50 text-violet-700 border-violet-200" },
};

function BadgeChip({ badge }: { badge: Badge }) {
  const { label, color } = BADGE_CONFIG[badge];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${color}`}>
      {label}
    </span>
  );
}

/* ── Single menu item row ───────────────────────────────── */
function CartaItemRow({ item, index }: { item: CartaItem; index: number }) {
  const reduce = useReducedMotion();
  const priceStr = item.price != null
    ? `€${item.price.toFixed(2).replace(".", ",")}`
    : item.priceLabel ?? "";

  return (
    <motion.li
      className="group flex items-start justify-between gap-4 py-3.5 border-b border-border/30 last:border-0"
      initial={reduce ? {} : { opacity: 0, y: 6 }}
      whileInView={reduce ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-4%" }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3), ease: ease.expOut }}
    >
      <div className="min-w-0 flex-1">
        {item.badge && (
          <div className="mb-1.5">
            <BadgeChip badge={item.badge} />
          </div>
        )}
        <p className="text-[15px] font-bold text-foreground leading-snug">
          {item.nameEs}
          {item.nameEn && (
            <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
              / {item.nameEn}
            </span>
          )}
        </p>
        {(item.descEs || item.descEn) && (
          <p className="mt-0.5 text-[12px] leading-snug text-muted-foreground">
            {item.descEs}
            {item.descEn && item.descEs && (
              <span className="italic text-muted-foreground/70"> · {item.descEn}</span>
            )}
            {item.descEn && !item.descEs && <span className="italic">{item.descEn}</span>}
          </p>
        )}
        {item.note && (
          <p className="mt-0.5 text-[11px] text-muted-foreground/60 italic">{item.note}</p>
        )}
      </div>
      <span className="shrink-0 text-[14px] font-bold text-primary tabular-nums whitespace-nowrap pt-0.5">
        {priceStr}
      </span>
    </motion.li>
  );
}

/* ── Subcategory block ──────────────────────────────────── */
function SubcategoryBlock({ sub, delay }: { sub: Subcategory; delay: number }) {
  return (
    <div className="mt-8 first:mt-0">
      <motion.div
        initial={{ opacity: 0, x: -6 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-5%" }}
        transition={{ duration: 0.35, delay, ease: ease.expOut }}
        className="mb-0.5 flex items-baseline gap-2"
      >
        <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
          {sub.titleEs}
        </h3>
        {sub.titleEn && (
          <span className="text-[11px] text-muted-foreground/60 tracking-wide">· {sub.titleEn}</span>
        )}
      </motion.div>
      {sub.note && (
        <p className="mb-2 text-[11px] italic text-muted-foreground/60">{sub.note}</p>
      )}
      <ul>
        {sub.items.map((item, i) => (
          <CartaItemRow key={item.id} item={item} index={i} />
        ))}
      </ul>
    </div>
  );
}

/* ── Tab content panel ──────────────────────────────────── */
function TabPanel({ tab }: { tab: MenuTab }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tab.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: ease.expOut }}
      >
        {tab.subcategories.map((sub, i) => (
          <SubcategoryBlock key={sub.id} sub={sub} delay={i * 0.04} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Tab bar ────────────────────────────────────────────── */
function TabBar({
  tabs,
  activeId,
  onChange,
}: {
  tabs: MenuTab[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="sticky top-[3.25rem] z-30 -mx-5 flex gap-1 overflow-x-auto bg-white/95 px-5 py-2 backdrop-blur-md border-b border-border/40 scrollbar-none"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => { onChange(tab.id); track("menu_tab", { tab: tab.id }); }}
            className={`relative shrink-0 rounded-xl px-4 py-2 text-[12px] font-semibold transition-colors outline-none
              ${active ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`}
          >
            {active && (
              <motion.span
                layoutId="tab-bg"
                className="absolute inset-0 rounded-xl"
                style={{ background: "oklch(0.955 0.015 240)" }}
                transition={reduce ? { duration: 0 } : { duration: 0.25, ease: ease.expOut }}
              />
            )}
            <span className="relative z-10 flex flex-col items-center gap-0">
              <span>{tab.labelEs}</span>
              {tab.hours && (
                <span className="text-[9px] font-normal opacity-60 leading-none">{tab.hours}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export function Menu() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [activeTabId, setActiveTabId] = useState(CARTA[0].id);
  const activeTab = CARTA.find((t) => t.id === activeTabId) ?? CARTA[0];

  return (
    <PageTransition>
      <UrgencyStrip />

      <div className="mx-auto max-w-screen-md px-5 pb-16 pt-6">
        {/* Header */}
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-2">
            La Carta
          </p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-foreground">
            Nuestra Carta
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
            Cocina mediterránea de temporada · Ibiza
          </p>
        </Reveal>

        {/* Badge legend */}
        <Reveal delay={0.08} className="mt-4">
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(BADGE_CONFIG) as [Badge, typeof BADGE_CONFIG[Badge]][]).map(([key, { label, color }]) => (
              <span key={key} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${color}`}>
                {label}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Tab bar */}
        <div className="mt-5">
          <TabBar tabs={CARTA} activeId={activeTabId} onChange={setActiveTabId} />
        </div>

        {/* Tab panel */}
        <div className="mt-6">
          <TabPanel tab={activeTab} />
        </div>

        {/* CTA */}
        <Reveal delay={0.1} className="mt-16">
          <div
            className="overflow-hidden rounded-2xl p-7 text-center"
            style={{ backgroundImage: "var(--gradient-sky)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 mb-3">
              ¿Listo para venir?
            </p>
            <p className="font-display text-2xl font-bold tracking-tight text-white">
              {t("menu.endCta")}
            </p>
            <p className="mt-1.5 text-[13px] text-white/65">{t("menu.endCtaSub")}</p>
            <motion.div
              className="mt-5 inline-block"
              whileHover={reduce ? {} : { scale: 1.02 }}
              whileTap={reduce ? {} : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                to="/reserve"
                onClick={() => track("cta_reserve_click", { source: "menu_end" })}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-[14px] font-bold shadow-md transition-shadow hover:shadow-lg"
                style={{ color: "oklch(0.46 0.16 243)" }}
              >
                {t("cta.reserveNow")}
              </Link>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </PageTransition>
  );
}

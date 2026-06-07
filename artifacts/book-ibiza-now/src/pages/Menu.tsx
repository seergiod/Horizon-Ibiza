import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import { MENU, type Dish } from "@/content/menu";
import { UrgencyStrip } from "@/components/UrgencyStrip";
import { Reveal, Stagger, StaggerItem, PageTransition } from "@/components/Motion";
import { track } from "@/lib/track";
import { ease } from "@/lib/motion";

function MenuItem({ dish, index }: { dish: Dish; index: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.li
      className="group flex items-start justify-between gap-4 py-4"
      initial={reduce ? {} : { opacity: 0, x: -8 }}
      whileInView={reduce ? {} : { opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: ease.expOut }}
    >
      <div className="min-w-0">
        <p className="text-[17px] font-bold text-foreground leading-tight tracking-tight">{dish.name}</p>
        <p className="mt-1 text-[13px] leading-snug text-muted-foreground">{dish.description}</p>
      </div>
      <span className="shrink-0 text-[15px] font-bold text-primary tabular-nums">€{dish.price}</span>
    </motion.li>
  );
}

function Section({ title, items }: { title: string; items: Dish[] }) {
  return (
    <section className="mt-10">
      <Reveal>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">{title}</h2>
      </Reveal>
      <ul className="mt-2 divide-y divide-border/40">
        {items.map((dish, i) => <MenuItem key={dish.id} dish={dish} index={i} />)}
      </ul>
    </section>
  );
}

export function Menu() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const starters = MENU.filter((d) => d.category === "starters");
  const mains = MENU.filter((d) => d.category === "mains");
  const drinks = MENU.filter((d) => d.category === "drinks");

  return (
    <PageTransition>
      <UrgencyStrip />
      <div className="mx-auto max-w-screen-md px-5 pb-12 pt-8">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-2">Our menu</p>
          <h1 className="text-5xl font-bold tracking-tight text-foreground">{t("menu.title")}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">{t("menu.subtitle")}</p>
        </Reveal>

        <Section title={t("menu.starters")} items={starters} />
        <Section title={t("menu.mains")} items={mains} />
        <Section title={t("menu.drinks")} items={drinks} />

        <Reveal delay={0.1} className="mt-14">
          <div
            className="overflow-hidden rounded-2xl p-7 text-center"
            style={{ backgroundImage: "var(--gradient-sky)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 mb-3">Ready to visit?</p>
            <p className="text-2xl font-bold tracking-tight text-white">{t("menu.endCta")}</p>
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
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-[14px] font-bold text-primary shadow-md transition-shadow hover:shadow-lg"
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

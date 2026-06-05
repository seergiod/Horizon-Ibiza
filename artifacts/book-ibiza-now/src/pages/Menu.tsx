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
      className="flex items-start justify-between gap-4 py-4"
      initial={reduce ? {} : { opacity: 0, x: -10 }}
      whileInView={reduce ? {} : { opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: ease.expOut }}
    >
      <div className="min-w-0">
        <p className="font-display text-xl text-foreground leading-tight">{dish.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{dish.description}</p>
      </div>
      <span className="shrink-0 text-base font-semibold text-primary">€{dish.price}</span>
    </motion.li>
  );
}

function Section({ title, items }: { title: string; items: Dish[] }) {
  return (
    <section className="mt-8">
      <Reveal><h2 className="font-display text-3xl text-foreground">{title}</h2></Reveal>
      <ul className="mt-4 divide-y divide-border/50">
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
      <div className="mx-auto max-w-screen-md px-5 pb-10 pt-8">
        <Reveal>
          <h1 className="font-display text-5xl text-foreground">{t("menu.title")}</h1>
          <p className="mt-2 text-base text-muted-foreground">{t("menu.subtitle")}</p>
        </Reveal>
        <Section title={t("menu.starters")} items={starters} />
        <Section title={t("menu.mains")} items={mains} />
        <Section title={t("menu.drinks")} items={drinks} />
        <Reveal delay={0.1} className="mt-12">
          <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center">
            <p className="font-display text-2xl text-foreground">{t("menu.endCta")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("menu.endCtaSub")}</p>
            <motion.div className="mt-5 inline-block"
              whileHover={reduce ? {} : { scale: 1.02 }} whileTap={reduce ? {} : { scale: 0.97 }}
              transition={{ duration: 0.15 }}>
              <Link to="/reserve" onClick={() => track("cta_reserve_click", { source: "menu_end" })}
                className="inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-semibold text-primary-foreground shadow-[var(--shadow-cta)]"
                style={{ backgroundImage: "var(--gradient-sunset)" }}>
                {t("cta.reserveNow")}
              </Link>
            </motion.div>
          </div>
        </Reveal>
      </div>
    </PageTransition>
  );
}

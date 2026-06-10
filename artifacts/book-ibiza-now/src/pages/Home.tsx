import { useRef, useEffect } from "react";
import { logEvent } from "@/lib/dashboard-api";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Typewriter } from "@/components/ui/typewriter";
import heroImg from "@/hero-sunset.jpg";
import dishSeafood from "@/dish-seafood.jpg";
import dishPaella from "@/dish-paella.jpg";
import drinkSignature from "@/drink-signature.jpg";
import seaViewImg from "@/sea-view.jpg";
import { UrgencyStrip } from "@/components/UrgencyStrip";
import { Reveal, Stagger, StaggerItem, ImageReveal, PageTransition } from "@/components/Motion";
import { ImageWithFallback } from "@/components/ImagePlaceholder";
import StickyScrollGallery from "@/components/ui/sticky-scroll";
import { MENU } from "@/content/menu";
import { track } from "@/lib/track";
import { ease, heroText } from "@/lib/motion";

const SIGNATURES = [
  { img: dishSeafood, index: 0 },
  { img: dishPaella, index: 1 },
  { img: drinkSignature, index: 2 },
];

export function Home() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();

  useEffect(() => { logEvent("VISITA_WEB"); }, []);
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(heroScroll, [0, 1], ["0%", "35%"]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  const signatures = MENU.slice(0, 3).map((dish, i) => ({ dish, img: SIGNATURES[i].img }));

  const trustItems = [
    { label: t("trust.seaView"), detail: "Figueretas · Ibiza" },
    { label: t("trust.sunsetTerrace"), detail: "Every evening" },
    { label: t("trust.whatsappConfirm"), detail: "Within 15 min" },
  ];

  return (
    <PageTransition>
      {/* ── Hero ── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 origin-center"
          style={{ y: reduce ? 0 : heroY }}
          initial={reduce ? {} : { scale: 1.08 }}
          animate={reduce ? {} : { scale: 1 }}
          transition={{ duration: 2.2, ease: ease.expOut }}
        >
          <ImageWithFallback
            src={heroImg}
            alt="Sunset over the Mediterranean sea from Horizon Ibiza terrace"
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
            minHeight="100svh"
            label="Image Coming Soon"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/80" />
        <motion.div
          className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-screen-md flex-col justify-end px-5 pb-10 pt-24 text-white"
          style={{ opacity: reduce ? 1 : heroOpacity }}
        >
          <motion.p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-white/60"
            variants={heroText} initial="hidden" animate="visible"
            transition={{ delay: 0.2, duration: 0.6, ease: ease.expOut }}
          >
            {t("hero.eyebrow")}
          </motion.p>
          <motion.h1
            className="text-5xl font-bold leading-[0.95] tracking-[-0.03em] text-balance sm:text-6xl"
            variants={heroText} initial="hidden" animate="visible"
            transition={{ delay: 0.4, duration: 0.75, ease: ease.expOut }}
          >
            {t("hero.title")}
          </motion.h1>
          <motion.div
            className="mt-3 flex h-[1.6em] items-center"
            initial={reduce ? {} : { opacity: 0 }}
            animate={reduce ? {} : { opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            aria-hidden="true"
          >
            <Typewriter
              words={[
                "Mediterranean cuisine · Ibiza",
                "Sea view dining",
                "Sunset restaurant Ibiza",
                "Romantic dinners",
                "Open every day, 8:00 – 23:30",
              ]}
              typingSpeed={52}
              deletingSpeed={28}
              pauseAfterType={2400}
              pauseAfterDelete={380}
              className="text-[15px] font-light leading-none tracking-wide text-white/65"
              cursorClassName="ml-px text-white/35 font-extralight"
            />
          </motion.div>
          <motion.p
            className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/50"
            variants={heroText} initial="hidden" animate="visible"
            transition={{ delay: 0.6, duration: 0.65, ease: ease.expOut }}
          >
            {t("hero.subtitle")}
          </motion.p>
          <motion.div
            className="mt-7 flex flex-col gap-3 sm:flex-row"
            initial={reduce ? {} : { opacity: 0, y: 16 }}
            animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.82, duration: 0.6, ease: ease.expOut }}
          >
            <motion.div whileHover={reduce ? {} : { scale: 1.02 }} whileTap={reduce ? {} : { scale: 0.97 }} transition={{ duration: 0.15 }}>
              <Link
                to="/reserve"
                onClick={() => track("cta_reserve_click", { source: "hero_primary" })}
                className="inline-flex h-13 w-full items-center justify-center rounded-xl px-8 text-[15px] font-semibold text-white shadow-[var(--shadow-cta)] sm:w-auto"
                style={{ backgroundImage: "var(--gradient-sunset)" }}
              >
                {t("cta.reserveNow")}
              </Link>
            </motion.div>
            <motion.div whileHover={reduce ? {} : { scale: 1.02 }} whileTap={reduce ? {} : { scale: 0.97 }} transition={{ duration: 0.15 }}>
              <Link
                to="/menu"
                onClick={() => track("menu_view", { source: "hero" })}
                className="inline-flex h-13 w-full items-center justify-center rounded-xl border border-white/20 bg-white/8 px-8 text-[15px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:w-auto"
              >
                {t("cta.viewMenu")}
              </Link>
            </motion.div>
          </motion.div>
          <motion.p
            className="mt-4 text-[11px] font-medium text-white/45 tracking-wide"
            initial={reduce ? {} : { opacity: 0 }} animate={reduce ? {} : { opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            {t("hero.trustLine")}
          </motion.p>
        </motion.div>
      </section>

      <UrgencyStrip />

      {/* ── Trust features ── */}
      <section className="px-5 pt-8">
        <div className="mx-auto max-w-screen-md">
          <Stagger className="grid grid-cols-3 gap-3">
            {trustItems.map(({ label, detail }) => (
              <StaggerItem key={label}>
                <div className="flex flex-col gap-1 rounded-2xl bg-secondary/70 px-3 py-4 text-center transition-colors hover:bg-secondary">
                  <span className="text-[11px] font-bold leading-tight text-foreground">{label}</span>
                  <span className="text-[10px] text-muted-foreground leading-snug">{detail}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Signature dishes ── */}
      <section className="px-5 pt-12">
        <div className="mx-auto max-w-screen-md">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-2">
              Signature dishes
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-foreground">{t("signature.title")}</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">{t("signature.subtitle")}</p>
          </Reveal>
          <Stagger className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {signatures.map(({ dish, img }) => (
              <StaggerItem key={dish.id}>
                <article className="group overflow-hidden rounded-2xl bg-card shadow-[0_2px_12px_0_oklch(0.52_0.24_263_/_0.07)]">
                  <div className="aspect-[4/3] overflow-hidden">
                    <motion.div
                      whileHover={reduce ? {} : { scale: 1.06 }}
                      transition={{ duration: 0.55, ease: ease.out }}
                      className="h-full w-full"
                    >
                      <ImageWithFallback
                        src={img}
                        alt={dish.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        minHeight="100%"
                        label="Image Coming Soon"
                      />
                    </motion.div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-[17px] font-bold text-foreground leading-tight tracking-tight">{dish.name}</h3>
                      <span className="shrink-0 text-[15px] font-bold text-primary">€{dish.price}</span>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{dish.description}</p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
          <Reveal delay={0.1} className="mt-5">
            <Link
              to="/menu"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-opacity hover:opacity-70"
              onClick={() => track("menu_view", { source: "signature_section" })}
            >
              {t("cta.viewMenu")}
              <span className="text-[11px]">→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Sea view parallax ── */}
      <section className="px-5 pt-12">
        <div className="mx-auto max-w-screen-md">
          <SeaViewParallax img={seaViewImg} t={t} reduce={reduce} />
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="pt-0">
        <StickyScrollGallery />
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-5 pt-12 pb-12">
        <Reveal className="mx-auto max-w-screen-md">
          <div
            className="overflow-hidden rounded-2xl p-8 text-center text-white"
            style={{ backgroundImage: "var(--gradient-sky)" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 mb-3">Reserve now</p>
            <p className="text-3xl font-bold tracking-tight">{t("urgency.bookFast")}</p>
            <p className="mt-2 text-[14px] text-white/70 leading-relaxed">{t("hero.ctaSubline")}</p>
            <motion.div
              className="mt-6 inline-block"
              whileHover={reduce ? {} : { scale: 1.03 }}
              whileTap={reduce ? {} : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                to="/reserve"
                onClick={() => track("cta_reserve_click", { source: "bottom_cta" })}
                className="inline-flex h-13 items-center justify-center rounded-xl bg-white px-8 text-[15px] font-bold text-primary shadow-lg transition-shadow hover:shadow-xl"
              >
                {t("cta.reserveNow")}
              </Link>
            </motion.div>
          </div>
        </Reveal>
      </section>
    </PageTransition>
  );
}

function SeaViewParallax({ img, t, reduce }: { img: string; t: (key: string) => string; reduce: boolean | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);

  return (
    <ImageReveal>
      <div ref={ref} className="relative overflow-hidden rounded-2xl">
        <motion.div style={{ y: reduce ? 0 : y, scale: 1.15 }} className="w-full">
          <ImageWithFallback
            src={img}
            alt="Sea view terrace at Horizon Ibiza"
            className="aspect-[16/9] w-full object-cover"
            loading="lazy"
            decoding="async"
            minHeight="56.25%"
            label="Image Coming Soon"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-7 text-white">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55 mb-1">Sea view</p>
            <p className="text-3xl font-bold tracking-tight">{t("hero.seaViewFeature")}</p>
            <p className="mt-1.5 text-[13px] text-white/70">{t("hero.seaViewSub")}</p>
          </Reveal>
        </div>
      </div>
    </ImageReveal>
  );
}

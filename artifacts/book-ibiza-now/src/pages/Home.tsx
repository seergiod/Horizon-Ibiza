import { useRef, useEffect } from "react";
import { logEvent } from "@/lib/dashboard-api";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { Typewriter } from "@/components/ui/typewriter";
import { UrgencyStrip } from "@/components/UrgencyStrip";
import { Reveal, Stagger, StaggerItem, ImageReveal, PageTransition } from "@/components/Motion";
import { ImageWithFallback } from "@/components/ImagePlaceholder";
import StickyScrollGallery from "@/components/ui/sticky-scroll";
import { MENU } from "@/content/menu";
import { track } from "@/lib/track";
import { ease, heroText } from "@/lib/motion";

const HERO_IMG     = "/pool-cocktail.jpg";
const DISH_IMGS    = ["/food-paella.jpg", "/food-pasta.jpg", "/food-salad.jpg"];
const SEA_VIEW_IMG = "/food-yogurt.jpg";

const DISH_DECORATIONS = [
  { img: "/dish-paella-art.png", alt: "Paella illustration" },
  { img: "/dish-pasta-art.png",  alt: "Pasta illustration" },
  { img: "/dish-acai.png",       alt: "Acaí bowl illustration" },
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
  const heroY       = useTransform(heroScroll, [0, 1], ["0%", "35%"]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  const signatures = MENU.slice(0, 3).map((dish, i) => ({ dish, img: DISH_IMGS[i] }));

  const trustItems = [
    { icon: "🌊", label: t("trust.seaView"),        detail: "Figueretas · Ibiza" },
    { icon: "🌅", label: t("trust.sunsetTerrace"),   detail: "Every evening" },
    { icon: "💬", label: t("trust.whatsappConfirm"), detail: "Within 15 min" },
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
            src={HERO_IMG}
            alt="Relaxing at Horizon Ibiza with a cocktail by the pool"
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
            minHeight="100svh"
            label="Loading…"
          />
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/85" />

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
            className="font-display text-5xl font-bold leading-[0.95] tracking-[-0.02em] text-balance sm:text-6xl"
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
            {trustItems.map(({ icon, label, detail }) => (
              <StaggerItem key={label}>
                <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-secondary/70 px-3 py-4 text-center transition-colors hover:bg-secondary">
                  <span className="text-xl">{icon}</span>
                  <span className="text-[11px] font-bold leading-tight text-foreground">{label}</span>
                  <span className="text-[10px] text-muted-foreground leading-snug">{detail}</span>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Signature dishes ── */}
      <section className="px-5 pt-14">
        <div className="mx-auto max-w-screen-md">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-2">
              Signature dishes
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-foreground">{t("signature.title")}</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">{t("signature.subtitle")}</p>
          </Reveal>
          <Stagger className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {signatures.map(({ dish, img }, i) => (
              <StaggerItem key={dish.id}>
                <article className="group overflow-hidden rounded-2xl bg-card shadow-[var(--shadow-card)]">
                  <div className="aspect-[4/3] overflow-hidden relative">
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
                        label="Loading…"
                      />
                    </motion.div>
                    {/* Decorative food art overlay */}
                    {i === 0 && (
                      <img
                        src="/dish-paella-art.png"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-4 -right-4 w-24 opacity-90 drop-shadow-lg"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-[17px] font-bold text-foreground leading-tight">{dish.name}</h3>
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

      {/* ── Floating food art banner ── */}
      <section className="px-5 pt-14 overflow-hidden">
        <div className="mx-auto max-w-screen-md">
          <div
            className="rounded-3xl px-6 py-10 flex flex-col sm:flex-row items-center gap-6 overflow-hidden relative"
            style={{ background: "linear-gradient(135deg, oklch(0.46 0.16 243) 0%, oklch(0.36 0.13 250) 100%)" }}
          >
            <div className="flex-1 text-white z-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 mb-2">Figueretas · Ibiza</p>
              <p className="font-display text-3xl font-bold leading-tight">
                Mediterranean flavors.<br />Endless horizon.
              </p>
              <p className="mt-3 text-[14px] text-white/70 leading-relaxed max-w-xs">
                Fresh catch of the day, traditional rice dishes and creative Mediterranean plates — all with a sea view.
              </p>
              <Link
                to="/reserve"
                onClick={() => track("cta_reserve_click", { source: "mid_banner" })}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-white px-6 text-[13px] font-bold transition-opacity hover:opacity-90"
                style={{ color: "oklch(0.46 0.16 243)" }}
              >
                {t("cta.reserveNow")}
              </Link>
            </div>
            <div className="flex-shrink-0 flex items-center justify-center gap-2 z-10">
              <img src="/dish-paella-art.png" alt="Paella" className="w-32 sm:w-40 drop-shadow-2xl" />
              <img src="/drink-mojito.png"    alt="Mojito" className="w-20 sm:w-24 drop-shadow-2xl -ml-4 mt-6" />
            </div>
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-16 -right-8 w-56 h-56 rounded-full bg-white/5" />
          </div>
        </div>
      </section>

      {/* ── Sea view parallax ── */}
      <section className="px-5 pt-14">
        <div className="mx-auto max-w-screen-md">
          <SeaViewParallax img={SEA_VIEW_IMG} t={t} reduce={reduce} />
        </div>
      </section>

      {/* ── Figueretas watercolor ── */}
      <section className="px-5 pt-10">
        <div className="mx-auto max-w-screen-md">
          <Reveal>
            <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl p-6"
              style={{ background: "oklch(0.962 0.008 245)" }}>
              <img src="/figueretas.png" alt="Figueretas Ibiza watercolor" className="w-36 sm:w-44 rounded-xl flex-shrink-0" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-1">Our location</p>
                <p className="font-display text-2xl font-bold text-foreground">Figueretas, Ibiza</p>
                <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
                  Right on the seafront of Figueretas beach, steps from the sand. Open every day from 8:00 to 23:30.
                </p>
                <Link
                  to="/contact"
                  className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary transition-opacity hover:opacity-70"
                >
                  How to find us →
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Gallery ── */}
      <section className="pt-14">
        <div className="mx-auto max-w-screen-md px-5 mb-6">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-2">Gallery</p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-foreground">A feast for the eyes</h2>
          </Reveal>
        </div>
        <StickyScrollGallery />
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-5 pt-14 pb-14">
        <Reveal className="mx-auto max-w-screen-md">
          <div
            className="overflow-hidden rounded-3xl p-8 sm:p-12 text-center text-white relative"
            style={{ backgroundImage: "var(--gradient-sky)" }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <img src="/dish-acai.png" alt="" aria-hidden="true"
                className="absolute -left-8 bottom-0 w-40 opacity-30 rotate-12" />
              <img src="/drink-juice.png" alt="" aria-hidden="true"
                className="absolute -right-6 -top-4 w-32 opacity-25 -rotate-12" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60 mb-3">Reserve now</p>
              <p className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t("urgency.bookFast")}</p>
              <p className="mt-2 text-[14px] text-white/70 leading-relaxed max-w-sm mx-auto">{t("hero.ctaSubline")}</p>
              <motion.div
                className="mt-7 inline-block"
                whileHover={reduce ? {} : { scale: 1.03 }}
                whileTap={reduce ? {} : { scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  to="/reserve"
                  onClick={() => track("cta_reserve_click", { source: "bottom_cta" })}
                  className="inline-flex h-13 items-center justify-center rounded-xl bg-white px-8 text-[15px] font-bold shadow-lg transition-shadow hover:shadow-xl"
                  style={{ color: "oklch(0.46 0.16 243)" }}
                >
                  {t("cta.reserveNow")}
                </Link>
              </motion.div>
            </div>
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
            alt="Fresh breakfast with sea view at Horizon Ibiza"
            className="aspect-[16/9] w-full object-cover"
            loading="lazy"
            decoding="async"
            minHeight="56.25%"
            label="Loading…"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 px-6 pb-7 text-white">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55 mb-1">Sea view</p>
            <p className="font-display text-3xl font-bold tracking-tight">{t("hero.seaViewFeature")}</p>
            <p className="mt-1.5 text-[13px] text-white/70">{t("hero.seaViewSub")}</p>
          </Reveal>
        </div>
      </div>
    </ImageReveal>
  );
}

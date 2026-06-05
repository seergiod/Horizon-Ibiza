import { useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import romanticImg from "@/romantic-sunset.jpg";
import dishSeafood from "@/dish-seafood.jpg";
import { UrgencyStrip } from "@/components/UrgencyStrip";
import { Reveal, ImageReveal, PageTransition } from "@/components/Motion";
import { ImageWithFallback } from "@/components/ImagePlaceholder";
import { track } from "@/lib/track";
import { ease, heroText } from "@/lib/motion";

export function Romantic() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <PageTransition>
      <section ref={heroRef} className="relative overflow-hidden">
        <motion.div style={{ y: reduce ? 0 : imgY, scale: 1.15 }}
          initial={reduce ? {} : { scale: 1.2 }} animate={reduce ? {} : { scale: 1.15 }}
          transition={{ duration: 1.8, ease: ease.expOut }} className="w-full">
          <ImageWithFallback src={romanticImg} alt="Candlelit romantic table with sunset sea view at Horizon Ibiza"
            className="h-[60svh] w-full object-cover" fetchPriority="high" decoding="async"
            minHeight="60svh" label="Image Coming Soon" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/25 to-black/75" />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-screen-md px-5 pb-8 text-white">
          <motion.p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-white/70"
            variants={heroText} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
            Figueretas · Ibiza
          </motion.p>
          <motion.h1 className="font-display text-5xl leading-[0.95] text-balance"
            variants={heroText} initial="hidden" animate="visible" transition={{ delay: 0.38, duration: 0.72, ease: ease.expOut }}>
            {t("seo.romantic.h1")}
          </motion.h1>
          <motion.p className="mt-3 max-w-md text-[15px] text-white/85 leading-snug"
            variants={heroText} initial="hidden" animate="visible" transition={{ delay: 0.56 }}>
            {t("seo.romantic.lead")}
          </motion.p>
          <motion.div className="mt-6" initial={reduce ? {} : { opacity: 0, y: 14 }} animate={reduce ? {} : { opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5, ease: ease.expOut }}>
            <motion.div whileHover={reduce ? {} : { scale: 1.02 }} whileTap={reduce ? {} : { scale: 0.97 }} transition={{ duration: 0.15 }}>
              <Link to="/reserve" onClick={() => track("cta_reserve_click", { source: "seo_romantic_hero" })}
                className="inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-semibold text-primary-foreground shadow-[var(--shadow-cta)]"
                style={{ backgroundImage: "var(--gradient-sunset)" }}>
                {t("cta.reserveNow")}
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <UrgencyStrip />
      <article className="mx-auto max-w-screen-md px-5 pt-10 pb-4">
        <Reveal><h2 className="font-display text-3xl text-foreground">{t("seo.romantic.bodyTitle")}</h2></Reveal>
        <Reveal delay={0.1}><p className="mt-3 text-base text-muted-foreground leading-relaxed">{t("seo.romantic.body1")}</p></Reveal>
        <Reveal delay={0.15}><p className="mt-3 text-base text-muted-foreground leading-relaxed">{t("seo.romantic.body2")}</p></Reveal>
      </article>
      <section className="px-5 pt-6">
        <ImageReveal className="mx-auto max-w-screen-md overflow-hidden rounded-3xl">
          <ImageWithFallback src={dishSeafood} alt="Premium seafood dish at Horizon Ibiza romantic dining"
            className="aspect-[16/9] w-full object-cover" loading="lazy" decoding="async"
            minHeight="56.25%" label="Image Coming Soon" />
        </ImageReveal>
      </section>
      <Reveal className="mx-auto max-w-screen-md px-5 pt-10 pb-20 text-center">
        <p className="font-display text-2xl text-foreground">{t("seo.romantic.ctaTitle")}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t("seo.romantic.ctaSub")}</p>
        <motion.div className="mt-5 inline-block" whileHover={reduce ? {} : { scale: 1.02 }} whileTap={reduce ? {} : { scale: 0.97 }} transition={{ duration: 0.15 }}>
          <Link to="/reserve" onClick={() => track("cta_reserve_click", { source: "seo_romantic_bottom" })}
            className="inline-flex h-14 items-center justify-center rounded-full px-8 text-base font-semibold text-primary-foreground shadow-[var(--shadow-cta)]"
            style={{ backgroundImage: "var(--gradient-sunset)" }}>
            {t("cta.reserveNow")}
          </Link>
        </motion.div>
      </Reveal>
    </PageTransition>
  );
}

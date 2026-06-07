import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SITE } from "@/content/site";
import { track } from "@/lib/track";
import { ease } from "@/lib/motion";

export function SiteHeader() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const onReservePage = pathname === "/reserve";
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handler = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 40);
        setVisible(y < 80 || y < lastY);
        setLastY(y);
        ticking = false;
      });
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [lastY]);

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40"
      animate={reduce ? {} : {
        y: visible ? 0 : -80,
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(0px)",
        backgroundColor: scrolled ? "oklch(1 0 0 / 0.92)" : "oklch(1 0 0 / 0)",
        borderBottomColor: scrolled ? "oklch(0.88 0.02 253 / 0.8)" : "oklch(0.88 0.02 253 / 0)",
      }}
      transition={{ duration: 0.3, ease: ease.out }}
      style={{ borderBottomWidth: 1, borderBottomStyle: "solid" }}
    >
      <div className="mx-auto flex max-w-screen-md items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-baseline gap-1.5 group">
          <motion.span
            className="text-[17px] font-bold leading-none tracking-tight text-foreground"
            whileHover={reduce ? {} : { opacity: 0.7 }}
            transition={{ duration: 0.2 }}
          >
            {SITE.name.split(" ")[0]}
          </motion.span>
          <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Ibiza
          </span>
        </Link>
        <nav className="flex items-center gap-0.5">
          <Link
            to="/menu"
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-foreground/65 transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t("nav.menu")}
          </Link>
          <Link
            to="/contact"
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-foreground/65 transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t("nav.contact")}
          </Link>
          <LanguageSwitcher />
          <AnimatePresence>
            {!onReservePage && (
              <motion.div
                initial={reduce ? {} : { opacity: 0, scale: 0.9 }}
                animate={reduce ? {} : { opacity: 1, scale: 1 }}
                exit={reduce ? {} : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2, ease: ease.expOut }}
              >
                <Link
                  to="/reserve"
                  onClick={() => track("cta_reserve_click", { source: "header" })}
                  className="ml-1.5 inline-flex h-8 items-center justify-center rounded-lg px-4 text-[12px] font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-95"
                  style={{ backgroundImage: "var(--gradient-sunset)" }}
                >
                  {t("cta.reserve")}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </motion.header>
  );
}

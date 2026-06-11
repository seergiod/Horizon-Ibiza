import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { track } from "@/lib/track";
import { ease } from "@/lib/motion";

export function SiteHeader() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const onReservePage = pathname === "/reserve";
  const reduce = useReducedMotion();
  const [scrolled, setScrolled]   = useState(false);
  const [visible, setVisible]     = useState(true);
  const [lastY, setLastY]         = useState(0);
  const [menuOpen, setMenuOpen]   = useState(false);

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

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const navLinks = [
    { to: "/menu",    label: t("nav.menu") },
    { to: "/contact", label: t("nav.contact") },
  ];

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-40"
        animate={reduce ? {} : {
          y: visible ? 0 : -80,
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "blur(12px) saturate(120%)",
          backgroundColor: scrolled ? "oklch(1 0 0 / 0.95)" : "oklch(1 0 0 / 0.82)",
          borderBottomColor: scrolled ? "oklch(0.89 0.018 248 / 0.9)" : "oklch(0.89 0.018 248 / 0.4)",
        }}
        transition={{ duration: 0.3, ease: ease.out }}
        style={{ borderBottomWidth: 1, borderBottomStyle: "solid" }}
      >
        <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-2.5">
          {/* Logo */}
          <Link to="/" className="flex items-center" onClick={() => setMenuOpen(false)}>
            <img
              src="/logo-transparent.png"
              alt="Horizon Ibiza"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {label}
              </Link>
            ))}
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

          {/* Mobile: reserve + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {!onReservePage && (
              <Link
                to="/reserve"
                onClick={() => track("cta_reserve_click", { source: "header_mobile" })}
                className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-[12px] font-semibold text-white shadow-sm"
                style={{ backgroundImage: "var(--gradient-sunset)" }}
              >
                {t("cta.reserve")}
              </Link>
            )}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-secondary/80"
              style={{ color: scrolled || menuOpen ? undefined : "white" }}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile full-screen menu overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-30 flex flex-col bg-white md:hidden"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.22, ease: ease.expOut }}
          >
            <div className="flex flex-col gap-1 px-6 pt-24 pb-8">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="py-4 text-2xl font-semibold text-foreground border-b border-border/40"
                >
                  {label}
                </Link>
              ))}
              <Link
                to="/reserve"
                onClick={() => track("cta_reserve_click", { source: "mobile_menu" })}
                className="mt-6 inline-flex h-14 w-full items-center justify-center rounded-xl text-[16px] font-bold text-white"
                style={{ backgroundImage: "var(--gradient-sunset)" }}
              >
                {t("cta.reserveNow")}
              </Link>
            </div>
            <div className="px-6 mt-auto pb-12">
              <LanguageSwitcher />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

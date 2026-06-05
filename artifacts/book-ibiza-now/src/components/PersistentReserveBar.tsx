import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { buildWhatsAppUrl, helpMessage } from "@/lib/whatsapp";
import { track } from "@/lib/track";
import { ease } from "@/lib/motion";
import type { Locale } from "@/i18n";

export function PersistentReserveBar() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [waPulse, setWaPulse] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setWaPulse(true);
      setTimeout(() => setWaPulse(false), 700);
    }, 15_000);
    return () => clearInterval(id);
  }, []);

  if (pathname === "/reserve") return null;

  const locale = (i18n.language?.slice(0, 2) as Locale) || "en";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="reserve-bar"
          initial={reduce ? {} : { y: 80, opacity: 0 }}
          animate={reduce ? {} : { y: 0, opacity: 1 }}
          exit={reduce ? {} : { y: 80, opacity: 0 }}
          transition={{ duration: 0.4, ease: ease.expOut }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/96 backdrop-blur-md"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 0.625rem)",
            paddingTop: "0.5rem",
            paddingLeft: "0.75rem",
            paddingRight: "0.75rem",
          }}
        >
          <div className="mx-auto flex max-w-screen-md items-center gap-2.5">
            <motion.div
              className="flex-1"
              whileHover={reduce ? {} : { scale: 1.01 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                to="/reserve"
                onClick={() => track("cta_reserve_click", { source: "bottom_bar" })}
                className="flex h-13 w-full items-center justify-center rounded-full font-semibold text-[15px] text-primary-foreground shadow-[var(--shadow-cta)]"
                style={{ backgroundImage: "var(--gradient-sunset)" }}
              >
                {t("cta.reserve")}
              </Link>
            </motion.div>
            <motion.a
              href={buildWhatsAppUrl(helpMessage(locale), locale)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { source: "bottom_bar" })}
              aria-label="WhatsApp"
              className="inline-flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md"
              whileHover={reduce ? {} : { scale: 1.06 }}
              whileTap={reduce ? {} : { scale: 0.93 }}
              animate={reduce ? {} : waPulse ? {
                scale: [1, 1.12, 0.97, 1.05, 1],
                boxShadow: ["0 4px 12px oklch(0 0 0 / 0.15)", "0 0 0 8px #25D36620", "0 0 0 0px #25D36600", "0 4px 12px oklch(0 0 0 / 0.15)"],
              } : {}}
              transition={waPulse ? { duration: 0.65, ease: ease.out } : { duration: 0.18 }}
            >
              <MessageCircle className="h-5 w-5" />
            </motion.a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

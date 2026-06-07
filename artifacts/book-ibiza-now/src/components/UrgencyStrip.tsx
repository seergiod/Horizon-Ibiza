import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Flame, Clock } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { tablesLeftToday, isUrgent } from "@/lib/urgency";
import { ease } from "@/lib/motion";

export function UrgencyStrip() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setCount(tablesLeftToday());
  }, []);

  return (
    <AnimatePresence>
      {count !== null && (
        <motion.div
          initial={reduce ? {} : { opacity: 0, y: -8 }}
          animate={reduce ? {} : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: ease.expOut }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 text-center text-[13px] font-semibold ${
            isUrgent(count)
              ? "bg-amber-50 text-amber-700 border-b border-amber-200/60"
              : "bg-blue-50 text-blue-700 border-b border-blue-200/60"
          }`}
        >
          {isUrgent(count) ? (
            <Flame className="h-3.5 w-3.5 shrink-0 animate-pulse" />
          ) : (
            <Clock className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>
            {isUrgent(count)
              ? t("urgency.tablesLeft", { count })
              : t("urgency.spotsAvailable", { count })}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

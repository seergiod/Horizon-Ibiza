import { useTranslation } from "react-i18next";
import type { Locale } from "@/i18n";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
  { code: "de", label: "DE" },
  { code: "fr", label: "FR" },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) as Locale;

  return (
    <div className="flex items-center">
      <select
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="h-8 rounded-full border-0 bg-transparent px-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary/30 cursor-pointer"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </div>
  );
}

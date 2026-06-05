import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import es from "./locales/es";
import de from "./locales/de";
import fr from "./locales/fr";

export type Locale = "en" | "es" | "de" | "fr";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, es: { translation: es }, de: { translation: de }, fr: { translation: fr } },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: { order: ["navigator", "htmlTag"] },
  });

export default i18n;

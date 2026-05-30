import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import tr from "./tr.json";

/**
 * i18n kurulumu. Diller: Türkçe (varsayılan) + İngilizce.
 * Türkçe terminoloji guardrail'i için bkz. ./lexicon.ts
 * (tr.json içeriği testte assertTurkishTerminology ile denetlenmeli — en.json hariç).
 */
export const SUPPORTED_LANGUAGES = ["tr", "en"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = "tr";

void i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  // React Native'de Suspense kullanmıyoruz
  react: { useSuspense: false },
});

/** Uygulama dilini değiştirir (settingsStore tarafından çağrılır). */
export function setAppLanguage(lng: AppLanguage): void {
  if (i18n.language !== lng) void i18n.changeLanguage(lng);
}

export default i18n;

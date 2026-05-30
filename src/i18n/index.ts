import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import tr from "./tr.json";

/**
 * i18n kurulumu. Şimdilik tek dil: Türkçe (tr).
 * Türkçe terminoloji guardrail'i için bkz. ./lexicon.ts
 * (tr.json içeriği testte assertTurkishTerminology ile denetlenmeli).
 */
export const DEFAULT_LANGUAGE = "tr" as const;

void i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  interpolation: { escapeValue: false },
  // React Native'de Suspense kullanmıyoruz
  react: { useSuspense: false },
});

export default i18n;

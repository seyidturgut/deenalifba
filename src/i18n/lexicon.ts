/**
 * Türkçe İslami Terminoloji Bütünlüğü (GUARDRAIL).
 *
 * `lang: tr` için standart İngilizce-Arapça transliterasyonlar YASAKTIR.
 * Doğru Türkçe karşılıklar zorunludur. Bu sözlük hem dökümantasyon hem de
 * test/lint amaçlıdır: `assertTurkishTerminology()` çeviri metinlerini denetler.
 *
 * Kural kaynağı: PROJECT PROFILE §4.A
 */

export type TerminologyRule = {
  /** Doğru Türkçe terim */
  correct: string;
  /** Yasak transliterasyonlar (büyük/küçük harf duyarsız eşleşir) */
  forbidden: string[];
  note?: string;
};

export const TURKISH_TERMINOLOGY: TerminologyRule[] = [
  { correct: "Namaz", forbidden: ["Salat", "Salah", "Solat"] },
  { correct: "Sure", forbidden: ["Surah", "Surat"] },
  { correct: "Harf", forbidden: ["Letter"], note: "çoğul: Harfler (NOT Letters)" },
  { correct: "Abdest", forbidden: ["Wudu", "Wudhu"] },
];

/**
 * Bir metin bloğunda yasak terim geçip geçmediğini denetler.
 * Tam kelime sınırı (\b) ile eşleşir, büyük/küçük harf duyarsızdır.
 * @returns ihlal listesi (boşsa metin temiz)
 */
export function findTerminologyViolations(
  text: string
): { forbidden: string; correct: string }[] {
  const violations: { forbidden: string; correct: string }[] = [];
  for (const rule of TURKISH_TERMINOLOGY) {
    for (const bad of rule.forbidden) {
      const re = new RegExp(`\\b${bad}\\b`, "i");
      if (re.test(text)) {
        violations.push({ forbidden: bad, correct: rule.correct });
      }
    }
  }
  return violations;
}

/**
 * Çeviri sözlüğünü (key→string) komple denetler; ihlal varsa fırlatır.
 * CI/test içinde tr.json üzerinde çağrılması önerilir.
 */
export function assertTurkishTerminology(
  translations: Record<string, unknown>,
  path = ""
): void {
  for (const [key, value] of Object.entries(translations)) {
    const here = path ? `${path}.${key}` : key;
    if (typeof value === "string") {
      const v = findTerminologyViolations(value);
      if (v.length) {
        throw new Error(
          `[Terminoloji ihlali] "${here}": ` +
            v.map((x) => `"${x.forbidden}" → "${x.correct}" kullanın`).join("; ")
        );
      }
    } else if (value && typeof value === "object") {
      assertTurkishTerminology(value as Record<string, unknown>, here);
    }
  }
}

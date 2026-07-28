import { LETTERS } from "@/data/letters";

/**
 * "Harf Tanıma" bölümü — haritada 29-35 arası YEDİ ayrı seviye.
 *
 * Abdulkadir (2. playtest turu): "içeriği 29-35 seviyelerine yayın, seviye başına 4-5 harf
 * verin — hepsini birden öğretmek bilişsel yükü artırıyor, çocuğa pratik için zaman kalmıyor."
 * Ayrıca 1-28'deki "bir düğüm = bir kısa ders" ritmi de böylece korunuyor.
 */
export const FORMS_GROUP_SIZE = 4;

/** Harf id'lerinin 4'erli dilimleri (7 grup × 4 harf = 28). */
export const FORMS_GROUPS: number[][] = (() => {
  const out: number[][] = [];
  for (let i = 0; i < LETTERS.length; i += FORMS_GROUP_SIZE) {
    out.push(LETTERS.slice(i, i + FORMS_GROUP_SIZE).map((l) => l.id));
  }
  return out;
})();

export const FORMS_GROUP_COUNT = FORMS_GROUPS.length;

/** 0-tabanlı grup indeksi → harf id'leri */
export function formsGroup(index: number): number[] {
  return FORMS_GROUPS[index] ?? [];
}

/** Bir harf hangi grupta? (ilerleme/kilit hesapları için) */
export function groupOfLetter(letterId: number): number {
  return FORMS_GROUPS.findIndex((g) => g.includes(letterId));
}

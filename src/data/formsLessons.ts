import { LETTERS } from "@/data/letters";

/**
 * "Harf Tanıma" bölümü — haritada 29-35 arası YEDİ ayrı seviye.
 *
 * Abdulkadir (2. tur): "içeriği seviyelere yayın, hepsini birden öğretmek bilişsel yükü
 * artırıyor." 3. turda daha da ileri gitti: seviye başına TEK harf — bölüm hâlâ uzundu.
 * Böylece 1-28'deki "bir düğüm = bir kısa ders" ritmi bu bölümde de birebir korunuyor.
 */
/**
 * Seviye başına harf sayısı: 1.
 *
 * Abdulkadir (3. tur, madde 6): "Bu bölüm seviye başına çok uzun. 4 harfe indirdik
 * ama bence 1-28'de olduğu gibi seviye başına TEK harf olmalı." Can/shib'in
 * "kısa seviye, hızlı başarı" yaklaşımıyla da örtüşüyor.
 */
export const FORMS_GROUP_SIZE = 1;

/** Harf id'lerinin dilimleri (28 grup × 1 harf = 28). */
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

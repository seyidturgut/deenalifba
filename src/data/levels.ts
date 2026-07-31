import { LETTERS } from "@/data/letters";

/**
 * Seviye modeli — her harf İKİ seviyeye bölünür.
 *
 * Can (AdMob/Voodoo) → shib → Abdulkadir onayı ("option B"): çocuk başarıya
 * çabuk ulaşmalı. Tek uzun ders yerine iki kısa seviye: önce harfi öğrenip
 * yazar, sonra onunla oynayıp söyler. Toplam pratik aynı kalır — Abdulkadir'in
 * "pratik azalmasın" kaygısı da böylece karşılanır.
 */
export type LevelPart = "learn" | "play";

export type Level = {
  /** Haritadaki sıra numarası (1'den başlar) */
  no: number;
  letterId: number;
  part: LevelPart;
};

export const LEVELS: Level[] = LETTERS.flatMap((l, i) => [
  { no: i * 2 + 1, letterId: l.id, part: "learn" as LevelPart },
  { no: i * 2 + 2, letterId: l.id, part: "play" as LevelPart },
]);

/** Harf bölümündeki toplam seviye sayısı (28 harf × 2 = 56). */
export const LETTER_LEVEL_COUNT = LEVELS.length;

/** Bir harfin ilgili parçasının seviye numarası. */
export function levelNoOf(letterId: number, part: LevelPart): number {
  const idx = LETTERS.findIndex((l) => l.id === letterId);
  return idx < 0 ? 0 : idx * 2 + (part === "learn" ? 1 : 2);
}

export function levelByNo(no: number): Level | undefined {
  return LEVELS[no - 1];
}

/** Bu parçanın ilerleme anahtarı (progressStore). */
export function partKey(letterId: number, part: LevelPart) {
  return `${letterId}:${part}` as const;
}

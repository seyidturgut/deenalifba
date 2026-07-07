/**
 * Karıştırılan harf grupları (Abdulkadir geri bildirimi #6/#7).
 *
 * #6 "Noktaları Ayırt Et": aynı temel gövdeye sahip, yalnız NOKTA sayısı/yeriyle
 * ayrılan harfler (ör. ب 1 alt nokta / ت 2 üst nokta / ث 3 üst nokta). Çocuk bu
 * harfleri karıştırabiliyor; pratik onları özellikle birbirine karşı sınar.
 *
 * #7 "Benzer Sesler": Türkçe/yabancı öğrenci kulağına yakın gelen ses çiftleri
 * (Abdulkadir'in örnekleri: ث/ف, ق/ك). Şekil benzemez ama SES karışabilir.
 *
 * Her iki liste de harf id'leriyle (bkz. letters.ts) çalışır; bir harf en fazla
 * bir grupta yer alır. Listeler ihtiyaç oldukça genişletilebilir.
 */

export const DOT_CONFUSABLE_GROUPS: number[][] = [
  [2, 3, 4], // ب ت ث
  [5, 6, 7], // ج ح خ
  [8, 9], // د ذ
  [10, 11], // ر ز
  [12, 13], // س ش
  [14, 15], // ص ض
  [16, 17], // ط ظ
  [18, 19], // ع غ
  [20, 21], // ف ق
];

export const SOUND_CONFUSABLE_GROUPS: number[][] = [
  [4, 20], // ث / ف (Abdulkadir örneği)
  [21, 22], // ق / ك (Abdulkadir örneği)
  [6, 27], // ح / ه
  [9, 11], // ذ / ز
  [12, 14], // س / ص
  [15, 17], // ض / ظ
];

function siblingsOf(groups: number[][], letterId: number): number[] {
  const group = groups.find((g) => g.includes(letterId));
  if (!group) return [];
  return group.filter((id) => id !== letterId);
}

/** Bir harfin nokta-karışabilir kardeşleri (kendisi hariç). Yoksa []. */
export function dotSiblings(letterId: number): number[] {
  return siblingsOf(DOT_CONFUSABLE_GROUPS, letterId);
}

/** Bir harfin ses-karışabilir kardeşleri (kendisi hariç). Yoksa []. */
export function soundSiblings(letterId: number): number[] {
  return siblingsOf(SOUND_CONFUSABLE_GROUPS, letterId);
}

export function hasDotConfusable(letterId: number): boolean {
  return dotSiblings(letterId).length > 0;
}

export function hasSoundConfusable(letterId: number): boolean {
  return soundSiblings(letterId).length > 0;
}

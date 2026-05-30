import type { Letter } from "./types";

/**
 * 28 Arap harfi (Harf) — Elif-Ba sırasıyla, Türkçe okunuş adlarıyla.
 *
 * Not: `audioKey` ve `strokeCount` şimdilik placeholder. Tasarım/ses ekibi
 * asset'leri (ses dosyaları + stroke referansları) teslim edince güncellenecek.
 * Freemium: ilk 6 harf ücretsiz (free: true) — PROJECT PROFILE §4.C.
 */

const FREE_LETTER_COUNT = 6;

const RAW: Omit<Letter, "free">[] = [
  { id: 1, char: "ا", name: "Elif", translit: "alif", audioKey: "letter_01_elif", strokeCount: 1 },
  { id: 2, char: "ب", name: "Be", translit: "ba", audioKey: "letter_02_be", strokeCount: 2 },
  { id: 3, char: "ت", name: "Te", translit: "ta", audioKey: "letter_03_te", strokeCount: 2 },
  { id: 4, char: "ث", name: "Se", translit: "sa", audioKey: "letter_04_se", strokeCount: 2 },
  { id: 5, char: "ج", name: "Cim", translit: "cim", audioKey: "letter_05_cim", strokeCount: 2 },
  { id: 6, char: "ح", name: "Ha", translit: "ha", audioKey: "letter_06_ha", strokeCount: 1 },
  { id: 7, char: "خ", name: "Hı", translit: "hi", audioKey: "letter_07_hi", strokeCount: 2 },
  { id: 8, char: "د", name: "Dal", translit: "dal", audioKey: "letter_08_dal", strokeCount: 1 },
  { id: 9, char: "ذ", name: "Zel", translit: "zel", audioKey: "letter_09_zel", strokeCount: 2 },
  { id: 10, char: "ر", name: "Ra", translit: "ra", audioKey: "letter_10_ra", strokeCount: 1 },
  { id: 11, char: "ز", name: "Ze", translit: "ze", audioKey: "letter_11_ze", strokeCount: 2 },
  { id: 12, char: "س", name: "Sin", translit: "sin", audioKey: "letter_12_sin", strokeCount: 1 },
  { id: 13, char: "ش", name: "Şın", translit: "sin", audioKey: "letter_13_sin", strokeCount: 2 },
  { id: 14, char: "ص", name: "Sad", translit: "sad", audioKey: "letter_14_sad", strokeCount: 2 },
  { id: 15, char: "ض", name: "Dad", translit: "dad", audioKey: "letter_15_dad", strokeCount: 2 },
  { id: 16, char: "ط", name: "Tı", translit: "ti", audioKey: "letter_16_ti", strokeCount: 2 },
  { id: 17, char: "ظ", name: "Zı", translit: "zi", audioKey: "letter_17_zi", strokeCount: 2 },
  { id: 18, char: "ع", name: "Ayn", translit: "ayn", audioKey: "letter_18_ayn", strokeCount: 1 },
  { id: 19, char: "غ", name: "Gayn", translit: "gayn", audioKey: "letter_19_gayn", strokeCount: 2 },
  { id: 20, char: "ف", name: "Fe", translit: "fe", audioKey: "letter_20_fe", strokeCount: 2 },
  { id: 21, char: "ق", name: "Kaf", translit: "kaf", audioKey: "letter_21_kaf", strokeCount: 3 },
  { id: 22, char: "ك", name: "Kef", translit: "kef", audioKey: "letter_22_kef", strokeCount: 2 },
  { id: 23, char: "ل", name: "Lam", translit: "lam", audioKey: "letter_23_lam", strokeCount: 1 },
  { id: 24, char: "م", name: "Mim", translit: "mim", audioKey: "letter_24_mim", strokeCount: 2 },
  { id: 25, char: "ن", name: "Nun", translit: "nun", audioKey: "letter_25_nun", strokeCount: 2 },
  { id: 26, char: "و", name: "Vav", translit: "vav", audioKey: "letter_26_vav", strokeCount: 1 },
  { id: 27, char: "ه", name: "He", translit: "he", audioKey: "letter_27_he", strokeCount: 1 },
  { id: 28, char: "ي", name: "Ye", translit: "ye", audioKey: "letter_28_ye", strokeCount: 3 },
];

export const LETTERS: Letter[] = RAW.map((l) => ({
  ...l,
  free: l.id <= FREE_LETTER_COUNT,
}));

export const TOTAL_LETTERS = LETTERS.length;

export function getLetter(id: number): Letter | undefined {
  return LETTERS.find((l) => l.id === id);
}

export { FREE_LETTER_COUNT };

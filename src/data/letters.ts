import type { Letter } from "./types";

/**
 * 28 Arap harfi (Harf) — Elif-Ba sırasıyla, Türkçe okunuş adlarıyla.
 *
 * Not: `audioKey` ve `strokeCount` şimdilik placeholder. Tasarım/ses ekibi
 * asset'leri (ses dosyaları + stroke referansları) teslim edince güncellenecek.
 * Freemium: ilk 6 harf ücretsiz (free: true) — PROJECT PROFILE §4.C.
 */

const FREE_LETTER_COUNT = 6;

// Adlar STANDART ARAPÇA (Türkçe değil) — hedef kitle yurt dışı Türk olmayan Müslüman
// çocuk; sesler de standart Arapça (btn_1..28). NOT: bu `name`/`translit` artık çocuğa
// ekranda GÖSTERİLMEZ (Ismail: transliterasyona dayanma, Arapça harf + ses). Yalnız
// kod/iç kullanım için doğru tutulur.
const RAW: Omit<Letter, "free">[] = [
  { id: 1, char: "ا", name: "Alif", translit: "alif", audioKey: "letter_01_alif", strokeCount: 1 },
  { id: 2, char: "ب", name: "Bā", translit: "ba", audioKey: "letter_02_ba", strokeCount: 2 },
  { id: 3, char: "ت", name: "Tā", translit: "ta", audioKey: "letter_03_ta", strokeCount: 2 },
  { id: 4, char: "ث", name: "Thā", translit: "tha", audioKey: "letter_04_tha", strokeCount: 2 },
  { id: 5, char: "ج", name: "Jīm", translit: "jim", audioKey: "letter_05_jim", strokeCount: 2 },
  { id: 6, char: "ح", name: "Ḥā", translit: "haa", audioKey: "letter_06_haa", strokeCount: 1 },
  { id: 7, char: "خ", name: "Khā", translit: "kha", audioKey: "letter_07_kha", strokeCount: 2 },
  { id: 8, char: "د", name: "Dāl", translit: "dal", audioKey: "letter_08_dal", strokeCount: 1 },
  { id: 9, char: "ذ", name: "Dhāl", translit: "dhal", audioKey: "letter_09_dhal", strokeCount: 2 },
  { id: 10, char: "ر", name: "Rā", translit: "ra", audioKey: "letter_10_ra", strokeCount: 1 },
  { id: 11, char: "ز", name: "Zāy", translit: "zay", audioKey: "letter_11_zay", strokeCount: 2 },
  { id: 12, char: "س", name: "Sīn", translit: "sin", audioKey: "letter_12_sin", strokeCount: 1 },
  { id: 13, char: "ش", name: "Shīn", translit: "shin", audioKey: "letter_13_shin", strokeCount: 2 },
  { id: 14, char: "ص", name: "Ṣād", translit: "sad", audioKey: "letter_14_sad", strokeCount: 2 },
  { id: 15, char: "ض", name: "Ḍād", translit: "dad", audioKey: "letter_15_dad", strokeCount: 2 },
  { id: 16, char: "ط", name: "Ṭā", translit: "taa", audioKey: "letter_16_taa", strokeCount: 2 },
  { id: 17, char: "ظ", name: "Ẓā", translit: "zaa", audioKey: "letter_17_zaa", strokeCount: 2 },
  { id: 18, char: "ع", name: "ʿAyn", translit: "ayn", audioKey: "letter_18_ayn", strokeCount: 1 },
  { id: 19, char: "غ", name: "Ghayn", translit: "ghayn", audioKey: "letter_19_ghayn", strokeCount: 2 },
  { id: 20, char: "ف", name: "Fā", translit: "fa", audioKey: "letter_20_fa", strokeCount: 2 },
  { id: 21, char: "ق", name: "Qāf", translit: "qaf", audioKey: "letter_21_qaf", strokeCount: 3 },
  { id: 22, char: "ك", name: "Kāf", translit: "kaf", audioKey: "letter_22_kaf", strokeCount: 2 },
  { id: 23, char: "ل", name: "Lām", translit: "lam", audioKey: "letter_23_lam", strokeCount: 1 },
  { id: 24, char: "م", name: "Mīm", translit: "mim", audioKey: "letter_24_mim", strokeCount: 2 },
  { id: 25, char: "ن", name: "Nūn", translit: "nun", audioKey: "letter_25_nun", strokeCount: 2 },
  { id: 26, char: "و", name: "Wāw", translit: "waw", audioKey: "letter_26_waw", strokeCount: 1 },
  { id: 27, char: "ه", name: "Hā", translit: "ha", audioKey: "letter_27_ha", strokeCount: 1 },
  { id: 28, char: "ي", name: "Yā", translit: "ya", audioKey: "letter_28_ya", strokeCount: 3 },
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

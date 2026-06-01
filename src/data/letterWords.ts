/**
 * Harf → Kelime/Nesne eşlemesi (WordMatch oyunu).
 * Her harf, otantik bir Arapça-kelime nesnesiyle eşlenir; etiket EN (birincil) + TR.
 * İllüstrasyonlar AI ile üretilip assets/illustrations/words/ altına konur.
 *
 * Faz B: WORD_WORDS tablosu ve WORD_IMAGES doldurulacak. Görsel olmayan harfler
 * için `word` etkinliği ders havuzundan otomatik atlanır (bkz. data/lesson.ts).
 */

export type LetterWord = { en: string; tr: string };

/** Harf id → { en, tr } etiketleri (Faz B'de doldurulur). */
export const LETTER_WORDS: Record<number, LetterWord> = {};

/** Harf id → illüstrasyon require (Faz B'de doldurulur). */
export const WORD_IMAGES: Record<number, number> = {};

/** Bu harf için kelime görseli mevcut mu? (yoksa word etkinliği atlanır) */
export function hasWordImage(letterId: number): boolean {
  return !!WORD_IMAGES[letterId];
}

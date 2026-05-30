import type { LetterSrsState, QualityScore } from "@/data/types";

/**
 * Modifiye SM-2 Aralıklı Tekrar Algoritması (PROJECT PROFILE §3.B).
 *
 * Standart SM-2'den farkları:
 *  - Kalite skoru 0-3 aralığında (klasik SM-2: 0-5). 0-3'ü dahili olarak
 *    0-5'e ölçekleriz, böylece formüller korunur ama çocuk-dostu basit
 *    skorlama (yanlış / zor / iyi / mükemmel) kullanılır.
 *  - quality < 2 "başarısız" sayılır → tekrar sıfırlanır, harf yakında
 *    "Recall" fazına geri düşer (cezalandırma değil, nazik tekrar).
 *
 * Saf fonksiyon: yan etkisiz, test edilebilir. Zaman dışarıdan (now) verilir.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MIN_EASE = 1.3;

/** 0-3 kalite skorunu klasik SM-2'nin 0-5 ölçeğine eşler. */
function scaleQuality(q: QualityScore): number {
  // 0→1, 1→3, 2→4, 3→5  (tamamen yanlış 0 değil 1 alır ki ease aşırı düşmesin)
  return [1, 3, 4, 5][q];
}

export function createInitialSrsState(
  letterId: number,
  now: number
): LetterSrsState {
  return {
    letterId,
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    dueAt: now, // hemen çalışılabilir
    lastReviewedAt: null,
  };
}

/**
 * Bir tekrar sonrası yeni SRS durumunu hesaplar.
 * @param state mevcut durum
 * @param quality 0-3 kalite skoru
 * @param now epoch ms (test edilebilirlik için dışarıdan verilir)
 */
export function reviewLetter(
  state: LetterSrsState,
  quality: QualityScore,
  now: number
): LetterSrsState {
  const q5 = scaleQuality(quality);

  // Ease faktörü güncellemesi (klasik SM-2 formülü)
  let easeFactor =
    state.easeFactor + (0.1 - (5 - q5) * (0.08 + (5 - q5) * 0.02));
  if (easeFactor < MIN_EASE) easeFactor = MIN_EASE;

  let repetitions: number;
  let intervalDays: number;

  if (quality < 2) {
    // Başarısız: tekrarı sıfırla, yarın tekrar göster (nazik tekrar)
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions = state.repetitions + 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(state.intervalDays * easeFactor);
    }
  }

  return {
    letterId: state.letterId,
    repetitions,
    easeFactor,
    intervalDays,
    dueAt: now + intervalDays * MS_PER_DAY,
    lastReviewedAt: now,
  };
}

/** Vadesi gelmiş (tekrar edilmesi gereken) harfleri filtreler. */
export function getDueLetters(
  states: LetterSrsState[],
  now: number
): LetterSrsState[] {
  return states
    .filter((s) => s.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt);
}

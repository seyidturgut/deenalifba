/** Alif — temel domain tipleri */

/** 4 adımlı öğrenme döngüsünün adımları (PROJECT PROFILE §3.A) — legacy/SRS göçü. */
export type LearningStep = "trace" | "puzzle" | "sounds" | "recall";

export const LEARNING_STEPS: LearningStep[] = [
  "trace",
  "puzzle",
  "sounds",
  "recall",
];

/**
 * Öğrenme döngüsü v2 etkinlik türleri.
 * Pedagoji: önce ÖĞRET (intro + trace), sonra PRATİK (spot/sounds/word/catch), sonra recall.
 */
export type ActivityKind = "intro" | "trace" | "spot" | "sounds" | "word" | "catch" | "recall";

/** Tek bir Arap harfi (Harf). 28 harf — bkz. letters.ts */
export type Letter = {
  /** 1..28 sıralı kimlik */
  id: number;
  /** İzole (yalın) form, ör. "ا" */
  char: string;
  /** Türkçe okunuş adı, ör. "Elif" */
  name: string;
  /** Latin transliterasyon (yalnız iç kullanım / debug) */
  translit: string;
  /** Gömülü ses dosyası anahtarı (asset gelince eşlenecek) */
  audioKey: string;
  /** Stroke (çizgi) sayısı — trace doğrulaması için (asset gelince netleşir) */
  strokeCount: number;
  /**
   * Ücretsiz katmanda erişilebilir mi?
   * Freemium kuralı: ilk 6 harf serbest (PROJECT PROFILE §4.C)
   */
  free: boolean;
};

/** Bir harfin SM-2 aralıklı tekrar durumu (PROJECT PROFILE §3.B) */
export type LetterSrsState = {
  letterId: number;
  /** Tekrar sayısı (ardışık başarılı) */
  repetitions: number;
  /** Kolaylık faktörü (ease factor), başlangıç 2.5 */
  easeFactor: number;
  /** Bir sonraki tekrara kadar gün cinsinden aralık */
  intervalDays: number;
  /** Bir sonraki tekrarın zamanı (epoch ms) */
  dueAt: number;
  /** Son güncelleme (epoch ms) */
  lastReviewedAt: number | null;
};

/** Kalite skoru 0-3 (PROJECT PROFILE §3.B) */
export type QualityScore = 0 | 1 | 2 | 3;

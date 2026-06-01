import type { ActivityKind } from "@/data/types";
import { hasWordImage } from "@/data/letterWords";
import { images } from "@/lib/images";
import { hasLetterSound } from "@/lib/sfx";

/**
 * Öğrenme döngüsü v2 — her harf için DEĞİŞKEN ders (2-3 mini-oyun).
 * Sabit 4 adım yerine havuzdan deterministik (harfe göre) seçim → tekdüzelik kırılır.
 */

// Pratik (pekiştirme) oyun havuzu — öğretmeden SONRA gelir
const PRACTICE: ActivityKind[] = ["spot", "sounds", "word", "catch"];

/**
 * Harf için ders etkinlik listesini üretir (deterministik).
 * PEDAGOJİ: önce ÖĞRET (intro → trace), sonra 1-2 PRATİK (havuzdan, harfe göre
 * değişir → tekdüzelik kırılır), önceki harf varsa sonda kısa TEKRAR.
 */
export function buildLesson(letterId: number): ActivityKind[] {
  const lesson: ActivityKind[] = ["intro", "trace"];

  // Uygun pratik oyunları
  const practice = PRACTICE.filter((k) => {
    if (k === "sounds" || k === "catch") return hasLetterSound(letterId);
    if (k === "word") return hasWordImage(letterId);
    return true; // spot her zaman uygun
  });

  // 1-2 pratik, harfe göre kaydırılarak (ardışık harfler farklı oyun alır)
  if (practice.length > 0) {
    const n = Math.min(2, practice.length);
    const start = (letterId - 1) % practice.length;
    for (let i = 0; i < n; i++) lesson.push(practice[(start + i) % practice.length]);
  }

  // Önceki harf varsa sonda kısa tekrar (SM-2)
  if (letterId > 1) lesson.push("recall");
  return lesson;
}

/** Etkinlik → başlık i18n anahtarı + ikon (StepBar & banner). */
export const ACTIVITY_META: Record<ActivityKind, { labelKey: string; icon?: number; emoji?: string }> = {
  intro: { labelKey: "learn.intro", emoji: "👋" },
  trace: { labelKey: "learn.trace", icon: images.stepTrace },
  spot: { labelKey: "learn.puzzle", icon: images.stepPuzzle },
  sounds: { labelKey: "learn.sounds", icon: images.stepSounds },
  recall: { labelKey: "learn.recall", icon: images.stepRecall },
  word: { labelKey: "learn.word", emoji: "📖" },
  catch: { labelKey: "learn.catch", emoji: "🫧" },
};

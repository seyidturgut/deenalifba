import type { ActivityKind } from "@/data/types";
import { hasWordImage } from "@/data/letterWords";
import { images } from "@/lib/images";
import { hasLetterSound } from "@/lib/sfx";

/**
 * Öğrenme döngüsü v2 — her harf için DEĞİŞKEN ders (2-3 mini-oyun).
 * Sabit 4 adım yerine havuzdan deterministik (harfe göre) seçim → tekdüzelik kırılır.
 */

// Pratik (pekiştirme) oyun havuzu — öğretmeden SONRA gelir.
// Hepsi YAZISIZ + sesli; "word" Faz B (illüstrasyon gelince).
const PRACTICE: ActivityKind[] = ["hearTap", "match", "drag", "balloon", "catch", "word"];

/**
 * Harf için ders etkinlik listesini üretir (deterministik).
 * PEDAGOJİ: önce ÖĞRET (intro → trace), sonra 1-2 PRATİK (havuzdan, harfe göre
 * değişir → tekdüzelik kırılır), önceki harf varsa sonda kısa TEKRAR.
 */
export function buildLesson(letterId: number): ActivityKind[] {
  // Önce ÖĞRET (intro → boya/trace: gerçek glif konturunu parmakla boyama),
  // sonra 2 değişen yazısız oyun, sonra tekrar.
  const lesson: ActivityKind[] = ["intro", "trace"];

  // Uygun pratik oyunları — sesli oyunlar harf sesi gerektirir
  const practice = PRACTICE.filter((k) => {
    if (k === "word") return hasWordImage(letterId);
    return hasLetterSound(letterId); // hearTap/match/drag/balloon/catch sesli
  });

  // 2 pratik, harfe göre kaydırılarak (ardışık harfler farklı oyun alır → tekdüzelik yok)
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
  intro: { labelKey: "learn.intro", icon: images.stepIntro },
  trace: { labelKey: "learn.trace", icon: images.stepTrace },
  hearTap: { labelKey: "learn.hearTap", icon: images.stepHearTap },
  match: { labelKey: "learn.match", icon: images.stepMatch },
  drag: { labelKey: "learn.drag", icon: images.stepDrag },
  balloon: { labelKey: "learn.balloon", icon: images.stepBalloon },
  catch: { labelKey: "learn.catch", icon: images.stepCatch },
  word: { labelKey: "learn.word", emoji: "📖" },
  recall: { labelKey: "learn.recall", icon: images.stepRecall },
};

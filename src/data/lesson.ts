import { hasDotConfusable, hasSoundConfusable } from "@/data/confusables";
import type { LevelPart } from "@/data/levels";
import type { ActivityKind } from "@/data/types";
import { hasWordImage } from "@/data/letterWords";
import { images } from "@/lib/images";
import { hasLetterSound } from "@/lib/sfx";
import { LETTERS } from "@/data/letters";
import { useProgressStore } from "@/stores/progressStore";

/**
 * Öğrenme döngüsü v2 — her harf için DEĞİŞKEN ders (2-3 mini-oyun).
 * Sabit 4 adım yerine havuzdan deterministik (harfe göre) seçim → tekdüzelik kırılır.
 */

// Pratik (pekiştirme) oyun havuzu — öğretmeden SONRA gelir.
// Hepsi YAZISIZ + sesli; "word" Faz B (illüstrasyon gelince).
// "dots"/"confuseSound" yalnız karışabilir kardeşi OLAN harflerde havuza girer (Abdulkadir #6/#7).
const PRACTICE: ActivityKind[] = ["hearTap", "match", "drag", "balloon", "catch", "word", "dots", "confuseSound"];

/**
 * Mini-oyunlar KADEMELİ açılır (Can — AdMob/Voodoo, Sohail üzerinden):
 * "İlk harfte beş mini-oyun fazla; ilk seviye uygulamanın nasıl oynandığını
 * öğretmeli. Yeni oyunlar ilerleme ÖDÜLÜ olarak açılsın."
 *
 * 1. harf yalnız öğret → boya → konuş. Sonraki her harfte bir oyun daha açılır ve
 * çocuk "Yeni oyun!" anını yaşar.
 *
 * ⚠️ BURASI TEK AYAR NOKTASI. Abdulkadir müfredat açısından "daha erken/geç olsun"
 * derse yalnız bu tablodaki sayılar değişir, kodun geri kalanına dokunulmaz.
 */
export const GAME_UNLOCKS: Partial<Record<ActivityKind, number>> = {
  hearTap: 2,
  match: 3,
  balloon: 4,
  catch: 5,
  drag: 6,
  word: 7,
  dots: 8,
  confuseSound: 9,
};

/** Bu oyun bu harfte açık mı? (tabloda yoksa hep açık) */
export function isGameUnlocked(kind: ActivityKind, letterId: number): boolean {
  const from = GAME_UNLOCKS[kind];
  return from === undefined || letterId >= from;
}

/** Tam bu harfte İLK KEZ açılan oyun (varsa) — "Yeni oyun!" anını tetikler. */
export function newlyUnlockedGame(letterId: number): ActivityKind | undefined {
  return (Object.keys(GAME_UNLOCKS) as ActivityKind[]).find((k) => GAME_UNLOCKS[k] === letterId);
}

/**
 * Bir seviyede kaç pratik oyunu olacağı.
 *
 * shib (Can'ın oyun tasarımı notu üzerine): "İlk seviyelerde tek oyun olsun,
 * sonra iki, sonra üç — çocuk başarıya çabuk ulaşsın." İlk harflerde tek oyun
 * hem bu hızlı başarı hissini verir hem yeni mekanikleri tek tek tanıtır.
 */
function practiceCount(letterId: number): number {
  if (letterId <= 2) return 1;
  if (letterId <= 6) return 2;
  return 3;
}

/**
 * Harf için ders etkinlik listesini üretir (deterministik).
 *
 * Her harf İKİ seviyeye bölünür (data/levels.ts):
 *   learn → tanı + boya      (öğren ve yaz)
 *   play  → oyunlar + konuş  (pratik et ve söyle)
 * Tek uzun ders yerine iki kısa seviye; toplam pratik aynı kalır.
 */
export function buildLesson(letterId: number, part: LevelPart = "learn"): ActivityKind[] {
  if (part === "learn") return ["intro", "trace"];

  const lesson: ActivityKind[] = [];

  // Uygun pratik oyunları — sesli oyunlar harf sesi gerektirir
  const practice = PRACTICE.filter((k) => {
    if (!isGameUnlocked(k, letterId)) return false; // henüz açılmadı (kademeli açılım)
    if (k === "word") return hasWordImage(letterId);
    if (k === "dots") return hasLetterSound(letterId) && hasDotConfusable(letterId);
    if (k === "confuseSound") return hasLetterSound(letterId) && hasSoundConfusable(letterId);
    return hasLetterSound(letterId); // hearTap/match/drag/balloon/catch sesli
  });

  // Harfe göre kaydırılarak seç (ardışık harfler farklı oyun alır → tekdüzelik yok)
  if (practice.length > 0) {
    const n = Math.min(practiceCount(letterId), practice.length);
    const start = (letterId - 1) % practice.length;
    for (let i = 0; i < n; i++) lesson.push(practice[(start + i) % practice.length]);
  }

  /**
   * Önceki harf varsa sonda kısa tekrar (SM-2).
   *
   * Ama TEKRAR EDİLECEK harf yoksa adımı hiç ekleme: Abdulkadir'in ekran kaydında
   * "Tekrar" ekranı açılıp "henüz tekrar edilecek bir şey yok" deyip hemen kapanıyor,
   * talimatı da boşuna çalıp sonraki adımın talimatına biniyordu.
   */
  const hasEarlier = LETTERS.some(
    (l) => l.id < letterId && useProgressStore.getState().isLetterComplete(l.id)
  );
  if (letterId > 1 && hasEarlier) lesson.push("recall");

  // Kaydet & karşılaştır — Abdulkadir video: dinleme/yazma/pratik BİTMEDEN konuşma
  // istenmemeli, dersin GERÇEK son adımı olsun (her harfte).
  lesson.push("speak");
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
  dots: { labelKey: "learn.dots", emoji: "🔍" },
  confuseSound: { labelKey: "learn.confuseSound", emoji: "🎧" },
  recall: { labelKey: "learn.recall", icon: images.stepRecall },
  speak: { labelKey: "learn.speak", icon: images.icMic },
};

import { FREE_LETTER_COUNT } from "@/data/letters";

/**
 * Freemium & Monetizasyon Kapısı (PROJECT PROFILE §4.C).
 *
 * - Ücretsiz katman: ilk 6 harfe tam erişim.
 * - 6. harften sonra: abone olmayan kullanıcılar GÜNDE tam 1 seviye açabilir.
 * - Abone: sınırsız.
 *
 * Saf mantık; tarih dışarıdan (now) verilir → test edilebilir.
 * Abonelik durumu sonraki fazda RevenueCat ile beslenecek.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type UnlockContext = {
  isSubscribed: boolean;
  /** En son "günlük kilit açma" zamanı (epoch ms) veya null */
  lastDailyUnlockAt: number | null;
  now: number;
};

export type UnlockDecision =
  | { allowed: true; reason: "free_tier" | "subscribed" | "daily_quota" }
  | { allowed: false; reason: "daily_limit_reached"; nextUnlockAt: number };

/**
 * Verilen harfin (1-tabanlı id) açılıp açılamayacağına karar verir.
 */
export function canUnlockLetter(
  letterId: number,
  ctx: UnlockContext
): UnlockDecision {
  if (letterId <= FREE_LETTER_COUNT) {
    return { allowed: true, reason: "free_tier" };
  }
  if (ctx.isSubscribed) {
    return { allowed: true, reason: "subscribed" };
  }
  // Abone değil + ücretsiz sınırın ötesinde → günde 1 hak
  if (ctx.lastDailyUnlockAt === null) {
    return { allowed: true, reason: "daily_quota" };
  }
  const nextUnlockAt = ctx.lastDailyUnlockAt + MS_PER_DAY;
  if (ctx.now >= nextUnlockAt) {
    return { allowed: true, reason: "daily_quota" };
  }
  return { allowed: false, reason: "daily_limit_reached", nextUnlockAt };
}

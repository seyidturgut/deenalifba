import { FREE_LETTER_COUNT } from "@/data/letters";
import { canUnlockLetter } from "@/lib/freemium";

/**
 * Freemium kapısı — para tarafı. Bir yöne kayarsa ücretli içerik bedava açılır,
 * diğer yöne kayarsa çocuk ilerleyemez ve ebeveyn parasının karşılığını alamaz.
 */
const GUN = 24 * 60 * 60 * 1000;
const SIMDI = 1_700_000_000_000;

describe("freemium kapısı", () => {
  it("ilk altı harf herkese açık", () => {
    for (let id = 1; id <= FREE_LETTER_COUNT; id++) {
      expect(canUnlockLetter(id, { isSubscribed: false, lastDailyUnlockAt: null, now: SIMDI })).toEqual({
        allowed: true,
        reason: "free_tier",
      });
    }
  });

  it("abone için sınır yok", () => {
    expect(canUnlockLetter(28, { isSubscribed: true, lastDailyUnlockAt: SIMDI, now: SIMDI }).allowed).toBe(true);
  });

  it("abone olmayan ilk kez günlük hakkını kullanabilir", () => {
    const d = canUnlockLetter(7, { isSubscribed: false, lastDailyUnlockAt: null, now: SIMDI });
    expect(d).toEqual({ allowed: true, reason: "daily_quota" });
  });

  it("aynı gün ikinci açılış reddedilir ve ne zaman açılacağı söylenir", () => {
    const d = canUnlockLetter(8, { isSubscribed: false, lastDailyUnlockAt: SIMDI, now: SIMDI + 1000 });
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.nextUnlockAt).toBe(SIMDI + GUN);
  });

  it("bir gün geçince tekrar açılır", () => {
    expect(canUnlockLetter(8, { isSubscribed: false, lastDailyUnlockAt: SIMDI, now: SIMDI + GUN }).allowed).toBe(true);
  });

  it("bir saniye eksikken hâlâ kapalı", () => {
    expect(canUnlockLetter(8, { isSubscribed: false, lastDailyUnlockAt: SIMDI, now: SIMDI + GUN - 1 }).allowed).toBe(false);
  });
});

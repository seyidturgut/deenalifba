import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createInitialSrsState, getDueLetters, reviewLetter } from "@/algorithms/sm2";
import type { LetterSrsState, QualityScore } from "@/data/types";
import { zustandMMKVStorage } from "@/db/storage";

/**
 * Aralıklı tekrar (SM-2) durumu — harf id → LetterSrsState.
 * Saf SM-2 mantığı `@/algorithms/sm2`'den gelir; burada yalnız kalıcılık (MMKV).
 * (database.ts SQLite şeması native'de ileride bu store'u besleyebilir.)
 */
type SrsStore = {
  byLetter: Record<number, LetterSrsState>;
  /** Bir tekrar denemesini işle (yoksa başlat), SM-2 ile günceller. */
  grade: (letterId: number, quality: QualityScore, now: number) => void;
  /** Verilen harfler arasından vadesi gelmişleri (id) döndürür. */
  dueAmong: (ids: number[], now: number) => number[];
};

export const useSrsStore = create<SrsStore>()(
  persist(
    (set, get) => ({
      byLetter: {},
      grade: (letterId, quality, now) =>
        set((s) => {
          const cur = s.byLetter[letterId] ?? createInitialSrsState(letterId, now);
          return { byLetter: { ...s.byLetter, [letterId]: reviewLetter(cur, quality, now) } };
        }),
      dueAmong: (ids, now) => {
        const states = ids
          .map((id) => get().byLetter[id])
          .filter((x): x is LetterSrsState => !!x);
        return getDueLetters(states, now).map((s) => s.letterId);
      },
    }),
    {
      name: "alif-srs",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

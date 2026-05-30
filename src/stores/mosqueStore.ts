import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandMMKVStorage } from "@/db/storage";

/**
 * Meta-oyun: "Camini İnşa Et" (PROJECT PROFILE §3.C).
 *
 * İlerleme tabanlı durum motoru: harf/ders tamamlandıkça modüler cami
 * parçaları açılır (minare, kubbe, çini, bahçe). Bu store yalnız yerel
 * durumu tutar; görsel ödül tetikleme UI tarafında dinlenir.
 */

export type MosquePart =
  | "foundation"
  | "walls"
  | "dome"
  | "minaret"
  | "tiles"
  | "garden"
  | "crescent";

/** Kaç harf tamamlanınca hangi parça açılır (eşik tablosu). */
export const MOSQUE_UNLOCK_THRESHOLDS: { part: MosquePart; lettersRequired: number }[] = [
  { part: "foundation", lettersRequired: 1 },
  { part: "walls", lettersRequired: 4 },
  { part: "dome", lettersRequired: 8 },
  { part: "minaret", lettersRequired: 12 },
  { part: "tiles", lettersRequired: 18 },
  { part: "garden", lettersRequired: 24 },
  { part: "crescent", lettersRequired: 28 },
];

type MosqueState = {
  unlockedParts: MosquePart[];
  /** En son açılan parça (UI kutlama animasyonunu tetiklemek için) */
  lastUnlocked: MosquePart | null;

  /** Tamamlanan harf sayısına göre eşikleri değerlendirir, yeni parçaları açar. */
  syncWithProgress: (completedLetterCount: number) => MosquePart[];
  clearLastUnlocked: () => void;
};

export const useMosqueStore = create<MosqueState>()(
  persist(
    (set, get) => ({
      unlockedParts: [],
      lastUnlocked: null,

      syncWithProgress: (completedLetterCount) => {
        const already = new Set(get().unlockedParts);
        const newlyUnlocked = MOSQUE_UNLOCK_THRESHOLDS.filter(
          (t) => completedLetterCount >= t.lettersRequired && !already.has(t.part)
        ).map((t) => t.part);

        if (newlyUnlocked.length === 0) return [];

        set((s) => ({
          unlockedParts: [...s.unlockedParts, ...newlyUnlocked],
          lastUnlocked: newlyUnlocked[newlyUnlocked.length - 1],
        }));
        return newlyUnlocked;
      },

      clearLastUnlocked: () => set({ lastUnlocked: null }),
    }),
    {
      name: "alif-mosque",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

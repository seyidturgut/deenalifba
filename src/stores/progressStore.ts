import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { LEARNING_STEPS, type LearningStep } from "@/data/types";
import { zustandMMKVStorage } from "@/db/storage";

/**
 * İlerleme durumu: hangi harflerin/adımların tamamlandığı + freemium günlük kilit.
 * (SM-2 tekrar durumu ayrıca SQLite'ta tutulur; bu store hızlı UI bayrakları içindir.)
 */

/** "letterId:step" anahtarı, ör. "3:trace" */
type StepKey = `${number}:${LearningStep}`;

type ProgressState = {
  /** Tamamlanmış adımlar kümesi (legacy / etkinlik logu) */
  completedSteps: Record<StepKey, true>;
  /** Tamamlanmış harfler (ders v2 — harf-seviyesi tamamlanma) */
  completedLetters: number[];
  /** Açılmış (erişilebilir) harf id'leri */
  unlockedLetters: number[];
  /** Freemium: en son günlük kilit açma zamanı (epoch ms) */
  lastDailyUnlockAt: number | null;

  isStepComplete: (letterId: number, step: LearningStep) => boolean;
  completeStep: (letterId: number, step: LearningStep) => void;
  /** Bir harfin dersini tamamlandı işaretler (ders v2). */
  completeLetter: (letterId: number) => void;
  isLetterComplete: (letterId: number) => boolean;
  unlockLetter: (letterId: number, now: number, countsAsDaily: boolean) => void;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedSteps: {},
      completedLetters: [],
      unlockedLetters: [1], // ilk harf baştan açık
      lastDailyUnlockAt: null,

      isStepComplete: (letterId, step) =>
        get().completedSteps[`${letterId}:${step}`] === true,

      completeStep: (letterId, step) =>
        set((s) => ({
          completedSteps: {
            ...s.completedSteps,
            [`${letterId}:${step}` as StepKey]: true,
          },
        })),

      completeLetter: (letterId) =>
        set((s) => {
          const cur = s.completedLetters ?? [];
          return cur.includes(letterId) ? s : { completedLetters: [...cur, letterId] };
        }),

      isLetterComplete: (letterId) => {
        if ((get().completedLetters ?? []).includes(letterId)) return true;
        // Legacy göç: eski 4-adımın tamamı bitmişse tamam say
        const steps = get().completedSteps;
        return LEARNING_STEPS.every((step) => steps[`${letterId}:${step}`] === true);
      },

      unlockLetter: (letterId, now, countsAsDaily) =>
        set((s) => ({
          unlockedLetters: s.unlockedLetters.includes(letterId)
            ? s.unlockedLetters
            : [...s.unlockedLetters, letterId],
          lastDailyUnlockAt: countsAsDaily ? now : s.lastDailyUnlockAt,
        })),
    }),
    {
      name: "alif-progress",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

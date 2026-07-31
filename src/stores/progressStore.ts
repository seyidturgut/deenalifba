import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { LETTERS } from "@/data/letters";
import { partKey, type LevelPart } from "@/data/levels";
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
  /**
   * Tamamlanmış SEVİYE parçaları ("3:learn", "3:play").
   * Her harf iki seviyeye bölündü (bkz. data/levels.ts). Eski kayıtlarda bu alan
   * yok — o zaman completedLetters'a bakılır, yani 12 harfi bitirmiş bir çocuk
   * ilk 24 seviyeyi tamamlanmış bulur, ilerlemesi sıfırlanmaz.
   */
  completedParts: string[];
  /** Açılmış (erişilebilir) harf id'leri */
  unlockedLetters: number[];
  /** Freemium: en son günlük kilit açma zamanı (epoch ms) */
  lastDailyUnlockAt: number | null;

  isStepComplete: (letterId: number, step: LearningStep) => boolean;
  completeStep: (letterId: number, step: LearningStep) => void;
  /** Bir harfin dersini tamamlandı işaretler (ders v2). */
  completeLetter: (letterId: number) => void;
  isLetterComplete: (letterId: number) => boolean;
  /** Seviye parçası tamamlandı mı? (eski kayıtlarda harf tamamsa iki parça da tamamdır) */
  isPartComplete: (letterId: number, part: LevelPart) => boolean;
  completePart: (letterId: number, part: LevelPart) => void;
  unlockLetter: (letterId: number, now: number, countsAsDaily: boolean) => void;
  /** TEST/QA: 28 harfin tamamını açar ve tamamlanmış işaretler (Ayarlar — ekip için). */
  unlockAllForTesting: () => void;
  /** Tüm ilerlemeyi başa al (Ayarlar "Yeni Oyun" — test). */
  reset: () => void;
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      completedSteps: {},
      completedLetters: [],
      completedParts: [],
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

      isPartComplete: (letterId, part) => {
        if ((get().completedParts ?? []).includes(partKey(letterId, part))) return true;
        // Göç: bu harf eski modelde tamamlanmışsa iki parçası da tamam sayılır.
        return (get().completedLetters ?? []).includes(letterId);
      },

      completePart: (letterId, part) =>
        set((s) => {
          const key = partKey(letterId, part);
          const cur = s.completedParts ?? [];
          if (cur.includes(key)) return s;
          const next = [...cur, key];
          // İki parça da bitti → harf tamamlandı (cami/ödüller harfe bağlı kalıyor)
          const both = next.includes(partKey(letterId, "learn")) && next.includes(partKey(letterId, "play"));
          const letters = s.completedLetters ?? [];
          return {
            completedParts: next,
            completedLetters: both && !letters.includes(letterId) ? [...letters, letterId] : letters,
          };
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

      // TEST/QA (Sohail/Abdulkadir/Oliver): sonraki bölümleri denemek için 28'i beklemek
      // zorunda kalmasınlar. Yalnız Ayarlar'daki test aracından çağrılır.
      unlockAllForTesting: () => {
        const all = LETTERS.map((l) => l.id);
        set({
          completedLetters: all,
          unlockedLetters: all,
          completedParts: all.flatMap((id) => [partKey(id, "learn"), partKey(id, "play")]),
        });
      },

      reset: () =>
        set({ completedSteps: {}, completedLetters: [], completedParts: [], unlockedLetters: [1], lastDailyUnlockAt: null }),
    }),
    {
      name: "alif-progress",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

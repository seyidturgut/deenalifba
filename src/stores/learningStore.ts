import { create } from "zustand";

import { LEARNING_STEPS, type LearningStep } from "@/data/types";

/**
 * Aktif öğrenme oturumunun GEÇİCİ durumu (kalıcı DEĞİL).
 * Hangi harfte, hangi adımdayız — döngü içi navigasyon için.
 * Kalıcı ilerleme progressStore + SQLite'ta tutulur.
 */
type LearningState = {
  activeLetterId: number | null;
  activeStepIndex: number;

  startLetter: (letterId: number) => void;
  nextStep: () => boolean; // true: ilerledi, false: döngü bitti
  reset: () => void;
};

export const useLearningStore = create<LearningState>((set, get) => ({
  activeLetterId: null,
  activeStepIndex: 0,

  startLetter: (letterId) => set({ activeLetterId: letterId, activeStepIndex: 0 }),

  nextStep: () => {
    const { activeStepIndex } = get();
    if (activeStepIndex < LEARNING_STEPS.length - 1) {
      set({ activeStepIndex: activeStepIndex + 1 });
      return true;
    }
    return false;
  },

  reset: () => set({ activeLetterId: null, activeStepIndex: 0 }),
}));

/** Mevcut adımı seçici olarak döndürür (store dışında türetilen değer). */
export function selectActiveStep(s: LearningState): LearningStep {
  return LEARNING_STEPS[s.activeStepIndex];
}

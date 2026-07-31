import { create } from "zustand";

import { buildLesson } from "@/data/lesson";
import type { LevelPart } from "@/data/levels";
import type { ActivityKind } from "@/data/types";

/**
 * Aktif öğrenme oturumunun GEÇİCİ durumu (kalıcı DEĞİL).
 * Ders v2: sabit adım yerine harfe göre değişen etkinlik listesi.
 */
type LearningState = {
  activeLetterId: number | null;
  /** Bu oturumda oynanan seviye parçası (öğren / oyna) */
  activePart: LevelPart;
  activities: ActivityKind[];
  activeIndex: number;

  startLetter: (letterId: number, part?: LevelPart) => void;
  nextStep: () => boolean; // true: ilerledi, false: ders bitti
  reset: () => void;
};

export const useLearningStore = create<LearningState>((set, get) => ({
  activeLetterId: null,
  activePart: "learn",
  activities: [],
  activeIndex: 0,

  startLetter: (letterId, part = "learn") =>
    set({ activeLetterId: letterId, activePart: part, activities: buildLesson(letterId, part), activeIndex: 0 }),

  nextStep: () => {
    const { activeIndex, activities } = get();
    if (activeIndex < activities.length - 1) {
      set({ activeIndex: activeIndex + 1 });
      return true;
    }
    return false;
  },

  reset: () => set({ activeLetterId: null, activePart: "learn", activities: [], activeIndex: 0 }),
}));

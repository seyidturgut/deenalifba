import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandMMKVStorage } from "@/db/storage";

/**
 * "Harf Tanıma" bölümü ilerlemesi (Abdulkadir'in müfredat önerisi — Harakat'tan ÖNCE).
 * 28 harf bitince açılır; her tur bir harfin pozisyonel formunu tanıtır.
 * Yalnız CİHAZDA (offline-first).
 */
type FormsState = {
  /** Bu bölümde tamamlanmış harf id'leri */
  completed: number[];
  /** Bölümün açılış anlatımı (Pırıl sesli) izlendi mi — yalnız ilk girişte gösterilir */
  introSeen: boolean;
  complete: (letterId: number) => void;
  isComplete: (letterId: number) => boolean;
  markIntroSeen: () => void;
  reset: () => void;
};

export const useFormsStore = create<FormsState>()(
  persist(
    (set, get) => ({
      completed: [],
      introSeen: false,
      complete: (letterId) =>
        set((s) => (s.completed.includes(letterId) ? s : { completed: [...s.completed, letterId] })),
      isComplete: (letterId) => get().completed.includes(letterId),
      markIntroSeen: () => set({ introSeen: true }),
      reset: () => set({ completed: [], introSeen: false }),
    }),
    {
      name: "alif-forms",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

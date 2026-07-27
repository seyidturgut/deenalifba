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
  complete: (letterId: number) => void;
  isComplete: (letterId: number) => boolean;
  reset: () => void;
};

export const useFormsStore = create<FormsState>()(
  persist(
    (set, get) => ({
      completed: [],
      complete: (letterId) =>
        set((s) => (s.completed.includes(letterId) ? s : { completed: [...s.completed, letterId] })),
      isComplete: (letterId) => get().completed.includes(letterId),
      reset: () => set({ completed: [] }),
    }),
    {
      name: "alif-forms",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

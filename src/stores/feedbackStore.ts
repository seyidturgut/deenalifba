import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandMMKVStorage } from "@/db/storage";

/**
 * Ebeveyn geri bildirimi (Sohail beta isteği). Final sonunda + home'daki pasif
 * butondan açılan modal: 3 emoji + opsiyonel metin.
 *
 * GİZLİLİK: şimdilik YALNIZ cihazda (offline-first kuralı). Uzak gönderim hedefi
 * (e-posta/Sheet/Slack) Sohail netleştirince eklenecek; o zaman bu kayıtlar
 * gönderilebilir. Çocuk PII'si DEĞİL — ebeveynin girdiği serbest metin + emoji.
 */
export type FeedbackRating = "happy" | "neutral" | "sad";

export type FeedbackEntry = {
  rating: FeedbackRating;
  text: string;
  /** "finale" (28 sonu) | "home" (pasif buton) */
  context: string;
  at: number;
};

type FeedbackState = {
  entries: FeedbackEntry[];
  add: (entry: FeedbackEntry) => void;
  clear: () => void;
};

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set) => ({
      entries: [],
      add: (entry) => set((s) => ({ entries: [...s.entries, entry].slice(-50) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: "alif-feedback",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

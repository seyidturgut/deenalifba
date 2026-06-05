import { create } from "zustand";

/**
 * Oyun-içi "sahne" geri bildirim kanalı. Oyunlar olayları bildirir, büyük host
 * (StageHost) + CheerOverlay bunlara tepki verir. Persist YOK (anlık UI durumu).
 *  - cheer():      doğru cevap   → host sevinir + küçük yıldız patlaması
 *  - celebrate():  oyun/tur sonu → host kutlar + "Aferin!" + konfeti
 *  - oops():       yanlış        → host nazik tepki (sallanma)
 */
export type StageMood = "idle" | "happy" | "celebrate" | "oops";

type StageState = {
  mood: StageMood;
  cheerN: number; // doğru cevap sayacı (patlama tetikler)
  celebrateN: number; // kutlama sayacı (overlay tetikler)
  cheer: () => void;
  celebrate: () => void;
  oops: () => void;
  resetIdle: () => void;
};

let timer: ReturnType<typeof setTimeout> | null = null;
const clear = () => {
  if (timer) clearTimeout(timer);
  timer = null;
};

export const useStageStore = create<StageState>((set) => ({
  mood: "idle",
  cheerN: 0,
  celebrateN: 0,
  cheer: () => {
    clear();
    set((s) => ({ mood: "happy", cheerN: s.cheerN + 1 }));
    timer = setTimeout(() => set({ mood: "idle" }), 850);
  },
  celebrate: () => {
    clear();
    set((s) => ({ mood: "celebrate", celebrateN: s.celebrateN + 1 }));
    timer = setTimeout(() => set({ mood: "idle" }), 1600);
  },
  oops: () => {
    clear();
    set({ mood: "oops" });
    timer = setTimeout(() => set({ mood: "idle" }), 550);
  },
  resetIdle: () => {
    clear();
    set({ mood: "idle" });
  },
}));

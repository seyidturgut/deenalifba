import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandMMKVStorage } from "@/db/storage";

/**
 * İstikamet Zinciri (Istiqama Chain) — elde tutma mekaniği (müşteri/Sohail fikri).
 *
 * Duolingo'nun kaygı-temelli serisi DEĞİL: zincir kırılmaz, "DURAKLAR".
 *  - Her pratik günü zincire bir hilal ekler (currentChain +1).
 *  - Gün(ler) kaçırılırsa: o ana kadarki zincir "en iyi"ye yazılır (bestChain),
 *    yeni zincir 1'den başlar — ceza yok, rekoru geçmeye davet.
 *  - Aynı gün birden çok pratik → tek sayılır (idempotent).
 *
 * GİZLİLİK: tamamen cihaz-içi (MMKV), uzak senkron yok. `now` dışarıdan verilir
 * (test edilebilir). Tarih, yerel gün sınırına göre `toDateString()` ile karşılaştırılır.
 */
type StreakState = {
  /** En son pratik günü (new Date(now).toDateString()) veya null */
  lastPracticeDay: string | null;
  /** Süregelen zincir uzunluğu (gün) */
  currentChain: number;
  /** Şimdiye kadarki en uzun zincir (kupa) */
  bestChain: number;

  /** Bir pratik gününü işaretler (harf tamamlanınca çağrılır). */
  recordPractice: (now: number) => void;
  /**
   * Görüntüleme durumu: bugün/dün pratik varsa zincir "canlı"dır; aksi halde
   * duraklamıştır (gösterimde 0 say, sonraki pratikte 1'den başlar).
   * best = max(bestChain, currentChain).
   */
  chainView: (now: number) => { current: number; best: number; practicedToday: boolean; paused: boolean };
};

const DAY = 24 * 60 * 60 * 1000;
const dayStr = (ms: number) => new Date(ms).toDateString();

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      lastPracticeDay: null,
      currentChain: 0,
      bestChain: 0,

      recordPractice: (now) =>
        set((s) => {
          const today = dayStr(now);
          if (s.lastPracticeDay === today) return s; // bugün zaten sayıldı
          const yesterday = dayStr(now - DAY);
          if (s.lastPracticeDay === yesterday) {
            // zincir devam ediyor
            const currentChain = s.currentChain + 1;
            return { currentChain, bestChain: Math.max(s.bestChain, currentChain), lastPracticeDay: today };
          }
          // ilk pratik VEYA gün(ler) kaçırıldı → eskiyi kupaya yaz, yeniden başla
          return {
            bestChain: Math.max(s.bestChain, s.currentChain),
            currentChain: 1,
            lastPracticeDay: today,
          };
        }),

      chainView: (now) => {
        const { lastPracticeDay, currentChain, bestChain } = get();
        const today = dayStr(now);
        const yesterday = dayStr(now - DAY);
        const live = lastPracticeDay === today || lastPracticeDay === yesterday;
        return {
          current: live ? currentChain : 0,
          best: Math.max(bestChain, currentChain),
          practicedToday: lastPracticeDay === today,
          paused: !live && currentChain > 0,
        };
      },
    }),
    {
      name: "alif-streak",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

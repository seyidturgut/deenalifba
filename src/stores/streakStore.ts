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
 * FAZ 2 — KALKAN (shield): Haftada 1 koruyucu kalkan verilir (en çok SHIELD_CAP).
 *  Çocuk TEK bir günü kaçırırsa ve kalkanı varsa, kalkan otomatik harcanır ve
 *  zincir kırılmadan DEVAM eder ("Pırıl zincirini güvende tuttu"). Nazik/affedici.
 *
 * GİZLİLİK: tamamen cihaz-içi (MMKV), uzak senkron yok. `now` dışarıdan verilir
 * (test edilebilir). Tarih, yerel gün sınırına göre `toDateString()` ile karşılaştırılır.
 */
const SHIELD_CAP = 2;

type ChainView = {
  current: number;
  best: number;
  practicedToday: boolean;
  paused: boolean;
  shields: number;
  protectedToday: boolean;
};

type StreakState = {
  /** En son pratik günü (new Date(now).toDateString()) veya null */
  lastPracticeDay: string | null;
  /** Süregelen zincir uzunluğu (gün) */
  currentChain: number;
  /** Şimdiye kadarki en uzun zincir (kupa) */
  bestChain: number;
  /** Eldeki kalkan sayısı (Faz 2) */
  shields: number;
  /** En son kalkan verilme zamanı (epoch ms) — haftalık verme için */
  lastShieldAt: number | null;
  /** Kalkanın zinciri koruduğu son gün (geri bildirim için) */
  lastProtectedDay: string | null;
  /** Pratik yapılan günlerin kaydı (son ~21 gün) — ebeveyn haftalık özeti için */
  practiceDays: string[];

  /** Bir pratik gününü işaretler (harf tamamlanınca çağrılır). Kalkan otomatik korur. */
  recordPractice: (now: number) => void;
  /** Haftada 1 kalkan verir (home odaklanınca çağrılır). */
  grantWeeklyShield: (now: number) => void;
  /** Görüntüleme durumu (+ kalkan + bugün korundu mu). */
  chainView: (now: number) => ChainView;
  /** Ebeveyn özeti: son 7 günde kaç gün pratik + gün-gün bayraklar (eskiden yeniye). */
  weekView: (now: number) => { count: number; flags: boolean[] };
};

const DAY = 24 * 60 * 60 * 1000;
const dayStr = (ms: number) => new Date(ms).toDateString();

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      lastPracticeDay: null,
      currentChain: 0,
      bestChain: 0,
      shields: 0,
      lastShieldAt: null,
      lastProtectedDay: null,
      practiceDays: [],

      recordPractice: (now) =>
        set((s) => {
          const today = dayStr(now);
          if (s.lastPracticeDay === today) return s; // bugün zaten sayıldı
          const days = [...s.practiceDays, today].slice(-21); // gün geçmişi (ebeveyn özeti)
          const yesterday = dayStr(now - DAY);
          if (s.lastPracticeDay === yesterday) {
            // zincir devam ediyor (ardışık gün)
            const currentChain = s.currentChain + 1;
            return { currentChain, bestChain: Math.max(s.bestChain, currentChain), lastPracticeDay: today, practiceDays: days };
          }
          // TEK gün kaçırıldı + kalkan varsa → kalkanı harca, zinciri KORU (devam et)
          const twoDaysAgo = dayStr(now - 2 * DAY);
          if (s.lastPracticeDay === twoDaysAgo && s.shields > 0 && s.currentChain > 0) {
            const currentChain = s.currentChain + 1;
            return {
              currentChain,
              bestChain: Math.max(s.bestChain, currentChain),
              lastPracticeDay: today,
              shields: s.shields - 1,
              lastProtectedDay: today,
              practiceDays: days,
            };
          }
          // ilk pratik VEYA korunamayan boşluk → eskiyi kupaya yaz, yeniden başla
          return {
            bestChain: Math.max(s.bestChain, s.currentChain),
            currentChain: 1,
            lastPracticeDay: today,
            practiceDays: days,
          };
        }),

      grantWeeklyShield: (now) =>
        set((s) => {
          if (s.lastShieldAt !== null && now - s.lastShieldAt < 7 * DAY) return s;
          if (s.shields >= SHIELD_CAP) return { lastShieldAt: now };
          return { shields: Math.min(SHIELD_CAP, s.shields + 1), lastShieldAt: now };
        }),

      chainView: (now) => {
        const { lastPracticeDay, currentChain, bestChain, shields, lastProtectedDay } = get();
        const today = dayStr(now);
        const yesterday = dayStr(now - DAY);
        const live = lastPracticeDay === today || lastPracticeDay === yesterday;
        return {
          current: live ? currentChain : 0,
          best: Math.max(bestChain, currentChain),
          practicedToday: lastPracticeDay === today,
          paused: !live && currentChain > 0,
          shields,
          protectedToday: lastProtectedDay === today,
        };
      },

      weekView: (now) => {
        const days = get().practiceDays;
        // son 7 gün: bugün..6 gün önce → eskiden yeniye sırala
        const flags: boolean[] = [];
        for (let i = 6; i >= 0; i--) flags.push(days.includes(dayStr(now - i * DAY)));
        return { count: flags.filter(Boolean).length, flags };
      },
    }),
    {
      name: "alif-streak",
      storage: createJSONStorage(() => zustandMMKVStorage),
    }
  )
);

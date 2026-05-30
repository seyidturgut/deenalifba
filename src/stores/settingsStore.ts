import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandMMKVStorage } from "@/db/storage";
import { setIsUnder13 } from "@/lib/analyticsGuard";

/**
 * Kullanıcı ayarları + onboarding profili.
 *
 * GİZLİLİK (PROJECT PROFILE §4.B): `childName` bir PII'dir ve YALNIZCA
 * cihaz-içi MMKV'de tutulur — uzak senkron yoktur.
 */
type SettingsState = {
  childName: string | null;
  isUnder13: boolean;
  language: "tr";
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  isSubscribed: boolean;
  onboardingComplete: boolean;
  lastRewardDay: string | null;

  setChildName: (name: string) => void;
  setIsUnder13: (value: boolean) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleHaptics: () => void;
  setSubscribed: (value: boolean) => void;
  completeOnboarding: () => void;
  /** Günlük ödülü dener; bugün ilk kezse true döner ve işaretler. */
  claimDailyReward: () => boolean;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      childName: null,
      isUnder13: true, // fail-safe varsayım
      language: "tr",
      soundEnabled: true,
      musicEnabled: true,
      hapticsEnabled: true,
      isSubscribed: false,
      onboardingComplete: false,
      lastRewardDay: null,

      setChildName: (name) => set({ childName: name.trim() }),
      setIsUnder13: (value) => {
        setIsUnder13(value); // analytics guard'ı senkronla
        set({ isUnder13: value });
      },
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
      setSubscribed: (value) => set({ isSubscribed: value }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      claimDailyReward: () => {
        const today = new Date().toDateString();
        if (get().lastRewardDay === today) return false;
        set({ lastRewardDay: today });
        return true;
      },
    }),
    {
      name: "alif-settings",
      storage: createJSONStorage(() => zustandMMKVStorage),
      onRehydrateStorage: () => (state) => {
        // Rehydrate sonrası analytics guard'ı güncel tut
        if (state) setIsUnder13(state.isUnder13);
      },
    }
  )
);

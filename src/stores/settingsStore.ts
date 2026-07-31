import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { zustandMMKVStorage } from "@/db/storage";
import { type AppLanguage, setAppLanguage } from "@/i18n";
import { setIsUnder13 } from "@/lib/analyticsGuard";

/**
 * Kullanıcı ayarları + onboarding profili.
 *
 * GİZLİLİK (PROJECT PROFILE §4.B): `childName` bir PII'dir ve YALNIZCA
 * cihaz-içi MMKV'de tutulur — uzak senkron yoktur.
 */
type SettingsState = {
  childName: string | null;
  mosqueName: string | null;
  /** Çocuğun maskota verdiği isim ("benim Pırıl'ım" sahipliği). Cihazda. */
  mascotName: string | null;
  /** Çocuğun seçtiği tema/aksan rengi (hex). Cihazda. */
  accentColor: string | null;
  isUnder13: boolean;
  language: AppLanguage;
  soundEnabled: boolean;
  musicEnabled: boolean;
  hapticsEnabled: boolean;
  isSubscribed: boolean;
  onboardingComplete: boolean;
  /**
   * Pırıl'ın "bu bölümde ne yapıyoruz" açıklamalarından hangileri dinlendi.
   * Abdulkadir (madde 1/8): çocuk bir bölüme ilk girdiğinde Pırıl ne yapacağını
   * anlatmalı — ama her seferinde tekrarlarsa sıkıcı olur, bir kez yeter.
   */
  seenTips: string[];
  lastRewardDay: string | null;

  setChildName: (name: string) => void;
  setMosqueName: (name: string) => void;
  setMascotName: (name: string) => void;
  setAccentColor: (hex: string) => void;
  setIsUnder13: (value: boolean) => void;
  setLanguage: (lng: AppLanguage) => void;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleHaptics: () => void;
  setSubscribed: (value: boolean) => void;
  completeOnboarding: () => void;
  /** Bu açıklama daha önce dinlendi mi? (dinlenmediyse işaretler ve true döner) */
  claimTip: (key: string) => boolean;
  /** Günlük ödülü dener; bugün ilk kezse true döner ve işaretler. */
  claimDailyReward: () => boolean;
  /** "Yeni Oyun" (test): profil + onboarding + cami kozmetiğini başa al.
   *  Dil/ses/müzik/titreşim/abonelik korunur. */
  resetForNewGame: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      childName: null,
      mosqueName: null,
      mascotName: null,
      accentColor: null,
      isUnder13: true, // fail-safe varsayım
      language: "en", // varsayılan EN (müşteri talebi); kullanıcı TR'ye geçebilir
      soundEnabled: true,
      musicEnabled: true,
      hapticsEnabled: true,
      isSubscribed: false,
      onboardingComplete: false,
      seenTips: [],
      lastRewardDay: null,

      setChildName: (name) => set({ childName: name.trim() }),
      setMosqueName: (name) => set({ mosqueName: name.trim() }),
      setMascotName: (name) => set({ mascotName: name.trim() }),
      setAccentColor: (hex) => set({ accentColor: hex }),
      setIsUnder13: (value) => {
        setIsUnder13(value); // analytics guard'ı senkronla
        set({ isUnder13: value });
      },
      setLanguage: (lng) => {
        setAppLanguage(lng); // i18n'i senkronla
        set({ language: lng });
      },
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
      toggleHaptics: () => set((s) => ({ hapticsEnabled: !s.hapticsEnabled })),
      setSubscribed: (value) => set({ isSubscribed: value }),
      completeOnboarding: () => set({ onboardingComplete: true }),

      claimTip: (key) => {
        if (get().seenTips.includes(key)) return false;
        set((s) => ({ seenTips: [...s.seenTips, key] }));
        return true;
      },
      claimDailyReward: () => {
        const today = new Date().toDateString();
        if (get().lastRewardDay === today) return false;
        set({ lastRewardDay: today });
        return true;
      },
      resetForNewGame: () =>
        set({
          childName: null,
          mascotName: null,
          accentColor: null,
          mosqueName: null,
          onboardingComplete: false,
          lastRewardDay: null,
          seenTips: [], // "Yeni Oyun" → açıklamalar da baştan dinlensin
        }),
    }),
    {
      name: "alif-settings",
      storage: createJSONStorage(() => zustandMMKVStorage),
      onRehydrateStorage: () => (state) => {
        // Rehydrate sonrası analytics guard'ı ve dili güncel tut
        if (state) {
          setIsUnder13(state.isUnder13);
          setAppLanguage(state.language);
        }
      },
    }
  )
);

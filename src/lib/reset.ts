import { useFormsStore } from "@/stores/formsStore";
import { useMosqueStore } from "@/stores/mosqueStore";
import { useProgressStore } from "@/stores/progressStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSrsStore } from "@/stores/srsStore";
import { useStreakStore } from "@/stores/streakStore";

/**
 * "Yeni Oyun" — tüm ilerlemeyi/SRS/zincir/cami + profil/onboarding'i başa alır.
 * Test amaçlı (Sohail: her seferinde onboarding'den başlayabilmek için). Her store
 * kendini başlangıç durumuna döner; persist middleware MMKV'yi otomatik günceller.
 * Çağıran taraf sonra '/onboarding'e yönlendirir.
 *
 * Dil/ses/müzik/titreşim/abonelik KORUNUR (resetForNewGame).
 */
export function resetAllProgress() {
  useProgressStore.getState().reset();
  useSrsStore.getState().reset();
  useStreakStore.getState().reset();
  useMosqueStore.getState().reset();
  useFormsStore.getState().reset();
  useSettingsStore.getState().resetForNewGame();
}

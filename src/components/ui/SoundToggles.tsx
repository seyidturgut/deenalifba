import { Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { playSfx, syncMusicWithSetting } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Doğrudan ekranda müzik + ses aç/kapat (oyun tarzı, ebeveyn kapısı YOK).
 * Müzik ve ses efektleri ayrı kontrol edilir.
 */
function ToggleButton({
  on,
  iconOn,
  iconOff,
  onPress,
  label,
}: {
  on: boolean;
  iconOn: string;
  iconOff: string;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-11 w-11 items-center justify-center rounded-full"
      style={{
        backgroundColor: on ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)",
        shadowColor: "#1462B5",
        shadowOpacity: 0.18,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
      }}
    >
      <Text style={{ fontSize: 20, opacity: on ? 1 : 0.45 }}>{on ? iconOn : iconOff}</Text>
    </Pressable>
  );
}

export function SoundToggles() {
  const { t } = useTranslation();
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const toggleMusic = useSettingsStore((s) => s.toggleMusic);
  const toggleSound = useSettingsStore((s) => s.toggleSound);

  return (
    <View className="flex-row gap-2">
      <ToggleButton
        on={musicEnabled}
        iconOn="🎵"
        iconOff="🎵"
        label={t("a11y.musicToggle")}
        onPress={() => {
          toggleMusic();
          // toggle sonrası güncel ayara göre müziği başlat/durdur
          setTimeout(syncMusicWithSetting, 0);
          if (soundEnabled) playSfx("ui_tap");
        }}
      />
      <ToggleButton
        on={soundEnabled}
        iconOn="🔊"
        iconOff="🔇"
        label={t("a11y.soundToggle")}
        onPress={() => {
          const willBeOn = !soundEnabled;
          toggleSound();
          if (willBeOn) playSfx("ui_tap");
        }}
      />
    </View>
  );
}

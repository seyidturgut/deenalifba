import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { ParentGate } from "@/features/parent-gate/ParentGate";
import { playSfx, syncMusicWithSetting } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Ayarlar — zararsız çocuk ayarları (ses/müzik/titreşim) DOĞRUDAN açıktır.
 * Ebeveyn Kapısı (çarpma doğrulaması) yalnızca hassas "Ebeveyn Alanı"nı korur:
 * abonelik + gizlilik (PROJECT PROFILE §4.B — kapı abonelik/ebeveyn görünümleri içindir,
 * günlük ses ayarı için değil).
 */
export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showGate, setShowGate] = useState(false);
  const [parentUnlocked, setParentUnlocked] = useState(false);

  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const toggleMusic = useSettingsStore((s) => s.toggleMusic);
  const toggleHaptics = useSettingsStore((s) => s.toggleHaptics);

  const Row = ({
    label,
    value,
    onValueChange,
  }: {
    label: string;
    value: boolean;
    onValueChange: () => void;
  }) => (
    <View
      className="flex-row items-center justify-between rounded-2xl bg-white px-5 py-4"
      style={{
        shadowColor: "#1462B5",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <Text className="text-lg font-bold text-ink">{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: "#37ACFF", false: "#CBD5E1" }}
      />
    </View>
  );

  return (
    <GradientBg>
      <View className="flex-1 gap-4 py-6">
        <Text className="font-display text-3xl font-extrabold text-ink">
          {t("settings.title")}
        </Text>

        {/* Çocuk-erişimli ayarlar — kapı YOK */}
        <Row label={t("settings.sound")} value={soundEnabled} onValueChange={toggleSound} />
        <Row
          label="Müzik"
          value={musicEnabled}
          onValueChange={() => {
            toggleMusic();
            setTimeout(syncMusicWithSetting, 0);
          }}
        />
        <Row label={t("settings.haptics")} value={hapticsEnabled} onValueChange={toggleHaptics} />

        {/* Ebeveyn Alanı — kapı arkasında (abonelik/gizlilik) */}
        <View
          className="mt-1 gap-2 rounded-2xl bg-white px-5 py-4"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}
        >
          <Text className="text-lg font-bold text-ink">Ebeveyn Alanı</Text>
          <Text className="text-sm font-semibold text-ink/55">Abonelik ve gizlilik (yalnız ebeveyn)</Text>
          {parentUnlocked ? (
            <Text className="mt-1 text-base font-semibold text-ink/70">🔓 Açık — abonelik yakında eklenecek.</Text>
          ) : (
            <JuicyButton label="Ebeveyn Girişi 🔒" tone="primary" onPress={() => { playSfx("ui_tap"); setShowGate(true); }} />
          )}
        </View>

        <View className="flex-1" />
        <JuicyButton label="Tanıtımı tekrar izle ▶" tone="accent" onPress={() => router.push("/onboarding")} />
        <JuicyButton label={t("common.close")} tone="primary" onPress={() => router.back()} />
      </View>

      {/* Ebeveyn Kapısı yalnız hassas alan için — üst katman */}
      {showGate && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(8,38,74,0.55)",
            paddingHorizontal: 18,
            paddingTop: 24,
            paddingBottom: 32,
          }}
        >
          <ParentGate
            onSuccess={() => {
              setParentUnlocked(true);
              setShowGate(false);
            }}
          />
          <Pressable onPress={() => setShowGate(false)} className="items-center pt-2">
            <Text className="text-base font-bold text-white">Vazgeç</Text>
          </Pressable>
        </View>
      )}
    </GradientBg>
  );
}

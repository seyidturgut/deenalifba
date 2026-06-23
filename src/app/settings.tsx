import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { ParentGate } from "@/features/parent-gate/ParentGate";
import { LETTERS } from "@/data/letters";
import type { AppLanguage } from "@/i18n";
import { playSfx, syncMusicWithSetting } from "@/lib/sfx";
import { APP_VERSION_LABEL } from "@/lib/version";
import { useProgressStore } from "@/stores/progressStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStreakStore } from "@/stores/streakStore";

/** Ebeveyn haftalık özeti (İstikamet Zinciri Faz 3a) — kapı arkasında, ekran-görüntüsü alınası. */
function ParentSummary() {
  const { t } = useTranslation();
  const childName = useSettingsStore((s) => s.childName);
  useStreakStore((s) => s.practiceDays); // reaktivite
  const current = useStreakStore((s) => s.currentChain);
  const best = useStreakStore((s) => s.bestChain);
  const wv = useStreakStore.getState().weekView(Date.now());
  const completed = useProgressStore((s) => LETTERS.filter((l) => s.isLetterComplete(l.id)).length);
  const bestEver = Math.max(best, current);

  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 15, color: "#0E5FC2" }}>
        {t("settings.progressTitle")}{childName ? ` · ${childName}` : ""}
      </Text>
      {/* Son 7 gün — dolu=pratik (sonuncusu bugün) */}
      <View className="flex-row items-center" style={{ gap: 6 }}>
        {wv.flags.map((f, i) => (
          <View
            key={i}
            style={{ width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: f ? "#3FB984" : "rgba(0,0,0,0.08)" }}
          >
            {f && <Text style={{ fontSize: 11, color: "#fff" }}>🌙</Text>}
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: "#34618C" }}>{t("settings.weekDays", { n: wv.count })}</Text>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#5C6B7A" }}>{t("settings.chainCurrent", { n: current })}</Text>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#5C6B7A" }}>{t("settings.chainBest", { n: bestEver })}</Text>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#5C6B7A" }}>{t("settings.lettersLearnedP", { n: completed, total: LETTERS.length })}</Text>
    </View>
  );
}

/**
 * Ayarlar — zararsız çocuk ayarları (dil/ses/müzik/titreşim) DOĞRUDAN açıktır.
 * Ebeveyn Kapısı (çarpma doğrulaması) yalnızca hassas "Ebeveyn Alanı"nı korur:
 * abonelik + gizlilik (PROJECT PROFILE §4.B — kapı abonelik/ebeveyn görünümleri içindir,
 * günlük ayar için değil).
 */
export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showGate, setShowGate] = useState(false);
  const [parentUnlocked, setParentUnlocked] = useState(false);

  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const toggleMusic = useSettingsStore((s) => s.toggleMusic);
  const toggleHaptics = useSettingsStore((s) => s.toggleHaptics);

  const cardStyle = {
    shadowColor: "#1462B5",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  } as const;

  const Row = ({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: () => void }) => (
    <View className="flex-row items-center justify-between rounded-2xl bg-white px-5 py-4" style={cardStyle}>
      <Text className="text-lg font-bold text-ink">{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#37ACFF", false: "#CBD5E1" }} />
    </View>
  );

  const langs: { code: AppLanguage; label: string }[] = [
    { code: "tr", label: t("language.tr") },
    { code: "en", label: t("language.en") },
  ];

  return (
    <GradientBg>
      <View className="flex-1 gap-4 py-6">
        <Text className="font-display text-3xl font-extrabold text-ink">{t("settings.title")}</Text>

        {/* Dil seçimi (TR varsayılan) */}
        <View className="flex-row items-center justify-between rounded-2xl bg-white px-5 py-4" style={cardStyle}>
          <Text className="text-lg font-bold text-ink">{t("settings.language")}</Text>
          <View className="flex-row gap-2">
            {langs.map((l) => {
              const active = language === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => {
                    if (!active) {
                      setLanguage(l.code);
                      if (soundEnabled) playSfx("ui_tap");
                    }
                  }}
                  className="rounded-full px-4 py-2"
                  style={{ backgroundColor: active ? "#208AEF" : "#EDF1F5" }}
                >
                  <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 14, color: active ? "white" : "#5B6470" }}>
                    {l.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Çocuk-erişimli ayarlar — kapı YOK */}
        <Row label={t("settings.sound")} value={soundEnabled} onValueChange={toggleSound} />
        <Row
          label={t("settings.music")}
          value={musicEnabled}
          onValueChange={() => {
            toggleMusic();
            setTimeout(syncMusicWithSetting, 0);
          }}
        />
        <Row label={t("settings.haptics")} value={hapticsEnabled} onValueChange={toggleHaptics} />

        {/* Ebeveyn Alanı — kapı arkasında (abonelik/gizlilik) */}
        <View className="mt-1 gap-2 rounded-2xl bg-white px-5 py-4" style={cardStyle}>
          <Text className="text-lg font-bold text-ink">{t("settings.parentArea")}</Text>
          <Text className="text-sm font-semibold text-ink/55">{t("settings.parentAreaDesc")}</Text>
          {parentUnlocked ? (
            <ParentSummary />
          ) : (
            <JuicyButton label={t("settings.parentLogin")} tone="primary" onPress={() => { playSfx("ui_tap"); setShowGate(true); }} />
          )}
        </View>

        <View className="flex-1" />
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#7A8593", textAlign: "center", marginBottom: 8 }}>
          {APP_VERSION_LABEL}
        </Text>
        <JuicyButton label={t("settings.replayIntro")} tone="accent" onPress={() => router.push("/onboarding")} />
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
            <Text className="text-base font-bold text-white">{t("common.cancel")}</Text>
          </Pressable>
        </View>
      )}
    </GradientBg>
  );
}

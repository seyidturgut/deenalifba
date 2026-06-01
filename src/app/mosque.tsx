import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Floating } from "@/components/ui/Floating";
import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { LETTERS } from "@/data/letters";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useProgressStore } from "@/stores/progressStore";
import { useSettingsStore } from "@/stores/settingsStore";

export default function Mosque() {
  const { t } = useTranslation();
  const router = useRouter();

  const completed = useProgressStore((s) => LETTERS.filter((l) => s.isLetterComplete(l.id)).length);
  const mosqueName = useSettingsStore((s) => s.mosqueName);
  const setMosqueName = useSettingsStore((s) => s.setMosqueName);

  // 12 kümülatif inşa aşaması (ana ekran/cutscene ile aynı formül)
  const STAGES = images.mosqueStages.length;
  const stageIdx = Math.min(STAGES - 1, Math.max(0, completed - 1));
  const built = Math.min(completed, STAGES);
  const progress = built / STAGES;

  const displayName = mosqueName || t("mosque.defaultName");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = () => {
    setDraft(mosqueName || "");
    setEditing(true);
    playSfx("ui_tap");
  };
  const saveEdit = () => {
    if (draft.trim().length > 0) setMosqueName(draft);
    setEditing(false);
    playSfx("correct_ding");
  };

  // Aşama ilerleyince ses çal
  const prevStage = useRef(stageIdx);
  useEffect(() => {
    if (completed > 0 && stageIdx > prevStage.current) playSfx("mosque_build");
    prevStage.current = stageIdx;
  }, [stageIdx, completed]);

  return (
    <GradientBg variant="skyWarm">
      <View className="flex-1 py-4">
        {/* Başlık: cami adı (oyun-tarzı) + düzenle */}
        {editing ? (
          <View className="flex-row items-center gap-2">
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t("mosque.namePlaceholder")}
              placeholderTextColor="#A9B4C2"
              autoFocus
              maxLength={20}
              returnKeyType="done"
              onSubmitEditing={saveEdit}
              className="flex-1 rounded-2xl border-2 border-primary bg-white px-4 py-2.5"
              style={{ fontFamily: "Fredoka_700Bold", fontSize: 22, color: "#208AEF" }}
            />
            <Pressable
              onPress={saveEdit}
              className="h-12 w-12 items-center justify-center rounded-2xl bg-success"
              style={{ shadowColor: "#1462B5", shadowOpacity: 0.2, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
            >
              <Text style={{ fontSize: 22, color: "white" }}>✓</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={startEdit} className="flex-row items-center gap-2">
            <Text
              numberOfLines={1}
              style={{
                fontFamily: "Fredoka_700Bold",
                fontSize: 30,
                color: "#0E5FC2",
                textShadowColor: "rgba(255,255,255,0.9)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
                flexShrink: 1,
              }}
            >
              {displayName}
            </Text>
            <View className="h-9 w-9 items-center justify-center rounded-full bg-white/85">
              <Text style={{ fontSize: 16 }}>✏️</Text>
            </View>
          </Pressable>
        )}

        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: "#5C6B7A", marginTop: 6 }}>
          {t("mosque.subtitle")}
        </Text>

        {/* Cami — süzülen inşa aşaması */}
        <View className="my-3 flex-1 items-center justify-center">
          <Floating distance={9} duration={2400}>
            <Animated.View key={stageIdx} entering={FadeIn.duration(500)}>
              <Image
                source={images.mosqueStages[stageIdx]}
                style={{ width: 300, height: 300, opacity: completed === 0 ? 0.4 : 1 }}
                contentFit="contain"
              />
            </Animated.View>
          </Floating>
        </View>

        {/* İlerleme */}
        <View className="mx-1 h-5 overflow-hidden rounded-full bg-white/70">
          <View className="h-full rounded-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
        </View>
        <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: "#4A5663", textAlign: "center", marginTop: 8 }}>
          {t("mosque.parts", { built, total: STAGES })}
        </Text>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#7A8593", textAlign: "center", marginTop: 2 }}>
          {t("mosque.lettersLearned", { n: completed, total: LETTERS.length })}
        </Text>

        <View style={{ height: 14 }} />
        <JuicyButton label={t("common.back")} tone="primary" onPress={() => router.back()} />
      </View>
    </GradientBg>
  );
}

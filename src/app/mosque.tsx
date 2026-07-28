import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Floating } from "@/components/ui/Floating";
import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { Crescent } from "@/components/ui/IslamicMotifs";
import { LETTERS } from "@/data/letters";
import { GARDEN_STAGE_COUNT, gardenStage } from "@/lib/garden";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useFormsStore } from "@/stores/formsStore";
import { useProgressStore } from "@/stores/progressStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStreakStore } from "@/stores/streakStore";

export default function Mosque() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  // Sahne ekranı doldurur. Görsellerin kenar boşluğu kırpıldı (ortak kutu), bu yüzden
  // aynı genişlikte cami gözle görülür biçimde daha büyük görünüyor.
  const WORLD = Math.min(width - 4, 430);

  const completed = useProgressStore((s) => LETTERS.filter((l) => s.isLetterComplete(l.id)).length);
  const mosqueName = useSettingsStore((s) => s.mosqueName);
  const setMosqueName = useSettingsStore((s) => s.setMosqueName);
  const accentColor = useSettingsStore((s) => s.accentColor) ?? "#F5A524";
  const bestChain = useStreakStore((s) => s.bestChain);
  const currentChain = useStreakStore((s) => s.currentChain);
  const bestChainEver = Math.max(bestChain, currentChain);

  // 12 kümülatif inşa aşaması (ana ekran/cutscene ile aynı formül)
  const STAGES = images.mosqueStages.length;
  const stageIdx = Math.min(STAGES - 1, Math.max(0, completed - 1));
  const built = Math.min(completed, STAGES);
  const allDone = built >= STAGES;

  // Cami 28. harfte biter; sonrası Harf Tanıma seviyeleri için BAHÇE ödülü devralır.
  const formsCompleted = useFormsStore((s) => s.completed);
  const garden = allDone ? gardenStage(formsCompleted) : 0;
  const inGarden = garden > 0;

  const progress = inGarden ? garden / GARDEN_STAGE_COUNT : built / STAGES;
  const gardenDone = garden >= GARDEN_STAGE_COUNT;

  // Pırıl'ın balonu: ilerlemeye göre teşvik (artık fener/çeşme görevi yok — cami kendi büyür)
  const promptKey = inGarden
    ? gardenDone
      ? "mosque.gardenReady"
      : "mosque.gardenGrowing"
    : allDone
      ? "mosque.allReady"
      : completed === 0
        ? "mosque.startLearning"
        : "mosque.growing";

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

  // Aşama ilerleyince ses çal (cami parçası ya da yeni bahçe adımı)
  const prevStage = useRef(stageIdx);
  const prevGarden = useRef(garden);
  useEffect(() => {
    if (completed > 0 && stageIdx > prevStage.current) playSfx("mosque_build");
    prevStage.current = stageIdx;
  }, [stageIdx, completed]);
  useEffect(() => {
    if (garden > prevGarden.current) playSfx("mosque_build");
    prevGarden.current = garden;
  }, [garden]);

  // Pırıl camide "yaşar" — dokununca zıplar (companion bağı)
  const pirilJump = useSharedValue(0);
  const onPirilTap = () => {
    haptics.tap();
    playSfx("ui_tap");
    pirilJump.value = withSequence(
      withTiming(1, { duration: 240, easing: Easing.out(Easing.back(2.2)) }),
      withSpring(0, { damping: 6, stiffness: 140 })
    );
  };
  const pirilStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -pirilJump.value * 22 }, { scale: 1 + pirilJump.value * 0.08 }],
  }));

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
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 30,
              color: "#0E5FC2",
              textShadowColor: "rgba(255,255,255,0.9)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {displayName}
          </Text>
        )}

        <View
          className="mt-2 self-start rounded-2xl bg-white/85 px-4 py-2"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: "#34618C" }}>
            {t(inGarden ? "mosque.gardenSubtitle" : "mosque.subtitle")}
          </Text>
        </View>

        {/* Cami — süzülen inşa aşaması (12 parça, kendi içinde bütünlüklü büyür) */}
        <View className="my-2 flex-1 items-center justify-center">
          <View style={{ width: WORLD, height: WORLD }}>
            <Floating distance={10} duration={2400}>
              <Animated.View key={inGarden ? `g${garden}` : `m${stageIdx}`} entering={FadeIn.duration(500)}>
                <Image
                  source={inGarden ? images.gardenStages[garden - 1] : images.mosqueStages[stageIdx]}
                  style={{ width: WORLD, height: WORLD, opacity: completed === 0 ? 0.4 : 1 }}
                  contentFit="contain"
                />
              </Animated.View>
            </Floating>
          </View>

          {/* Pırıl camide "yaşar" + teşvik söyler; dokununca zıplar (companion bağı) */}
          <View pointerEvents="box-none" style={{ position: "absolute", left: -6, bottom: -4, width: 150, height: 188, alignItems: "center", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 168, marginBottom: 2, shadowColor: "#1462B5", shadowOpacity: 0.14, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}>
              <Text numberOfLines={2} style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 12, color: "#34414F", textAlign: "center" }}>
                {t(promptKey)}
              </Text>
            </View>
            <Pressable onPress={onPirilTap} hitSlop={10} style={{ width: 138, height: 138, alignItems: "center", justifyContent: "flex-end" }}>
              <View style={{ position: "absolute", bottom: 30, width: 94, height: 94, borderRadius: 47, backgroundColor: accentColor, opacity: 0.22 }} />
              <Image source={images.nodeCloud} style={{ position: "absolute", bottom: 0, width: 126, height: 52 }} contentFit="contain" />
              <Animated.View style={pirilStyle}>
                <Mascot size={118} pose={allDone ? "celebrate" : "happy"} />
              </Animated.View>
            </Pressable>
          </View>
        </View>

        {/* İlerleme */}
        <View className="mx-1 h-5 overflow-hidden rounded-full bg-white/70">
          <View className="h-full rounded-full bg-accent" style={{ width: `${Math.round(progress * 100)}%` }} />
        </View>
        <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: "#4A5663", textAlign: "center", marginTop: 8 }}>
          {inGarden
            ? t("mosque.gardenParts", { built: garden, total: GARDEN_STAGE_COUNT })
            : t("mosque.parts", { built, total: STAGES })}
        </Text>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#7A8593", textAlign: "center", marginTop: 2 }}>
          {t("mosque.lettersLearned", { n: completed, total: LETTERS.length })}
        </Text>
        {/* En iyi istikamet zinciri kupası */}
        {bestChainEver > 0 && (
          <View className="mt-2 flex-row items-center justify-center" style={{ gap: 6 }}>
            <Crescent size={18} color={accentColor} />
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 14, color: "#0E5FC2" }}>
              {t("mosque.bestChain", { n: bestChainEver })}
            </Text>
          </View>
        )}

        <View style={{ height: 14 }} />
        <View className="gap-2.5">
          {!editing && (
            <JuicyButton
              label={`✏️  ${mosqueName ? t("mosque.rename") : t("mosque.nameIt")}`}
              tone="accent"
              onPress={startEdit}
            />
          )}
          <JuicyButton label={t("common.back")} tone="primary" onPress={() => router.back()} />
        </View>
      </View>
    </GradientBg>
  );
}

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Floating } from "@/components/ui/Floating";
import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { Crescent } from "@/components/ui/IslamicMotifs";
import { LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useProgressStore } from "@/stores/progressStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStreakStore } from "@/stores/streakStore";

// Konumlar dünya kutusuna ORANTILI (0..1 merkez) → ölçek büyüyünce hizalı kalır
const LANTERN_SPOTS = [
  { x: 0.12, y: 0.54 },
  { x: 0.80, y: 0.47 },
  { x: 0.46, y: 0.22 },
];
const FOUNTAIN_SPOT = { x: 0.40, y: 0.56 };

/** Cami dünyası dokunulabilir öğesi — kapalıyken nabız atar (davet), dokununca açılır + ışır. */
function WorldSpot({ on, onActivate, cx, cy, onImg, offImg, size = 48 }: { on: boolean; onActivate: () => void; cx: number; cy: number; onImg: number; offImg: number; size?: number }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (!on) pulse.value = withRepeat(withSequence(withTiming(1, { duration: 650, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 650, easing: Easing.inOut(Easing.ease) })), -1, false);
    else pulse.value = withTiming(0, { duration: 200 });
  }, [on, pulse]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: on ? 0.55 : 0.12 + pulse.value * 0.3,
    transform: [{ scale: (on ? 1.15 : 0.85) + pulse.value * 0.18 }],
  }));
  return (
    <Pressable onPress={on ? undefined : onActivate} disabled={on} style={{ position: "absolute", left: cx - size / 2, top: cy - size / 2, width: size, height: size, alignItems: "center", justifyContent: "center" }} hitSlop={12}>
      <Animated.View style={[{ position: "absolute", width: size * 1.3, height: size * 1.3, borderRadius: size * 0.65, backgroundColor: on ? "#FFD36B" : "#FFFFFF" }, haloStyle]} />
      <Image source={on ? onImg : offImg} style={{ width: size, height: size }} contentFit="contain" />
    </Pressable>
  );
}

export default function Mosque() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const WORLD = Math.min(width - 12, 392); // cami sahnesi ekranı doldurur (Sohail: çok daha büyük)
  const lanternSize = Math.round(WORLD * 0.17);
  const fountainSize = Math.round(WORLD * 0.23);

  const completed = useProgressStore((s) => LETTERS.filter((l) => s.isLetterComplete(l.id)).length);
  const mosqueName = useSettingsStore((s) => s.mosqueName);
  const setMosqueName = useSettingsStore((s) => s.setMosqueName);
  const accentColor = useSettingsStore((s) => s.accentColor) ?? "#F5A524";
  const lanterns = useSettingsStore((s) => s.mosqueLanterns);
  const lightLantern = useSettingsStore((s) => s.lightLantern);
  const fountain = useSettingsStore((s) => s.mosqueFountain);
  const setFountain = useSettingsStore((s) => s.setFountain);
  const litCount = LANTERN_SPOTS.filter((_, i) => lanterns[i] === true).length;
  const allLit = litCount === LANTERN_SPOTS.length;
  const allDone = allLit && fountain;
  const onLight = (i: number) => {
    lightLantern(i, LANTERN_SPOTS.length);
    haptics.success();
    playSfx("level_unlock");
    if (litCount + 1 === LANTERN_SPOTS.length) playSfx("star_earned");
  };
  const onFountain = () => {
    setFountain(true);
    haptics.success();
    playSfx("whoosh");
    if (allLit) playSfx("star_earned");
  };
  // Pırıl'ın görev balonu: önce fenerler → sonra çeşme → hepsi hazır
  const promptKey = allDone ? "mosque.allReady" : !allLit ? "mosque.lightLanterns" : "mosque.turnOnWater";
  const bestChain = useStreakStore((s) => s.bestChain);
  const currentChain = useStreakStore((s) => s.currentChain);
  const bestChainEver = Math.max(bestChain, currentChain);

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
            {t("mosque.subtitle")}
          </Text>
        </View>

        {/* Cami — süzülen inşa aşaması + dokunulabilir fenerler/çeşme (Sohail #6, büyük sahne) */}
        <View className="my-2 flex-1 items-center justify-center">
          <View style={{ width: WORLD, height: WORLD }}>
            <Floating distance={10} duration={2400}>
              <Animated.View key={stageIdx} entering={FadeIn.duration(500)}>
                <Image
                  source={images.mosqueStages[stageIdx]}
                  style={{ width: WORLD, height: WORLD, opacity: completed === 0 ? 0.4 : 1 }}
                  contentFit="contain"
                />
              </Animated.View>
            </Floating>
            {/* Fenerler — çocuk dokununca yanar (kalıcı; "benim camim") */}
            {LANTERN_SPOTS.map((s, i) => (
              <WorldSpot key={i} on={lanterns[i] === true} onActivate={() => onLight(i)} cx={s.x * WORLD} cy={s.y * WORLD} onImg={images.lanternOn} offImg={images.lanternOff} size={lanternSize} />
            ))}
            {/* Çeşme — dokununca su akar */}
            <WorldSpot on={fountain} onActivate={onFountain} cx={FOUNTAIN_SPOT.x * WORLD} cy={FOUNTAIN_SPOT.y * WORLD} onImg={images.fountainOn} offImg={images.fountainOff} size={fountainSize} />
          </View>

          {/* Pırıl camide "yaşar" + fener görevini söyler; dokununca zıplar (companion bağı) */}
          <View pointerEvents="box-none" style={{ position: "absolute", left: -6, bottom: -4, width: 150, height: 188, alignItems: "center", justifyContent: "flex-end" }}>
            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 168, marginBottom: 2, shadowColor: "#1462B5", shadowOpacity: 0.14, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}>
              <Text numberOfLines={2} style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 12, color: "#34414F", textAlign: "center" }}>
                {t(promptKey)}
              </Text>
            </View>
            <View style={{ width: 138, height: 138, alignItems: "center", justifyContent: "flex-end" }}>
              <View style={{ position: "absolute", bottom: 30, width: 94, height: 94, borderRadius: 47, backgroundColor: accentColor, opacity: 0.22 }} />
              <Image source={images.nodeCloud} style={{ position: "absolute", bottom: 0, width: 126, height: 52 }} contentFit="contain" />
              <Mascot size={118} pose={allDone ? "celebrate" : "point"} />
            </View>
          </View>
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

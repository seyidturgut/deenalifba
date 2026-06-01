import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Celebration } from "@/components/ui/Celebration";
import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { SoundToggles } from "@/components/ui/SoundToggles";
import { SoundCatch } from "@/features/catch/SoundCatch";
import { LetterIntro } from "@/features/intro/LetterIntro";
import { MosqueBuild } from "@/features/mosque/MosqueBuild";
import { RecallGame } from "@/features/recall/RecallGame";
import { SoundsGame } from "@/features/sounds/SoundsGame";
import { SpotTheLetter } from "@/features/spot/SpotTheLetter";
import { TraceCanvas } from "@/features/trace/TraceCanvas";
import { ACTIVITY_META } from "@/data/lesson";
import { getLetter, TOTAL_LETTERS } from "@/data/letters";
import { getStrokes } from "@/data/letterStrokes";
import type { ActivityKind } from "@/data/types";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useLearningStore } from "@/stores/learningStore";
import { useMosqueStore } from "@/stores/mosqueStore";
import { useProgressStore } from "@/stores/progressStore";

const HINT_KEY: Record<ActivityKind, string> = {
  intro: "learn.introHint",
  trace: "learn.traceHint",
  spot: "learn.puzzleHint",
  sounds: "learn.soundsHint",
  word: "learn.wordHint",
  catch: "learn.catchHint",
  recall: "learn.recallHint",
};

/** Ders adımları göstergesi — değişken sayıda etkinlik (tek bir "raf" üstünde). */
function StepBar({ activities, activeIndex }: { activities: ActivityKind[]; activeIndex: number }) {
  return (
    <View className="items-center py-1">
      <View
        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
        style={{
          backgroundColor: "rgba(255,255,255,0.5)",
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.75)",
          shadowColor: "#1462B5",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        {activities.map((k, i) => {
          const active = i === activeIndex;
          const done = i < activeIndex;
          const meta = ACTIVITY_META[k];
          return (
            <View
              key={`${k}-${i}`}
              style={{
                width: active ? 56 : 46,
                height: active ? 56 : 46,
                borderRadius: 30,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? "#FFFFFF" : "transparent",
                borderWidth: done ? 3 : 0,
                borderColor: "#3FB984",
                shadowColor: active ? "#1462B5" : "transparent",
                shadowOpacity: active ? 0.25 : 0,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              {meta.icon ? (
                <Image
                  source={meta.icon}
                  style={{ width: active ? 40 : 32, height: active ? 40 : 32, opacity: active || done ? 1 : 0.5 }}
                  contentFit="contain"
                />
              ) : (
                <Text style={{ fontSize: active ? 28 : 22, opacity: active || done ? 1 : 0.5 }}>{meta.emoji}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function LearnScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { letterId } = useLocalSearchParams<{ letterId: string }>();
  const id = Number(letterId);
  const letter = getLetter(id);

  const activities = useLearningStore((s) => s.activities);
  const activeIndex = useLearningStore((s) => s.activeIndex);
  const startLetter = useLearningStore((s) => s.startLetter);
  const nextStep = useLearningStore((s) => s.nextStep);
  const completeLetter = useProgressStore((s) => s.completeLetter);
  const syncMosque = useMosqueStore((s) => s.syncWithProgress);

  const [celebrate, setCelebrate] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [buildVisible, setBuildVisible] = useState(false);
  const [buildStage, setBuildStage] = useState(0);

  useEffect(() => {
    startLetter(id);
  }, [id, startLetter]);

  const goHome = () => router.replace("/home");

  const finishLetter = () => {
    setCelebrate(false); // kutlamayı kapat → cami sahnesiyle çakışmasın
    const isComplete = useProgressStore.getState().isLetterComplete;
    let completed = 0;
    for (let i = 1; i <= TOTAL_LETTERS; i++) if (isComplete(i)) completed++;
    syncMosque(completed);
    const stages = images.mosqueStages.length;
    const idxNow = Math.min(stages - 1, Math.max(0, completed - 1));
    setBuildStage(idxNow);
    setBuildVisible(true);
  };

  const onCompleteStep = () => {
    haptics.success();
    const advanced = nextStep();
    if (advanced) {
      playSfx("step_complete");
    } else {
      completeLetter(id);
      setCelebrate(true);
    }
  };

  if (!letter) {
    return (
      <GradientBg>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-muted">Harf bulunamadı.</Text>
        </View>
      </GradientBg>
    );
  }

  const kind = activities[activeIndex];
  const stepLabel = kind ? t(ACTIVITY_META[kind].labelKey) : "";
  const isTrace = kind === "trace";

  return (
    <GradientBg>
      {/* Üst utility: geri (sol) + müzik/ses (sağ) */}
      <View className="flex-row items-center justify-between pt-1">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            shadowColor: "#1462B5",
            shadowOpacity: 0.18,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#208AEF", marginTop: -2 }}>‹</Text>
        </Pressable>
        <SoundToggles />
      </View>

      <StepBar activities={activities} activeIndex={activeIndex} />

      {/* Başlık banner */}
      <View style={{ alignItems: "center" }}>
        <View style={{ width: 248, aspectRatio: 3.02 }}>
          <Image source={images.titleBanner} style={StyleSheet.absoluteFill} contentFit="contain" />
          <View style={{ position: "absolute", left: 0, right: 0, top: "5%", bottom: "42%", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#5B4A1E", includeFontPadding: false }}>
              {stepLabel}
            </Text>
          </View>
        </View>
      </View>

      <View
        className="mt-1 self-center rounded-full bg-white/65 px-6 py-2"
        style={{ maxWidth: "92%", shadowColor: "#1462B5", shadowOpacity: 0.14, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } }}
      >
        <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 17, lineHeight: 23, textAlign: "center", color: "#34618C" }}>
          {kind ? t(HINT_KEY[kind]) : ""}
        </Text>
      </View>

      {/* Etkinlik */}
      {kind === "intro" ? (
        <View className="flex-1 items-center justify-center">
          <LetterIntro key={`intro-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "trace" ? (
        <View className="flex-1 items-center justify-center pb-1">
          <View style={{ width: "100%", maxWidth: 420, aspectRatio: 0.9, alignSelf: "center" }}>
            <Image source={images.playPanel} style={StyleSheet.absoluteFill} contentFit="fill" />
            <View style={{ position: "absolute", left: "9%", right: "9%", top: "9%", bottom: "11%" }}>
              <TraceCanvas
                key={id}
                bare
                showDemo={id <= 3}
                demoRTL={id !== 1}
                resetSignal={resetSignal}
                letterChar={letter.char}
                strokes={getStrokes(id)}
                onComplete={() => setTimeout(onCompleteStep, 450)}
              />
            </View>
          </View>
        </View>
      ) : kind === "spot" ? (
        <View className="flex-1 items-center justify-center">
          <SpotTheLetter key={`spot-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "sounds" ? (
        <View className="flex-1 items-center justify-center">
          <SoundsGame key={`sounds-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "catch" ? (
        <View className="flex-1 items-center justify-center">
          <SoundCatch key={`catch-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "recall" ? (
        <View className="flex-1 items-center justify-center">
          <RecallGame key={`recall-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : (
        <View className="flex-1" />
      )}

      {isTrace && (
        <View className="items-center pb-2">
          <JuicyButton label={t("learn.redraw")} tone="accent" onPress={() => setResetSignal((s) => s + 1)} />
        </View>
      )}

      <Celebration visible={celebrate} onDone={finishLetter} />
      <MosqueBuild visible={buildVisible} stageIndex={buildStage} onDone={goHome} />
    </GradientBg>
  );
}

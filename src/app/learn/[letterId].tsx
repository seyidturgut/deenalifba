import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Celebration } from "@/components/ui/Celebration";
import { CheerOverlay } from "@/components/ui/CheerOverlay";
import { GradientBg } from "@/components/ui/GradientBg";
import { SoundToggles } from "@/components/ui/SoundToggles";
import { StageHost } from "@/components/ui/StageHost";
import { BalloonPop } from "@/features/balloon/BalloonPop";
import { SoundCatch } from "@/features/catch/SoundCatch";
import { GiveToPiril } from "@/features/drag/GiveToPiril";
import { HearTap } from "@/features/heartap/HearTap";
import { LetterIntro } from "@/features/intro/LetterIntro";
import { MatchGame } from "@/features/match/MatchGame";
import { MosqueBuild } from "@/features/mosque/MosqueBuild";
import { RecallGame } from "@/features/recall/RecallGame";
import { ACTIVITY_META } from "@/data/lesson";
import { getLetter, TOTAL_LETTERS } from "@/data/letters";
import type { ActivityKind } from "@/data/types";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useLearningStore } from "@/stores/learningStore";
import { useMosqueStore } from "@/stores/mosqueStore";
import { useProgressStore } from "@/stores/progressStore";
import { useStageStore } from "@/stores/stageStore";

const HINT_KEY: Record<ActivityKind, string> = {
  intro: "learn.introHint",
  trace: "learn.traceHint",
  hearTap: "learn.hearTapHint",
  match: "learn.matchHint",
  drag: "learn.dragHint",
  balloon: "learn.balloonHint",
  catch: "learn.catchHint",
  word: "learn.wordHint",
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
  const [buildVisible, setBuildVisible] = useState(false);
  const [buildStage, setBuildStage] = useState(0);

  useEffect(() => {
    startLetter(id);
    useStageStore.getState().resetIdle();
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
      useStageStore.getState().celebrate(); // host kutlar + "Aferin!" overlay
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
  const FLOOR_H = 118; // alt sahne zemini (büyük host orada durur; oyunlar üstte)

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

      {/* Görev paneli (çerçeve) + etkinlik — sahne zemininin ÜSTÜNDE */}
      <View style={{ flex: 1, marginTop: 10 }}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 2,
            right: 2,
            top: 2,
            bottom: FLOOR_H + 2,
            borderRadius: 30,
            backgroundColor: "rgba(255,255,255,0.24)",
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.6)",
          }}
        />
        <View style={{ flex: 1, marginBottom: FLOOR_H }}>
        {kind === "intro" ? (
        <View className="flex-1 items-center justify-center">
          <LetterIntro key={`intro-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "hearTap" ? (
        <View className="flex-1 items-center justify-center">
          <HearTap key={`hearTap-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "match" ? (
        <View className="flex-1 items-center justify-center">
          <MatchGame key={`match-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "drag" ? (
        <View className="flex-1 items-center justify-center">
          <GiveToPiril key={`drag-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "balloon" ? (
        <View className="flex-1 items-center justify-center">
          <BalloonPop key={`balloon-${id}`} letterId={id} onComplete={onCompleteStep} />
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
        </View>
      </View>

      {/* Sahne zemini (bulut bandı) + büyük host (sunucu) */}
      <View pointerEvents="none" style={{ position: "absolute", left: -18, right: -18, bottom: 0, height: FLOOR_H + 6 }}>
        <Image source={images.nodeCloud} style={{ position: "absolute", right: -6, bottom: -8, width: 196, height: 92, opacity: 0.8 }} contentFit="contain" />
      </View>
      <StageHost size={148} />
      <CheerOverlay />

      <Celebration visible={celebrate} onDone={finishLetter} />
      <MosqueBuild visible={buildVisible} stageIndex={buildStage} onDone={goHome} />
    </GradientBg>
  );
}

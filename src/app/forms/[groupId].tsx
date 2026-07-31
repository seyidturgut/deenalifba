import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Celebration } from "@/components/ui/Celebration";
import { CheerOverlay } from "@/components/ui/CheerOverlay";
import { CorrectBurst } from "@/components/ui/CorrectBurst";
import { GradientBg } from "@/components/ui/GradientBg";
import { SoundToggles } from "@/components/ui/SoundToggles";
import { StageHost } from "@/components/ui/StageHost";
import { ChapterIntro } from "@/features/forms/ChapterIntro";
import { FormIntro } from "@/features/forms/FormIntro";
import { FormRecognition } from "@/features/forms/FormRecognition";
import { FormReverse } from "@/features/forms/FormReverse";
import { BalloonPop } from "@/features/balloon/BalloonPop";
import { SoundCatch } from "@/features/catch/SoundCatch";
import { MatchGame } from "@/features/match/MatchGame";
import { PaintTrace } from "@/features/trace/PaintTrace";
import { formKindsFor, type LetterFormKind } from "@/data/letterForms";
import { formsGroup, FORMS_GROUP_SIZE } from "@/data/formsLessons";
import { LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playHint, playLetter, playSfx, resetCombo, type HintKey } from "@/lib/sfx";
import { useFormsStore } from "@/stores/formsStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStageStore } from "@/stores/stageStore";
import { MosqueBuild } from "@/features/mosque/MosqueBuild";
import { gardenStage } from "@/lib/garden";

/**
 * "Harf Tanıma" seviyesi — haritada 29-35 olarak görünen kısa derslerden biri
 * (Abdulkadir: seviye başına 4-5 harf, hepsi tek seviyede değil).
 *
 * Harf dersleriyle AYNI ritim: üstte adım çubuğu (bu seviyedeki harfler), her harf
 * için ÖNCE öğret (formları göster) → SONRA oyun. Oyun türü harften harfe değişir
 * (tanı ↔ tersi) — tek tip tekrar sıkmasın.
 */
export default function FormsLevel() {
  const { t } = useTranslation();
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const gi = Math.max(0, Number(groupId) - 1); // 1-tabanlı URL → 0-tabanlı indeks
  const letters = formsGroup(gi);

  const complete = useFormsStore((s) => s.complete);
  const introSeen = useFormsStore((s) => s.introSeen);
  const markIntroSeen = useFormsStore((s) => s.markIntroSeen);

  const [idx, setIdx] = useState(0);
  const [taught, setTaught] = useState(false);
  const language = useSettingsStore((s) => s.language);
  const [celebrate, setCelebrate] = useState(false);
  const [gardenVisible, setGardenVisible] = useState(false);

  const letterId = letters[idx];
  const goHome = () => router.replace("/home");

  const onLetterDone = () => {
    complete(letterId);
    resetCombo(); // seri harf başına
    haptics.success();
    if (idx < letters.length - 1) {
      playSfx("step_complete");
      useStageStore.getState().cheer();
      setTimeout(() => {
        setIdx((i) => i + 1);
        setTaught(false);
      }, 450);
    } else {
      setCelebrate(true);
    }
  };

  // Seviye bitti → bahçe büyüme anı (cami 28'de bitti, ödül artık bahçe).
  const onCelebrationDone = () => {
    setCelebrate(false);
    setGardenVisible(true);
  };

  if (!letters.length) {
    return (
      <GradientBg>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-muted">Bölüm bulunamadı.</Text>
        </View>
      </GradientBg>
    );
  }

  // Bölümün sesli açılışı yalnız İLK seviyenin ilk girişinde
  const showChapterIntro = gi === 0 && !introSeen;
  // Oyun türü değişsin (grup+harf indeksine göre) — tek tip tekrar olmasın
  /**
   * Abdulkadir (2. tur): "1-28'deki oyun çeşitliliği bu bölümde de korunmalı."
   * Formlara özgü iki oyunun yanına 1-28'in dört sevilen mekaniği eklendi; hepsi
   * artık harfi POZİSYONEL formuyla gösteriyor. Sıra deterministik — çocuk aynı
   * harfe dönerse aynı oyunu görür, kafası karışmaz.
   */
  const GAME_COUNT = 6;

  const gameIndex = (gi * FORMS_GROUP_SIZE + idx) % GAME_COUNT;

  /**
   * Talimat sesi (Abdulkadir madde 2). Öğretim (FormIntro) adımında değil, oyun
   * başlarken çalar — öğretimde Pırıl zaten konuşuyor.
   */
  useEffect(() => {
    if (!taught || showChapterIntro || !letterId) return;
    const key: HintKey | null =
      gameIndex === 0 ? "formFind" : gameIndex === 1 ? "formWhich"
      : gameIndex === 2 ? "match" : gameIndex === 3 ? "balloon"
      : gameIndex === 4 ? "catch" : "trace";
    const tt = setTimeout(() => playHint(language, key), 260);
    return () => clearTimeout(tt);
  }, [taught, showChapterIntro, letterId, gameIndex, language]);

  // Oyunun göstereceği form: bu harfin gerçekten sahip olduğu pozisyonel formlardan biri
  // (bağlanmayan 6 harfte yalnız "son" vardır — var olmayan şekil gösterilmez).
  const positional = formKindsFor(letterId ?? 0).filter((k) => k !== "isolated");
  const gameForm: LetterFormKind | undefined = positional.length
    ? positional[(gi + idx) % positional.length]
    : undefined;

  return (
    <GradientBg>
      <View className="flex-row items-center justify-between pt-1">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.9)", shadowColor: "#1462B5", shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#208AEF", marginTop: -2 }}>‹</Text>
        </Pressable>
        <SoundToggles />
      </View>

      {/* Adım çubuğu — bu seviyedeki harfler (harf derslerindeki StepBar ile aynı dil) */}
      {!showChapterIntro && (
        <View className="items-center py-1">
          <View
            className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
            style={{ backgroundColor: "rgba(255,255,255,0.5)", borderWidth: 2, borderColor: "rgba(255,255,255,0.75)" }}
          >
            {letters.map((id, i) => {
              const active = i === idx;
              const done = i < idx;
              return (
                <View key={id} style={{ flexDirection: "row", alignItems: "center" }}>
                  {i > 0 && (
                    <View style={{ width: 10, height: 4, borderRadius: 2, marginHorizontal: 1, backgroundColor: i <= idx ? "#3FB984" : "rgba(0,0,0,0.12)" }} />
                  )}
                  <View
                    style={{
                      width: active ? 40 : 32,
                      height: active ? 40 : 32,
                      borderRadius: 20,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: active ? "#FFFFFF" : "transparent",
                      borderWidth: done ? 3 : 0,
                      borderColor: "#3FB984",
                    }}
                  >
                    <Text style={{ fontFamily: "Amiri_700Bold", fontSize: active ? 22 : 18, color: done ? "#3FB984" : "#3A3A44", opacity: active || done ? 1 : 0.5 }}>
                      {LETTERS.find((l) => l.id === id)?.char}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ alignItems: "center" }}>
        <View style={{ width: 248, aspectRatio: 3.02 }}>
          <Image source={images.titleBanner} style={StyleSheet.absoluteFill} contentFit="contain" />
          <View style={{ position: "absolute", left: 0, right: 0, top: "5%", bottom: "42%", alignItems: "center", justifyContent: "center" }}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ fontFamily: "Fredoka_700Bold", fontSize: 20, color: "#5B4A1E", includeFontPadding: false, paddingHorizontal: 14 }}
            >
              {t("forms.bannerTitle")}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1, marginTop: 8, marginBottom: 110 }}>
        {showChapterIntro ? (
          <ChapterIntro onDone={markIntroSeen} />
        ) : taught ? (
          gameIndex === 0 ? (
            <FormRecognition key={`rec-${letterId}`} letterId={letterId} onComplete={onLetterDone} />
          ) : gameIndex === 1 ? (
            <FormReverse key={`rev-${letterId}`} letterId={letterId} onComplete={onLetterDone} />
          ) : gameIndex === 2 ? (
            <MatchGame key={`mat-${letterId}`} letterId={letterId} formKind={gameForm} onComplete={onLetterDone} />
          ) : gameIndex === 3 ? (
            <BalloonPop key={`bal-${letterId}`} letterId={letterId} formKind={gameForm} onComplete={onLetterDone} />
          ) : gameIndex === 4 ? (
            <SoundCatch key={`cat-${letterId}`} letterId={letterId} formKind={gameForm} onComplete={onLetterDone} />
          ) : (
            <PaintTrace key={`tra-${letterId}`} letterId={letterId} formKind={gameForm} onComplete={onLetterDone} />
          )
        ) : (
          <FormIntro key={`fi-${letterId}`} letterId={letterId} onDone={() => setTaught(true)} />
        )}
      </View>

      {!showChapterIntro && <StageHost size={140} onReplay={() => letterId && playLetter(letterId)} />}
      <CorrectBurst />
      <CheerOverlay />
      <Celebration visible={celebrate} onDone={onCelebrationDone} />
      <MosqueBuild
        visible={gardenVisible}
        variant="garden"
        stageIndex={gardenStage(useFormsStore.getState().completed) - 1}
        onDone={goHome}
      />
    </GradientBg>
  );
}

import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Celebration } from "@/components/ui/Celebration";
import { CheerOverlay } from "@/components/ui/CheerOverlay";
import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { SoundToggles } from "@/components/ui/SoundToggles";
import { StageHost } from "@/components/ui/StageHost";
import { FormRecognition } from "@/features/forms/FormRecognition";
import { LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playLetter, playSfx } from "@/lib/sfx";
import { useFormsStore } from "@/stores/formsStore";

/** Bir oturumda kaç harf çalışılır (kısa tutulur — çocuk yorulmadan biter). */
const ROUND_SIZE = 5;

/**
 * "Harf Tanıma" bölümü — 28 harften SONRA, Harakat'tan ÖNCE (Abdulkadir'in müfredat
 * önerisi): çocuk harfleri kelime içindeki farklı formlarıyla (baş/orta/son) tanır.
 *
 * Her oturum ROUND_SIZE kadar harf sunar: henüz tamamlanmamışlardan sırayla.
 */
export default function FormsChapter() {
  const { t } = useTranslation();
  const router = useRouter();
  const completed = useFormsStore((s) => s.completed);
  const complete = useFormsStore((s) => s.complete);

  // Bu oturumun harfleri — henüz bitmemişlerden ilk ROUND_SIZE tanesi
  const [queue] = useState<number[]>(() =>
    LETTERS.filter((l) => !useFormsStore.getState().isComplete(l.id))
      .slice(0, ROUND_SIZE)
      .map((l) => l.id)
  );
  const [idx, setIdx] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const allDone = queue.length === 0;
  const letterId = queue[idx];

  const onRoundComplete = () => {
    complete(letterId);
    haptics.success();
    if (idx < queue.length - 1) {
      playSfx("step_complete");
      setTimeout(() => setIdx((i) => i + 1), 450);
    } else {
      setCelebrate(true);
    }
  };

  const goHome = () => router.replace("/home");

  return (
    <GradientBg>
      {/* Üst: geri + ses */}
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

      {/* Başlık banner */}
      <View style={{ alignItems: "center" }}>
        <View style={{ width: 248, aspectRatio: 3.02 }}>
          <Image source={images.titleBanner} style={StyleSheet.absoluteFill} contentFit="contain" />
          <View style={{ position: "absolute", left: 0, right: 0, top: "5%", bottom: "42%", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 22, color: "#5B4A1E", includeFontPadding: false }}>
              {t("journey.letterForms")}
            </Text>
          </View>
        </View>
      </View>

      {/* İlerleme (bölüm geneli) */}
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: "#34618C", textAlign: "center", marginTop: 2 }}>
        {t("forms.progress", { n: completed.length, total: LETTERS.length })}
      </Text>

      <View style={{ flex: 1, marginTop: 8, marginBottom: 110 }}>
        {allDone ? (
          // Bölümün tamamı bitti — kutlama + çıkış
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 18, paddingHorizontal: 20 }}>
            <Mascot size={130} pose="celebrate" />
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 20, color: "#208AEF", textAlign: "center" }}>
              {t("forms.chapterDone")}
            </Text>
            <JuicyButton label={t("finale.continue")} tone="success" onPress={goHome} />
          </View>
        ) : (
          <FormRecognition key={`form-${letterId}`} letterId={letterId} onComplete={onRoundComplete} />
        )}
      </View>

      <StageHost size={140} onReplay={() => letterId && playLetter(letterId)} />
      <CheerOverlay />
      <Celebration visible={celebrate} onDone={goHome} />
    </GradientBg>
  );
}

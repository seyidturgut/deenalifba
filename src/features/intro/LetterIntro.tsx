import { Image } from "expo-image";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Floating } from "@/components/ui/Floating";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { getLetter } from "@/data/letters";
import { images } from "@/lib/images";
import { playLetter } from "@/lib/sfx";

/**
 * "Tanı" (öğret) adımı — TEST DEĞİL. Harfi tanıtır: büyük harf + adı + sesi
 * (otomatik çalar + Dinle). Çocuk önce harfi görür/duyar, sonra Devam'a basar.
 * Pedagoji: önce öğret, sonra pratik.
 */
export function LetterIntro({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const letter = getLetter(letterId);

  useEffect(() => {
    const tt = setTimeout(() => playLetter(letterId), 350);
    return () => clearTimeout(tt);
  }, [letterId]);

  if (!letter) return null;

  return (
    <View className="flex-1 items-center justify-center gap-5">
      {/* Büyük harf kartı — dokununca harfin sesi tekrar çalar (etiketsiz) */}
      <Floating distance={8} duration={2200}>
        <Pressable onPress={() => playLetter(letterId)} style={{ width: 250, height: 250 }}>
          <Image source={images.playPanel} style={StyleSheet.absoluteFill} contentFit="fill" />
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Amiri_700Bold", fontSize: 140, color: "#2A2A33" }}>{letter.char}</Text>
          </View>
        </Pressable>
      </Floating>

      {/* Harfin adı */}
      <Text
        style={{
          fontFamily: "Fredoka_700Bold",
          fontSize: 30,
          color: "#0E5FC2",
          textShadowColor: "rgba(255,255,255,0.9)",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        }}
      >
        {letter.name}
      </Text>

      {/* Devam (öğretme adımı — açık devam butonu) */}
      <JuicyButton label={t("intro.continue")} tone="success" onPress={onComplete} />
    </View>
  );
}

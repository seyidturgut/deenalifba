import { Image } from "expo-image";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { Floating } from "@/components/ui/Floating";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { getLetter } from "@/data/letters";
import { getLetterPath, PATH_BOX } from "@/data/letterPaths";
import { images } from "@/lib/images";
import { playLetter } from "@/lib/sfx";

const CARD = 250;
const GLYPH = 176; // kart içi glif alanı (altın çerçeveye değmesin)

/**
 * "Tanı" (öğret) adımı — TEST DEĞİL. Harfi tanıtır: büyük harf + sesi
 * (otomatik çalar + dokun-tekrar). Latin ad gösterilmez (Ismail: Arapça + ses).
 *
 * Harf, GERÇEK Amiri glif konturuyla (letterPaths, 1000×1000 kutuda ORTALANMIŞ)
 * SVG path olarak çizilir → 28 harfin hepsi kartta STABİL ortalı durur. (Text
 * glifi kullanılırsa kuyruklu harfler ح/ج yan boşluk/baseline yüzünden kayıyordu.)
 */
export function LetterIntro({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const letter = getLetter(letterId);
  const lp = getLetterPath(letterId);
  const sc = GLYPH / PATH_BOX;

  // Dokun-dinle rozeti nabzı — çocuk okuyamaz, ikon davetle "buraya dokun" anlaşılsın
  // (Abdulkadir: "sesli söyle" daveti yazıyla kalsın ama ikon/etkileşimle de desteklensin).
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.14 }] }));

  useEffect(() => {
    const tt = setTimeout(() => playLetter(letterId), 350);
    return () => clearTimeout(tt);
  }, [letterId]);

  if (!letter) return null;

  return (
    <View className="flex-1 items-center justify-center gap-5">
      {/* Büyük harf kartı — dokununca harfin sesi tekrar çalar (etiketsiz) */}
      <Floating distance={8} duration={2200}>
        <Pressable onPress={() => playLetter(letterId)} style={{ width: CARD, height: CARD }}>
          <Image source={images.playPanel} style={StyleSheet.absoluteFill} contentFit="fill" />
          <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
            {lp ? (
              // bbox-merkezli path → her harf aynı şekilde ortalı
              <Svg width={GLYPH} height={GLYPH}>
                <G transform={`scale(${sc})`}>
                  <Path d={lp.d} fill="#2A2A33" />
                </G>
              </Svg>
            ) : (
              // path yoksa Amiri glif fallback
              <Text style={{ fontFamily: "Amiri_700Bold", fontSize: 140, color: "#2A2A33" }}>{letter.char}</Text>
            )}
          </View>
          {/* Dinle rozeti — ikonla "dokun ve dinle" daveti (diğer oyunlardaki 🔊 diliyle tutarlı) */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                right: -8,
                bottom: -8,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: "#F5A524",
                shadowColor: "#1462B5",
                shadowOpacity: 0.25,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              },
              badgeStyle,
            ]}
          >
            <Text style={{ fontSize: 26 }}>🔊</Text>
          </Animated.View>
        </Pressable>
      </Floating>

      {/* Latin ad GÖSTERİLMEZ (Ismail: Arapça harf + ses; transliterasyona dayanma).
          Çocuk harfi görür + sesini duyar; karta dokununca ses tekrar çalar. */}

      {/* Devam (öğretme adımı — açık devam butonu) */}
      <JuicyButton label={t("intro.continue")} tone="success" onPress={onComplete} />
    </View>
  );
}

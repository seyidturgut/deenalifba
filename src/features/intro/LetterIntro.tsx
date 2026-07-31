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
import { NARRATION_DURATIONS_MS, playLetter, playNarration } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

const CARD = 250;
const GLYPH = 176; // kart içi glif alanı (altın çerçeveye değmesin)

/**
 * "Tanı" (öğret) adımı — TEST DEĞİL. Harfi tanıtır: büyük harf + sesi
 * (otomatik çalar + dokun-tekrar). Latin ad gösterilmez (Ismail: Arapça + ses).
 *
 * Harf, GERÇEK Amiri glif konturuyla (letterPaths, 1000×1000 kutuda ORTALANMIŞ)
 * SVG path olarak çizilir → 28 harfin hepsi kartta STABİL ortalı durur. (Text
 * glifi kullanılırsa kuyruklu harfler ح/ج yan boşluk/baseline yüzünden kayıyordu.)
 *
 * Kaydet & karşılaştır artık BURADA değil — ayrı bir "speak" adımı olarak dersin
 * SONUNA taşındı (bkz. features/speak/SpeakPractice.tsx, Abdulkadir video geri
 * bildirimi: konuşma pratiği, öğretme/pratik BİTMEDEN istenmemeli).
 */
export function LetterIntro({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const letter = getLetter(letterId);
  const lp = getLetterPath(letterId);
  const sc = GLYPH / PATH_BOX;
  const { t } = useTranslation();

  // Dokun-dinle rozeti nabzı — çocuk okuyamaz, ikon davetle "buraya dokun" anlaşılsın
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.14 }] }));

  /**
   * Abdulkadir (madde 1): "Level 1'de Pırıl, çocuk başlamadan ÖNCE ne yapacağımızı
   * anlatsın." Açıklama yalnız ilk kez dinlenir (claimTip); harfin sesi de o zaman
   * araya girmesin diye anlatım bitince çalar.
   */
  useEffect(() => {
    const intro =
      letterId === 1 && useSettingsStore.getState().claimTip("level1Intro")
        ? NARRATION_DURATIONS_MS[useSettingsStore.getState().language].level1Intro
        : 0;
    if (intro) playNarration(useSettingsStore.getState().language, "level1Intro");
    const tt = setTimeout(() => playLetter(letterId), 350 + intro);
    return () => clearTimeout(tt);
  }, [letterId]);

  if (!letter) return null;

  return (
    <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 20 }}>
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
          {/* Dinle rozeti — ikonla "dokun ve dinle" daveti (illüstrasyon, emoji değil).
              Kartın SINIRLARI İÇİNDE konumlanır (negatif taşma yok) → hiçbir kapsayıcıda kesilmez. */}
          <Animated.View pointerEvents="none" style={[{ position: "absolute", right: 2, bottom: 2 }, badgeStyle]}>
            <Image source={images.icListen} style={{ width: 58, height: 53 }} contentFit="contain" />
          </Animated.View>
        </Pressable>
      </Floating>

      {/* Latin ad GÖSTERİLMEZ (Ismail: Arapça harf + ses; transliterasyona dayanma). */}

      <JuicyButton label={t("intro.continue")} tone="success" onPress={onComplete} />
    </View>
  );
}

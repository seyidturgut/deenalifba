import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { Crescent, Sparkle4, Star8 } from "@/components/ui/IslamicMotifs";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";

const { width: SCREEN_W } = Dimensions.get("window");
const LINE1 = 3600; // 1. cümle → 2. cümle
const LINE2 = 3600; // 2. cümle → "birine göster" + Devam

/**
 * Level 28 BÜYÜK FİNAL (Sohail): son harf bitince camin tam reveal'ı (ışıklı,
 * tamamlanmış) + Pırıl'ın oyundaki en büyük duygusal anı + sesli-tarz kısa diyalog:
 *  1) "Maa shaa Allah — 28 harfi biliyorsun, cami tamam, bunu sen yaptın."
 *  2) "Harfler hazır. Yakında nasıl konuştuklarını göstereceğim." (Stage 2 tohumu)
 *  3) "Yaptığını birine gösterir misin?" (beta: ağızdan-ağıza)
 * Diyalog otomatik ilerler; dokununca hızlanır. Devam → onDone (home'da Stage 2
 * "Yakında" görünür). Ses şimdilik kutlama sfx; cümleler sonra seslendirilebilir.
 */
export function MosqueFinale({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState(0); // 0:line1 1:line2 2:showSomeone+devam
  const doneRef = useRef(false);

  const reveal = useSharedValue(0);
  const glow = useSharedValue(0);
  const pirilBounce = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    doneRef.current = false;
    setPhase(0);
    reveal.value = 0;
    reveal.value = withSequence(
      withTiming(1.06, { duration: 900, easing: Easing.out(Easing.back(1.6)) }),
      withSpring(1, { damping: 9 })
    );
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0.55, { duration: 1100 })), -1, true);
    pirilBounce.value = withDelay(
      300,
      withRepeat(withSequence(withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 420 })), 3, false)
    );
    playSfx("mashallah", 1.0);
    playSfx("star_earned", 0.7);
    setTimeout(() => playSfx("mosque_build", 0.6), 250);
    haptics.celebrate();

    const t1 = setTimeout(() => setPhase((p) => (p < 1 ? 1 : p)), LINE1);
    const t2 = setTimeout(() => setPhase((p) => (p < 2 ? 2 : p)), LINE1 + LINE2);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const revealStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, reveal.value), transform: [{ scale: 0.7 + reveal.value * 0.3 }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.35 + glow.value * 0.45, transform: [{ scale: 0.95 + glow.value * 0.12 }] }));
  const pirilStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -pirilBounce.value * 10 }, { scale: 1 + pirilBounce.value * 0.05 }] }));

  if (!visible) return null;

  // dokununca diyaloğu hızlandır
  const advance = () => {
    if (phase < 2) setPhase((p) => p + 1);
  };
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    playSfx("ui_tap");
    onDone();
  };

  const MOSQUE = Math.min(SCREEN_W * 0.82, 360);
  const lineKey = phase === 0 ? "finale.line1" : phase === 1 ? "finale.line2" : "finale.showSomeone";

  return (
    <Pressable
      onPress={advance}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0B3566", alignItems: "center", justifyContent: "center", paddingHorizontal: 22 }}
    >
      <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: "center" }}>
        <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 30, color: "#FFD36B", textAlign: "center", marginBottom: 8 }}>
          {t("finale.title")}
        </Text>

        {/* Cami — büyük reveal + sıcak parıltı (ışıklı/tamam) */}
        <View style={{ width: MOSQUE, height: MOSQUE, alignItems: "center", justifyContent: "center" }}>
          <Animated.View
            style={[{ position: "absolute", width: MOSQUE * 1.05, height: MOSQUE * 1.05, borderRadius: MOSQUE * 0.55, backgroundColor: "rgba(245,191,107,0.4)" }, glowStyle]}
          />
          {/* motif parıltıları */}
          <View style={{ position: "absolute", top: 4, right: MOSQUE * 0.1 }}>
            <Star8 size={30} color="#FFD36B" />
          </View>
          <View style={{ position: "absolute", top: MOSQUE * 0.18, left: MOSQUE * 0.04 }}>
            <Sparkle4 size={22} color="#FFE08A" />
          </View>
          <View style={{ position: "absolute", bottom: MOSQUE * 0.16, right: MOSQUE * 0.02 }}>
            <Crescent size={24} color="#FFD36B" />
          </View>
          <Animated.View style={revealStyle}>
            <Image source={images.mosque} style={{ width: MOSQUE, height: MOSQUE }} contentFit="contain" />
          </Animated.View>
        </View>

        {/* Pırıl konuşma balonu (sıralı diyalog) */}
        <View style={{ minHeight: 92, justifyContent: "flex-start", marginTop: 6 }}>
          <View
            key={phase}
            style={{ backgroundColor: "#FFFFFF", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, maxWidth: 340, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
          >
            <Animated.Text
              entering={FadeIn.duration(450)}
              style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 16, color: "#34414F", textAlign: "center", lineHeight: 22 }}
            >
              {t(lineKey)}
            </Animated.Text>
          </View>
        </View>

        {/* Pırıl — en büyük kutlama anı */}
        <Animated.View style={[{ marginTop: 2 }, pirilStyle]}>
          <Mascot size={120} pose="celebrate" />
        </Animated.View>

        {/* Devam — diyalog bitince */}
        <View style={{ width: "100%", maxWidth: 320, marginTop: 10, minHeight: 60 }}>
          {phase >= 2 && (
            <Animated.View entering={FadeIn.duration(400)}>
              <JuicyButton label={t("finale.continue")} tone="success" onPress={finish} />
            </Animated.View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

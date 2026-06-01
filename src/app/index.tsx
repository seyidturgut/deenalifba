import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Floating } from "@/components/ui/Floating";
import { GradientBg } from "@/components/ui/GradientBg";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/** Oyun-tarzı açılış: parıltı halkası, parlayan logo, pırıltılar, yükleniyor noktaları. */

/** Nabız atan altın parıltı halkası (logonun arkasında). */
function GlowRing() {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.82 + v.value * 0.26 }],
    opacity: 0.45 + v.value * 0.45,
  }));
  return (
    <Animated.Image
      source={images.nodeGlow}
      resizeMode="contain"
      style={[{ position: "absolute", width: 320, height: 320 }, style]}
    />
  );
}

/** Pırıltı (yıldız) — yavaşça parlayıp söner. */
function Sparkle({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: 700 }), withTiming(0.15, { duration: 700 })), -1, true)
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.6 + v.value * 0.6 }] }));
  return (
    <Animated.Image
      source={images.star}
      resizeMode="contain"
      style={[{ position: "absolute", left: x, top: y, width: size, height: size }, style]}
    />
  );
}

/** "Yükleniyor" zıplayan üç nokta. */
function LoadingDots() {
  return (
    <View className="flex-row gap-2">
      {[0, 1, 2].map((i) => <Dot key={i} delay={i * 160} />)}
    </View>
  );
}
function Dot({ delay }: { delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 360 }), withTiming(0, { duration: 360 })), -1, false));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -v.value * 8 }], opacity: 0.5 + v.value * 0.5 }));
  return <Animated.View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: "white" }, style]} />;
}

export default function Index() {
  const router = useRouter();
  const { t } = useTranslation();
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  // Logo'da hafif nefes (pulse)
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withDelay(450, withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, []);
  const titleStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.04 }] }));

  useEffect(() => {
    playSfx("welcome");
    const timer = setTimeout(() => {
      router.replace(onboardingComplete ? "/home" : "/onboarding");
    }, 2800);
    return () => clearTimeout(timer);
  }, [onboardingComplete, router]);

  return (
    <GradientBg>
      <View className="flex-1 items-center justify-center">
        {/* Pırıltılar */}
        <Sparkle x={40} y={140} size={22} delay={0} />
        <Sparkle x={300} y={90} size={16} delay={500} />
        <Sparkle x={70} y={360} size={14} delay={900} />
        <Sparkle x={290} y={330} size={20} delay={300} />

        {/* Parıltı halkası + maskot */}
        <View className="items-center justify-center" style={{ height: 280 }}>
          <GlowRing />
          <Animated.View entering={ZoomIn.springify().damping(9).mass(0.8)}>
            <Floating distance={12} duration={1500}>
              <Image source={images.mascot} style={{ width: 168, height: 168 }} contentFit="contain" />
            </Floating>
          </Animated.View>
        </View>

        {/* Logo — sticker stili (arka navy + ön mavi + beyaz hâle) */}
        <Animated.View entering={ZoomIn.delay(300).springify().damping(7)} style={[{ marginTop: 6 }, titleStyle]}>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <Text
              style={{
                position: "absolute",
                fontFamily: "Fredoka_700Bold",
                fontSize: 78,
                color: "#0B4FA6",
                transform: [{ translateY: 4 }],
              }}
            >
              Alif
            </Text>
            <Text
              style={{
                fontFamily: "Fredoka_700Bold",
                fontSize: 78,
                color: "#36A6FF",
                textShadowColor: "rgba(255,255,255,0.95)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 8,
              }}
            >
              Alif
            </Text>
          </View>
        </Animated.View>

        {/* Slogan — yumuşak pill */}
        <Animated.View
          entering={FadeIn.delay(750)}
          className="mt-3 rounded-full bg-white/80 px-5 py-2"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: "#34618C" }}>
            {t("onboarding.welcomeSubtitle")}
          </Text>
        </Animated.View>

        {/* Yükleniyor */}
        <Animated.View entering={FadeIn.delay(1100)} style={{ position: "absolute", bottom: 60 }}>
          <LoadingDots />
        </Animated.View>
      </View>
    </GradientBg>
  );
}

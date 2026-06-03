import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
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
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/** "Yükleniyor" zıplayan üç nokta. */
function Dot({ delay }: { delay: number }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 360 }), withTiming(0, { duration: 360 })), -1, false));
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -v.value * 7 }], opacity: 0.55 + v.value * 0.45 }));
  return <Animated.View style={[{ width: 11, height: 11, borderRadius: 6, backgroundColor: "#FFFFFF" }, style]} />;
}

/** Açılış: tasarım arka planı (gökyüzü + ışıklı halka), halka içinde süzülen Hüdhüd + logo. */
export default function Index() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width: W, height: H } = useWindowDimensions();
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

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

  const birdSize = Math.round(Math.min(W * 0.46, 200));
  const ringY = H * 0.37; // arka plandaki halkanın merkezi

  return (
    <View style={{ flex: 1, backgroundColor: "#BCD3F0" }}>
      <Image source={images.splashBg} style={StyleSheet.absoluteFill} contentFit="cover" />

      {/* Halkanın içinde süzülen Hüdhüd */}
      <Animated.View
        entering={ZoomIn.springify().damping(9).mass(0.8)}
        style={{ position: "absolute", top: ringY - birdSize / 2, left: 0, right: 0, alignItems: "center" }}
      >
        <Floating distance={10} duration={1600}>
          <Image source={images.hudhud} style={{ width: birdSize, height: birdSize }} contentFit="contain" />
        </Floating>
      </Animated.View>

      {/* "Alif" logosu */}
      <Animated.View
        entering={ZoomIn.delay(300).springify().damping(7)}
        style={[{ position: "absolute", top: H * 0.6, left: 0, right: 0, alignItems: "center" }, titleStyle]}
      >
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Text style={{ position: "absolute", fontFamily: "Fredoka_700Bold", fontSize: 78, color: "#0B4FA6", transform: [{ translateY: 4 }] }}>Alif</Text>
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

      {/* Slogan + altın süslü ayraç */}
      <Animated.View entering={FadeIn.delay(750)} style={{ position: "absolute", top: H * 0.6 + 78, left: 0, right: 0, alignItems: "center" }}>
        <Text
          style={{
            fontFamily: "Nunito_700Bold",
            fontSize: 16,
            color: "#1F4E79",
            textShadowColor: "rgba(255,255,255,0.95)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 5,
          }}
        >
          {t("onboarding.welcomeSubtitle")}
        </Text>
        <View className="mt-2.5 flex-row items-center gap-2">
          <View style={{ width: 64, height: 2, borderRadius: 2, backgroundColor: "rgba(193,138,40,0.6)" }} />
          <Text style={{ fontSize: 14, color: "#C18A28" }}>✦</Text>
          <View style={{ width: 64, height: 2, borderRadius: 2, backgroundColor: "rgba(193,138,40,0.6)" }} />
        </View>
      </Animated.View>

      {/* Yükleniyor */}
      <View style={{ position: "absolute", bottom: H * 0.085, left: 0, right: 0, alignItems: "center" }}>
        <View className="flex-row gap-2">
          {[0, 1, 2].map((i) => (
            <Dot key={i} delay={i * 160} />
          ))}
        </View>
      </View>
    </View>
  );
}

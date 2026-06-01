import { Image } from "expo-image";
import { useEffect } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

const { width: SCREEN_W } = Dimensions.get("window");

/**
 * Seviye sonu cami inşa kutsahnesi: yeni parça "yerine oturur" (pop + parıltı).
 * `visible` true olunca oynar, dokununca / ~2.4sn sonra `onDone`.
 */
export function MosqueBuild({
  visible,
  stageIndex,
  onDone,
}: {
  visible: boolean;
  stageIndex: number;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const pop = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    playSfx("mosque_build");
    if (hapticsEnabled) haptics.celebrate();
    pop.value = 0;
    glow.value = 0;
    pop.value = withSequence(
      withTiming(1.12, { duration: 360, easing: Easing.out(Easing.back(2)) }),
      withSpring(1, { damping: 9 })
    );
    glow.value = withSequence(withTiming(1, { duration: 300 }), withDelay(500, withTiming(0.55, { duration: 600 })));
    const tt = setTimeout(onDone, 2600);
    return () => clearTimeout(tt);
  }, [visible, stageIndex]);

  const imgStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.6 + pop.value * 0.4 }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.9 + glow.value * 0.3 }] }));

  if (!visible) return null;
  const idx = Math.min(Math.max(stageIndex, 0), images.mosqueStages.length - 1);

  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(8,38,74,0.62)",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
      }}
    >
      <Pressable onPress={onDone} style={{ alignItems: "center", justifyContent: "center", flex: 1, width: "100%" }}>
        {/* Oyun-popup kartı */}
        <Animated.View
          entering={ZoomIn.springify().damping(10)}
          style={{
            alignItems: "center",
            backgroundColor: "#FFFDF7",
            borderRadius: 34,
            borderWidth: 4,
            borderColor: "#FFD36B",
            paddingTop: 16,
            paddingBottom: 18,
            paddingHorizontal: 20,
            shadowColor: "#1462B5",
            shadowOpacity: 0.3,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 20, color: "#208AEF", textAlign: "center", marginBottom: 6 }}>
            {t("mosque.building")}
          </Text>
          <View style={{ width: SCREEN_W * 0.6, height: SCREEN_W * 0.6, alignItems: "center", justifyContent: "center" }}>
            {/* sıcak parıltı (kart içinde, camiyi öne çıkarır) */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  width: SCREEN_W * 0.56,
                  height: SCREEN_W * 0.56,
                  borderRadius: SCREEN_W * 0.28,
                  backgroundColor: "rgba(245,165,36,0.28)",
                },
                glowStyle,
              ]}
            />
            <Animated.View style={imgStyle}>
              <Image source={images.mosqueStages[idx]} style={{ width: SCREEN_W * 0.58, height: SCREEN_W * 0.58 }} contentFit="contain" />
            </Animated.View>
          </View>
        </Animated.View>

        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 18 }}>
          {t("mosque.tapContinue")}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

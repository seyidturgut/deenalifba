import { Image } from "expo-image";
import { useEffect } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
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
const HOLD = 850; // önceki aşamayı bu kadar göster, sonra büyümeye geç
const GROW = 800; // geçiş süresi

/**
 * Seviye sonu cami inşa kutsahnesi: ÖNCE önceki aşama gösterilir, SONRA yeni parça
 * büyüyerek/parıldayarak belirir (crossfade + pop + parıltı) → çocuk "nereden nereye"
 * geldiğini görür. `visible` true olunca oynar, dokununca / otomatik `onDone`.
 *
 * NOT: Giriş animasyonları shared-value ile yapılır (Reanimated `entering` RNW'de
 * güvenilir değil → backdrop/kart açılmıyordu).
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

  const appear = useSharedValue(0); // backdrop + genel görünürlük
  const cardScale = useSharedValue(0.8); // popup kart giriş
  const newOpacity = useSharedValue(0); // yeni aşama belirir
  const prevOpacity = useSharedValue(1); // önceki aşama solar
  const pop = useSharedValue(0); // yeni aşama "yerine oturma"
  const glow = useSharedValue(0); // büyüme anı parıltısı
  const sparkle = useSharedValue(0); // yıldız parçacıkları

  const idx = Math.min(Math.max(stageIndex, 0), images.mosqueStages.length - 1);
  const hasPrev = idx > 0;
  const prevIdx = hasPrev ? idx - 1 : idx;

  useEffect(() => {
    if (!visible) return;
    if (hapticsEnabled) haptics.tap();

    // giriş (web+native güvenli)
    appear.value = 0;
    appear.value = withTiming(1, { duration: 220 });
    cardScale.value = 0.8;
    cardScale.value = withSequence(withTiming(1.04, { duration: 240, easing: Easing.out(Easing.back(2)) }), withSpring(1, { damping: 10 }));

    newOpacity.value = hasPrev ? 0 : 1;
    prevOpacity.value = hasPrev ? 1 : 0;
    pop.value = 0;
    glow.value = 0;
    sparkle.value = 0;

    if (hasPrev) {
      newOpacity.value = withDelay(HOLD, withTiming(1, { duration: GROW, easing: Easing.out(Easing.cubic) }));
      prevOpacity.value = withDelay(HOLD, withTiming(0, { duration: GROW * 0.7 }));
      pop.value = withDelay(
        HOLD,
        withSequence(withTiming(1.1, { duration: 320, easing: Easing.out(Easing.back(2)) }), withSpring(1, { damping: 9 }))
      );
      glow.value = withDelay(HOLD - 80, withSequence(withTiming(1, { duration: 360 }), withDelay(500, withTiming(0.5, { duration: 700 }))));
      sparkle.value = withDelay(HOLD, withSequence(withTiming(1, { duration: 360 }), withDelay(450, withTiming(0, { duration: 700 }))));
      const st = setTimeout(() => {
        playSfx("mosque_build");
        if (hapticsEnabled) haptics.celebrate();
      }, HOLD);
      const tt = setTimeout(onDone, HOLD + GROW + 1500);
      return () => {
        clearTimeout(st);
        clearTimeout(tt);
      };
    } else {
      playSfx("mosque_build");
      if (hapticsEnabled) haptics.celebrate();
      pop.value = withSequence(withTiming(1.12, { duration: 360, easing: Easing.out(Easing.back(2)) }), withSpring(1, { damping: 9 }));
      glow.value = withSequence(withTiming(1, { duration: 300 }), withDelay(500, withTiming(0.55, { duration: 600 })));
      const tt = setTimeout(onDone, 2400);
      return () => clearTimeout(tt);
    }
  }, [visible, stageIndex]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: appear.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: appear.value, transform: [{ scale: cardScale.value }] }));
  const newStyle = useAnimatedStyle(() => ({ opacity: newOpacity.value, transform: [{ scale: 0.62 + pop.value * 0.38 }] }));
  const prevStyle = useAnimatedStyle(() => ({ opacity: prevOpacity.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.9 + glow.value * 0.3 }] }));
  const sparkleStyle = useAnimatedStyle(() => ({ opacity: sparkle.value, transform: [{ scale: 0.6 + sparkle.value * 0.6 }] }));

  if (!visible) return null;

  const BOX = SCREEN_W * 0.6;
  const IMG = SCREEN_W * 0.58;

  return (
    <Animated.View
      style={[
        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(8,38,74,0.62)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
        backdropStyle,
      ]}
    >
      <Pressable onPress={onDone} style={{ alignItems: "center", justifyContent: "center", flex: 1, width: "100%" }}>
        {/* Oyun-popup kartı */}
        <Animated.View
          style={[
            {
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
            },
            cardStyle,
          ]}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 20, color: "#208AEF", textAlign: "center", marginBottom: 6 }}>
            {t("mosque.building")}
          </Text>
          <View style={{ width: BOX, height: BOX, alignItems: "center", justifyContent: "center" }}>
            {/* sıcak parıltı (büyüme anı) */}
            <Animated.View
              style={[
                { position: "absolute", width: SCREEN_W * 0.56, height: SCREEN_W * 0.56, borderRadius: SCREEN_W * 0.28, backgroundColor: "rgba(245,165,36,0.3)" },
                glowStyle,
              ]}
            />
            {/* önceki aşama (solar) */}
            {hasPrev && (
              <Animated.View style={[{ position: "absolute", width: IMG, height: IMG }, prevStyle]}>
                <Image source={images.mosqueStages[prevIdx]} style={{ width: IMG, height: IMG }} contentFit="contain" />
              </Animated.View>
            )}
            {/* yeni aşama (büyüyerek belirir) */}
            <Animated.View style={[{ position: "absolute", width: IMG, height: IMG }, newStyle]}>
              <Image source={images.mosqueStages[idx]} style={{ width: IMG, height: IMG }} contentFit="contain" />
            </Animated.View>
            {/* parıltı yıldızları (yeni parça vurgusu) */}
            {hasPrev && (
              <>
                <Animated.View style={[{ position: "absolute", top: 6, right: BOX * 0.18 }, sparkleStyle]}>
                  <Image source={images.star} style={{ width: 34, height: 34 }} contentFit="contain" />
                </Animated.View>
                <Animated.View style={[{ position: "absolute", top: BOX * 0.3, left: BOX * 0.1 }, sparkleStyle]}>
                  <Image source={images.star} style={{ width: 24, height: 24 }} contentFit="contain" />
                </Animated.View>
              </>
            )}
          </View>
        </Animated.View>

        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 18 }}>
          {t("mosque.tapContinue")}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

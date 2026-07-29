import { Image } from "expo-image";
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Mascot } from "@/components/ui/Mascot";
import { Star8 } from "@/components/ui/IslamicMotifs";
import { ACTIVITY_META } from "@/data/lesson";
import type { ActivityKind } from "@/data/types";
import { haptics } from "@/lib/haptics";
import { mascotVars } from "@/lib/mascot";
import { playNarration, playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * "Yeni oyun!" anı — mini-oyunlar kademeli açıldığı için (bkz. GAME_UNLOCKS) çocuk
 * bir oyunu İLK kez oynayacağı an bunu bir ödül olarak yaşar.
 *
 * Can (AdMob/Voodoo, Sohail üzerinden): "Yeni mini-oyunlar ilerleme ödülü olarak
 * açılsın — çocuğa devam etmek için sebep verir."
 */
const AUTO_MS = 7000; // çocuk dokunmazsa kendiliğinden devam (Pırıl anlatımı ~3.9sn sürüyor)

export function NewGameUnlock({
  visible,
  kind,
  onDone,
}: {
  visible: boolean;
  kind: ActivityKind | null;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const doneRef = useRef(false);

  const appear = useSharedValue(0);
  const card = useSharedValue(0.82);
  const iconPop = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (!visible || !kind) return;
    doneRef.current = false;
    appear.value = 0;
    appear.value = withTiming(1, { duration: 220 });
    card.value = 0.82;
    card.value = withSequence(withTiming(1.05, { duration: 260, easing: Easing.out(Easing.back(2.4)) }), withSpring(1, { damping: 10 }));
    iconPop.value = 0;
    iconPop.value = withDelay(180, withSequence(withTiming(1.25, { duration: 300, easing: Easing.out(Easing.back(3)) }), withSpring(1, { damping: 8 })));
    glow.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.35, { duration: 900 })), -1, false);

    haptics.celebrate();
    playSfx("star_earned");
    playSfx("correct_ding", 0.6);
    // Pırıl: "Vay canına! Yeni bir oyun açıldı! Hadi hemen deneyelim!"
    const nt = setTimeout(() => playNarration(language, "newGame"), 500);
    const auto = setTimeout(() => finish(), AUTO_MS);
    return () => {
      clearTimeout(nt);
      clearTimeout(auto);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, kind]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  const backdropStyle = useAnimatedStyle(() => ({ opacity: appear.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: appear.value, transform: [{ scale: card.value }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.6 + iconPop.value * 0.4 }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.25 + glow.value * 0.4, transform: [{ scale: 0.94 + glow.value * 0.14 }] }));

  if (!visible || !kind) return null;

  const meta = ACTIVITY_META[kind];

  return (
    <Animated.View
      style={[
        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(11,53,102,0.92)", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
        backdropStyle,
      ]}
    >
      <Pressable onPress={finish} style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={[
            {
              alignItems: "center",
              backgroundColor: "#FFFDF7",
              borderRadius: 34,
              borderWidth: 4,
              borderColor: "#FFD36B",
              paddingTop: 18,
              paddingBottom: 22,
              paddingHorizontal: 26,
              shadowColor: "#1462B5",
              shadowOpacity: 0.3,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
            },
            cardStyle,
          ]}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#F5A524", textAlign: "center" }}>
            {t("learn.newGameTitle")}
          </Text>

          {/* Oyunun ikonu — parlayan halka içinde */}
          <View style={{ width: 168, height: 168, alignItems: "center", justifyContent: "center", marginTop: 6 }}>
            <Animated.View
              style={[{ position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "#F5A524" }, glowStyle]}
            />
            <Animated.View style={iconStyle}>
              {meta.icon ? (
                <Image source={meta.icon} style={{ width: 116, height: 116 }} contentFit="contain" />
              ) : (
                <Text style={{ fontSize: 84 }}>{meta.emoji ?? "🎮"}</Text>
              )}
            </Animated.View>
            <View style={{ position: "absolute", top: 2, right: 6 }}>
              <Star8 size={30} color="#FFD36B" />
            </View>
            <View style={{ position: "absolute", bottom: 6, left: 2 }}>
              <Star8 size={20} color="#3FB984" />
            </View>
          </View>

          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 22, color: "#208AEF", textAlign: "center" }}>
            {t(meta.labelKey)}
          </Text>

          <View style={{ marginTop: 4 }}>
            <Mascot size={104} pose="celebrate" />
          </View>

          <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: "#5B6B7C", textAlign: "center", marginTop: 2 }}>
            {t("learn.newGameHint", mascotVars())}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

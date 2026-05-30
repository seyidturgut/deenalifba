import { Image } from "expo-image";
import { useEffect, useMemo } from "react";
import { Dimensions, Text, View } from "react-native";
import Animated, {
  Easing,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

const { width: SCREEN_W } = Dimensions.get("window");
const COLORS = ["#F5A524", "#37ACFF", "#3FB984", "#FF6B9D", "#FFD93D", "#8B5CF6"];
const PIECE_COUNT = 28;

type PieceConf = {
  startX: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  rot: number;
  delay: number;
};

function ConfettiPiece({ conf }: { conf: PieceConf }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) });
  }, [p]);

  const style = useAnimatedStyle(() => {
    const t = p.value;
    const x = conf.vx * t;
    const y = conf.vy * t + 900 * t * t * 0.5; // yerçekimi
    return {
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${conf.rot * t}deg` }],
      opacity: 1 - Math.max(0, t - 0.7) / 0.3,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 120,
          left: conf.startX,
          width: conf.size,
          height: conf.size * 0.6,
          backgroundColor: conf.color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

/**
 * Tam ekran kutlama: konfeti yağmuru + büyüyen yıldız + "Aferin!" + ses + haptik.
 * `visible` true olunca tetiklenir, ~1.8s sonra `onDone` çağrılır.
 */
export function Celebration({
  visible,
  onDone,
  title,
}: {
  visible: boolean;
  onDone: () => void;
  title?: string;
}) {
  const { t: translate } = useTranslation();
  const heading = title ?? translate("common.great");
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const pieces = useMemo<PieceConf[]>(
    () =>
      Array.from({ length: PIECE_COUNT }, () => ({
        startX: SCREEN_W * 0.5 + (Math.random() - 0.5) * 60,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 8 + Math.random() * 8,
        vx: (Math.random() - 0.5) * SCREEN_W * 1.1,
        vy: -180 - Math.random() * 220,
        rot: (Math.random() - 0.5) * 720,
        delay: Math.random() * 120,
      })),
    // her gösterimde yeni konfeti
    [visible]
  );

  useEffect(() => {
    if (!visible) return;
    playSfx("letter_complete");
    playSfx("confetti_pop", 0.7);
    playSfx("star_earned", 0.8);
    if (hapticsEnabled) haptics.celebrate();
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [visible, hapticsEnabled, onDone]);

  if (!visible) return null;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 }}
    >
      {pieces.map((conf, i) => (
        <ConfettiPiece key={i} conf={conf} />
      ))}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Animated.View entering={ZoomIn.springify()} style={{ alignItems: "center" }}>
          <Image source={images.star} style={{ width: 120, height: 120 }} contentFit="contain" />
          <Text
            style={{
              marginTop: 8,
              fontSize: 38,
              fontFamily: "Fredoka_700Bold",
              color: "#F5A524",
              textShadowColor: "rgba(255,255,255,0.9)",
              textShadowRadius: 8,
            }}
          >
            {heading}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

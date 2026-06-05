import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useStageStore } from "@/stores/stageStore";

/**
 * CheerOverlay — oyun/tur sonu coşkulu geri bildirim: büyük "Aferin!" + konfeti.
 * stageStore.celebrate() çağrılınca kısa süre (≈1.3sn) görünür. pointerEvents none.
 */
const COLORS = ["#FF8FA3", "#6FB1FF", "#7ED99B", "#FFD166", "#C792EA", "#FF9F5A"];

function Piece({ prog, x, color, rot, sy, H }: { prog: any; x: number; color: number | string; rot: number; sy: number; H: number }) {
  const st = useAnimatedStyle(() => ({
    opacity: 1 - prog.value * prog.value,
    transform: [{ translateX: x }, { translateY: sy + prog.value * (H * 0.72) }, { rotate: `${prog.value * rot * 360}deg` }],
  }));
  return <Animated.View style={[{ position: "absolute", left: 0, top: 0, width: 12, height: 16, borderRadius: 3, backgroundColor: color as string }, st]} />;
}

export function CheerOverlay() {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const celebrateN = useStageStore((s) => s.celebrateN);
  const [show, setShow] = useState(false);
  const prog = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    if (celebrateN === 0) return;
    setShow(true);
    prog.value = 0;
    prog.value = withTiming(1, { duration: 1300, easing: Easing.linear });
    pop.value = 0;
    pop.value = withSequence(
      withTiming(1.12, { duration: 220, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 160 }),
      withDelay(560, withTiming(0, { duration: 300 }))
    );
    const id = setTimeout(() => setShow(false), 1380);
    return () => clearTimeout(id);
  }, [celebrateN]);

  const pieces = useMemo(
    () => Array.from({ length: 16 }, (_, i) => ({ x: (i * 53) % Math.max(1, Math.round(width)), color: COLORS[i % COLORS.length], rot: (i % 2 ? 1 : -1) * (1 + (i % 3)), sy: -24 - (i % 5) * 28 })),
    [width, celebrateN]
  );

  const textStyle = useAnimatedStyle(() => ({ opacity: pop.value > 0.02 ? 1 : 0, transform: [{ scale: pop.value }, { translateY: (1 - pop.value) * -10 }] }));

  if (!show) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((p, i) => (
        <Piece key={i} prog={prog} x={p.x} color={p.color} rot={p.rot} sy={p.sy} H={height} />
      ))}
      <Animated.View style={[{ position: "absolute", left: 0, right: 0, top: height * 0.3, alignItems: "center" }, textStyle]}>
        <Text
          style={{
            fontFamily: "Fredoka_700Bold",
            fontSize: 52,
            color: "#36A6FF",
            textShadowColor: "rgba(255,255,255,0.95)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 8,
          }}
        >
          {t("common.great")}
        </Text>
      </Animated.View>
    </View>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { Motif, type MotifKind, REWARD_COLORS } from "./IslamicMotifs";
import { comboLevel } from "@/lib/sfx";
import { useStageStore } from "@/stores/stageStore";

/**
 * Doğru cevap ANI — genişleyen ışık halkası + dışa saçılan motifler.
 *
 * Can (AdMob/Voodoo, Sohail üzerinden): "Doğru cevaplar renk, animasyon ve sesle
 * anında tatmin edici bir geri bildirim vermeli." Önceden yalnız host'un küçük
 * sevinci vardı; cevabın verildiği yerde hiçbir şey olmuyordu.
 *
 * Efektin şiddeti SERİYE bağlı (comboLevel): üst üste doğru yapan çocuk giderek
 * daha büyük bir patlama görür — sesin yükselen perdesiyle aynı ritim.
 * Dokunmayı engellemez (pointerEvents none).
 */
const KINDS: MotifKind[] = ["sparkle4", "star8", "crescent", "sparkle4", "star8", "sparkle4"];
const DURATION = 620;

function Shard({ prog, angle, dist, size, color, kind }: { prog: any; angle: number; dist: number; size: number; color: string; kind: MotifKind }) {
  const style = useAnimatedStyle(() => {
    const p = prog.value;
    return {
      opacity: 1 - p * p,
      transform: [
        { translateX: Math.cos(angle) * dist * p },
        { translateY: Math.sin(angle) * dist * p },
        { scale: 0.5 + (1 - p) * 0.7 },
        { rotate: `${p * 180}deg` },
      ],
    };
  });
  return (
    <Animated.View style={[{ position: "absolute" }, style]}>
      <Motif kind={kind} size={size} color={color} />
    </Animated.View>
  );
}

export function CorrectBurst() {
  const { width, height } = useWindowDimensions();
  const cheerN = useStageStore((s) => s.cheerN);
  const [show, setShow] = useState(false);
  const [level, setLevel] = useState(1);
  const prog = useSharedValue(0);

  useEffect(() => {
    if (cheerN === 0) return;
    setLevel(Math.max(1, comboLevel()));
    setShow(true);
    prog.value = 0;
    prog.value = withTiming(1, { duration: DURATION, easing: Easing.out(Easing.cubic) });
    const id = setTimeout(() => setShow(false), DURATION + 60);
    return () => clearTimeout(id);
  }, [cheerN]);

  // Seri büyüdükçe daha çok parça, daha geniş saçılma
  const shards = useMemo(() => {
    const n = 6 + level * 2;
    return Array.from({ length: n }, (_, i) => ({
      angle: (i / n) * Math.PI * 2 + (i % 2 ? 0.32 : 0),
      dist: 74 + level * 16 + (i % 3) * 18,
      size: 16 + (i % 3) * 7 + level * 2,
      color: REWARD_COLORS[i % REWARD_COLORS.length],
      kind: KINDS[i % KINDS.length],
    }));
  }, [level]);

  const ringStyle = useAnimatedStyle(() => {
    const p = prog.value;
    return {
      opacity: (1 - p) * 0.8,
      transform: [{ scale: 0.25 + p * (1.5 + level * 0.22) }],
    };
  });

  if (!show) return null;

  const RING = 170;

  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", left: 0, top: 0, width, height, alignItems: "center", justifyContent: "center" }}
    >
      {/* Genişleyen ışık halkası */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: RING,
            height: RING,
            borderRadius: RING / 2,
            borderWidth: 11,
            borderColor: "#FFB020",
          },
          ringStyle,
        ]}
      />
      {shards.map((s, i) => (
        <Shard key={i} prog={prog} angle={s.angle} dist={s.dist} size={s.size} color={s.color} kind={s.kind} />
      ))}
    </View>
  );
}

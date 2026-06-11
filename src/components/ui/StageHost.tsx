import { Image } from "expo-image";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { images } from "@/lib/images";
import { Mascot, type MascotPose } from "./Mascot";
import { useStageStore } from "@/stores/stageStore";

/**
 * StageHost — oyun-içi büyük "sunucu" Hüdhüd. Alt köşede sahnede durur, stageStore
 * ruh haline göre tepki verir (idle/sevinç/kutlama/sallanma) + doğru cevapta yıldız patlaması.
 * pointerEvents none → oyun dokunuşlarını engellemez.
 */
const A = Animated.createAnimatedComponent(Image);
const MOOD_POSE: Record<string, MascotPose> = { idle: "point", happy: "happy", celebrate: "celebrate", oops: "idle" };

function PuffStar({ p, cx, cy, dx, dy }: { p: any; cx: number; cy: number; dx: number; dy: number }) {
  const st = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    transform: [{ translateX: dx * 42 * p.value }, { translateY: dy * 48 * p.value }, { scale: 0.4 + p.value * 0.7 }],
  }));
  return <A source={images.star} style={[{ position: "absolute", left: cx - 12, top: cy - 12, width: 24, height: 24 }, st]} contentFit="contain" />;
}

function Puff({ seq, cx, cy }: { seq: number; cx: number; cy: number }) {
  const p = useSharedValue(1); // 1 = gizli (dinlenme); cheer'de 0→1 oynar
  useEffect(() => {
    if (seq > 0) {
      p.value = 0;
      p.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
    }
  }, [seq]);
  const dirs: [number, number][] = [
    [-1, -1],
    [0, -1.3],
    [1, -0.9],
    [0.6, -0.3],
  ];
  return (
    <>
      {dirs.map(([dx, dy], i) => (
        <PuffStar key={i} p={p} cx={cx} cy={cy} dx={dx} dy={dy} />
      ))}
    </>
  );
}

export function StageHost({ size = 120, onReplay }: { size?: number; onReplay?: () => void }) {
  const mood = useStageStore((s) => s.mood);
  const cheerN = useStageStore((s) => s.cheerN);

  const shake = useSharedValue(0);
  useEffect(() => {
    if (mood === "oops") {
      shake.value = withSequence(
        withTiming(-1, { duration: 60 }),
        withTiming(1, { duration: 60 }),
        withTiming(-1, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
    }
  }, [mood]);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value * 6 }] }));

  return (
    <View pointerEvents="box-none" style={{ position: "absolute", left: -6, bottom: -8, width: size + 60, height: size + 72 }}>
      {/* zemin bulutu */}
      <Image pointerEvents="none" source={images.nodeCloud} style={{ position: "absolute", bottom: 6, left: 8, width: size * 1.02, height: size * 0.42 }} contentFit="contain" />
      {/* doğru cevap yıldız patlaması (baş hizası) */}
      <Puff seq={cheerN} cx={8 + size / 2} cy={size * 0.34} />
      {/* host — dokununca harf sesini tekrar çalar (etiketsiz replay) */}
      <Animated.View style={[{ position: "absolute", bottom: 20, left: 6 }, shakeStyle]}>
        <Mascot size={size} pose={MOOD_POSE[mood]} onTap={onReplay} />
      </Animated.View>
    </View>
  );
}

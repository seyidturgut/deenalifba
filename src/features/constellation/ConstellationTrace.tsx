import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Polyline } from "react-native-svg";

import { getStars } from "@/data/constellations";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";

/**
 * "Takımyıldız" çizim adımı: harfin üzerindeki numaralı yıldızları SIRAYLA birleştir.
 * Doğru sıradaki yıldıza dokun/sürükle → yıldız yanar + önceki yıldızdan ışıltılı çizgi
 * (grup/stroke kopukluğunda çizgi yok). Tamamlanınca harf altın yanar → onComplete.
 * Ceza yok: yanlış/erken dokunuş ilerletmez.
 */
type OrderStar = { x: number; y: number; group: number; label: number };

function StarDot({
  x,
  y,
  label,
  state,
}: {
  x: number;
  y: number;
  label: number;
  state: "done" | "next" | "todo";
}) {
  const SIZE = state === "next" ? 50 : 42;
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (state === "next") {
      pulse.value = withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0, { duration: 600 })), -1, false);
    } else {
      pulse.value = 0;
    }
  }, [state]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.18 }] }));
  const dim = state === "todo";
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", left: x - SIZE / 2, top: y - SIZE / 2, width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <Image source={images.star} style={{ width: SIZE, height: SIZE, opacity: dim ? 0.4 : 1 }} contentFit="contain" />
      {/* Sıra numarası — köşe rozeti (yüzü kapatmasın) */}
      {state !== "done" && (
        <View
          style={{
            position: "absolute",
            right: -2,
            top: -2,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 3,
            borderRadius: 9,
            backgroundColor: state === "next" ? "#208AEF" : "rgba(90,100,112,0.6)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 11, color: "white" }}>{label}</Text>
        </View>
      )}
    </Animated.View>
  );
}

export function ConstellationTrace({
  letterChar,
  letterId,
  onComplete,
  resetSignal = 0,
}: {
  letterChar: string;
  letterId: number;
  onComplete: () => void;
  resetSignal?: number;
}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [next, setNext] = useState(0);
  const [done, setDone] = useState(false);

  // Yıldızları sıralı tek listeye düz (grup bilgisini koruyarak)
  const order = useMemo<OrderStar[]>(() => {
    const groups = getStars(letterId) ?? [];
    const out: OrderStar[] = [];
    groups.forEach((g, gi) => g.forEach(([x, y]) => out.push({ x, y, group: gi, label: out.length + 1 })));
    return out;
  }, [letterId]);
  const total = order.length;

  const nextRef = useRef(0);
  nextRef.current = next;
  const doneRef = useRef(false);
  doneRef.current = done;

  useEffect(() => {
    setNext(0);
    setDone(false);
  }, [resetSignal, letterId]);

  const px = (s: OrderStar): [number, number] => [s.x * size.w, s.y * size.h];

  const tryConnect = (gx: number, gy: number) => {
    if (doneRef.current || size.w === 0) return;
    const i = nextRef.current;
    if (i >= total) return;
    const [sx, sy] = px(order[i]);
    const R = Math.min(size.w, size.h) * 0.16;
    if (Math.hypot(gx - sx, gy - sy) <= R) {
      const n = i + 1;
      setNext(n);
      haptics.tap();
      playSfx("trace_start", 0.6);
      if (n >= total) {
        setDone(true);
        haptics.success();
        playSfx("trace_success");
        playSfx("star_earned", 0.8);
        setTimeout(onComplete, 700);
      }
    }
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => runOnJS(tryConnect)(e.x, e.y))
        .onUpdate((e) => runOnJS(tryConnect)(e.x, e.y)),
    // tryConnect güncel state'i ref'ten okur
    [size.w, size.h, total]
  );

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  // Birleşmiş ardışık (aynı grup) yıldızlar arası çizgiler
  const lines: string[] = [];
  for (let i = 1; i < next; i++) {
    if (order[i].group === order[i - 1].group) {
      const [ax, ay] = px(order[i - 1]);
      const [bx, by] = px(order[i]);
      lines.push(`${ax},${ay} ${bx},${by}`);
    }
  }

  return (
    <GestureDetector gesture={pan}>
      <View onLayout={onLayout} className="overflow-hidden" style={{ flex: 1, width: "100%" }}>
        {size.w > 0 && (
          <>
            {/* Silik harf kılavuzu (RN Text, ortalı) */}
            <View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
              <Text
                style={{
                  fontFamily: "Amiri_700Bold",
                  fontSize: Math.min(size.w, size.h) * 0.78,
                  lineHeight: Math.min(size.w, size.h) * 0.78,
                  color: done ? "#F5C451" : "#B7C6DA",
                  includeFontPadding: false,
                  transform: [{ translateY: -size.h * 0.085 }],
                  textShadowColor: "rgba(255,255,255,0.85)",
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 3,
                }}
              >
                {letterChar}
              </Text>
            </View>

            {/* Işıltılı bağlantı çizgileri */}
            <Svg width={size.w} height={size.h} style={{ position: "absolute", left: 0, top: 0 }} pointerEvents="none">
              {lines.map((pts, i) => (
                <Polyline key={`g${i}`} points={pts} stroke="rgba(245,196,81,0.35)" strokeWidth={12} strokeLinecap="round" fill="none" />
              ))}
              {lines.map((pts, i) => (
                <Polyline key={`l${i}`} points={pts} stroke="#F5C451" strokeWidth={5} strokeLinecap="round" fill="none" />
              ))}
            </Svg>

            {/* Yıldızlar */}
            {order.map((s, i) => {
              const [sx, sy] = px(s);
              const state = done || i < next ? "done" : i === next ? "next" : "todo";
              return <StarDot key={i} x={sx} y={sy} label={s.label} state={state} />;
            })}
          </>
        )}
      </View>
    </GestureDetector>
  );
}

import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, ClipPath, Defs, G, Path } from "react-native-svg";

import { getLetterPath, PATH_BOX } from "@/data/letterPaths";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playLetter, playSfx } from "@/lib/sfx";
import { useStageStore } from "@/stores/stageStore";

/**
 * "Sihirli Boya" — harf çizim adımı (Lingokids tarzı, YAZISIZ):
 * GERÇEK Amiri glif konturu noktalı (dashed) gösterilir; çocuk parmağıyla harfin
 * üzerini boyar → renk yalnız HARFİN İÇİNDE belirir (clip). ~%85 dolunca harf
 * altın yanar + kutlama → onComplete. Ceza yok: dışarı taşmak hiçbir şey yapmaz.
 * Başta el işareti kısa bir karalama demosu yapar (okuma gerektirmez).
 */
const PAINT_R = 72; // boya damlası yarıçapı (glif birimi)
const COVER_R = 100; // ilerleme sayımı yarıçapı (biraz cömert)
const MIN_DIST = 30; // kaydedilen iki nokta arası min mesafe (glif birimi)
const DONE_RATIO = 0.85;

type Drop = { x: number; y: number; c: string };

const dropColor = (x: number, y: number) => `hsl(${Math.round(((x + y) / (PATH_BOX * 2)) * 280)}, 85%, 62%)`;

/** Başlangıç demo eli — harfin ortasında küçük karalama turları atar. */
function HintHand({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, []);
  const style = useAnimatedStyle(() => {
    const a = t.value * Math.PI * 2;
    return {
      transform: [
        { translateX: cx + Math.cos(a * 2) * r },
        { translateY: cy + Math.sin(a * 3) * r * 0.6 },
      ],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -23, top: -10, width: 46, height: 46 }, style]}>
      <Image source={images.handPointer} style={{ width: 46, height: 46 }} contentFit="contain" />
    </Animated.View>
  );
}

export function PaintTrace({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const lp = getLetterPath(letterId);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [drops, setDrops] = useState<Drop[]>([]);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);

  const coveredRef = useRef<Set<number>>(new Set());
  const lastRef = useRef<[number, number] | null>(null);
  const doneRef = useRef(false);
  const tickRef = useRef(0);

  // tamamlanınca harf "pop" yapar
  const pop = useSharedValue(1);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  useEffect(() => {
    // sıfırla (harf değişimi)
    coveredRef.current = new Set();
    lastRef.current = null;
    doneRef.current = false;
    setDrops([]);
    setDone(false);
    setTouched(false);
    const tt = setTimeout(() => playLetter(letterId), 350);
    return () => clearTimeout(tt);
  }, [letterId]);

  const side = Math.min(size.w, size.h);
  const s = side / PATH_BOX;
  const ox = (size.w - side) / 2;
  const oy = (size.h - side) / 2;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setDone(true);
    pop.value = withSequence(
      withTiming(1.08, { duration: 260, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 200 })
    );
    haptics.success();
    playSfx("trace_success");
    playSfx("star_earned", 0.8);
    useStageStore.getState().celebrate();
    setTimeout(onComplete, 900);
  };

  const paintAt = (px: number, py: number) => {
    if (doneRef.current || !lp || side === 0) return;
    const gx = (px - ox) / s;
    const gy = (py - oy) / s;
    if (gx < 0 || gy < 0 || gx > PATH_BOX || gy > PATH_BOX) return;
    const last = lastRef.current;
    if (last && Math.hypot(gx - last[0], gy - last[1]) < MIN_DIST) return;
    lastRef.current = [gx, gy];
    setTouched(true);
    setDrops((prev) => (prev.length > 700 ? prev : [...prev, { x: gx, y: gy, c: dropColor(gx, gy) }]));

    // ilerleme: yakın iç noktaları kapat
    const covered = coveredRef.current;
    const inner = lp.inner;
    for (let i = 0; i < inner.length; i++) {
      if (covered.has(i)) continue;
      const dx = inner[i][0] - gx;
      const dy = inner[i][1] - gy;
      if (dx * dx + dy * dy <= COVER_R * COVER_R) covered.add(i);
    }
    tickRef.current++;
    if (tickRef.current % 6 === 0) {
      haptics.tap();
      playSfx("trace_start", 0.35);
    }
    if (covered.size / inner.length >= DONE_RATIO) finish();
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => runOnJS(paintAt)(e.x, e.y))
        .onUpdate((e) => runOnJS(paintAt)(e.x, e.y)),
    [side, ox, oy, letterId]
  );

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  if (!lp) return null;
  const clipId = `letter-clip-${letterId}`;

  return (
    <GestureDetector gesture={pan}>
      <View onLayout={onLayout} style={{ flex: 1, width: "100%" }}>
        {side > 0 && (
          <Animated.View style={[{ width: size.w, height: size.h }, popStyle]}>
            <Svg width={size.w} height={size.h}>
              <Defs>
                <ClipPath id={clipId}>
                  <Path d={lp.d} />
                </ClipPath>
              </Defs>
              <G transform={`translate(${ox},${oy}) scale(${s})`}>
                {/* Boş harf zemini + noktalı kontur (Lingokids görünümü) */}
                <Path
                  d={lp.d}
                  fill={done ? "#F5C451" : "rgba(255,255,255,0.92)"}
                  stroke={done ? "#E8A93C" : "#8FA8C8"}
                  strokeWidth={10}
                  strokeDasharray={done ? undefined : "30 24"}
                  strokeLinecap="round"
                />
                {/* Boya — yalnız harfin içinde görünür */}
                {!done && (
                  <G clipPath={`url(#${clipId})`}>
                    {drops.map((d, i) => (
                      <Circle key={i} cx={d.x} cy={d.y} r={PAINT_R} fill={d.c} opacity={0.85} />
                    ))}
                  </G>
                )}
              </G>
            </Svg>
            {/* Demo eli — ilk dokunuşa kadar */}
            {!touched && !done && <HintHand cx={ox + side / 2} cy={oy + side / 2} r={side * 0.16} />}
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
}

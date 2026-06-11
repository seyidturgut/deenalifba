import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useStageStore } from "@/stores/stageStore";
import { getLetter, LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playLetter, playSfx } from "@/lib/sfx";

/**
 * "Balon Patlat" (balloon): hedef harf SESLİ söylenir. Harfli balonlar aşağıdan
 * yukarı süzülür; çocuk DOĞRU harfli balonları patlatır (dokun) → balon patlama
 * efektiyle (pop_burst + balloon_pop) patlar. 3 doğru → biter. Yanlış → sallanır.
 * YAZISIZ — patlatma mekaniği bariz, hedef ses.
 */
const NEED = 3;
const BW = 76; // balon sprite genişliği
const BSPRITE = Math.round(BW / 0.55); // sprite oranı (ip dahil) ≈ 138
// Tek pembe sprite'ı kodla renklendirmek için gövdeye binen renk katmanı paleti
const TINTS = ["#FF7DA0", "#5AA6FF", "#5FD389", "#FFC24D", "#B58CF0", "#FF9A5A"];

function Balloon({
  char,
  isTarget,
  tint,
  left,
  delay,
  duration,
  areaH,
  gameOver,
  onPop,
}: {
  char: string;
  isTarget: boolean;
  tint: string;
  left: number;
  delay: number;
  duration: number;
  areaH: number;
  gameOver: boolean;
  onPop: (correct: boolean) => void;
}) {
  const ty = useSharedValue(areaH);
  const tx = useSharedValue(0);
  const sc = useSharedValue(1);
  const burst = useSharedValue(0);
  const [popped, setPopped] = useState(false);
  const [bursting, setBursting] = useState(false);

  useEffect(() => {
    ty.value = withDelay(delay, withRepeat(withTiming(-BSPRITE - 20, { duration, easing: Easing.linear }), -1, false));
  }, []);

  // Konum (yükselme + sallanma) — opacity'den BAĞIMSIZ (patlama efekti gizlenmesin)
  const posStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }, { translateX: tx.value }] }));
  // Gövde (patlarken küçülür/saydamlaşır)
  const bodyStyle = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: sc.value }));
  const burstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.5 + burst.value * 0.9 }],
    opacity: interpolate(burst.value, [0, 0.25, 1], [0.2, 1, 0]),
  }));

  const press = () => {
    if (gameOver || popped || bursting) return;
    if (isTarget) {
      setBursting(true);
      sc.value = withTiming(0, { duration: 130 });
      burst.value = withTiming(1, { duration: 380 });
      haptics.success();
      playSfx("balloon_pop");
      onPop(true);
      setTimeout(() => setPopped(true), 420);
    } else {
      tx.value = withSequence(withTiming(-7, { duration: 45 }), withTiming(7, { duration: 45 }), withTiming(0, { duration: 45 }));
      haptics.tap();
      playSfx("gentle_try_again");
      useStageStore.getState().oops();
      onPop(false);
    }
  };

  if (popped) return null;

  const BODY = BW * 0.9; // renklendirilecek gövde dairesi (üst kısım)

  return (
    <Animated.View style={[{ position: "absolute", left, top: 0, width: BW, height: BSPRITE }, posStyle]}>
      {/* Patlama efekti — gövdenin opacity'sinden ayrı (her zaman görünür) */}
      {bursting && (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: "absolute", left: BW / 2 - BW, top: -BW * 0.45, width: BW * 2, height: BW * 2, alignItems: "center", justifyContent: "center" },
            burstStyle,
          ]}
        >
          <Image source={images.popBurst} style={{ width: BW * 1.9, height: BW * 1.9 }} contentFit="contain" />
        </Animated.View>
      )}

      <Animated.View style={bodyStyle}>
        <Pressable onPress={press} hitSlop={6}>
          <Image source={images.balloonPink} style={{ width: BW, height: BSPRITE }} contentFit="contain" />
          {/* Renk katmanı — pembe sprite'ı çeşitli renklere boyar (gövde dairesi) */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: BW * 0.05,
              left: (BW - BODY) / 2,
              width: BODY,
              height: BODY,
              borderRadius: BODY / 2,
              backgroundColor: tint,
              opacity: 0.55,
            }}
          />
          {/* Harf — gövdeye biner (renk katmanının üstünde) */}
          <View style={{ position: "absolute", top: BW * 0.06, left: 0, width: BW, height: BW * 0.94, alignItems: "center", justifyContent: "center" }}>
            <Text
              style={{
                fontFamily: "Amiri_700Bold",
                fontSize: BW * 0.5,
                lineHeight: BW * 0.64,
                color: "white",
                textShadowColor: "rgba(0,0,0,0.28)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {char}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export function BalloonPop({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { width } = useWindowDimensions();
  const target = getLetter(letterId);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const finishedRef = useRef(false);

  const areaW = Math.min(width - 24, 360);
  const areaH = 410;

  // 4 hedef + 4 çeldirici balon, sütunlara dağıtılmış
  const balloons = useMemo(() => {
    if (!target) return [];
    const pool = LETTERS.filter((l) => l.id !== letterId && l.char !== target.char);
    const distract: string[] = [];
    for (let i = 0; i < 4 && pool.length; i++) distract.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].char);
    const items: { char: string; isTarget: boolean }[] = [
      ...Array.from({ length: 4 }, () => ({ char: target.char, isTarget: true })),
      ...distract.map((c) => ({ char: c, isTarget: false })),
    ];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    const cols = items.length;
    const gap = (areaW - BW) / (cols - 1);
    // renkleri karıştırıp dağıt (aynı renk yan yana gelmesin)
    const tints = [...TINTS].sort(() => Math.random() - 0.5);
    return items.map((it, i) => ({
      ...it,
      key: i,
      tint: tints[i % tints.length],
      left: Math.round(i * gap),
      delay: i * 460,
      duration: 4600 + (i % 3) * 850,
    }));
  }, [letterId, target, areaW]);

  // Girişte hedefi sesli söyle
  useEffect(() => {
    const tt = setTimeout(() => playLetter(letterId), 400);
    return () => clearTimeout(tt);
  }, [letterId]);

  if (!target) return null;

  const onPop = (correct: boolean) => {
    if (!correct || done) return;
    const n = count + 1;
    setCount(n);
    playSfx("correct_ding", 0.7);
    useStageStore.getState().cheer();
    if (n >= NEED && !finishedRef.current) {
      finishedRef.current = true;
      setDone(true);
      playSfx("star_earned");
      setTimeout(onComplete, 700);
    }
  };

  return (
    <View className="flex-1 items-center gap-2 pt-1">
      {/* İlerleme (yıldız) */}
      <View className="flex-row gap-1.5">
        {Array.from({ length: NEED }).map((_, i) => (
          <Image key={i} source={images.star} style={{ width: 28, height: 28, opacity: i < count ? 1 : 0.28 }} contentFit="contain" />
        ))}
      </View>

      {/* Balon alanı */}
      <View style={{ width: areaW, height: areaH, overflow: "hidden" }}>
        {balloons.map((b) => (
          <Balloon
            key={b.key}
            char={b.char}
            isTarget={b.isTarget}
            tint={b.tint}
            left={b.left}
            delay={b.delay}
            duration={b.duration}
            areaH={areaH}
            gameOver={done}
            onPop={onPop}
          />
        ))}
      </View>
    </View>
  );
}

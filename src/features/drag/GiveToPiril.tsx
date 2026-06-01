import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { getLetter, LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playLetter, playSfx } from "@/lib/sfx";

/**
 * "Pırıl'a Ver" (drag): Pırıl harfi SESLİ ister. Çocuk doğru harfi YUKARI, Pırıl'ın
 * sepetine sürükler. ÇOCUK-BARİZ: büyük nabızlı hedef sepet + otomatik tekrarlayan
 * "kartı yukarı taşı" demosu (hayalet kart + el). Doğru → sepete girer (yıldız);
 * yanlış → geri döner. 2 tur. YAZISIZ — hedef ses, aksiyon görsel demo.
 */
const ROUNDS = 2;
const CARD = 92;
const INNER = CARD * 0.58;
const DROP_UP = 70; // bu kadar yukarı kalkınca "Pırıl'a verildi" (cömert = çocuk dostu)

function CardFace({ char, size = CARD }: { char: string; size?: number }) {
  const inner = size * 0.58;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Image source={images.nodeTile} style={{ position: "absolute", width: size, height: size }} contentFit="contain" />
      <View
        style={{
          width: inner,
          height: inner,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ translateX: size * 0.023 }, { translateY: size * -0.053 }],
        }}
      >
        <Text style={{ fontFamily: "Amiri_700Bold", fontSize: inner * 0.78, lineHeight: inner * 0.96, color: "#3A3A44" }}>{char}</Text>
      </View>
    </View>
  );
}

function DraggableCard({
  char,
  isTarget,
  enabled,
  onGrab,
  onGiven,
}: {
  char: string;
  isTarget: boolean;
  enabled: boolean;
  onGrab: () => void;
  onGiven: (correct: boolean) => void;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const sc = useSharedValue(1);
  const lift = useSharedValue(0); // kavrayınca hafif büyüme/gölge
  const [gone, setGone] = useState(false);

  const resolve = (correct: boolean) => {
    if (correct) {
      setGone(true);
      onGiven(true);
    } else {
      tx.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withSpring(0));
      ty.value = withSpring(0);
      lift.value = withTiming(0, { duration: 150 });
      onGiven(false);
    }
  };

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .onStart(() => {
          lift.value = withTiming(1, { duration: 120 });
          runOnJS(onGrab)();
        })
        .onUpdate((e) => {
          tx.value = e.translationX;
          ty.value = e.translationY;
        })
        .onEnd(() => {
          if (ty.value < -DROP_UP) {
            if (isTarget) {
              ty.value = withTiming(ty.value - 70, { duration: 230 });
              sc.value = withTiming(0, { duration: 250 }, () => runOnJS(resolve)(true));
            } else {
              runOnJS(resolve)(false);
            }
          } else {
            tx.value = withSpring(0);
            ty.value = withSpring(0);
            lift.value = withTiming(0, { duration: 150 });
          }
        }),
    [enabled, isTarget]
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value * (1 + lift.value * 0.08) }],
    shadowColor: "#1462B5",
    shadowOpacity: 0.18 + lift.value * 0.22,
    shadowRadius: 6 + lift.value * 8,
    shadowOffset: { width: 0, height: 4 + lift.value * 4 },
    zIndex: lift.value > 0 ? 10 : 1,
  }));

  if (gone) return <View style={{ width: CARD, height: CARD }} />;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style}>
        <CardFace char={char} />
      </Animated.View>
    </GestureDetector>
  );
}

export function GiveToPiril({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const target = getLetter(letterId);
  const [round, setRound] = useState(0);
  const [locked, setLocked] = useState(false);
  const [interacted, setInteracted] = useState(false);
  const finishedRef = useRef(false);

  // Ölçüm: sepet ve kart satırının container içindeki Y merkezleri (demo için)
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [basketY, setBasketY] = useState(0);
  const [cardsY, setCardsY] = useState(0);

  // Tur kartları: hedef + 3 çeldirici, karışık
  const cards = useMemo(() => {
    if (!target) return [];
    const pool = LETTERS.filter((l) => l.id !== letterId && l.char !== target.char);
    const picks: string[] = [];
    for (let i = 0; i < 3 && pool.length; i++) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].char);
    const arr = [...picks, target.char];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [letterId, target, round]);

  // Sepet nabzı + parıltı halkası
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.12 }],
    opacity: 0.45 + pulse.value * 0.4,
  }));
  const basketStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -pulse.value * 5 }] }));

  // DEMO: hayalet kart + el, kart satırından sepete doğru tekrar tekrar yükselir
  const demo = useSharedValue(0);
  useEffect(() => {
    demo.value = 0;
    demo.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [round]);
  const travel = cardsY && basketY ? cardsY - basketY : 0;
  const demoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -travel * demo.value }, { scale: 0.92 - demo.value * 0.12 }],
    opacity: interpolate(demo.value, [0, 0.12, 0.8, 1], [0, 1, 1, 0]),
  }));

  // Tur başında hedefi sesli söyle
  useEffect(() => {
    const tt = setTimeout(() => playLetter(letterId), 400);
    return () => clearTimeout(tt);
  }, [letterId, round]);

  if (!target) return null;

  const onGrab = () => setInteracted(true);

  const onGiven = (correct: boolean) => {
    if (!correct) {
      haptics.tap();
      playSfx("gentle_try_again");
      return;
    }
    haptics.success();
    playSfx("correct_ding");
    setLocked(true);
    if (round + 1 >= ROUNDS) {
      if (finishedRef.current) return;
      finishedRef.current = true;
      playSfx("star_earned");
      setTimeout(onComplete, 600);
    } else {
      setTimeout(() => {
        setRound((r) => r + 1);
        setLocked(false);
        setInteracted(false);
      }, 500);
    }
  };

  const showDemo = !interacted && !locked && travel > 0 && box.w > 0;

  return (
    <View
      className="flex-1 w-full"
      onLayout={(e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      style={{ justifyContent: "center", gap: 14, paddingVertical: 12 }}
    >
      {/* ÜST: Dinle + Pırıl sepeti tutuyor (büyük hedef, nabızlı halka) */}
      <View className="items-center gap-1">
        <Pressable
          onPress={() => playLetter(letterId)}
          className="flex-row items-center gap-1.5 rounded-full bg-primary px-5 py-2.5"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.22, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontSize: 20 }}>🔊</Text>
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 15, color: "white" }}>{t("common.listen")}</Text>
        </Pressable>

        {/* Pırıl sepeti tutuyor — drop hedefi (basket = alt kısım) */}
        <View
          onLayout={(e) => setBasketY(e.nativeEvent.layout.y + e.nativeEvent.layout.height * 0.66)}
          style={{ width: 184, height: 210, alignItems: "center", justifyContent: "flex-end" }}
        >
          {/* Sepet bölgesini saran nabızlı parıltı halkası */}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                bottom: 4,
                width: 134,
                height: 134,
                borderRadius: 67,
                borderWidth: 5,
                borderColor: "#F5C451",
                borderStyle: "dashed",
                backgroundColor: "rgba(255,255,255,0.35)",
              },
              ringStyle,
            ]}
          />
          <Animated.View style={basketStyle}>
            <Image source={images.pirilBasket} style={{ width: 150, aspectRatio: 0.72 }} contentFit="contain" />
          </Animated.View>
        </View>
      </View>

      {/* ORTA: yukarı ipucu oku */}
      <View className="items-center" pointerEvents="none">
        <Text style={{ fontSize: 30, color: "#208AEF", opacity: 0.55 }}>⬆️</Text>
      </View>

      {/* ALT: sürüklenebilir kartlar */}
      <View
        onLayout={(e) => setCardsY(e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2)}
        style={{ flexDirection: "row", justifyContent: "center", gap: 10, paddingBottom: 4 }}
      >
        {cards.map((c, i) => (
          <DraggableCard
            key={`${round}-${i}`}
            char={c}
            isTarget={c === target.char}
            enabled={!locked}
            onGrab={onGrab}
            onGiven={onGiven}
          />
        ))}
      </View>

      {/* DEMO overlay (hayalet kart + el — kartı sepete taşımayı gösterir) */}
      {showDemo && (
        <Animated.View
          pointerEvents="none"
          style={[
            { position: "absolute", left: box.w / 2 - 36, top: cardsY - 36, width: 72, alignItems: "center" },
            demoStyle,
          ]}
        >
          {/* Nötr hayalet kart (cevabı sızdırmaz) — yalnız "yukarı taşı" hareketini öğretir */}
          <View style={{ width: 66, height: 66, alignItems: "center", justifyContent: "center", opacity: 0.8 }}>
            <Image source={images.nodeTile} style={{ position: "absolute", width: 66, height: 66 }} contentFit="contain" />
            <Image source={images.star} style={{ width: 34, height: 34, transform: [{ translateY: -3 }] }} contentFit="contain" />
          </View>
          <Image source={images.handPointer} style={{ width: 46, height: 46, marginTop: -10 }} contentFit="contain" />
        </Animated.View>
      )}
    </View>
  );
}

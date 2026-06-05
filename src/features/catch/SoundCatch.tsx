import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { useStageStore } from "@/stores/stageStore";
import { getLetter, LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playLetter, playSfx } from "@/lib/sfx";

/**
 * "Yakala" (catch): hedef harf SESLİ söylenir. Harf karoları bir şeritte
 * SAĞDAN SOLA kayar; çocuk doğru olanı geçerken yakalar (dokun). 3 yakalama → biter.
 * Yanlış → nazik sallanma. YAZISIZ — kayan şerit + dokunma mekaniği bariz.
 */
const NEED = 3;
const TILE = 84;
const INNER = TILE * 0.6;
const SPACING = 132;
const SPEED = 78; // px/sn — çocuk dostu tempo

function CatchTile({
  char,
  isTarget,
  caught,
  left,
  top,
  onPress,
}: {
  char: string;
  isTarget: boolean;
  caught: boolean;
  left: number;
  top: number;
  onPress: () => void;
}) {
  const tx = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const press = () => {
    if (caught) return;
    if (!isTarget) {
      tx.value = withSequence(withTiming(-7, { duration: 45 }), withTiming(7, { duration: 45 }), withTiming(0, { duration: 45 }));
    }
    onPress();
  };
  return (
    <Animated.View style={[{ position: "absolute", left, top, width: TILE, height: TILE }, style]}>
      <Pressable onPress={press} style={{ width: TILE, height: TILE, alignItems: "center", justifyContent: "center" }}>
        <Image source={images.nodeTile} style={{ position: "absolute", width: TILE, height: TILE, opacity: caught ? 0.4 : 1 }} contentFit="contain" />
        {caught ? (
          <Image source={images.star} style={{ width: TILE * 0.6, height: TILE * 0.6 }} contentFit="contain" />
        ) : (
          <View
            style={{
              width: INNER,
              height: INNER,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ translateX: TILE * 0.023 }, { translateY: TILE * -0.053 }],
            }}
          >
            <Text style={{ fontFamily: "Amiri_700Bold", fontSize: INNER * 0.74, lineHeight: INNER * 0.92, color: "#3A3A44" }}>{char}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function SoundCatch({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const target = getLetter(letterId);
  const [caught, setCaught] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const finishedRef = useRef(false);

  const laneW = Math.min(width - 24, 360);
  const laneH = 180;

  // Şerit karoları: 7 karo, ~4 hedef + çeldiriciler, karışık
  const tiles = useMemo(() => {
    if (!target) return [];
    const pool = LETTERS.filter((l) => l.id !== letterId && l.char !== target.char);
    const distract: string[] = [];
    for (let i = 0; i < 3 && pool.length; i++) distract.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].char);
    const items: { char: string; isTarget: boolean }[] = [
      ...Array.from({ length: 4 }, () => ({ char: target.char, isTarget: true })),
      ...distract.map((c) => ({ char: c, isTarget: false })),
    ];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items.map((it, i) => ({ ...it, key: i }));
  }, [letterId, target]);

  const stripW = tiles.length * SPACING;
  const startX = laneW; // sağ kenardan gir
  const travel = startX + stripW; // tamamen geçene kadar
  const duration = Math.round((travel / SPEED) * 1000);

  const slide = useSharedValue(startX);
  useEffect(() => {
    slide.value = startX;
    slide.value = withRepeat(withTiming(-stripW, { duration, easing: Easing.linear }), -1, false);
  }, [stripW, duration]);
  const stripStyle = useAnimatedStyle(() => ({ transform: [{ translateX: slide.value }] }));

  // Girişte hedefi sesli söyle
  useEffect(() => {
    const tt = setTimeout(() => playLetter(letterId), 400);
    return () => clearTimeout(tt);
  }, [letterId]);

  if (!target) return null;

  const onTilePress = (key: number, isTarget: boolean) => {
    if (done || caught.includes(key)) return;
    if (!isTarget) {
      haptics.tap();
      playSfx("gentle_try_again");
      useStageStore.getState().oops();
      return;
    }
    haptics.success();
    playSfx("correct_ding");
    useStageStore.getState().cheer();
    const nc = [...caught, key];
    setCaught(nc);
    if (nc.length >= NEED && !finishedRef.current) {
      finishedRef.current = true;
      setDone(true);
      playSfx("star_earned");
      setTimeout(onComplete, 650);
    }
  };

  return (
    <View className="flex-1 items-center justify-center gap-3">
      <View className="flex-row items-center gap-3 px-2">
        <Pressable
          onPress={() => playLetter(letterId)}
          className="flex-row items-center gap-2 rounded-full bg-primary px-5 py-3"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.22, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontSize: 22 }}>🔊</Text>
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: "white" }}>{t("common.listen")}</Text>
        </Pressable>
      </View>

      {/* İlerleme (yakalananlar) */}
      <View className="flex-row gap-1.5">
        {Array.from({ length: NEED }).map((_, i) => (
          <Image key={i} source={images.star} style={{ width: 26, height: 26, opacity: i < caught.length ? 1 : 0.28 }} contentFit="contain" />
        ))}
      </View>

      {/* Kayan şerit (sağ→sol) — bulut nehri zemini */}
      <View
        style={{
          width: laneW,
          height: laneH,
          overflow: "hidden",
          borderRadius: 22,
          justifyContent: "center",
        }}
      >
        <Image
          source={images.catchLane}
          style={{ position: "absolute", left: 0, top: 0, width: laneW, height: laneH }}
          contentFit="cover"
        />
        <Animated.View style={[{ position: "absolute", top: 0, left: 0, height: laneH, width: stripW }, stripStyle]}>
          {tiles.map((tile, i) => {
            // hafif dikey dalga → tek düze olmasın
            const top = laneH / 2 - TILE / 2 + (i % 2 === 0 ? -18 : 18);
            return (
              <CatchTile
                key={tile.key}
                char={tile.char}
                isTarget={tile.isTarget}
                caught={caught.includes(tile.key)}
                left={i * SPACING}
                top={top}
                onPress={() => onTilePress(tile.key, tile.isTarget)}
              />
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

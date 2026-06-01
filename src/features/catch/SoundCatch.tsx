import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Mascot } from "@/components/ui/Mascot";
import { getLetter, LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playLetter, playSfx } from "@/lib/sfx";

/**
 * "Sesi Yakala" arcade: hedef harfin sesi çalınır; harf karoları süzülür,
 * çocuk doğru olanı yakalar (tap). 3 doğru → biter. Yanlış → nazik sallanma.
 */
const ROUNDS = 3;
const TILE = 92;
// 4 yuva (oran), her tur harfler karıştırılır
const SLOTS = [
  { x: 0.04, y: 0.02 },
  { x: 0.55, y: 0.16 },
  { x: 0.16, y: 0.52 },
  { x: 0.6, y: 0.66 },
];

function FloatTile({
  char,
  isTarget,
  left,
  top,
  phase,
  onCorrect,
  onWrong,
}: {
  char: string;
  isTarget: boolean;
  left: number;
  top: number;
  phase: number;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const bob = useSharedValue(0);
  const shake = useSharedValue(0);
  useEffect(() => {
    bob.value = withDelay(
      phase,
      withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.ease) })), -1, false)
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -7 + bob.value * 14 }, { translateX: shake.value }],
  }));
  const press = () => {
    if (isTarget) {
      onCorrect();
    } else {
      shake.value = withSequence(
        withTiming(-8, { duration: 45 }),
        withTiming(8, { duration: 45 }),
        withTiming(0, { duration: 45 })
      );
      onWrong();
    }
  };
  return (
    <Animated.View style={[{ position: "absolute", left, top, width: TILE, height: TILE }, style]}>
      <Pressable onPress={press} style={{ width: TILE, height: TILE, alignItems: "center", justifyContent: "center" }}>
        <Image source={images.nodeTile} style={{ position: "absolute", width: TILE, height: TILE }} contentFit="contain" />
        <View
          style={{
            width: TILE * 0.6,
            height: TILE * 0.6,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateX: TILE * 0.023 }, { translateY: TILE * -0.053 }],
          }}
        >
          <Text style={{ fontFamily: "Amiri_700Bold", fontSize: TILE * 0.6 * 0.74, lineHeight: TILE * 0.6 * 0.92, color: "#3A3A44" }}>
            {char}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function SoundCatch({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const target = getLetter(letterId);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);

  const areaW = Math.min(width - 36, 360);
  const areaH = 380;

  // Tur başına 4 karo (hedef + 3 çeldirici), yuvalara karışık
  const tiles = useMemo(() => {
    if (!target) return [];
    const pool = LETTERS.filter((l) => l.id !== letterId && l.char !== target.char);
    const picks: string[] = [];
    for (let i = 0; i < 3 && pool.length; i++) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].char);
    const chars = [...picks, target.char];
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.map((c, i) => ({ char: c, slot: SLOTS[i] }));
  }, [letterId, target, round]);

  // Tur başında sesi çal
  useEffect(() => {
    const tt = setTimeout(() => playLetter(letterId), 350);
    return () => clearTimeout(tt);
  }, [letterId, round]);

  if (!target) return null;

  const onCorrect = () => {
    if (done) return;
    haptics.success();
    playSfx("correct_ding");
    if (round + 1 >= ROUNDS) {
      setDone(true);
      playSfx("star_earned");
      setTimeout(onComplete, 600);
    } else {
      setRound((r) => r + 1);
    }
  };
  const onWrong = () => {
    haptics.tap();
    playSfx("gentle_try_again");
  };

  return (
    <View className="flex-1 items-center justify-center gap-3">
      <View className="flex-row items-center gap-3 px-2">
        <Mascot size={50} />
        <Pressable
          onPress={() => playLetter(letterId)}
          className="flex-row items-center gap-2 rounded-full bg-primary px-5 py-3"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontSize: 22 }}>🔊</Text>
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: "white" }}>{t("catch.listen")}</Text>
        </Pressable>
      </View>

      {/* Tur göstergesi */}
      <View className="flex-row gap-1.5">
        {Array.from({ length: ROUNDS }).map((_, i) => (
          <View key={i} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: i < round || done ? "#FFB020" : "rgba(255,255,255,0.7)" }} />
        ))}
      </View>

      {/* Süzülen harfler */}
      <View style={{ width: areaW, height: areaH }}>
        {tiles.map((tile, i) => (
          <FloatTile
            key={`${round}-${i}`}
            char={tile.char}
            isTarget={tile.char === target.char}
            left={tile.slot.x * (areaW - TILE)}
            top={tile.slot.y * (areaH - TILE)}
            phase={i * 220}
            onCorrect={onCorrect}
            onWrong={onWrong}
          />
        ))}
      </View>
    </View>
  );
}

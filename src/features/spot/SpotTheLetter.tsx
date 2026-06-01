import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Mascot } from "@/components/ui/Mascot";
import { getLetter, LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";

/**
 * "Harfi bul" oyunu: Pırıl bir harfin adını sorar (ör. "Be"), çocuk 4 Arapça
 * harften doğrusuna dokunur. Yanlışta kart nazikçe sallanır (ceza yok),
 * doğru seçimde yıldız + ses → onComplete.
 */
const CARD = 130;
const INNER = CARD * 0.6;

function OptionCard({
  char,
  isTarget,
  locked,
  onSolved,
}: {
  char: string;
  isTarget: boolean;
  locked: boolean;
  onSolved: () => void;
}) {
  const [done, setDone] = useState(false);
  const tx = useSharedValue(0);
  const sc = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { scale: sc.value }] }));

  const press = () => {
    if (locked || done) return;
    if (isTarget) {
      setDone(true);
      sc.value = withSequence(withTiming(1.1, { duration: 130 }), withTiming(1, { duration: 130 }));
      haptics.success();
      playSfx("correct_ding");
      onSolved();
    } else {
      tx.value = withSequence(
        withTiming(-9, { duration: 45 }),
        withTiming(9, { duration: 45 }),
        withTiming(-6, { duration: 45 }),
        withTiming(0, { duration: 45 })
      );
      haptics.tap();
      playSfx("gentle_try_again");
    }
  };

  return (
    <Animated.View style={style}>
      <Pressable onPress={press} style={{ width: CARD, height: CARD, alignItems: "center", justifyContent: "center" }}>
        <Image source={images.nodeTile} style={{ position: "absolute", width: CARD, height: CARD }} contentFit="contain" />
        <View
          style={{
            width: INNER,
            height: INNER,
            alignItems: "center",
            justifyContent: "center",
            transform: [{ translateX: CARD * 0.023 }, { translateY: CARD * -0.053 }],
          }}
        >
          <Text style={{ fontFamily: "Amiri_700Bold", fontSize: INNER * 0.74, lineHeight: INNER * 0.92, color: "#3A3A44" }}>
            {char}
          </Text>
        </View>
        {done && (
          <Image source={images.star} style={{ position: "absolute", right: -6, top: -10, width: 36, height: 36 }} contentFit="contain" />
        )}
      </Pressable>
    </Animated.View>
  );
}

export function SpotTheLetter({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const target = getLetter(letterId);
  const [solved, setSolved] = useState(false);

  const options = useMemo(() => {
    if (!target) return [];
    const pool = LETTERS.filter((l) => l.id !== letterId && l.char !== target.char);
    const picks: string[] = [];
    for (let i = 0; i < 3 && pool.length; i++) {
      const j = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(j, 1)[0].char);
    }
    const arr = [...picks, target.char];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [letterId, target]);

  if (!target) return null;

  const handleSolved = () => {
    if (solved) return;
    setSolved(true);
    setTimeout(onComplete, 650);
  };

  return (
    <View className="flex-1 items-center justify-center gap-5">
      {/* Soru: maskot + balon */}
      <View className="flex-row items-center gap-2 px-2">
        <Mascot size={56} />
        <View
          className="rounded-3xl rounded-bl-md bg-white/92 px-4 py-2"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 18, color: "#208AEF" }}>
            {t("spot.prompt", { name: target.name })}
          </Text>
        </View>
      </View>

      {/* 4 seçenek (2×2) */}
      <View style={{ width: CARD * 2 + 18, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 18 }}>
        {options.map((c, i) => (
          <OptionCard key={i} char={c} isTarget={c === target.char} locked={solved} onSolved={handleSolved} />
        ))}
      </View>
    </View>
  );
}

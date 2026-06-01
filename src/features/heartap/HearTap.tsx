import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Mascot } from "@/components/ui/Mascot";
import { getLetter, LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playLetter, playSfx } from "@/lib/sfx";

/**
 * "Duy & Dokun" (hearTap): Pırıl harfin sesini SÖYLER (otomatik + 🔊 tekrar),
 * çocuk 4 Arapça harften doğru duyduğuna dokunur. YAZISIZ — prompt sestir.
 * Doğru → yıldız; yanlış → nazik sallanma (ceza yok).
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

export function HearTap({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
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

  // Girişte hedefi SESLİ söyle (yazı yok → çocuk sesi dinler)
  useEffect(() => {
    const tt = setTimeout(() => playLetter(letterId), 400);
    return () => clearTimeout(tt);
  }, [letterId]);

  if (!target) return null;

  const handleSolved = () => {
    if (solved) return;
    setSolved(true);
    setTimeout(onComplete, 650);
  };

  return (
    <View className="flex-1 items-center justify-center gap-6">
      {/* Pırıl + büyük Dinle butonu (tek prompt = ses) */}
      <View className="flex-row items-center gap-3 px-2">
        <Mascot size={64} pose="point" />
        <Pressable
          onPress={() => playLetter(letterId)}
          className="flex-row items-center gap-2 rounded-full bg-primary px-6 py-4"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.22, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } }}
        >
          <Text style={{ fontSize: 26 }}>🔊</Text>
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 18, color: "white" }}>{t("common.listen")}</Text>
        </Pressable>
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

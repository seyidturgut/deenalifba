import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Mascot } from "@/components/ui/Mascot";
import { getLetter, LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useProgressStore } from "@/stores/progressStore";
import { useSrsStore } from "@/stores/srsStore";

/**
 * "Tekrar" (Recall): önceki öğrenilen harflerden (SM-2 vadesi gelenler öncelikli)
 * 1-3 tanesini seçer, harfi gösterip 4 isimden doğrusunu seçtirir. Sonuç SM-2'ye
 * işlenir (aralıklı tekrar). İlk harflerde tekrar yoksa nazikçe atlanır.
 */
const CARD = 120;
const INNER = CARD * 0.6;
const MAX_Q = 3;

type Question = { id: number; char: string; name: string; options: string[] };

function NameOption({
  label,
  correct,
  locked,
  onCorrect,
  onWrong,
}: {
  label: string;
  correct: boolean;
  locked: boolean;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const [picked, setPicked] = useState(false);
  const tx = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }] }));
  const press = () => {
    if (locked) return;
    if (correct) {
      setPicked(true);
      onCorrect();
    } else {
      tx.value = withSequence(
        withTiming(-8, { duration: 45 }),
        withTiming(8, { duration: 45 }),
        withTiming(-5, { duration: 45 }),
        withTiming(0, { duration: 45 })
      );
      onWrong();
    }
  };
  return (
    <Animated.View style={[{ width: "48%" }, style]}>
      <Pressable
        onPress={press}
        className="items-center justify-center rounded-2xl py-3"
        style={{
          backgroundColor: picked ? "#3FB984" : "white",
          shadowColor: "#1462B5",
          shadowOpacity: 0.12,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 18, color: picked ? "white" : "#34618C" }}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function RecallGame({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const grade = useSrsStore((s) => s.grade);

  const questions = useMemo<Question[]>(() => {
    const isComplete = useProgressStore.getState().isLetterComplete;
    const now = Date.now();
    const earlier = LETTERS.filter((l) => l.id < letterId && isComplete(l.id)).map((l) => l.id);
    if (earlier.length === 0) return [];
    const due = useSrsStore.getState().dueAmong(earlier, now);
    const pool = due.length ? due : earlier;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(MAX_Q, shuffled.length)).map((id) => {
      const target = getLetter(id)!;
      const pd = LETTERS.filter((l) => l.id !== id);
      const names: string[] = [];
      for (let i = 0; i < 3 && pd.length; i++) names.push(pd.splice(Math.floor(Math.random() * pd.length), 1)[0].name);
      const options = [...names, target.name];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      return { id, char: target.char, name: target.name, options };
    });
  }, [letterId]);

  const [qi, setQi] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [finished, setFinished] = useState(false);

  // Tekrar edilecek harf yoksa (ilk harfler) nazikçe geç
  useEffect(() => {
    if (questions.length === 0) {
      const tt = setTimeout(onComplete, 1300);
      return () => clearTimeout(tt);
    }
  }, [questions.length, onComplete]);

  if (questions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3">
        <Mascot size={72} pose="celebrate" />
        <View
          className="rounded-3xl bg-white/90 px-5 py-3"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: "#208AEF" }}>{t("recall.none")}</Text>
        </View>
      </View>
    );
  }

  const q = questions[qi];

  const onCorrect = () => {
    const quality = (wrong === 0 ? 3 : wrong === 1 ? 2 : 1) as 1 | 2 | 3;
    grade(q.id, quality, Date.now());
    haptics.success();
    playSfx("correct_ding");
    if (qi + 1 < questions.length) {
      setTimeout(() => {
        setQi(qi + 1);
        setWrong(0);
      }, 450);
    } else {
      setFinished(true);
      setTimeout(onComplete, 650);
    }
  };
  const onWrong = () => {
    setWrong((w) => w + 1);
    haptics.tap();
    playSfx("gentle_try_again");
  };

  return (
    <View className="flex-1 items-center justify-center gap-4">
      <View className="flex-row items-center gap-2 px-2">
        <Mascot size={52} />
        <View
          className="rounded-3xl rounded-bl-md bg-white/92 px-4 py-2"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 17, color: "#208AEF" }}>{t("recall.prompt")}</Text>
        </View>
      </View>

      {/* Harf kartı */}
      <View style={{ width: CARD, height: CARD, alignItems: "center", justifyContent: "center" }}>
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
            {q.char}
          </Text>
        </View>
      </View>

      {/* İlerleme noktaları */}
      <View className="flex-row gap-1.5">
        {questions.map((_, i) => (
          <View
            key={i}
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i <= qi ? "#FFB020" : "rgba(255,255,255,0.7)" }}
          />
        ))}
      </View>

      {/* 4 isim seçeneği */}
      <View key={qi} style={{ width: CARD * 2 + 40, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 }}>
        {q.options.map((name, i) => (
          <NameOption
            key={`${qi}-${i}`}
            label={name}
            correct={name === q.name}
            locked={finished}
            onCorrect={onCorrect}
            onWrong={onWrong}
          />
        ))}
      </View>
    </View>
  );
}

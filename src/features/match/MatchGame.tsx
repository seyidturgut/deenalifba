import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { getLetter, LETTERS } from "@/data/letters";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playLetter, playSfx } from "@/lib/sfx";
import { useStageStore } from "@/stores/stageStore";

/**
 * "Eşleştirme" (match): 6 kapalı kart = 3 çift (biri mevcut harf + 2 çeldirici).
 * Çocuk kartları çevirir, AYNI harfleri eşleştirir. Kart açılınca o harfin SESİ çalar
 * (pekiştirme). Hepsi eşleşince biter. YAZISIZ — mekanik tamamen görsel.
 */
const CARD = 96;
const INNER = CARD * 0.58;

type CardData = { key: number; letterId: number; char: string };

function MatchCard({
  data,
  faceUp,
  matched,
  locked,
  onFlip,
}: {
  data: CardData;
  faceUp: boolean;
  matched: boolean;
  locked: boolean;
  onFlip: () => void;
}) {
  const sc = useSharedValue(1);
  const shownRef = useRef(false);
  const reveal = faceUp || matched;

  useEffect(() => {
    if (reveal && !shownRef.current) {
      shownRef.current = true;
      sc.value = withSequence(withTiming(1.12, { duration: 130 }), withTiming(1, { duration: 130 }));
    } else if (!reveal) {
      shownRef.current = false;
    }
  }, [reveal]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }], opacity: matched ? 0.96 : 1 }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={() => {
          if (locked || reveal) return;
          onFlip();
        }}
        style={{ width: CARD, height: CARD, alignItems: "center", justifyContent: "center" }}
      >
        {reveal ? (
          <>
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
              <Text style={{ fontFamily: "Amiri_700Bold", fontSize: INNER * 0.78, lineHeight: INNER * 0.96, color: "#3A3A44" }}>
                {data.char}
              </Text>
            </View>
          </>
        ) : (
          <Image source={images.cardBack} style={{ position: "absolute", width: CARD, height: CARD }} contentFit="contain" />
        )}
        {matched && (
          <Image source={images.star} style={{ position: "absolute", right: -6, top: -10, width: 32, height: 32 }} contentFit="contain" />
        )}
      </Pressable>
    </Animated.View>
  );
}

export function MatchGame({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const target = getLetter(letterId);

  // 3 çift: hedef harf + 2 çeldirici → 6 kart, karışık
  const cards = useMemo<CardData[]>(() => {
    if (!target) return [];
    const pool = LETTERS.filter((l) => l.id !== letterId && l.char !== target.char);
    const distractors: typeof LETTERS = [];
    for (let i = 0; i < 2 && pool.length; i++) distractors.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    const chosen = [target, ...distractors];
    const deck: CardData[] = [];
    chosen.forEach((l) => {
      deck.push({ key: deck.length, letterId: l.id, char: l.char });
      deck.push({ key: deck.length, letterId: l.id, char: l.char });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck.map((c, i) => ({ ...c, key: i }));
  }, [letterId, target]);

  const [flipped, setFlipped] = useState<number[]>([]); // açık (henüz eşleşmemiş) kart key'leri
  const [matched, setMatched] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const finishedRef = useRef(false);

  // Girişte hedefi sesli söyle
  useEffect(() => {
    const tt = setTimeout(() => playLetter(letterId), 400);
    return () => clearTimeout(tt);
  }, [letterId]);

  const flip = (key: number) => {
    const card = cards.find((c) => c.key === key);
    if (!card) return;
    playLetter(card.letterId, 0.9); // çevrilen harfin sesi → pekiştirme
    haptics.tap();
    const open = [...flipped, key];
    setFlipped(open);
    if (open.length === 2) {
      setLocked(true);
      const [a, b] = open.map((k) => cards.find((c) => c.key === k)!);
      if (a.letterId === b.letterId) {
        setTimeout(() => {
          const nm = [...matched, a.key, b.key];
          setMatched(nm);
          setFlipped([]);
          setLocked(false);
          haptics.success();
          playSfx("correct_ding");
          useStageStore.getState().cheer();
          if (nm.length >= cards.length && !finishedRef.current) {
            finishedRef.current = true;
            playSfx("star_earned");
            setTimeout(onComplete, 650);
          }
        }, 420);
      } else {
        playSfx("gentle_try_again");
        useStageStore.getState().oops();
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 750);
      }
    }
  };

  if (!target) return null;

  const totalPairs = cards.length / 2;
  const pairsDone = matched.length / 2;

  return (
    <View className="flex-1 items-center justify-center gap-5">
      {/* Dinle */}
      <View className="flex-row items-center gap-3 px-2">
        <Pressable
          onPress={() => playLetter(letterId)}
          className="flex-row items-center gap-2 rounded-full bg-primary px-6 py-3.5"
          style={{ shadowColor: "#1462B5", shadowOpacity: 0.22, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } }}
        >
          <Text style={{ fontSize: 24 }}>🔊</Text>
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 18, color: "white" }}>{t("common.listen")}</Text>
        </Pressable>
      </View>

      {/* İlerleme — kaç çift bulundu (kaç çift kaldığı bariz olsun) */}
      <View className="flex-row items-center gap-2">
        {Array.from({ length: totalPairs }).map((_, i) => (
          <Image
            key={i}
            source={images.star}
            style={{ width: 30, height: 30, opacity: i < pairsDone ? 1 : 0.28 }}
            contentFit="contain"
          />
        ))}
      </View>

      {/* 3×2 kart ızgarası */}
      <View style={{ width: CARD * 3 + 24, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 14 }}>
        {cards.map((c) => (
          <MatchCard
            key={c.key}
            data={c}
            faceUp={flipped.includes(c.key)}
            matched={matched.includes(c.key)}
            locked={locked}
            onFlip={() => flip(c.key)}
          />
        ))}
      </View>
    </View>
  );
}

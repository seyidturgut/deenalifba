import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { getLetter, LETTERS } from "@/data/letters";
import { glyphChar, lettersWithForm, type LetterFormKind } from "@/lib/formGlyph";
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

export function MatchGame({
  letterId,
  onComplete,
  formKind,
}: {
  letterId: number;
  onComplete: () => void;
  /**
   * Verilirse eşleşecek ÇİFT "izole hâl ↔ pozisyonel form" olur (ب ↔ ﺒ).
   * Bölümün asıl öğrettiği şey tam olarak bu bağ — mekanik aynı kalıyor,
   * çocuk artık şekli tanımayı öğreniyor.
   */
  formKind?: LetterFormKind;
}) {
  const target = getLetter(letterId);

  // TEK gerçek çift (hedef harf) + 4 TEKİL çeldirici (eşi yok) → 6 kart.
  // Abdulkadir/Sohail: eski hâlde herhangi 2 çeldirici de eşleşince kazanılıyordu
  // (harfi hiç tanımadan şans+hafızayla bitirilebiliyordu). Artık kazanmanın TEK
  // yolu hedef harfin iki kartını bulmak — şans eseri çeldirici-çeldirici eşleşmesi
  // mümkün değil (her çeldirici tektir, eşi deste içinde yok).
  const cards = useMemo<CardData[]>(() => {
    if (!target) return [];
    const allowed = new Set(lettersWithForm(formKind));
    const pool = LETTERS.filter(
      (l) => l.id !== letterId && l.char !== target.char && (!formKind || allowed.has(l.id))
    );
    const distractors: typeof LETTERS = [];
    for (let i = 0; i < 4 && pool.length; i++) distractors.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    const deck: CardData[] = [
      // Formlu turda çift "izole ↔ form"; normal turda iki özdeş harf.
      { key: 0, letterId: target.id, char: glyphChar(target.id) },
      { key: 0, letterId: target.id, char: glyphChar(target.id, formKind) },
      // Çeldiricilerin yarısı izole yarısı formlu — "izoleyi bul" kestirmesi olmasın.
      ...distractors.map((l, i) => ({
        key: 0,
        letterId: l.id,
        char: formKind && i % 2 === 1 ? glyphChar(l.id, formKind) : glyphChar(l.id),
      })),
    ];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck.map((c, i) => ({ ...c, key: i }));
  }, [letterId, target, formKind]);

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
          // Destede tek gerçek çift var (hedef harf) → herhangi bir eşleşme = hedefi buldu demek
          if (!finishedRef.current) {
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

  const found = matched.length > 0;

  return (
    <View className="flex-1 items-center justify-center gap-5">
      {/* Tek yıldız — hedef harf çifti bulununca yanar (destede aranacak TEK gerçek çift) */}
      <Image source={images.star} style={{ width: 34, height: 34, opacity: found ? 1 : 0.28 }} contentFit="contain" />

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

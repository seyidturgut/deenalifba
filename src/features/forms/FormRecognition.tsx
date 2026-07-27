import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { getLetter, LETTERS } from "@/data/letters";
import { getLetterForms, PATH_BOX, type LetterFormKind } from "@/data/letterForms";
import { getLetterPath } from "@/data/letterPaths";
import { haptics } from "@/lib/haptics";
import { playLetter, playSfx } from "@/lib/sfx";
import { useStageStore } from "@/stores/stageStore";

/**
 * "Harf Tanıma" oyunu — Abdulkadir'in müfredat önerisi (Harakat'tan ÖNCE gelmeli).
 *
 * MEKANİK (yazısız, ses odaklı — no-reading kuralı): çocuğun ZATEN bildiği İZOLE harf
 * üstte gösterilir + sesi çalar (tanıdık çapa). Altta 4 seçenek: biri o harfin BAŞKA bir
 * pozisyonel formu (baş/orta/son), diğer 3'ü BAŞKA harflerin formları. Çocuk "bu tuhaf
 * şekil de aslında aynı harf" bağlantısını kurar.
 *
 * Bağlanmayan 6 harfte (ا د ذ ر ز و) yalnız "son" formu vardır — onlarda da çalışır.
 */
const TARGET = 132;
const CARD = 118;
const GLYPH_IN_CARD = CARD * 0.62;

/** Bu harfin izole DIŞINDAKİ formları (öğretilecek olanlar). */
function positionalKinds(letterId: number): LetterFormKind[] {
  const f = getLetterForms(letterId);
  if (!f) return [];
  return (Object.keys(f.paths) as LetterFormKind[]).filter((k) => k !== "isolated");
}

function Glyph({ d, size, color = "#2A2A33" }: { d: string; size: number; color?: string }) {
  return (
    <Svg width={size} height={size}>
      <G transform={`scale(${size / PATH_BOX})`}>
        <Path d={d} fill={color} />
      </G>
    </Svg>
  );
}

function OptionCard({
  d,
  isTarget,
  locked,
  onSolved,
}: {
  d: string;
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
      useStageStore.getState().cheer();
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
      useStageStore.getState().oops();
    }
  };

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={press}
        style={{
          width: CARD,
          height: CARD,
          borderRadius: 22,
          backgroundColor: "#FFFFFF",
          borderWidth: 3,
          borderColor: done ? "#3FB984" : "#E4E8EE",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#1462B5",
          shadowOpacity: 0.16,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Glyph d={d} size={GLYPH_IN_CARD} />
      </Pressable>
    </Animated.View>
  );
}

export function FormRecognition({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const [solved, setSolved] = useState(false);
  const letter = getLetter(letterId);
  const isoPath = getLetterPath(letterId);

  // Bu tur için: hedef harfin bir pozisyonel formu + 3 çeldirici (başka harflerin formları)
  const round = useMemo(() => {
    const kinds = positionalKinds(letterId);
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const targetD = getLetterForms(letterId)?.paths[kind];

    const others = LETTERS.filter((l) => l.id !== letterId);
    const decoys: string[] = [];
    const used = new Set<number>();
    while (decoys.length < 3 && used.size < others.length) {
      const pick = others[Math.floor(Math.random() * others.length)];
      if (used.has(pick.id)) continue;
      used.add(pick.id);
      const pk = positionalKinds(pick.id);
      const d = getLetterForms(pick.id)?.paths[pk[Math.floor(Math.random() * pk.length)]];
      if (d) decoys.push(d);
    }

    const opts = targetD ? [{ d: targetD, isTarget: true }, ...decoys.map((d) => ({ d, isTarget: false }))] : [];
    // karıştır
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [letterId]);

  useEffect(() => {
    setSolved(false);
    const tt = setTimeout(() => playLetter(letterId), 350);
    return () => clearTimeout(tt);
  }, [letterId]);

  if (!letter || !isoPath) return null;

  const solve = () => {
    setSolved(true);
    setTimeout(onComplete, 700);
  };

  return (
    <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 18 }}>
      {/* Tanıdık çapa: çocuğun bildiği İZOLE harf + sesi (dokununca tekrar çalar) */}
      <Pressable
        onPress={() => playLetter(letterId)}
        style={{
          width: TARGET,
          height: TARGET,
          borderRadius: 26,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderWidth: 4,
          borderColor: "#F5A524",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#1462B5",
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Glyph d={isoPath.d} size={TARGET * 0.66} />
      </Pressable>

      <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: "#34618C", textAlign: "center" }}>
        {t("forms.prompt")}
      </Text>

      {/* 4 seçenek — biri aynı harfin başka formu */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, maxWidth: CARD * 2 + 40 }}>
        {round.map((o, i) => (
          <OptionCard key={i} d={o.d} isTarget={o.isTarget} locked={solved} onSolved={solve} />
        ))}
      </View>
    </View>
  );
}

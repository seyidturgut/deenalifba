import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { getLetter, LETTERS } from "@/data/letters";
import { getLetterForms, PATH_BOX, type LetterFormKind } from "@/data/letterForms";
import { getLetterPath } from "@/data/letterPaths";
import { haptics } from "@/lib/haptics";
import { playCorrect, playLetter, playSfx, resetCombo } from "@/lib/sfx";
import { useStageStore } from "@/stores/stageStore";

/**
 * "Bu hangi harf?" — FormRecognition'ın TERS yönü.
 *
 * FormRecognition: bilinen izole harf → formunu bul.
 * Bu oyun: kelimeden çıkmış bir FORM gösterilir → çocuk hangi harf olduğunu (izole
 * hâlini) seçer. Gerçek okumada yapacağı iş budur. Ayrıca tek tip soru tekrarını kırar
 * (Abdulkadir: 1-28'deki oyun çeşitliliği bu bölümde de korunmalı).
 */
const TARGET = 128;
const CARD = 112;

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

function OptionCard({ d, isTarget, locked, onSolved }: { d: string; isTarget: boolean; locked: boolean; onSolved: () => void }) {
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
      playCorrect();
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
      resetCombo();
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
        <Glyph d={d} size={CARD * 0.6} />
      </Pressable>
    </Animated.View>
  );
}

export function FormReverse({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const [solved, setSolved] = useState(false);
  const letter = getLetter(letterId);

  // Soru: bu harfin bir pozisyonel formu. Şıklar: İZOLE harfler (doğrusu + 3 çeldirici)
  const round = useMemo(() => {
    const kinds = positionalKinds(letterId);
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const promptD = getLetterForms(letterId)?.paths[kind];

    const others = LETTERS.filter((l) => l.id !== letterId);
    const decoys: string[] = [];
    const used = new Set<number>();
    while (decoys.length < 3 && used.size < others.length) {
      const pick = others[Math.floor(Math.random() * others.length)];
      if (used.has(pick.id)) continue;
      used.add(pick.id);
      const d = getLetterPath(pick.id)?.d;
      if (d) decoys.push(d);
    }

    const own = getLetterPath(letterId)?.d;
    const opts = own ? [{ d: own, isTarget: true }, ...decoys.map((d) => ({ d, isTarget: false }))] : [];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return { promptD, opts };
  }, [letterId]);

  useEffect(() => {
    setSolved(false);
  }, [letterId]);

  if (!letter || !round.promptD) return null;

  const solve = () => {
    setSolved(true);
    playLetter(letterId); // doğru cevapta harfin sesi — form ↔ ses bağını pekiştirir
    setTimeout(onComplete, 900);
  };

  return (
    <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 16 }}>
      {/* Kelimeden çıkmış form — "bu hangi harf?" */}
      <View
        style={{
          width: TARGET,
          height: TARGET,
          borderRadius: 26,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderWidth: 4,
          borderColor: "#3FB984",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#1462B5",
          shadowOpacity: 0.18,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Glyph d={round.promptD} size={TARGET * 0.6} color="#2E7D5B" />
      </View>

      <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: "#34618C", textAlign: "center" }}>
        {t("forms.reversePrompt")}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, maxWidth: CARD * 2 + 36 }}>
        {round.opts.map((o, i) => (
          <OptionCard key={i} d={o.d} isTarget={o.isTarget} locked={solved} onSolved={solve} />
        ))}
      </View>
    </View>
  );
}

import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { JuicyButton } from "@/components/ui/JuicyButton";
import { getLetter } from "@/data/letters";
import { getLetterForms, PATH_BOX, type LetterFormKind } from "@/data/letterForms";
import { getLetterPath } from "@/data/letterPaths";
import { haptics } from "@/lib/haptics";
import { playLetter, playNarration, playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * "Harf Tanıma" ÖĞRETME adımı — testten ÖNCE gelir.
 *
 * Kullanıcının haklı itirazı: 28 harften sonra çocuk harflerin kelime içinde neden
 * şekil değiştirdiğini HİÇ bilmiyor; doğrudan "hangisi aynı harf?" diye sormak
 * öğretmeden test etmek olur. Bu adım önce GÖSTERİR:
 *   izole harf (bildiği) → aynı harf kelimenin başında / ortasında / sonunda
 * Her form tek tek, konumunu belli eden bir "kelime iskeleti" üstünde belirir; harf
 * hep aynı renkte kalır (vurgu), komşu yerler soluk noktalarla temsil edilir.
 *
 * YAZISIZ: konum bilgisi noktaların yerinden anlaşılır, ses her adımda tekrar çalar.
 */
const BIG = 128;
const SLOT = 46;

const ORDER: LetterFormKind[] = ["initial", "medial", "final"];
/** Form → Pırıl'ın konum repliği. Üç kutu tek başına çocuğa "baş/orta/son" demiyordu;
    kullanıcı haklı olarak sesli anlatım istedi. */
const POS_NARRATION = { initial: "posInitial", medial: "posMedial", final: "posFinal" } as const;

function Glyph({ d, size, color = "#2A2A33" }: { d: string; size: number; color?: string }) {
  return (
    <Svg width={size} height={size}>
      <G transform={`scale(${size / PATH_BOX})`}>
        <Path d={d} fill={color} />
      </G>
    </Svg>
  );
}

/** Kelime iskeleti: 3 kutu (baş/orta/son — Arapça SAĞDAN sola). Harfin yeri dolu, diğerleri soluk. */
function WordSlots({ kind, glyphD }: { kind: LetterFormKind; glyphD: string }) {
  // Arapça sağdan sola: dizi ekranda ters çevrilir (row-reverse)
  const slots: LetterFormKind[] = ["initial", "medial", "final"];
  return (
    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
      {slots.map((s) => {
        const active = s === kind;
        return (
          <View
            key={s}
            style={{
              width: SLOT,
              height: SLOT,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? "#FFFFFF" : "rgba(255,255,255,0.4)",
              borderWidth: active ? 3 : 2,
              borderColor: active ? "#3FB984" : "rgba(143,168,200,0.45)",
            }}
          >
            {active ? (
              <Glyph d={glyphD} size={SLOT * 0.66} color="#2E7D5B" />
            ) : (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(143,168,200,0.5)" }} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export function FormIntro({ letterId, onDone }: { letterId: number; onDone: () => void }) {
  const { t } = useTranslation();
  const letter = getLetter(letterId);
  const iso = getLetterPath(letterId);
  const forms = getLetterForms(letterId);
  const language = useSettingsStore((s) => s.language);

  // Bu harfin gerçekten sahip olduğu pozisyonel formlar (bağlanmayanlarda yalnız "final")
  const kinds = ORDER.filter((k) => !!forms?.paths[k]);
  // faz: 0 = izole tanıtım, 1..kinds.length = formlar
  const [phase, setPhase] = useState(0);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.05 }] }));

  useEffect(() => {
    // faz 0: harfin kendi sesi (tanıdık çapa) — sonraki fazlarda Pırıl konumu SÖYLER
    const k = phase === 0 ? null : kinds[phase - 1];
    const tt = setTimeout(() => {
      if (k) playNarration(language, POS_NARRATION[k as "initial" | "medial" | "final"]);
      else playLetter(letterId);
    }, 300);
    return () => clearTimeout(tt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterId, phase, language]);

  if (!letter || !iso || !forms) return null;

  const isIntro = phase === 0;
  const kind = kinds[phase - 1];
  const next = () => {
    haptics.tap();
    playSfx("ui_tap");
    if (phase < kinds.length) setPhase((p) => p + 1);
    else onDone();
  };

  return (
    <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: "#34618C", textAlign: "center", paddingHorizontal: 20 }}>
        {isIntro ? t("forms.introSame") : t("forms.introStill")}
      </Text>

      {isIntro ? (
        // 1) Bildiği izole harf — çapa
        <Animated.View style={pulseStyle}>
          <Pressable
            onPress={() => playLetter(letterId)}
            style={{
              width: BIG,
              height: BIG,
              borderRadius: 26,
              backgroundColor: "rgba(255,255,255,0.95)",
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
            <Glyph d={iso.d} size={BIG * 0.66} />
          </Pressable>
        </Animated.View>
      ) : (
        // 2) Aynı harf, kelimedeki yerine göre — izole hâli küçük referans olarak yanında kalır
        <Animated.View key={phase} entering={FadeIn.duration(350)} style={{ alignItems: "center", gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ width: 62, height: 62, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 2, borderColor: "#F5A524", alignItems: "center", justifyContent: "center" }}>
              <Glyph d={iso.d} size={40} />
            </View>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 26, color: "#7A8593" }}>=</Text>
            <View style={{ width: 62, height: 62, borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 3, borderColor: "#3FB984", alignItems: "center", justifyContent: "center" }}>
              <Glyph d={forms.paths[kind]!} size={40} color="#2E7D5B" />
            </View>
          </View>

          {/* Kelimedeki yeri — sağdan sola 3 kutu, harfin yeri vurgulu + Pırıl SÖYLER */}
          <WordSlots kind={kind} glyphD={forms.paths[kind]!} />
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 17, color: "#2E7D5B", textAlign: "center" }}>
            {t(`forms.${POS_NARRATION[kind as "initial" | "medial" | "final"]}`)}
          </Text>
        </Animated.View>
      )}

      <JuicyButton label={t("intro.continue")} tone="success" onPress={next} />
    </View>
  );
}

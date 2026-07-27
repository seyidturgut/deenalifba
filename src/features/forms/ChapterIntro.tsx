import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { getLetterForms, PATH_BOX } from "@/data/letterForms";
import { getLetterPath } from "@/data/letterPaths";
import { NARRATION_DURATIONS_MS, playNarration, playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * "Harf Tanıma" bölümünün AÇILIŞ anlatımı — bölüme İLK girişte bir kez.
 *
 * Kullanıcının itirazı: 28 harften sonra çocuk birden farklı bir düğümle karşılaşıyor
 * ve neden değiştiğini kimse anlatmıyor ("çocuklar bunu anlayamaz, sesli bir anlatım
 * ve ekran lazım"). Pırıl burada sesle anlatır: harfler kelimede el ele tutuşur,
 * şekilleri değişir, ama hâlâ aynı harflerdir.
 *
 * 3 replik (ElevenLabs, TR+EN) + her repliğe eşlik eden görsel:
 *   0) kutlama — bütün harfleri biliyorsun
 *   1) SIR: ب → بـ ـبـ ـب  (aynı harf, farklı yerlerde)
 *   2) hâlâ aynı harfler — hadi başlayalım
 */
const LINES = ["chForms1", "chForms2", "chForms3"] as const;
const DEMO_LETTER = 2; // ب — 4 formu da olan, tanıdık bir harf

function Glyph({ d, size, color = "#2A2A33" }: { d: string; size: number; color?: string }) {
  return (
    <Svg width={size} height={size}>
      <G transform={`scale(${size / PATH_BOX})`}>
        <Path d={d} fill={color} />
      </G>
    </Svg>
  );
}

export function ChapterIntro({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const [phase, setPhase] = useState(0);

  const iso = getLetterPath(DEMO_LETTER);
  const forms = getLetterForms(DEMO_LETTER);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 800, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.04 }] }));

  // Repliği çal + klip bitince otomatik ilerle (dokununca da hızlanır)
  useEffect(() => {
    const key = LINES[phase];
    const play = setTimeout(() => playNarration(language, key), 250);
    const dur = soundEnabled ? NARRATION_DURATIONS_MS[language][key] + 700 : 2600;
    const advance = phase < LINES.length - 1 ? setTimeout(() => setPhase((p) => p + 1), dur) : null;
    return () => {
      clearTimeout(play);
      if (advance) clearTimeout(advance);
    };
  }, [phase, language, soundEnabled]);

  const next = () => {
    playSfx("ui_tap");
    if (phase < LINES.length - 1) setPhase((p) => p + 1);
    else onDone();
  };

  return (
    <Pressable onPress={next} style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 22, paddingHorizontal: 20 }}>
      {/* Anlatım metni — sesle birlikte (ebeveyn okuyabilsin, çocuk dinler) */}
      <Animated.View key={`txt-${phase}`} entering={FadeIn.duration(400)} style={{ minHeight: 76, justifyContent: "center" }}>
        <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 14, maxWidth: 330, shadowColor: "#1462B5", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}>
          <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 16, color: "#34414F", textAlign: "center", lineHeight: 23 }}>
            {t(`forms.chIntro${phase + 1}`)}
          </Text>
        </View>
      </Animated.View>

      {/* Görsel: 2. replikte "aynı harf, farklı yerlerde" gösterimi */}
      {phase === 1 && iso && forms ? (
        <Animated.View entering={FadeIn.duration(450)} style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
          {[iso.d, forms.paths.initial, forms.paths.medial, forms.paths.final].map((d, i) =>
            d ? (
              <View
                key={i}
                style={{
                  width: 62,
                  height: 62,
                  borderRadius: 16,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 3,
                  borderColor: i === 0 ? "#F5A524" : "#3FB984",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Glyph d={d} size={40} color={i === 0 ? "#2A2A33" : "#2E7D5B"} />
              </View>
            ) : null
          )}
        </Animated.View>
      ) : (
        <Animated.View style={pulseStyle}>
          <Mascot size={132} pose={phase === 0 ? "celebrate" : "point"} />
        </Animated.View>
      )}

      {/* Son replikte başla butonu */}
      <View style={{ minHeight: 62, justifyContent: "center" }}>
        {phase === LINES.length - 1 && (
          <Animated.View entering={FadeIn.duration(400)}>
            <JuicyButton label={t("forms.chIntroStart")} tone="success" onPress={onDone} />
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}

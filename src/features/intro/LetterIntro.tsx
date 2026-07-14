import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { Floating } from "@/components/ui/Floating";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { RecordCompare } from "@/components/ui/RecordCompare";
import { getLetter } from "@/data/letters";
import { getLetterPath, PATH_BOX } from "@/data/letterPaths";
import { images } from "@/lib/images";
import { playLetter } from "@/lib/sfx";

const CARD = 250;
const GLYPH = 176; // kart içi glif alanı (altın çerçeveye değmesin)

/**
 * "Tanı" (öğret) adımı — TEST DEĞİL. Harfi tanıtır: büyük harf + sesi
 * (otomatik çalar + dokun-tekrar). Latin ad gösterilmez (Ismail: Arapça + ses).
 *
 * Harf, GERÇEK Amiri glif konturuyla (letterPaths, 1000×1000 kutuda ORTALANMIŞ)
 * SVG path olarak çizilir → 28 harfin hepsi kartta STABİL ortalı durur. (Text
 * glifi kullanılırsa kuyruklu harfler ح/ج yan boşluk/baseline yüzünden kayıyordu.)
 *
 * İki alt-ekrana bölünür (Abdulkadir video geri bildirimi): (1) "watch" — sade
 * harf+ses+devam (her harfte AYNI, sade), (2) "speak" — kaydet&karşılaştır,
 * adımın SONUNA doğru, tek başına kendi ekranında (Abdulkadir: tek ekranda
 * hem kart hem kayıt widget'ı fazla kalabalıktı + scroll gerektiriyordu; ayrıca
 * "her harfte olsun, sadece birkaç harften itibaren değil" diye netleştirdi).
 */
export function LetterIntro({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const letter = getLetter(letterId);
  const lp = getLetterPath(letterId);
  const sc = GLYPH / PATH_BOX;
  const [step, setStep] = useState<"watch" | "speak">("watch");
  const [hasRecorded, setHasRecorded] = useState(false);

  // Dokun-dinle rozeti nabzı — çocuk okuyamaz, ikon davetle "buraya dokun" anlaşılsın
  // (Abdulkadir: "sesli söyle" daveti yazıyla kalsın ama ikon/etkileşimle de desteklensin).
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.14 }] }));

  useEffect(() => {
    const tt = setTimeout(() => playLetter(letterId), 350);
    return () => clearTimeout(tt);
  }, [letterId]);

  if (!letter) return null;

  return (
    <View style={{ flex: 1, width: "100%" }}>
      {/* Kaydırılabilir güvenlik ağı (çok kısa ekranlarda taşarsa) — ama "Devam" butonu
          bunun DIŞINDA/ALTINDA SABİT durur. NOT: justifyContent:"center" kullanmıyoruz —
          içerik taştığında ortalama, taşmayı YUKARI ve AŞAĞI'ya eşit dağıtıp her iki
          uçtan da kırpılmaya yol açıyordu. Üstten akış + üstte biraz boşluk daha sağlam. */}
      <ScrollView
        style={{ flex: 1, width: "100%" }}
        contentContainerStyle={{ flexGrow: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 8, paddingBottom: 6 }}
        showsVerticalScrollIndicator={false}
      >
        {step === "watch" ? (
          // 1) Sade: büyük harf + ses + devam (Abdulkadir: her harfte AYNI sade ekran)
          <Floating distance={8} duration={2200}>
            <Pressable onPress={() => playLetter(letterId)} style={{ width: CARD, height: CARD }}>
              <Image source={images.playPanel} style={StyleSheet.absoluteFill} contentFit="fill" />
              <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}>
                {lp ? (
                  // bbox-merkezli path → her harf aynı şekilde ortalı
                  <Svg width={GLYPH} height={GLYPH}>
                    <G transform={`scale(${sc})`}>
                      <Path d={lp.d} fill="#2A2A33" />
                    </G>
                  </Svg>
                ) : (
                  // path yoksa Amiri glif fallback
                  <Text style={{ fontFamily: "Amiri_700Bold", fontSize: 140, color: "#2A2A33" }}>{letter.char}</Text>
                )}
              </View>
              {/* Dinle rozeti — ikonla "dokun ve dinle" daveti (illüstrasyon, emoji değil).
                  Kartın SINIRLARI İÇİNDE konumlanır (negatif taşma yok) → hiçbir kapsayıcıda kesilmez. */}
              <Animated.View pointerEvents="none" style={[{ position: "absolute", right: 2, bottom: 2 }, badgeStyle]}>
                <Image source={images.icListen} style={{ width: 58, height: 53 }} contentFit="contain" />
              </Animated.View>
            </Pressable>
          </Floating>
        ) : (
          // 2) Konuş: kaydet & karşılaştır — adımın SONUNDA, KENDİ tek-amaçlı ekranında
          // (Abdulkadir video: aynı ekranda hem kart hem kayıt widget'ı kalabalıktı/scroll
          // gerektiriyordu; "her harfte olsun ama adımın sonuna doğru" diye netleşti).
          <View style={{ alignItems: "center", gap: 22 }}>
            <Pressable
              onPress={() => playLetter(letterId)}
              style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 18 }}
            >
              <Image source={images.icListen} style={{ width: 34, height: 31 }} contentFit="contain" />
              {lp ? (
                <Svg width={40} height={40}>
                  <G transform={`scale(${40 / PATH_BOX})`}>
                    <Path d={lp.d} fill="#2A2A33" />
                  </G>
                </Svg>
              ) : (
                <Text style={{ fontFamily: "Amiri_700Bold", fontSize: 32, color: "#2A2A33" }}>{letter.char}</Text>
              )}
            </Pressable>
            <RecordCompare letterId={letterId} onRecordedChange={setHasRecorded} />
          </View>
        )}
      </ScrollView>

      {/* Devam (açık devam butonu) — SABİT, kaydırma alanının dışında */}
      <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
        <JuicyButton
          label={t("intro.continue")}
          tone="success"
          onPress={step === "watch" ? () => setStep("speak") : onComplete}
          disabled={step === "speak" && !hasRecorded}
        />
      </View>
    </View>
  );
}

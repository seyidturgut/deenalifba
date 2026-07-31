import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { NARRATION_DURATIONS_MS, playNarration, playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";
import { Mascot } from "@/components/ui/Mascot";
import { Crescent, Star8 } from "@/components/ui/IslamicMotifs";

const { width: SCREEN_W } = Dimensions.get("window");
const GROW = 850; // parça belirme süresi
const ADMIRE = 2400; // inşadan sonra hayran kalma süresi
const AUTOBUILD = 5200; // çocuk dokunmazsa otomatik inşa (takılmasın)

/**
 * Seviye sonu cami anı — ETKİLEŞİMLİ "dokun ve inşa et" (Sohail #6):
 * çocuk parıldayan işarete dokununca yeni parça yerine oturur (Pırıl yardım ister).
 * Dokunmazsa AUTOBUILD sonra kendiliğinden kurulur (takılma yok). İnşadan sonra
 * Pırıl kutlar + kısa hayran kalma, sonra `onDone`.
 */
export function MosqueBuild({
  visible,
  stageIndex,
  onDone,
  variant = "mosque",
}: {
  visible: boolean;
  stageIndex: number;
  onDone: () => void;
  /** "garden": cami 28'de bitti, Harf Tanıma seviyeleri bahçeyi büyütüyor. */
  variant?: "mosque" | "garden";
}) {
  const { t } = useTranslation();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const language = useSettingsStore((s) => s.language);
  const [built, setBuilt] = useState(false);
  const builtRef = useRef(false);
  const doneRef = useRef(false);

  const appear = useSharedValue(0);
  const cardScale = useSharedValue(0.8);
  const newOpacity = useSharedValue(0); // yeni aşama
  const prevOpacity = useSharedValue(1); // önceki aşama
  const pop = useSharedValue(0);
  const glow = useSharedValue(0);
  const sparkle = useSharedValue(0);
  const marker = useSharedValue(0); // "dokun" işareti nabzı
  const pirilBounce = useSharedValue(0);

  const isGarden = variant === "garden";
  const STAGE_IMAGES = isGarden ? images.gardenStages : images.mosqueStages;
  const idx = Math.min(Math.max(stageIndex, 0), STAGE_IMAGES.length - 1);
  // Bahçenin ilk adımında "önceki" görsel tamamlanmış CAMİ olmalı — çocuk
  // caminin yerinde durduğunu, sadece etrafının canlandığını görsün.
  const hasPrev = idx > 0 || isGarden;
  const prevSource =
    idx > 0 ? STAGE_IMAGES[idx - 1] : images.mosqueStages[images.mosqueStages.length - 1];

  const doBuild = () => {
    if (builtRef.current) return;
    builtRef.current = true;
    setBuilt(true);
    playSfx("mosque_build");
    playSfx("star_earned", 0.7);
    // Pırıl: "Bak, camin büyüdü!" / bahçede "Bahçemiz bir adım daha güzelleşti!"
    setTimeout(() => playNarration(language, isGarden ? "gardenGrown" : "mosqueBuilt"), 300);
    if (hapticsEnabled) haptics.celebrate();
    newOpacity.value = withTiming(1, { duration: GROW, easing: Easing.out(Easing.cubic) });
    if (hasPrev) prevOpacity.value = withTiming(0, { duration: GROW * 0.7 });
    pop.value = withSequence(withTiming(1.1, { duration: 320, easing: Easing.out(Easing.back(2)) }), withSpring(1, { damping: 9 }));
    glow.value = withSequence(withTiming(1, { duration: 360 }), withDelay(800, withTiming(0.5, { duration: 1000 })));
    sparkle.value = withSequence(withTiming(1, { duration: 420 }), withDelay(800, withTiming(0, { duration: 800 })));
    pirilBounce.value = withSequence(withTiming(1, { duration: 280, easing: Easing.out(Easing.back(2)) }), withSpring(0, { damping: 7 }));
    setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    }, GROW + ADMIRE);
  };

  useEffect(() => {
    if (!visible) return;
    builtRef.current = false;
    doneRef.current = false;
    setBuilt(false);
    if (hapticsEnabled) haptics.tap();

    appear.value = 0;
    appear.value = withTiming(1, { duration: 220 });
    cardScale.value = 0.8;
    cardScale.value = withSequence(withTiming(1.04, { duration: 240, easing: Easing.out(Easing.back(2)) }), withSpring(1, { damping: 10 }));

    // inşa öncesi: önceki aşama görünür, yeni gizli (ilk parçada hafif hayalet)
    newOpacity.value = hasPrev ? 0 : 0.22;
    prevOpacity.value = hasPrev ? 1 : 0;
    pop.value = 0;
    glow.value = 0;
    sparkle.value = 0;
    pirilBounce.value = 0;
    // "dokun" işareti nabzı (inşaya kadar)
    marker.value = withRepeat(withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) })), -1, false);

    /**
     * Abdulkadir (madde 8): "Cami ve bahçe inşasında da Pırıl açıklasın — küçük
     * çocuklar bu bölümü başta anlamıyor, ebeveyn anlatınca çok seviyorlar."
     * Yalnız İLK kez; sonra sessizce geçer. Anlatım sürerken otomatik inşa da
     * beklesin, yoksa Pırıl daha konuşurken parça yerine oturuyor.
     */
    const tipKey = isGarden ? "gardenHowto" : "mosqueHowto";
    const tipMs = useSettingsStore.getState().claimTip(tipKey)
      ? NARRATION_DURATIONS_MS[language][tipKey]
      : 0;
    let tip: ReturnType<typeof setTimeout> | null = null;
    if (tipMs) tip = setTimeout(() => playNarration(language, tipKey), 400);

    const auto = setTimeout(doBuild, AUTOBUILD + tipMs);
    return () => {
      if (tip) clearTimeout(tip);
      clearTimeout(auto);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, stageIndex]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: appear.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: appear.value, transform: [{ scale: cardScale.value }] }));
  const newStyle = useAnimatedStyle(() => ({ opacity: newOpacity.value, transform: [{ scale: 0.62 + pop.value * 0.38 }] }));
  const prevStyle = useAnimatedStyle(() => ({ opacity: prevOpacity.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.9 + glow.value * 0.3 }] }));
  const sparkleStyle = useAnimatedStyle(() => ({ opacity: sparkle.value, transform: [{ scale: 0.6 + sparkle.value * 0.6 }, { rotate: `${sparkle.value * 40}deg` }] }));
  const markerStyle = useAnimatedStyle(() => ({ opacity: 0.5 + marker.value * 0.5, transform: [{ scale: 0.9 + marker.value * 0.22 }] }));
  const pirilStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pirilBounce.value * 0.16 }, { translateY: -pirilBounce.value * 6 }] }));

  if (!visible) return null;

  const BOX = SCREEN_W * 0.6;
  const IMG = SCREEN_W * 0.58;

  return (
    <Animated.View
      style={[
        { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0B3566", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
        backdropStyle,
      ]}
    >
      <Pressable onPress={() => (built ? onDone() : doBuild())} style={{ alignItems: "center", justifyContent: "center", flex: 1, width: "100%" }}>
        <Animated.View
          style={[
            {
              alignItems: "center",
              backgroundColor: "#FFFDF7",
              borderRadius: 34,
              borderWidth: 4,
              borderColor: "#FFD36B",
              paddingTop: 16,
              paddingBottom: 18,
              paddingHorizontal: 20,
              shadowColor: "#1462B5",
              shadowOpacity: 0.3,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
            },
            cardStyle,
          ]}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 20, color: "#208AEF", textAlign: "center", marginBottom: 6 }}>
            {built ? t("mosque.builtCheer") : t(isGarden ? "mosque.gardenBuilding" : "mosque.building")}
          </Text>
          <View style={{ width: BOX, height: BOX, alignItems: "center", justifyContent: "center" }}>
            {/* sıcak parıltı (inşa anı) */}
            <Animated.View
              style={[
                { position: "absolute", width: SCREEN_W * 0.56, height: SCREEN_W * 0.56, borderRadius: SCREEN_W * 0.28, backgroundColor: "rgba(245,165,36,0.3)" },
                glowStyle,
              ]}
            />
            {/* önceki aşama */}
            {hasPrev && (
              <Animated.View style={[{ position: "absolute", width: IMG, height: IMG }, prevStyle]}>
                <Image source={prevSource} style={{ width: IMG, height: IMG }} contentFit="contain" />
              </Animated.View>
            )}
            {/* yeni aşama */}
            <Animated.View style={[{ position: "absolute", width: IMG, height: IMG }, newStyle]}>
              <Image source={STAGE_IMAGES[idx]} style={{ width: IMG, height: IMG }} contentFit="contain" />
            </Animated.View>

            {/* "DOKUN" işareti (inşadan önce) */}
            {!built && (
              <Animated.View
                style={[
                  { position: "absolute", width: 76, height: 76, borderRadius: 38, backgroundColor: "rgba(245,165,36,0.95)", alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: "#fff" },
                  markerStyle,
                ]}
              >
                <Text style={{ fontSize: 34 }}>{isGarden ? "🌱" : "🧱"}</Text>
              </Animated.View>
            )}

            {/* İslami motif parıltıları (inşa anında) */}
            {built && hasPrev && (
              <>
                <Animated.View style={[{ position: "absolute", top: 6, right: BOX * 0.16 }, sparkleStyle]}>
                  <Star8 size={34} color="#F5A524" />
                </Animated.View>
                <Animated.View style={[{ position: "absolute", top: BOX * 0.26, left: BOX * 0.08 }, sparkleStyle]}>
                  <Crescent size={26} color="#2E8B9E" />
                </Animated.View>
                <Animated.View style={[{ position: "absolute", bottom: BOX * 0.2, right: BOX * 0.08 }, sparkleStyle]}>
                  <Star8 size={22} color="#2FA869" />
                </Animated.View>
              </>
            )}

            {/* Pırıl — inşadan önce yardım ister (point), sonra kutlar (celebrate) */}
            <Animated.View style={[{ position: "absolute", bottom: -BOX * 0.04, right: -BOX * 0.04, width: BOX * 0.42, height: BOX * 0.42, alignItems: "center", justifyContent: "flex-end" }, pirilStyle]}>
              <Mascot size={BOX * 0.42} pose={built ? "celebrate" : "point"} />
            </Animated.View>
          </View>
        </Animated.View>

        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: "rgba(255,255,255,0.92)", marginTop: 18 }}>
          {built ? t("mosque.tapContinue") : t("mosque.tapToBuild")}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Crescent } from "./IslamicMotifs";
import { useStreakStore } from "@/stores/streakStore";

/**
 * İstikamet Zinciri bandı (oyunsal): altın madalyonda büyük gün sayısı +
 * büyüyen hilal dizisi. Nabız animasyonu + en yeni hilalde parıltı.
 * Pratik yoksa "bugün başlat" davetkâr hali. accentColor = çocuğun tema rengi.
 */
export function ChainBanner({ accentColor = "#F5A524" }: { accentColor?: string }) {
  const { t } = useTranslation();
  // reaktivite için abone ol, sonra canlı görünümü hesapla
  useStreakStore((s) => s.currentChain);
  useStreakStore((s) => s.lastPracticeDay);
  const cv = useStreakStore.getState().chainView(Date.now());
  const active = cv.current > 0;

  // madalyon nabzı
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse]);
  const medallionStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.06 }] }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: 0.35 + pulse.value * 0.4, transform: [{ scale: 1 + pulse.value * 0.18 }] }));

  const GOLD = "#F5A524";
  const visible = Math.min(cv.current, 7);

  return (
    <View
      className="mt-2 flex-row items-center self-start rounded-3xl px-3 py-2"
      style={{
        gap: 12,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderWidth: 2,
        borderColor: "#FFE2A6",
        shadowColor: "#1462B5",
        shadowOpacity: 0.14,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      {/* Madalyon — gün sayısı (veya başlat hilali) */}
      <View style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={[{ position: "absolute", width: 52, height: 52, borderRadius: 26, borderWidth: 3, borderColor: accentColor }, ringStyle]}
        />
        <Animated.View
          style={[
            { width: 46, height: 46, borderRadius: 23, backgroundColor: accentColor, alignItems: "center", justifyContent: "center" },
            medallionStyle,
          ]}
        >
          {active ? (
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#FFFFFF" }}>{cv.current}</Text>
          ) : (
            <Crescent size={26} color="#FFFFFF" />
          )}
        </Animated.View>
      </View>

      {/* Sağ: hilal dizisi + etiket */}
      <View style={{ gap: 3 }}>
        {active ? (
          <>
            <View className="flex-row items-center" style={{ gap: 3 }}>
              {Array.from({ length: visible }).map((_, i) => (
                <Crescent key={i} size={i === visible - 1 ? 24 : 20} color={GOLD} />
              ))}
              {cv.current > 7 && (
                <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 15, color: GOLD, marginLeft: 2 }}>+{cv.current - 7}</Text>
              )}
            </View>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 15, color: "#0E5FC2" }}>{t("home.chain", { n: cv.current })}</Text>
          </>
        ) : (
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: "#0E5FC2" }}>{t("home.chainStart")}</Text>
        )}
      </View>
    </View>
  );
}

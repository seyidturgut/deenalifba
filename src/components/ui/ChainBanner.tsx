import { Image } from "expo-image";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { images } from "@/lib/images";
import { useStreakStore } from "@/stores/streakStore";

/**
 * İstikamet Zinciri bandı — TAMAMEN GÖRSEL (yazısız): girih madalyonunda gün
 * sayısı + ipe dizili altın hilal boncukları (en yeni daha büyük, nabızlı).
 * Pratik yoksa davetkâr tek sönük boncuk. accentColor = çocuğun tema rengi (hale).
 */
export function ChainBanner({ accentColor = "#F5A524" }: { accentColor?: string }) {
  useStreakStore((s) => s.currentChain); // reaktivite
  useStreakStore((s) => s.lastPracticeDay);
  const cv = useStreakStore.getState().chainView(Date.now());
  const active = cv.current > 0;
  const visible = Math.min(cv.current, 7);

  // en yeni boncuk + madalyon nabzı
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 850, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [pulse]);
  const newestStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * 0.1 }, { rotate: `${pulse.value * 4}deg` }] }));
  const haloStyle = useAnimatedStyle(() => ({ opacity: 0.18 + pulse.value * 0.18, transform: [{ scale: 1 + pulse.value * 0.12 }] }));

  return (
    <View
      className="flex-row items-center self-start rounded-3xl px-3 py-2"
      style={{
        gap: 6,
        backgroundColor: "rgba(255,255,255,0.92)",
        borderWidth: 2,
        borderColor: "#FFE2A6",
        shadowColor: "#1462B5",
        shadowOpacity: 0.14,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      {/* Madalyon + gün sayısı */}
      <View style={{ width: 58, height: 58, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          style={[{ position: "absolute", width: 58, height: 58, borderRadius: 29, backgroundColor: accentColor }, haloStyle]}
        />
        <Image source={images.chainMedallion} style={{ position: "absolute", width: 58, height: 58 }} contentFit="contain" />
        {active ? (
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#8A5A12", marginTop: -1 }}>{cv.current}</Text>
        ) : (
          <Image source={images.chainBead} style={{ width: 30, height: 30, opacity: 0.5 }} contentFit="contain" />
        )}
      </View>

      {/* Boncuk dizisi (yalnız görsel) */}
      {active ? (
        <View className="flex-row items-center" style={{ gap: 1 }}>
          {Array.from({ length: visible }).map((_, i) => {
            const newest = i === visible - 1;
            const sz = newest ? 38 : 32;
            const Bead = (
              <Image source={images.chainBead} style={{ width: sz, height: sz }} contentFit="contain" />
            );
            return newest ? (
              <Animated.View key={i} style={newestStyle}>
                {Bead}
              </Animated.View>
            ) : (
              <View key={i}>{Bead}</View>
            );
          })}
        </View>
      ) : (
        <Animated.View style={newestStyle}>
          <Image source={images.chainBead} style={{ width: 38, height: 38 }} contentFit="contain" />
        </Animated.View>
      )}
    </View>
  );
}

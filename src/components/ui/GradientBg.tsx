import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/lib/images";

/**
 * İllüstrasyonlu gökyüzü arka planı (bg_sky) + güvenli alan.
 * Tüm ekranların ortak zemini — premium, tutarlı atmosfer.
 */
export function GradientBg({
  children,
  night = 0,
}: {
  children: ReactNode;
  /** geriye dönük uyum; artık tek illüstrasyon zemin kullanılıyor */
  variant?: "sky" | "skyWarm";
  /**
   * 0 = gündüz. 0-1 arası akşam/gece koyuluğu.
   * Bahçenin son iki aşaması (akşam kandilleri / yıldızlı gece) gündüz gökyüzünde
   * yapayık duruyordu — ekranın tamamı da onunla birlikte kararıyor.
   */
  night?: number;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: night > 0 ? "#0A1740" : "#BFE3FF" }}>
      <Image
        source={images.bgSky}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      {night > 0 && (
        <LinearGradient
          colors={["#0A1740", "#132A63", "#2A3F7A"]}
          style={[StyleSheet.absoluteFill, { opacity: night }]}
        />
      )}
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 18 }}>{children}</SafeAreaView>
    </View>
  );
}

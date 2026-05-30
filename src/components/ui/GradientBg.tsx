import { Image } from "expo-image";
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
}: {
  children: ReactNode;
  /** geriye dönük uyum; artık tek illüstrasyon zemin kullanılıyor */
  variant?: "sky" | "skyWarm";
}) {
  return (
    <View style={{ flex: 1, backgroundColor: "#BFE3FF" }}>
      <Image
        source={images.bgSky}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 18 }}>{children}</SafeAreaView>
    </View>
  );
}

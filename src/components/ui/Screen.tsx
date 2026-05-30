import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** Tüm ekranlar için ortak güvenli alan + arka plan sarmalayıcısı. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1 bg-canvas">
      <SafeAreaView className="flex-1 px-5">{children}</SafeAreaView>
    </View>
  );
}

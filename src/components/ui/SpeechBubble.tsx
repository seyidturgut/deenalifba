import type { ReactNode } from "react";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/** Maskotun konuştuğu yuvarlak konuşma balonu (alt köşeli kuyruklu). */
export function SpeechBubble({ children }: { children: ReactNode }) {
  return (
    <Animated.View entering={FadeInDown.springify().damping(12)} style={{ alignItems: "center" }}>
      <View
        className="rounded-3xl bg-white px-6 py-5"
        style={{
          maxWidth: 320,
          shadowColor: "#1462B5",
          shadowOpacity: 0.18,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        }}
      >
        <Text
          style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 20, color: "#2A2A33", textAlign: "center", lineHeight: 28 }}
        >
          {children}
        </Text>
      </View>
      {/* Kuyruk (alt üçgen) */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 12,
          borderRightWidth: 12,
          borderTopWidth: 14,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: "#FFFFFF",
          marginTop: -1,
        }}
      />
    </Animated.View>
  );
}

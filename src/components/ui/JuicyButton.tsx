import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { haptics } from "@/lib/haptics";
import { playSfx } from "@/lib/sfx";
import { gradients, type GradientButtonTone } from "@/theme/gradients";
import { useSettingsStore } from "@/stores/settingsStore";

const LIP = 6; // butonun 3D "dudak" yüksekliği

type Props = {
  label: string;
  onPress?: () => void;
  tone?: GradientButtonTone;
  style?: ViewStyle;
  disabled?: boolean;
};

/**
 * "Chunky" juicy buton (Duolingo/oyun tarzı): gradyan yüz + altında koyu dudak.
 * Basınca yüz aşağı iner (dudağa oturur) → tatmin edici dokunsal his.
 */
export function JuicyButton({ label, onPress, tone = "primary", style, disabled }: Props) {
  const pressed = useSharedValue(0);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const g = gradients[tone];

  const faceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * LIP }],
  }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 60 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 110 });
      }}
      onPress={() => {
        if (hapticsEnabled) haptics.tap();
        playSfx("ui_tap");
        onPress?.();
      }}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
    >
      <View style={{ paddingBottom: LIP }}>
        {/* Dudak (alt koyu kenar) */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: LIP,
            bottom: 0,
            borderRadius: 22,
            backgroundColor: g.lip,
          }}
        />
        {/* Üst yüz */}
        <Animated.View style={faceStyle}>
          <LinearGradient
            colors={g.face}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              minHeight: 58,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 28,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 19,
                fontFamily: "Fredoka_700Bold",
                letterSpacing: 0.3,
                textShadowColor: "rgba(0,0,0,0.18)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 2,
              }}
            >
              {label}
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>
    </Pressable>
  );
}

import { Image } from "expo-image";
import { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { haptics } from "@/lib/haptics";
import { playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * HudhudMascot — Kâşif Hüdhüd "Pırıl". POZ-BAZLI 2D maskot:
 * 5 poz görseli (idle/happy/celebrate/wave/point) + in-app animasyon
 * (idle nefes/süzülme + dokunmada squash-zıplama + poz değişiminde küçük bounce).
 * Görseller 3D modelden render edildi; aynı tuvalde → poz değişimi hizalı.
 */
type Pose = "idle" | "happy" | "celebrate" | "wave" | "point";

const POSE_SRC: Record<Pose, number> = {
  idle: require("@/assets/illustrations/mascot/Hudhud/hudhud_idle.webp"),
  happy: require("@/assets/illustrations/mascot/Hudhud/hudhud_happy.webp"),
  celebrate: require("@/assets/illustrations/mascot/Hudhud/hudhud_celebrate.webp"),
  wave: require("@/assets/illustrations/mascot/Hudhud/hudhud_wave.webp"),
  point: require("@/assets/illustrations/mascot/Hudhud/hudhud_point.webp"),
};

export function HudhudMascot({
  size = 56,
  onTap,
  pose = "idle",
}: {
  size?: number;
  onTap?: () => void;
  pose?: Pose;
  talking?: boolean;
}) {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const idle = useSharedValue(0);
  const jump = useSharedValue(0);
  const squash = useSharedValue(0);
  const bounce = useSharedValue(0);

  useEffect(() => {
    idle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [idle]);

  // poz değişiminde küçük zıplama
  useEffect(() => {
    if (pose === "idle") return;
    bounce.value = withSequence(withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 7 }));
  }, [pose, bounce]);

  const triggerJump = () => {
    if (hapticsEnabled) haptics.tap();
    playSfx("mascot_jump");
    squash.value = withSequence(withTiming(1, { duration: 90 }), withTiming(-1, { duration: 140 }), withSpring(0, { damping: 6, stiffness: 180 }));
    jump.value = withSequence(withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 7, stiffness: 160 }));
    onTap?.();
  };

  const style = useAnimatedStyle(() => {
    const breatheY = idle.value * -size * 0.04;
    const jumpY = (jump.value + bounce.value * 0.6) * -size * 0.16;
    const wiggle = idle.value * 1.5;
    const sx = 1 + squash.value * 0.12 + idle.value * 0.015;
    const sy = 1 - squash.value * 0.12 - idle.value * 0.015;
    return { transform: [{ translateY: breatheY + jumpY }, { rotate: `${wiggle}deg` }, { scaleX: sx }, { scaleY: sy }] };
  });

  // portre karakteri kare footprint'e sığdır (contain) — taşma yok
  return (
    <Pressable onPress={triggerJump} hitSlop={8} style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={style}>
        <Image source={POSE_SRC[pose]} style={{ width: size, height: size }} contentFit="contain" />
      </Animated.View>
    </Pressable>
  );
}

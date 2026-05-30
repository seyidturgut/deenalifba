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
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Canlı maskot — sürekli nefes/süzülme (idle) + dokununca squash-stretch zıplama.
 *
 * NOT: Reanimated transform animasyonu (statik PNG üzerinde). Göz kırpma gibi
 * parça-bazlı animasyonlar için riglenmiş Rive/Lottie asset gerekir — design
 * ekibi teslim edince `Mascot` aynı arayüzle Rive'a geçirilebilir.
 */
type Pose = "idle" | "happy" | "celebrate" | "wave" | "point";

const POSE_SOURCE: Record<Pose, number> = {
  idle: images.mascot,
  happy: images.mascotHappy,
  celebrate: images.mascotCelebrate,
  wave: images.mascotWave,
  point: images.mascotPoint,
};

export function Mascot({
  size = 56,
  onTap,
  pose = "idle",
}: {
  size?: number;
  onTap?: () => void;
  pose?: Pose;
}) {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  const idle = useSharedValue(0); // -1..1 nefes/süzülme
  const jump = useSharedValue(0); // 0..1 zıplama
  const squash = useSharedValue(0); // 0..1 squash-stretch

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

  const triggerJump = () => {
    if (hapticsEnabled) haptics.tap();
    playSfx("mascot_jump");
    // squash → stretch → yerine otur
    squash.value = withSequence(
      withTiming(1, { duration: 90 }),
      withTiming(-1, { duration: 140 }),
      withSpring(0, { damping: 6, stiffness: 180 })
    );
    jump.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
      withSpring(0, { damping: 7, stiffness: 160 })
    );
    onTap?.();
  };

  const style = useAnimatedStyle(() => {
    const breatheY = idle.value * -5;
    const jumpY = jump.value * -26;
    const wiggle = idle.value * 2 + jump.value * 4;
    // squash: +1 → bas-yayıl (geniş/alçak), -1 → uza (dar/yüksek)
    const sx = 1 + squash.value * 0.12 + idle.value * 0.015;
    const sy = 1 - squash.value * 0.12 - idle.value * 0.015;
    return {
      transform: [
        { translateY: breatheY + jumpY },
        { rotate: `${wiggle}deg` },
        { scaleX: sx },
        { scaleY: sy },
      ],
    };
  });

  return (
    <Pressable onPress={triggerJump} hitSlop={8}>
      <Animated.View style={style}>
        <Image source={POSE_SOURCE[pose]} style={{ width: size, height: size }} contentFit="contain" />
      </Animated.View>
    </Pressable>
  );
}

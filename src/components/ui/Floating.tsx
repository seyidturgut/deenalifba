import type { ReactNode } from "react";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

/**
 * İçeriğini yumuşakça yukarı-aşağı süzdürür (maskot/hero için "canlı" his).
 */
export function Floating({
  children,
  distance = 10,
  duration = 1600,
  delay = 0,
}: {
  children: ReactNode;
  distance?: number;
  duration?: number;
  delay?: number;
}) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-distance, { duration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [y, distance, duration]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

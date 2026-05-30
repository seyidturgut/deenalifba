import { Pressable, Text, type PressableProps } from "react-native";

import { haptics } from "@/lib/haptics";
import { useSettingsStore } from "@/stores/settingsStore";

type Variant = "primary" | "accent" | "ghost";

type Props = PressableProps & {
  label: string;
  variant?: Variant;
};

const containerByVariant: Record<Variant, string> = {
  primary: "bg-primary",
  accent: "bg-accent",
  ghost: "bg-transparent border-2 border-primary",
};

const textByVariant: Record<Variant, string> = {
  primary: "text-white",
  accent: "text-white",
  ghost: "text-primary",
};

/** Çocuk dostu, büyük dokunma hedefli buton (min 56px). */
export function Button({ label, variant = "primary", onPress, ...rest }: Props) {
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={(e) => {
        if (hapticsEnabled) haptics.tap();
        onPress?.(e);
      }}
      className={`min-h-[56px] items-center justify-center rounded-2xl px-6 py-4 active:opacity-80 ${containerByVariant[variant]}`}
      {...rest}
    >
      <Text className={`font-display text-lg font-bold ${textByVariant[variant]}`}>
        {label}
      </Text>
    </Pressable>
  );
}

import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { JuicyButton } from "@/components/ui/JuicyButton";
import { playSfx } from "@/lib/sfx";

/**
 * Ebeveyn Kapısı (PROJECT PROFILE §4.B).
 * Ayarlar/abonelik/ebeveyn görünümlerine erişimi engelleyen matematik doğrulama.
 */
function makeChallenge() {
  const a = 11 + Math.floor(Math.random() * 9); // 11..19
  const b = 3 + Math.floor(Math.random() * 6); // 3..8
  return { a, b, answer: a * b };
}

export function ParentGate({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation();
  const challenge = useMemo(makeChallenge, []);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const check = () => {
    if (parseInt(value, 10) === challenge.answer) {
      playSfx("parent_gate_open");
      onSuccess();
    } else {
      setError(true);
      setValue("");
    }
  };

  return (
    <View className="flex-1 items-center justify-center gap-5 px-6">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-white/80">
        <Text className="text-3xl">🔒</Text>
      </View>
      <Text className="font-display text-2xl font-extrabold text-ink">
        {t("parentGate.title")}
      </Text>
      <Text className="text-center text-base font-semibold text-ink/60">
        {t("parentGate.forParents")}
      </Text>
      <View
        className="items-center rounded-3xl bg-white px-8 py-6"
        style={{
          shadowColor: "#1462B5",
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        }}
      >
        <Text className="font-display text-4xl font-extrabold text-primary">
          {challenge.a} × {challenge.b} = ?
        </Text>
        <TextInput
          className="mt-4 w-40 rounded-full border-2 border-primary-soft bg-canvas px-4 py-3 text-center text-2xl font-bold"
          keyboardType="number-pad"
          value={value}
          onChangeText={setValue}
          accessibilityLabel={t("parentGate.instruction")}
          autoFocus
        />
        {error && <Text className="mt-2 text-base font-bold text-accent">{t("parentGate.wrong")}</Text>}
      </View>
      <JuicyButton label={t("common.continue")} tone="accent" onPress={check} />
    </View>
  );
}

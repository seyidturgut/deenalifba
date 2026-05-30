import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { LETTERS } from "@/data/letters";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { MOSQUE_UNLOCK_THRESHOLDS, type MosquePart } from "@/stores/mosqueStore";
import { useProgressStore } from "@/stores/progressStore";

export default function Mosque() {
  const { t } = useTranslation();
  const router = useRouter();

  const completed = useProgressStore((s) =>
    LETTERS.filter((l) => s.isLetterComplete(l.id)).length
  );

  const unlockedParts: MosquePart[] = MOSQUE_UNLOCK_THRESHOLDS.filter(
    (th) => completed >= th.lettersRequired
  ).map((th) => th.part);

  const progress = unlockedParts.length / MOSQUE_UNLOCK_THRESHOLDS.length;

  // Yeni cami parçası belirince ses çal
  const prevParts = useRef(unlockedParts.length);
  useEffect(() => {
    if (unlockedParts.length > prevParts.current) playSfx("mosque_build");
    prevParts.current = unlockedParts.length;
  }, [unlockedParts.length]);

  return (
    <GradientBg variant="skyWarm">
      <View className="flex-1 gap-3 py-4">
        <Text className="font-display text-3xl font-extrabold text-ink">
          {t("mosque.title")}
        </Text>
        <Text className="text-base font-semibold text-ink/60">{t("mosque.subtitle")}</Text>

        {/* Cami — inşa aşaması (ilerlemeye göre frame-swap) */}
        <View className="my-2 items-center">
          <Animated.View key={unlockedParts.length} entering={FadeIn.duration(500)}>
            <Image
              source={images.mosqueStages[Math.max(0, unlockedParts.length - 1)]}
              style={{ width: 280, height: 280, opacity: unlockedParts.length === 0 ? 0.4 : 1 }}
              contentFit="contain"
            />
          </Animated.View>
        </View>

        {/* İlerleme çubuğu */}
        <View className="mx-2 h-4 overflow-hidden rounded-full bg-white/60">
          <View
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
        <Text className="text-center font-display text-sm font-bold text-ink/70">
          {completed} / {LETTERS.length} harf · {unlockedParts.length}/
          {MOSQUE_UNLOCK_THRESHOLDS.length} parça
        </Text>

        <View className="flex-1" />
        <JuicyButton label={t("common.back")} tone="primary" onPress={() => router.back()} />
      </View>
    </GradientBg>
  );
}

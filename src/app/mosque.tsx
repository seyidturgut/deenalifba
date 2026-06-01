import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Floating } from "@/components/ui/Floating";
import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { LETTERS } from "@/data/letters";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useProgressStore } from "@/stores/progressStore";

export default function Mosque() {
  const { t } = useTranslation();
  const router = useRouter();

  const completed = useProgressStore((s) =>
    LETTERS.filter((l) => s.isLetterComplete(l.id)).length
  );

  // 12 kümülatif inşa aşaması (ana ekran/cutscene ile aynı formül)
  const STAGES = images.mosqueStages.length;
  const stageIdx = Math.min(STAGES - 1, Math.max(0, completed - 1));
  const built = Math.min(completed, STAGES);
  const progress = built / STAGES;

  // Aşama ilerleyince ses çal
  const prevStage = useRef(stageIdx);
  useEffect(() => {
    if (completed > 0 && stageIdx > prevStage.current) playSfx("mosque_build");
    prevStage.current = stageIdx;
  }, [stageIdx, completed]);

  return (
    <GradientBg variant="skyWarm">
      <View className="flex-1 gap-3 py-4">
        <Text className="font-display text-3xl font-extrabold text-ink">
          {t("mosque.title")}
        </Text>
        <Text className="text-base font-semibold text-ink/60">{t("mosque.subtitle")}</Text>

        {/* Cami — inşa aşaması (ilerlemeye göre frame-swap) */}
        <View className="my-2 items-center">
          <Floating distance={9} duration={2400}>
            <Animated.View key={stageIdx} entering={FadeIn.duration(500)}>
              <Image
                source={images.mosqueStages[stageIdx]}
                style={{ width: 280, height: 280, opacity: completed === 0 ? 0.4 : 1 }}
                contentFit="contain"
              />
            </Animated.View>
          </Floating>
        </View>

        {/* İlerleme çubuğu */}
        <View className="mx-2 h-4 overflow-hidden rounded-full bg-white/60">
          <View
            className="h-full rounded-full bg-accent"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
        <Text className="text-center font-display text-sm font-bold text-ink/70">
          {completed} / {LETTERS.length} harf · {built}/{STAGES}
        </Text>

        <View className="flex-1" />
        <JuicyButton label={t("common.back")} tone="primary" onPress={() => router.back()} />
      </View>
    </GradientBg>
  );
}

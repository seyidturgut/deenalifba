import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Floating } from "@/components/ui/Floating";
import { GradientBg } from "@/components/ui/GradientBg";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Markalı animasyonlu açılış (intro). ~2.2sn oynar, sonra onboarding/home'a geçer.
 * Premium his: maskot zıplayarak belirir, "Alif" başlık ve slogan akar.
 */
export default function Index() {
  const router = useRouter();
  const { t } = useTranslation();
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  useEffect(() => {
    playSfx("welcome");
    const timer = setTimeout(() => {
      router.replace(onboardingComplete ? "/home" : "/onboarding");
    }, 2600);
    return () => clearTimeout(timer);
  }, [onboardingComplete, router]);

  return (
    <GradientBg>
      <View className="flex-1 items-center justify-center gap-3">
        <Animated.View entering={ZoomIn.springify().damping(8).mass(0.8)}>
          <Floating distance={12} duration={1400}>
            <Image source={images.mascot} style={{ width: 150, height: 150 }} contentFit="contain" />
          </Floating>
        </Animated.View>

        <Animated.Text
          entering={FadeInDown.delay(350).springify()}
          style={{
            fontFamily: "Fredoka_700Bold",
            fontSize: 64,
            color: "#208AEF",
            textShadowColor: "rgba(255,255,255,0.9)",
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 10,
          }}
        >
          Alif
        </Animated.Text>

        <Animated.Text
          entering={FadeIn.delay(750)}
          style={{ fontFamily: "Nunito_600SemiBold", fontSize: 18, color: "rgba(42,42,51,0.7)" }}
        >
          {t("onboarding.welcomeSubtitle")}
        </Animated.Text>
      </View>
    </GradientBg>
  );
}

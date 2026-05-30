import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { FlatList, Pressable, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { GradientBg } from "@/components/ui/GradientBg";
import { StarBadge } from "@/components/ui/StarBadge";
import { LETTERS } from "@/data/letters";
import type { Letter } from "@/data/types";
import { images } from "@/lib/images";
import { playSfx } from "@/lib/sfx";
import { gradients } from "@/theme/gradients";
import { useProgressStore } from "@/stores/progressStore";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function LetterTile({ letter, index }: { letter: Letter; index: number }) {
  const router = useRouter();
  const isUnlocked = useProgressStore((s) => s.unlockedLetters.includes(letter.id));
  const isComplete = useProgressStore((s) => s.isLetterComplete(letter.id));

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(Math.min(index, 12) * 40).springify()}
      onPress={() => {
        if (isUnlocked) router.push(`/learn/${letter.id}`);
        else playSfx("locked_tap");
      }}
      style={{
        flex: 1,
        margin: 6,
        borderRadius: 22,
        shadowColor: "#1462B5",
        shadowOpacity: isUnlocked ? 0.2 : 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 5 },
        elevation: isUnlocked ? 4 : 1,
      }}
    >
      <LinearGradient
        colors={isUnlocked ? gradients.card : ["#E8EFF6", "#DFE8F2"]}
        style={{
          height: 110,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: isComplete ? 3 : 0,
          borderColor: "#3FB984",
        }}
      >
        <Text className="text-5xl" style={{ fontFamily: "Amiri_700Bold", color: isUnlocked ? "#2A2A33" : "#A9B4C2" }}>
          {letter.char}
        </Text>
        <Text className="mt-1 font-display text-base font-bold" style={{ color: isUnlocked ? "#5B6470" : "#B7C0CC" }}>
          {letter.name}
        </Text>
        {!isUnlocked && (
          <Image source={images.icLock} style={{ width: 30, height: 30, position: "absolute", right: 6, top: 6 }} contentFit="contain" />
        )}
        {isComplete && (
          <Image source={images.star} style={{ width: 30, height: 30, position: "absolute", right: -6, top: -8 }} contentFit="contain" />
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

export default function Harfler() {
  const { t } = useTranslation();
  const router = useRouter();
  const starCount = useProgressStore((s) => LETTERS.filter((l) => s.isLetterComplete(l.id)).length);

  return (
    <GradientBg>
      {/* Başlık: geri + "Harfler" + yıldız */}
      <View className="flex-row items-center justify-between py-2">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.9)", shadowColor: "#1462B5", shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#208AEF", marginTop: -2 }}>‹</Text>
        </Pressable>
        <Text className="font-display text-2xl font-extrabold text-ink">{t("letters.title")}</Text>
        <StarBadge count={starCount} />
      </View>

      <FlatList
        data={LETTERS}
        keyExtractor={(l) => String(l.id)}
        numColumns={3}
        renderItem={({ item, index }) => <LetterTile letter={item} index={index} />}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      />
    </GradientBg>
  );
}

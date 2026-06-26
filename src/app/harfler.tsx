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

function LetterTile({ letter, index, isActive }: { letter: Letter; index: number; isActive: boolean }) {
  const router = useRouter();
  const isUnlocked = useProgressStore((s) => s.unlockedLetters.includes(letter.id));
  const isComplete = useProgressStore((s) => s.isLetterComplete(letter.id));
  // Oynanabilir = açık VEYA tamamlanmış VEYA sıradaki (aktif) harf — home ile tutarlı
  const playable = isUnlocked || isComplete || isActive;

  const borderColor = isComplete ? "#3FB984" : isActive ? "#F5A524" : "transparent";
  const borderWidth = isComplete || isActive ? 3 : 0;

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(Math.min(index, 12) * 40).springify()}
      onPress={() => {
        if (playable) router.push(`/learn/${letter.id}`);
        else playSfx("locked_tap");
      }}
      style={{
        flex: 1,
        margin: 6,
        borderRadius: 22,
        shadowColor: isActive ? "#F5A524" : "#1462B5",
        shadowOpacity: isActive ? 0.34 : playable ? 0.2 : 0.08,
        shadowRadius: isActive ? 11 : 8,
        shadowOffset: { width: 0, height: 5 },
        elevation: playable ? 4 : 1,
      }}
    >
      <LinearGradient
        colors={playable ? gradients.card : ["#E8EFF6", "#DFE8F2"]}
        style={{
          height: 110,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          borderWidth,
          borderColor,
        }}
      >
        {/* Latin ad GÖSTERİLMEZ (Ismail: Arapça harf + ses) — sadece büyük harf */}
        <Text className="text-6xl" style={{ fontFamily: "Amiri_700Bold", color: playable ? "#2A2A33" : "#A9B4C2" }}>
          {letter.char}
        </Text>
        {!playable && (
          <Image source={images.icLock} style={{ width: 30, height: 30, position: "absolute", right: 6, top: 6 }} contentFit="contain" />
        )}
        {isComplete && (
          <Image source={images.star} style={{ width: 30, height: 30, position: "absolute", right: -6, top: -8 }} contentFit="contain" />
        )}
        {/* Sıradaki (aktif) harf rozeti — "burada kaldın, devam et" */}
        {isActive && !isComplete && (
          <View style={{ position: "absolute", right: -4, top: -8, width: 30, height: 30, borderRadius: 15, backgroundColor: "#F5A524", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 15, color: "#fff", marginLeft: 2 }}>▶</Text>
          </View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

export default function Harfler() {
  const { t } = useTranslation();
  const router = useRouter();
  const completedLetters = useProgressStore((s) => s.completedLetters); // reaktivite
  const isLetterComplete = useProgressStore((s) => s.isLetterComplete);
  const starCount = LETTERS.filter((l) => isLetterComplete(l.id)).length;

  // Aktif/sıradaki harf = ulaşılan EN İLERİ nokta (home ile aynı frontier mantığı)
  const lastDoneIndex = LETTERS.reduce((m, l, i) => (isLetterComplete(l.id) ? i : m), -1);
  const activeId = LETTERS[Math.min(lastDoneIndex + 1, LETTERS.length - 1)].id;
  void completedLetters; // abone kalmak için referansla

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
        <StarBadge count={starCount} total={LETTERS.length} />
      </View>

      <FlatList
        data={LETTERS}
        keyExtractor={(l) => String(l.id)}
        numColumns={3}
        renderItem={({ item, index }) => <LetterTile letter={item} index={index} isActive={item.id === activeId} />}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      />
    </GradientBg>
  );
}

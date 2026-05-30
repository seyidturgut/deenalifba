import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Polyline } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { GradientBg } from "@/components/ui/GradientBg";
import { Mascot } from "@/components/ui/Mascot";
import { StarBadge } from "@/components/ui/StarBadge";
import { LETTERS } from "@/data/letters";
import type { Letter } from "@/data/types";
import { images } from "@/lib/images";
import { playSfx, syncMusicWithSetting } from "@/lib/sfx";
import { MOSQUE_UNLOCK_THRESHOLDS } from "@/stores/mosqueStore";
import { useProgressStore } from "@/stores/progressStore";
import { useSettingsStore } from "@/stores/settingsStore";

const NODE = 108;
const V_GAP = 150; // düğümler arası dikey aralık (alt etikete yer)
const X_PATTERN = [0.5, 0.74, 0.5, 0.26]; // zig-zag (genişlik oranı)
const INNER = 0.6; // çerçevenin iç krem penceresi (NODE oranı)
// Krem pencere görselin tam merkezinde değil (3D lip): sağa/yukarı kaydır
const WIN_DX = NODE * 0.023;
const WIN_DY = NODE * -0.053;

/** Cami inşası ilerleme yüzdesi (yolculuk üst barı). */
function useCamiProgress() {
  return useProgressStore((s) => {
    const completed = LETTERS.filter((l) => s.isLetterComplete(l.id)).length;
    const parts = MOSQUE_UNLOCK_THRESHOLDS.filter((t) => completed >= t.lettersRequired).length;
    return Math.round((parts / MOSQUE_UNLOCK_THRESHOLDS.length) * 100);
  });
}

function LetterNode({
  letter,
  cx,
  cy,
  state,
  onPress,
}: {
  letter: Letter;
  cx: number;
  cy: number;
  state: "done" | "active" | "open" | "locked";
  onPress: () => void;
}) {
  const locked = state === "locked";
  const innerSize = NODE * INNER;

  // Aktif harf için nabız atan altın hale
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (state === "active") {
      pulse.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      pulse.value = 0;
    }
  }, [state]);
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.95 + pulse.value * 0.14 }],
    opacity: 0.55 + pulse.value * 0.4,
  }));

  return (
    <Pressable
      onPress={onPress}
      style={{
        position: "absolute",
        left: cx - NODE / 2,
        top: cy - NODE / 2,
        width: NODE,
        height: NODE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {locked ? (
        /* Kilitli: bulut + kilit */
        <>
          <Image source={images.nodeCloud} style={{ position: "absolute", width: NODE + 16, height: NODE }} contentFit="contain" />
          <Image source={images.icLock} style={{ position: "absolute", width: 38, height: 38, transform: [{ translateY: 4 }] }} contentFit="contain" />
        </>
      ) : (
        /* Açık / aktif / tamamlanan */
        <>
          {/* Aktif harf için nabız atan altın halka */}
          {state === "active" && (
            <Animated.Image
              source={images.nodeGlow}
              resizeMode="contain"
              style={[{ position: "absolute", width: NODE + 52, height: NODE + 52 }, glowStyle]}
            />
          )}

          {/* Altın çerçeve */}
          <Image source={images.nodeTile} style={{ position: "absolute", width: NODE, height: NODE }} contentFit="contain" />

          {/* İç krem pencerede harf */}
          <View
            style={{
              width: innerSize,
              height: innerSize,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ translateX: WIN_DX }, { translateY: WIN_DY }],
            }}
          >
            <Text
              style={{
                fontFamily: "Amiri_700Bold",
                fontSize: innerSize * 0.74,
                lineHeight: innerSize * 0.92,
                color: "#3A3A44",
                textAlign: "center",
              }}
            >
              {letter.char}
            </Text>
          </View>

          {/* Tamamlandı: yıldız rozeti */}
          {state === "done" && (
            <Image source={images.star} style={{ position: "absolute", right: -6, top: -10, width: 34, height: 34 }} contentFit="contain" />
          )}
        </>
      )}

      {/* Harf adı — düğümün altında */}
      <View style={{ position: "absolute", bottom: -20, alignItems: "center" }}>
        <Text
          style={{
            fontFamily: "Fredoka_700Bold",
            fontSize: 13,
            color: locked ? "#8190A0" : "#46525E",
            textShadowColor: "rgba(255,255,255,0.95)",
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 4,
          }}
        >
          {letter.name}
        </Text>
      </View>
    </Pressable>
  );
}

/** Üst bar: yıldız + "Cami İnşası %X" + ayar. */
function TopBar() {
  const router = useRouter();
  const stars = useProgressStore((s) => LETTERS.filter((l) => s.isLetterComplete(l.id)).length);
  const cami = useCamiProgress();
  return (
    <View className="flex-row items-center justify-between px-1 pt-1">
      <StarBadge count={stars} />
      <View
        className="flex-1 flex-row items-center gap-2 rounded-full bg-white/85 px-3 py-1.5"
        style={{ marginHorizontal: 8, shadowColor: "#1462B5", shadowOpacity: 0.12, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
      >
        <Image source={images.icMosque} style={{ width: 26, height: 26 }} contentFit="contain" />
        <View className="h-3 flex-1 overflow-hidden rounded-full bg-black/10">
          <View className="h-full rounded-full bg-success" style={{ width: `${cami}%` }} />
        </View>
        <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 13, color: "#5B6470" }}>%{cami}</Text>
      </View>
      <Pressable onPress={() => router.push("/settings")}>
        <Image source={images.icSettings} style={{ width: 42, height: 42 }} contentFit="contain" />
      </Pressable>
    </View>
  );
}

/** Alt menü (4 sekme). */
function BottomNav() {
  const router = useRouter();
  const { t } = useTranslation();
  const items: { label: string; src: number; onPress: () => void }[] = [
    { label: t("nav.home"), src: images.icHome, onPress: () => {} },
    { label: t("nav.lessons"), src: images.icLessons, onPress: () => router.push("/harfler") },
    { label: t("nav.mosque"), src: images.icMosque, onPress: () => router.push("/mosque") },
    { label: t("nav.settings"), src: images.icSettings, onPress: () => router.push("/settings") },
  ];
  return (
    <View
      className="flex-row items-center justify-around rounded-3xl bg-white/95 px-2 py-2"
      style={{ shadowColor: "#1462B5", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: -2 } }}
    >
      {items.map((it) => (
        <Pressable key={it.label} onPress={() => { playSfx("ui_tap"); it.onPress(); }} className="items-center" style={{ width: 64 }}>
          <Image source={it.src} style={{ width: 32, height: 32 }} contentFit="contain" />
          <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 11, color: "#5B6470" }}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** XP + seviye + günlük sandık — kompakt pill. */
function XpChestCard() {
  const totalSteps = useProgressStore((s) => Object.keys(s.completedSteps).length);
  const xp = totalSteps * 25;
  const SPAN = 200;
  const level = Math.floor(xp / SPAN) + 1;
  const into = xp % SPAN;
  const pct = Math.round((into / SPAN) * 100);

  const lastRewardDay = useSettingsStore((s) => s.lastRewardDay);
  const claimDailyReward = useSettingsStore((s) => s.claimDailyReward);
  const canClaim = lastRewardDay !== new Date().toDateString();

  const pulse = useSharedValue(0);
  useEffect(() => {
    if (canClaim) pulse.value = withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }), -1, true);
    else pulse.value = 0;
  }, [canClaim]);
  const chestStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.1 }, { rotate: `${-4 + pulse.value * 8}deg` }],
  }));

  return (
    <View
      className="mt-1.5 flex-row items-center gap-2 rounded-full bg-white/90 px-2 py-1"
      style={{ shadowColor: "#1462B5", shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } }}
    >
      <View className="items-center justify-center rounded-full" style={{ width: 26, height: 26, backgroundColor: "#FFB020" }}>
        <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 13, color: "white" }}>{level}</Text>
      </View>
      <View className="h-5 flex-1 justify-center overflow-hidden rounded-full bg-black/10">
        <View className="absolute h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#7BD66A", left: 0, top: 0 }} />
        <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 11, color: "#46525E", textAlign: "center" }}>{into} / {SPAN} XP</Text>
      </View>
      <Pressable onPress={() => { if (claimDailyReward()) playSfx("star_earned"); else playSfx("ui_tap"); }}>
        <Animated.View style={canClaim ? chestStyle : undefined}>
          <Image source={images.gift} style={{ width: 28, height: 28, opacity: canClaim ? 1 : 0.45 }} contentFit="contain" />
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const childName = useSettingsStore((s) => s.childName);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const unlocked = useProgressStore((s) => s.unlockedLetters);
  const isLetterComplete = useProgressStore((s) => s.isLetterComplete);

  useEffect(() => {
    syncMusicWithSetting();
  }, [musicEnabled]);

  const contentW = width - 36; // GradientBg padding 18*2

  // Aktif harf = sıradaki tamamlanmamış harf (Duolingo gibi parlar)
  const activeId = LETTERS.find((l) => !isLetterComplete(l.id))?.id ?? LETTERS.length;

  // Düğüm konumları (zig-zag)
  const nodes = LETTERS.map((l, i) => ({
    letter: l,
    cx: X_PATTERN[i % X_PATTERN.length] * contentW,
    cy: 60 + i * V_GAP,
  }));
  const mapHeight = 60 + (LETTERS.length - 1) * V_GAP + 80;
  const pathPoints = nodes.map((n) => `${n.cx},${n.cy}`).join(" ");

  const stateOf = (l: Letter): "done" | "active" | "open" | "locked" => {
    if (isLetterComplete(l.id)) return "done";
    if (l.id === activeId) return "active";
    if (unlocked.includes(l.id)) return "open";
    return "locked";
  };

  // Parallax: scroll ile arka plan bulutları daha yavaş kayar
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const cloudsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -scrollY.value * 0.35 }] }));
  // Dekoratif bulutlar — tüm harita boyunca serpiştir (zig-zag, çeşitli boy/opaklık)
  const clouds = Array.from({ length: 12 }, (_, i) => ({
    top: 40 + i * 290,
    left: i % 2 === 0 ? -16 : width * 0.52,
    w: 116 + (i % 3) * 30,
    op: 0.28 + (i % 3) * 0.07,
  }));

  return (
    <GradientBg>
      {/* Parallax bulut katmanı (arka planda, scroll'la yavaş kayar) */}
      <Animated.View
        pointerEvents="none"
        style={[{ position: "absolute", top: 0, bottom: 0, left: -18, right: -18 }, cloudsStyle]}
      >
        {clouds.map((c, i) => (
          <Image
            key={i}
            source={images.nodeCloud}
            style={{ position: "absolute", top: c.top, left: c.left, width: c.w, height: c.w * 0.78, opacity: c.op }}
            contentFit="contain"
          />
        ))}
      </Animated.View>

      <TopBar />

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Üst: maskot + (selam + balon) + XP */}
        <View className="px-1 pt-1">
          <View className="flex-row items-center gap-2.5">
            <Mascot size={64} />
            <View className="flex-1">
              <Text
                style={{
                  fontFamily: "Fredoka_700Bold",
                  fontSize: 19,
                  color: "#0E5FC2",
                  textShadowColor: "rgba(255,255,255,0.95)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {childName ? t("home.greeting", { name: childName }) : t("home.hello")}
              </Text>
              <View
                className="mt-1 self-start rounded-2xl rounded-tl-md bg-white/90 px-3 py-1.5"
                style={{ shadowColor: "#1462B5", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }}
              >
                <Text style={{ fontFamily: "Nunito_600SemiBold", fontSize: 12, color: "rgba(42,42,51,0.65)" }}>
                  {t("home.subtitle")}
                </Text>
              </View>
            </View>
          </View>
          <XpChestCard />
        </View>

        {/* Yolculuk haritası */}
        <View style={{ height: mapHeight, width: contentW, marginTop: 8 }}>
          <Svg width={contentW} height={mapHeight} style={{ position: "absolute", left: 0, top: 0 }}>
            <Polyline points={pathPoints} fill="none" stroke="#E8C766" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={pathPoints} fill="none" stroke="#FBE9A8" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          {nodes.map((n) => (
            <LetterNode
              key={n.letter.id}
              letter={n.letter}
              cx={n.cx}
              cy={n.cy}
              state={stateOf(n.letter)}
              onPress={() => {
                if (stateOf(n.letter) === "locked") playSfx("locked_tap");
                else router.push(`/learn/${n.letter.id}`);
              }}
            />
          ))}
        </View>
      </Animated.ScrollView>

      {/* Alt menü (sabit) */}
      <View style={{ position: "absolute", left: 12, right: 12, bottom: 8 }}>
        <BottomNav />
      </View>
    </GradientBg>
  );
}

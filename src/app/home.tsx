import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Path, Polyline } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { FeedbackModal } from "@/components/ui/FeedbackModal";
import { GradientBg } from "@/components/ui/GradientBg";
import { Mascot } from "@/components/ui/Mascot";
import { StarBadge } from "@/components/ui/StarBadge";
import { FORMS_GROUPS, formsGroup } from "@/data/formsLessons";
import { LETTERS } from "@/data/letters";

import type { Letter } from "@/data/types";
import { GARDEN_STAGE_COUNT, gardenStage } from "@/lib/garden";
import { images } from "@/lib/images";
import { playSfx, syncMusicWithSetting } from "@/lib/sfx";
import { useFormsStore } from "@/stores/formsStore";
import { useProgressStore } from "@/stores/progressStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStreakStore } from "@/stores/streakStore";

const NODE = 108;
const V_GAP = 150; // düğümler arası dikey aralık (alt etikete yer)
const X_PATTERN = [0.5, 0.74, 0.5, 0.26]; // zig-zag (genişlik oranı)
// Oturum boyunca son görülen aktif düğüm — harf tamamlanıp dönünce "uçuş" tetikler
let lastSeenActiveIndex: number | null = null;

// 28 harften sonraki BÜYÜK yolculuk aşamaları (kilitli, gelecek) — Elif'ten Namaz'a.
// Haritada görünür → "28 harf" değil, hedefin Namaz olduğu bir macera hissi (Sohail #7).
const JOURNEY_STAGES: { key: string; emoji: string; goal?: boolean; route?: string; formsGroup?: number }[] = [
  // Harf Tanıma (Abdulkadir): Harakat'tan ÖNCE gelir ve YEDİ seviyeye yayılır (29-35),
  // seviye başına 4 harf — hepsi tek seviyede olunca bilişsel yük fazlaydı ve 1-28'deki
  // "bir düğüm = bir kısa ders" ritmi bozuluyordu.
  ...FORMS_GROUPS.map((_, i) => ({ key: "letterForms", emoji: "ـبـ", route: `/forms/${i + 1}`, formsGroup: i })),
  { key: "harakat", emoji: "ﹶ" },
  { key: "joining", emoji: "🔗" },
  { key: "words", emoji: "📖" },
  { key: "duas", emoji: "🤲" },
  { key: "surahs", emoji: "📿" },
  { key: "salah", emoji: "🕌", goal: true },
];
const INNER = 0.6; // çerçevenin iç krem penceresi (NODE oranı)
// Krem pencere görselin tam merkezinde değil (3D lip): sağa/yukarı kaydır
const WIN_DX = NODE * 0.023;
const WIN_DY = NODE * -0.053;

function LevelNode({
  levelNo,
  cx,
  cy,
  state,
  onPress,
}: {
  levelNo: number;
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
        /* Kilitli: bulut + büyük seviye no + köşede kilit rozeti */
        <>
          <Image source={images.nodeCloud} style={{ position: "absolute", width: NODE + 16, height: NODE }} contentFit="contain" />
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: NODE * 0.36,
              color: "#8FA0B2",
              textShadowColor: "rgba(255,255,255,0.95)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 3,
            }}
          >
            {levelNo}
          </Text>
          <Image source={images.icLock} style={{ position: "absolute", right: 4, top: 6, width: 30, height: 30 }} contentFit="contain" />
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

          {/* İç krem pencerede seviye numarası */}
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
                fontFamily: "Fredoka_700Bold",
                fontSize: innerSize * 0.5,
                color: state === "done" ? "#3FB984" : "#3A3A44",
                textAlign: "center",
              }}
            >
              {levelNo}
            </Text>
          </View>

          {/* Tamamlandı: yıldız rozeti */}
          {state === "done" && (
            <Image source={images.star} style={{ position: "absolute", right: -6, top: -10, width: 34, height: 34 }} contentFit="contain" />
          )}
        </>
      )}

    </Pressable>
  );
}

/** Üst bar: öğrenilen harf sayacı + ayar. (Cami ilerlemesi "My Mosque" kartında — tekrar yok.) */
function TopBar() {
  const router = useRouter();
  const stars = useProgressStore((s) => LETTERS.filter((l) => s.isLetterComplete(l.id)).length);
  return (
    <View className="flex-row items-center justify-between px-1 pt-1">
      <StarBadge count={stars} total={LETTERS.length} />
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
  // Cami ilerlemesi → "Mosque" sekmesinde minik rozet (büyüyen cami hatırlatıcısı)
  const mosqueDone = useProgressStore((s) => LETTERS.filter((l) => s.isLetterComplete(l.id)).length);
  const mosqueStages = images.mosqueStages.length;
  // Cami 28'de biter; sonrası bahçe ödülü — rozet o zaman bahçe yüzdesini gösterir.
  const formsDone = useFormsStore((s) => s.completed);
  const garden = mosqueDone >= LETTERS.length ? gardenStage(formsDone) : 0;
  const mosquePct =
    mosqueDone >= LETTERS.length
      ? Math.round((garden / GARDEN_STAGE_COUNT) * 100)
      : Math.round((Math.min(mosqueDone, mosqueStages) / mosqueStages) * 100);
  const items: { label: string; src: number; onPress: () => void; badge?: number }[] = [
    { label: t("nav.home"), src: images.icHome, onPress: () => {} },
    { label: t("nav.lessons"), src: images.icLessons, onPress: () => router.push("/harfler") },
    { label: t("nav.mosque"), src: images.icMosque, onPress: () => router.push("/mosque"), badge: mosquePct },
    { label: t("nav.settings"), src: images.icSettings, onPress: () => router.push("/settings") },
  ];
  return (
    <View
      className="flex-row items-center justify-around rounded-3xl bg-white/95 px-2 py-2"
      style={{ shadowColor: "#1462B5", shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: -2 } }}
    >
      {items.map((it) => (
        <Pressable key={it.label} onPress={() => { playSfx("ui_tap"); it.onPress(); }} className="items-center" style={{ width: 74 }}>
          <View>
            <Image source={it.src} style={{ width: 32, height: 32 }} contentFit="contain" />
            {/* Büyüyen cami: ilerleme rozeti (yalnız başladıysa) */}
            {it.badge !== undefined && it.badge > 0 && (
              <View style={{ position: "absolute", top: -6, right: -14, backgroundColor: "#3FB984", borderRadius: 9, paddingHorizontal: 5, paddingVertical: 1, borderWidth: 1.5, borderColor: "#fff" }}>
                <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 9, color: "#fff" }}>%{it.badge}</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 12, color: "#4A5663", textAlign: "center" }}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * İleriki yolculuk aşaması. Çoğu kilitli ama GÖRÜNÜR (merak uyandırır); goal=Namaz (hedef).
 * `onPress` verilirse aşama OYNANABİLİR demektir (kilit rozeti yok, "Yakında" yerine kendi
 * durumu) — şu an yalnız "Harf Tanıma" böyle (28 harf bitince açılır).
 */
function StageGate({
  cx,
  cy,
  emoji,
  name,
  goal,
  soon,
  goalLabel,
  onPress,
  subtitle,
  levelNo,
  isChapter,
}: {
  cx: number;
  cy: number;
  emoji: string;
  name: string;
  goal?: boolean;
  soon: string;
  goalLabel: string;
  onPress?: () => void;
  subtitle?: string;
  /** Haritadaki sıra numarası — 28 harften SONRA da kesintisiz devam eder (29, 30…).
      Çocuk okuma bilmiyor; soyut glif/emoji ona hiçbir şey anlatmıyor, sayı anlatıyor. */
  levelNo?: number;
  /** Gerçek (oynanabilir) bölüm mü — yeşil kart ile gösterilir */
  isChapter?: boolean;
}) {
  const W = NODE + 44;
  const open = !!onPress;
  const innerSize = NODE * INNER;
  const body = (
    <>
      {goal && (
        <View style={{ position: "absolute", top: NODE * 0.04, width: NODE * 0.96, height: NODE * 0.96, borderRadius: NODE * 0.48, backgroundColor: "#F5C451", opacity: 0.3 }} />
      )}
      {isChapter && open ? (
        /* AÇIK bölüm — harf seviyeleriyle AYNI kart dili, ayrışsın diye yeşil çerçeve.
           (Kilitliyken kart soluklaştırılıp gösterilmez — amatör duruyordu; kilitli her
           şey diğer aşamalarla aynı bulut dilinde kalır, açılınca kart gelir.) */
        <View style={{ width: NODE, height: NODE, alignItems: "center", justifyContent: "center" }}>
          <Image source={images.nodeTileChapter} style={{ position: "absolute", width: NODE, height: NODE }} contentFit="contain" />
          <View
            style={{
              width: innerSize,
              height: innerSize,
              alignItems: "center",
              justifyContent: "center",
              transform: [{ translateX: WIN_DX }, { translateY: WIN_DY }],
            }}
          >
            {/* Metin glifi yerine normalize SVG path — Amiri metin glifleri kutuda
                kayıyor/küçük kalıyor (LetterIntro'da da bu yüzden path kullanılıyor). */}
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: innerSize * 0.5, color: "#2E7D5B", textAlign: "center" }}>
              {levelNo}
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ width: NODE, height: NODE * 0.82, alignItems: "center", justifyContent: "center" }}>
          <Image source={images.nodeCloud} style={{ position: "absolute", width: NODE + 14, height: NODE * 0.78, opacity: goal ? 1 : 0.92 }} contentFit="contain" />
          {goal ? (
            <Text style={{ fontSize: 38 }}>{emoji}</Text>
          ) : (
            <Text
              style={{
                fontFamily: "Fredoka_700Bold",
                fontSize: NODE * 0.3,
                color: "#8FA0B2",
                textShadowColor: "rgba(255,255,255,0.95)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 3,
              }}
            >
              {levelNo}
            </Text>
          )}
          <Image source={images.icLock} style={{ position: "absolute", right: NODE * 0.1, top: NODE * 0.04, width: 26, height: 26, opacity: 0.9 }} contentFit="contain" />
        </View>
      )}
      <Text
        numberOfLines={1}
        style={{ fontFamily: "Fredoka_700Bold", fontSize: goal ? 15 : 13, color: goal ? "#C77F12" : open ? "#2E7D5B" : "#7C8A99", marginTop: 1, textShadowColor: "rgba(255,255,255,0.9)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}
      >
        {name}
      </Text>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 10, color: goal ? "#D98A1E" : open ? "#3FB984" : "#A9B4C2", letterSpacing: goal ? 1 : 0 }}>
        {goal ? goalLabel : open ? subtitle : soon}
      </Text>
    </>
  );

  if (open) {
    return (
      <Pressable onPress={onPress} style={{ position: "absolute", left: cx - W / 2, top: cy - NODE / 2, width: W, alignItems: "center" }}>
        {body}
      </Pressable>
    );
  }
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: cx - W / 2, top: cy - NODE / 2, width: W, alignItems: "center" }}>
      {body}
    </View>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const childName = useSettingsStore((s) => s.childName);
  const accentColor = useSettingsStore((s) => s.accentColor) ?? "#F5A524";
  const mosqueName = useSettingsStore((s) => s.mosqueName);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const unlocked = useProgressStore((s) => s.unlockedLetters);
  const isLetterComplete = useProgressStore((s) => s.isLetterComplete);
  // Harf Tanıma bölümü (Abdulkadir) — 28 harf bitince açılır
  const allLettersDone = useProgressStore((s) => LETTERS.every((l) => s.isLetterComplete(l.id)));
  const formsDoneIds = useFormsStore((s) => s.completed);
  const scrollRef = useRef<any>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    syncMusicWithSetting();
  }, [musicEnabled]);

  // Haftada 1 kalkan ver (İstikamet Zinciri Faz 2) — home açılınca dener (haftalık kapılı)
  useEffect(() => {
    useStreakStore.getState().grantWeeklyShield(Date.now());
  }, []);

  const contentW = width - 36; // GradientBg padding 18*2

  // Aktif/rehber düğüm = ULAŞILAN EN İLERİ nokta (tamamlananların hemen ardındaki harf).
  // "İlk boşluğa" göre DEĞİL → çocuk bir harfi atlasa bile kuş geri seviyeye dönmez,
  // hep en ileride durur (Duolingo gibi parlar).
  const lastDoneIndex = LETTERS.reduce((m, l, i) => (isLetterComplete(l.id) ? i : m), -1);
  // Rehberin durduğu düğüm. 28 harf bitmemişse sıradaki harf; bitmişse Harf Tanıma
  // gruplarının ilk tamamlanmamışı — yoksa Pırıl 28'de park kalıyor ve çocuk 28'i
  // bitirip haritaya dönünce "sıradaki burası" işaretini hiç görmüyordu.
  const lettersAllDone = lastDoneIndex === LETTERS.length - 1;
  const firstOpenFormsGroup = FORMS_GROUPS.findIndex((g) => g.some((id) => !formsDoneIds.includes(id)));
  const activeIndex = lettersAllDone
    ? LETTERS.length + (firstOpenFormsGroup === -1 ? FORMS_GROUPS.length - 1 : firstOpenFormsGroup)
    : Math.min(lastDoneIndex + 1, LETTERS.length - 1);
  const activeId = lettersAllDone ? -1 : LETTERS[activeIndex].id;

  // Düğüm konumları (zig-zag)
  const nodes = LETTERS.map((l, i) => ({
    letter: l,
    cx: X_PATTERN[i % X_PATTERN.length] * contentW,
    cy: 88 + i * V_GAP,
  }));
  // 28 harften SONRA: büyük yolculuğun ileriki aşamaları (kilitli ama GÖRÜNÜR) — Sohail #7
  const stageNodes = JOURNEY_STAGES.map((s, j) => {
    const i = LETTERS.length + j;
    return { ...s, cx: X_PATTERN[i % X_PATTERN.length] * contentW, cy: 88 + i * V_GAP };
  });
  const totalNodes = LETTERS.length + JOURNEY_STAGES.length;
  const mapHeight = 88 + (totalNodes - 1) * V_GAP + 110;
  const pathPoints = [...nodes, ...stageNodes].map((n) => `${n.cx},${n.cy}`).join(" ");


  // Rehber karakterin durduğu aktif düğüm (harf düğümleri VE bölüm düğümleri dahil)
  const allNodes = [...nodes, ...stageNodes];
  const activeNode = allNodes[activeIndex];
  // Rehber Hüdhüd yerleşimi: düğümün boş tarafında, kendi bulutunda, büyük
  const GUIDE = 124;
  const guideSide = activeNode && activeNode.cx <= contentW / 2 ? 1 : -1;
  const guideX = activeNode ? activeNode.cx + guideSide * (NODE * 0.74) : 0;
  const guideTop = activeNode ? Math.max(4, activeNode.cy - GUIDE * 0.5) : 0;

  // Bir düğüm konumunun "rehber" yerleşimi (uçuş başlangıcı için)
  const guidePosOf = (i: number) => {
    const n = allNodes[i];
    if (!n) return { x: 0, top: 0 };
    const side = n.cx <= contentW / 2 ? 1 : -1;
    return { x: n.cx + side * (NODE * 0.74), top: Math.max(4, n.cy - GUIDE * 0.5) };
  };

  // Seviye geçiş uçuşu: aktif düğüm ilerleyince Pırıl önceki düğümden yenisine uçar
  const fly = useSharedValue(1); // 1 = yerinde
  const [flyFrom, setFlyFrom] = useState<number | null>(null);
  // Ekran tekrar odaklanınca (harf bitip dönünce) aktif düğüm ilerlediyse Pırıl uçar.
  // useFocusEffect → arka planda tetiklenip kaçırılmaz; kullanıcı dönünce görür.
  useFocusEffect(
    useCallback(() => {
      const prev = lastSeenActiveIndex;
      if (prev != null && activeIndex > prev) {
        setFlyFrom(Math.max(0, activeIndex - 1));
        fly.value = 0;
        fly.value = withTiming(1, { duration: 1150, easing: Easing.inOut(Easing.cubic) }, (f) => {
          if (f) runOnJS(setFlyFrom)(null);
        });
      }
      lastSeenActiveIndex = activeIndex;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex])
  );

  const src = flyFrom != null ? guidePosOf(flyFrom) : null;
  const flyStyle = useAnimatedStyle(() => {
    if (src == null) return { transform: [{ translateX: 0 }, { translateY: 0 }] };
    const t = fly.value;
    const arc = -Math.sin(t * Math.PI) * 48; // yukarı kavis (uçuş hissi)
    return {
      transform: [
        { translateX: (src.x - guideX) * (1 - t) },
        { translateY: (src.top - guideTop) * (1 - t) + arc },
        { scale: 1 + Math.sin(t * Math.PI) * 0.06 },
      ],
    };
  });
  const flying = flyFrom != null;

  // Pırıl'ın periyodik mini balonu — camiye/hedefe atıf (Sohail #1, ikon-ağırlıklı)
  const TIPS = [t("home.tip1"), t("home.tip2"), t("home.tip3"), t("home.tip4")];
  const [tipIdx, setTipIdx] = useState(0);
  const [tipShown, setTipShown] = useState(false);
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    const show = () => {
      setTipShown(true);
      hideTimer = setTimeout(() => setTipShown(false), 4500);
    };
    const first = setTimeout(show, 2500);
    const interval = setInterval(() => {
      setTipIdx((i) => (i + 1) % 4);
      show();
    }, 11000);
    return () => {
      clearTimeout(first);
      clearTimeout(hideTimer);
      clearInterval(interval);
    };
  }, []);

  // Açılışta (ve aktif harf değişince) rehberi/aktif seviyeyi görünür yere kaydır
  useEffect(() => {
    if (!activeNode) return;
    const tmr = setTimeout(() => {
      const GREETING_H = 96; // selam bloğu ~yüksekliği
      const y = Math.max(0, GREETING_H + 8 + activeNode.cy - 260);
      scrollRef.current?.scrollTo?.({ y, animated: true });
    }, 350);
    return () => clearTimeout(tmr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

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
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Üst: kısa selam (companion sesini Pırıl'ın harita balonu taşır → alt balon yok) */}
        <View className="px-1 pt-1">
          <Text
            style={{
              fontFamily: "Fredoka_700Bold",
              fontSize: 20,
              color: "#0E5FC2",
              textShadowColor: "rgba(255,255,255,0.95)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {childName ? t("home.greeting", { name: childName }) : t("home.hello")}
          </Text>
          {/* NOT: İstikamet zinciri bandı home'dan KALDIRILDI (Sohail: belirsiz/tıklanamıyor,
              kafa karıştırıyor). Zincir verisi Ayarlar → Ebeveyn Özeti'nde duruyor. */}
        </View>

        {/* Yolculuk haritası */}
        <View style={{ height: mapHeight, width: contentW, marginTop: 8 }}>
          <Svg width={contentW} height={mapHeight} style={{ position: "absolute", left: 0, top: 0 }}>
            <Polyline points={pathPoints} fill="none" stroke="#E8C766" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
            <Polyline points={pathPoints} fill="none" stroke="#FBE9A8" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          {nodes.map((n, i) => (
            <LevelNode
              key={n.letter.id}
              levelNo={i + 1}
              cx={n.cx}
              cy={n.cy}
              state={stateOf(n.letter)}
              onPress={() => {
                if (stateOf(n.letter) === "locked") playSfx("locked_tap");
                else router.push(`/learn/${n.letter.id}`);
              }}
            />
          ))}

          {/* 28 harften sonra: büyük yolculuğun ileriki aşamaları (kilitli, görünür) */}
          {stageNodes.map((s, si) => {
            // 1. grup 28 harf bitince, sonrakiler bir öncekinin harfleri bitince açılır
            // (harf seviyeleri gibi kademeli ilerleme).
            const gi = s.formsGroup;
            const groupLetters = gi === undefined ? [] : formsGroup(gi);
            const groupDone = groupLetters.filter((id) => formsDoneIds.includes(id)).length;
            const prevDone =
              gi === undefined || gi === 0 ? true : formsGroup(gi - 1).every((id) => formsDoneIds.includes(id));
            const playable = !!s.route && allLettersDone && prevDone;
            return (
              <StageGate
                key={`${s.key}-${si}`}
                cx={s.cx}
                cy={s.cy}
                emoji={s.emoji}
                name={gi === undefined || gi === 0 ? t(`journey.${s.key}`) : ""}
                goal={s.goal}
                soon={
                  s.route
                    ? !allLettersDone
                      ? t("forms.locked")
                      : t("forms.progress", { n: groupDone, total: groupLetters.length })
                    : t("journey.soon")
                }
                goalLabel={t("journey.goalLabel")}
                subtitle={t("forms.progress", { n: groupDone, total: groupLetters.length })}
                levelNo={LETTERS.length + stageNodes.indexOf(s) + 1}
                isChapter={!!s.route}
                onPress={playable ? () => { playSfx("ui_tap"); router.push(s.route as any); } : undefined}
              />
            );
          })}

          {/* Rehber Hüdhüd — aktif seviyenin YANINDA; seviye bitince yenisine UÇAR */}
          {activeNode && (
            <Animated.View
              pointerEvents="none"
              style={[
                { position: "absolute", left: guideX - GUIDE / 2, top: guideTop, width: GUIDE, height: GUIDE, alignItems: "center", justifyContent: "flex-end" },
                flyStyle,
              ]}
            >
              {/* Pırıl'ın mini balonu (camiye/hedefe atıf) — uçarken gizle */}
              {tipShown && !flying && (
                <View pointerEvents="none" style={{ position: "absolute", bottom: GUIDE * 0.88, left: -30, right: -30, alignItems: "center" }}>
                  <View
                    style={{ maxWidth: 192, backgroundColor: "#FFFFFF", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, shadowColor: "#1462B5", shadowOpacity: 0.16, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }}
                  >
                    <Text numberOfLines={2} style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 12.5, color: "#34414F", textAlign: "center" }}>
                      {TIPS[tipIdx]}
                    </Text>
                  </View>
                </View>
              )}
              {/* Çocuğun seçtiği aksan rengiyle hale (sahiplenme ipucu) */}
              <View style={{ position: "absolute", bottom: GUIDE * 0.26, width: GUIDE * 0.82, height: GUIDE * 0.82, borderRadius: GUIDE * 0.41, backgroundColor: accentColor, opacity: 0.22 }} />
              <Image source={images.nodeCloud} style={{ position: "absolute", bottom: 0, width: GUIDE * 0.96, height: GUIDE * 0.4 }} contentFit="contain" />
              <Mascot size={GUIDE} pose={flying ? "celebrate" : "point"} />
            </Animated.View>
          )}
        </View>
      </Animated.ScrollView>

      {/* Pasif ebeveyn geri bildirim butonu — sol alt, ana navigasyondan ayrı (Sohail).
          Prompt/push yok; isteyen ebeveyn dokununca modal açılır. */}
      <Pressable
        onPress={() => {
          playSfx("ui_tap");
          setFeedbackOpen(true);
        }}
        hitSlop={8}
        style={{
          position: "absolute",
          left: 14,
          bottom: 84,
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: "rgba(255,255,255,0.92)",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#1462B5",
          shadowOpacity: 0.18,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 3 },
        }}
      >
        <Text style={{ fontSize: 22 }}>💬</Text>
      </Pressable>

      {/* Alt menü (sabit) */}
      <View style={{ position: "absolute", left: 12, right: 12, bottom: 8 }}>
        <BottomNav />
      </View>

      <FeedbackModal visible={feedbackOpen} context="home" onClose={() => setFeedbackOpen(false)} />
    </GradientBg>
  );
}

import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { Celebration } from "@/components/ui/Celebration";
import { CheerOverlay } from "@/components/ui/CheerOverlay";
import { CorrectBurst } from "@/components/ui/CorrectBurst";
import { NewGameUnlock } from "@/components/ui/NewGameUnlock";
import { GradientBg } from "@/components/ui/GradientBg";
import { SoundToggles } from "@/components/ui/SoundToggles";
import { StageHost } from "@/components/ui/StageHost";
import { BalloonPop } from "@/features/balloon/BalloonPop";
import { SoundCatch } from "@/features/catch/SoundCatch";
import { ConfusePick } from "@/features/confuse/ConfusePick";
import { GiveToPiril } from "@/features/drag/GiveToPiril";
import { HearTap } from "@/features/heartap/HearTap";
import { LetterIntro } from "@/features/intro/LetterIntro";
import { MatchGame } from "@/features/match/MatchGame";
import { FeedbackModal } from "@/components/ui/FeedbackModal";
import { ParentEmailOptin } from "@/components/ui/ParentEmailOptin";
import { MosqueBuild } from "@/features/mosque/MosqueBuild";
import { MosqueFinale } from "@/features/mosque/MosqueFinale";
import { RecallGame } from "@/features/recall/RecallGame";
import { SpeakPractice } from "@/features/speak/SpeakPractice";
import { PaintTrace } from "@/features/trace/PaintTrace";
import { dotSiblings, soundSiblings } from "@/data/confusables";
import { ACTIVITY_META, newlyUnlockedGame } from "@/data/lesson";
import { getLetter, TOTAL_LETTERS } from "@/data/letters";
import type { LevelPart } from "@/data/levels";
import type { ActivityKind } from "@/data/types";
import { haptics } from "@/lib/haptics";
import { mascotVars } from "@/lib/mascot";
import { images } from "@/lib/images";
import { playHint, playLetter, playSfx, resetCombo, stopSpeech, type HintKey } from "@/lib/sfx";
import { useLearningStore } from "@/stores/learningStore";
import { useMosqueStore } from "@/stores/mosqueStore";
import { useProgressStore } from "@/stores/progressStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStageStore } from "@/stores/stageStore";
import { useStreakStore } from "@/stores/streakStore";

const HINT_KEY: Record<ActivityKind, string> = {
  intro: "learn.introHint",
  trace: "learn.traceHint",
  hearTap: "learn.hearTapHint",
  match: "learn.matchHint",
  drag: "learn.dragHint",
  balloon: "learn.balloonHint",
  catch: "learn.catchHint",
  word: "learn.wordHint",
  dots: "learn.dotsHint",
  confuseSound: "learn.confuseSoundHint",
  recall: "learn.recallHint",
  speak: "learn.speakHint",
};

/** Ders adımları göstergesi — değişken sayıda etkinlik (tek bir "raf" üstünde). */
function StepBar({ activities, activeIndex }: { activities: ActivityKind[]; activeIndex: number }) {
  return (
    <View className="items-center py-1">
      <View
        className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
        style={{
          backgroundColor: "rgba(255,255,255,0.5)",
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.75)",
          shadowColor: "#1462B5",
          shadowOpacity: 0.15,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        {activities.map((k, i) => {
          const active = i === activeIndex;
          const done = i < activeIndex;
          const meta = ACTIVITY_META[k];
          return (
            <View key={`${k}-${i}`} style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Adımlar arası bağlantı çizgisi — "sıra/ilerleme" görsel olarak bariz olsun
                  (Abdulkadir: ikonların anlamı/ilerlemesi net değildi). Yazı eklemeden. */}
              {i > 0 && (
                <View
                  style={{ width: 10, height: 4, borderRadius: 2, marginHorizontal: 1, backgroundColor: i <= activeIndex ? "#3FB984" : "rgba(0,0,0,0.12)" }}
                />
              )}
              <View
                style={{
                  width: active ? 56 : 46,
                  height: active ? 56 : 46,
                  borderRadius: 30,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active ? "#FFFFFF" : "transparent",
                  borderWidth: done ? 3 : 0,
                  borderColor: "#3FB984",
                  shadowColor: active ? "#1462B5" : "transparent",
                  shadowOpacity: active ? 0.25 : 0,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                }}
              >
                {meta.icon ? (
                  <Image
                    source={meta.icon}
                    style={{ width: active ? 40 : 32, height: active ? 40 : 32, opacity: active || done ? 1 : 0.5 }}
                    contentFit="contain"
                  />
                ) : (
                  <Text style={{ fontSize: active ? 28 : 22, opacity: active || done ? 1 : 0.5 }}>{meta.emoji}</Text>
                )}
                {/* Tamamlandı rozeti — net "bitti" işareti (yeşil kenarlık yeterince bariz değildi) */}
                {done && (
                  <View
                    style={{
                      position: "absolute",
                      right: -2,
                      bottom: -2,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: "#3FB984",
                      borderWidth: 2,
                      borderColor: "#fff",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 10, color: "#fff", fontFamily: "Fredoka_700Bold" }}>✓</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function LearnScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { letterId, part: partParam } = useLocalSearchParams<{ letterId: string; part?: string }>();
  const id = Number(letterId);
  // Her harf iki seviyeye bölündü: ?part=play ikinci seviye (oyunlar + konuş).
  const part: LevelPart = partParam === "play" ? "play" : "learn";
  const letter = getLetter(id);

  const activities = useLearningStore((s) => s.activities);
  const activeIndex = useLearningStore((s) => s.activeIndex);
  const startLetter = useLearningStore((s) => s.startLetter);
  const nextStep = useLearningStore((s) => s.nextStep);
  const completePart = useProgressStore((s) => s.completePart);
  const syncMosque = useMosqueStore((s) => s.syncWithProgress);

  const language = useSettingsStore((s) => s.language);
  const [celebrate, setCelebrate] = useState(false);
  const [buildVisible, setBuildVisible] = useState(false);
  const [buildStage, setBuildStage] = useState(0);
  const [finaleVisible, setFinaleVisible] = useState(false);

  /**
   * "Yeni oyun!" anı — mini-oyunlar kademeli açıldığı için (GAME_UNLOCKS) çocuk
   * bir oyunu İLK kez oynayacağı adımda kısa bir ödül ekranı görür.
   * Aynı ders içinde bir kez gösterilir.
   */
  const [unlockShownFor, setUnlockShownFor] = useState<ActivityKind | null>(null);
  const [unlockVisible, setUnlockVisible] = useState(false);
  const newGame = id ? newlyUnlockedGame(id) : undefined;
  const [emailOptinVisible, setEmailOptinVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  /**
   * Bu harf derse GİRERKEN zaten tamamlanmış mıydı?
   * Tamamlanmış bir harfi yeniden oynamak bir TEKRAR turudur: cami zaten o parçayı
   * aldı, 28 biterse final zaten izlendi. Bunu ayırt etmezsek 28'i bitirmiş bir çocuk
   * herhangi bir harfi tekrar oynadığında büyük finali (ve ebeveyn e-posta ekranını)
   * baştan görüyordu.
   */
  const wasComplete = useRef(false);
  useEffect(() => {
    wasComplete.current = useProgressStore.getState().isPartComplete(id, part);
  }, [id, part]);

  useEffect(() => {
    startLetter(id, part);
    useStageStore.getState().resetIdle();
    setUnlockShownFor(null);
    resetCombo(); // seri harfe özeldir, önceki harften taşımasın
  }, [id, part, startLetter]);

  /**
   * Abdulkadir (madde 2): her etkinliğin talimatı SESLİ söylenir — okuyamayan
   * çocuk ne yapacağını balondaki yazıdan öğrenemiyordu. "Yeni oyun!" ekranı
   * açıkken beklenir, yoksa Pırıl kendi üstüne konuşur.
   */
  useEffect(() => {
    const current = activities[activeIndex];
    if (!current || unlockVisible) return;
    stopSpeech(); // önceki adımın repliği burada çalmasın
    // "Konuş" adımının talimatı iki parçaya bölündü (kulak / mikrofon) ve
    // RecordCompare'in içinden, ilgili buton belirdiği anda söyleniyor.
    if (current === "speak") return;
    const tt = setTimeout(() => playHint(language, current as HintKey), 260);
    return () => clearTimeout(tt);
  }, [activities, activeIndex, unlockVisible, language]);

  // Bu harfte yeni açılan oyunun sırası geldiğinde, oyundan ÖNCE ödül ekranı.
  useEffect(() => {
    const current = activities[activeIndex];
    if (wasComplete.current) return; // tekrar turunda "yeni oyun" sürprizi yok
    if (!current || !newGame || current !== newGame || unlockShownFor === newGame) return;
    setUnlockShownFor(newGame);
    setUnlockVisible(true);
  }, [activities, activeIndex, newGame, unlockShownFor]);

  const goHome = () => router.replace("/home");

  const finishLetter = () => {
    setCelebrate(false); // kutlamayı kapat → cami sahnesiyle çakışmasın
    // Ders biterken konuşma kuyruğunu boşalt: konuşma adımının replikleri kanalda
    // yer ayırmış oluyor ve cami sahnesinin "camin büyüdü" sesi sıra bekliyordu
    // (Abdulkadir 3. tur: "seviye bitince sesi duymadan önce gözle görülür gecikme").
    stopSpeech();
    // Tekrar turu: yeni cami parçası yok, final yok — kutlamayı gördü, haritaya dön.
    // İlk seviye ("öğren") de cami vermez; harf ancak ikinci seviyede tamamlanır.
    if (wasComplete.current || part === "learn") {
      goHome();
      return;
    }
    const isComplete = useProgressStore.getState().isLetterComplete;
    let completed = 0;
    for (let i = 1; i <= TOTAL_LETTERS; i++) if (isComplete(i)) completed++;
    syncMosque(completed);
    // Son harf (28) → BÜYÜK FİNAL (cami tam reveal + Pırıl diyalog), normal build yerine
    if (completed >= TOTAL_LETTERS) {
      setFinaleVisible(true);
      return;
    }
    const stages = images.mosqueStages.length;
    const idxNow = Math.min(stages - 1, Math.max(0, completed - 1));
    setBuildStage(idxNow);
    setBuildVisible(true);
  };

  const onCompleteStep = () => {
    haptics.success();
    // Sohail (playtest raporu): aktiviteler bitince bir sonrakine geçiş çok hızlıydı,
    // çocuk başarıyı fark edecek zaman bulamıyordu. Her mini-oyun zaten kendi içinde
    // ~650-900ms'lik bir "doğru!" payı bırakıp onComplete'i SONRA çağırıyor — ama o an
    // hemen adım değişince kutlama (cheer) artık DEĞİŞMİŞ yeni ekranın üzerinde oynuyordu.
    // Kutlamayı hâlâ görünen (bitmiş) ekranın üzerinde hemen başlat, adım değişimini/StepBar
    // güncellemesini kısa bir gecikmeyle yap → kutlama gerçek bir "durak" hissi versin.
    const willAdvance = activeIndex < activities.length - 1;
    if (willAdvance) {
      useStageStore.getState().cheer(); // ara adımda HAFİF sevinç (büyük "Great Job!" değil — yanıltmasın)
    }
    setTimeout(() => {
      const advanced = nextStep();
      if (advanced) {
        playSfx("step_complete");
      } else {
        completePart(id, part);
        useStreakStore.getState().recordPractice(Date.now()); // bugünü zincire ekle (istikamet)
        setCelebrate(true);
      }
    }, 450);
  };

  if (!letter) {
    return (
      <GradientBg>
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-muted">Harf bulunamadı.</Text>
        </View>
      </GradientBg>
    );
  }

  const kind = activities[activeIndex];
  const stepLabel = kind ? t(ACTIVITY_META[kind].labelKey, mascotVars()) : "";
  const FLOOR_H = 118; // alt sahne zemini (büyük host orada durur; oyunlar üstte)

  return (
    <GradientBg>
      {/* Üst utility: geri (sol) + müzik/ses (sağ) */}
      <View className="flex-row items-center justify-between pt-1">
        <Pressable
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.9)",
            shadowColor: "#1462B5",
            shadowOpacity: 0.18,
            shadowRadius: 5,
            shadowOffset: { width: 0, height: 3 },
          }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#208AEF", marginTop: -2 }}>‹</Text>
        </Pressable>
        <SoundToggles />
      </View>

      <StepBar activities={activities} activeIndex={activeIndex} />

      {/* Başlık banner */}
      <View style={{ alignItems: "center" }}>
        <View style={{ width: 248, aspectRatio: 3.02 }}>
          <Image source={images.titleBanner} style={StyleSheet.absoluteFill} contentFit="contain" />
          <View style={{ position: "absolute", left: 0, right: 0, top: "5%", bottom: "42%", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#5B4A1E", includeFontPadding: false }}>
              {stepLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Talimat balonu — dokununca Pırıl tekrar söyler (çocuk kaçırdıysa) */}
      <Pressable
        onPress={() => kind && playHint(language, kind as HintKey)}
        hitSlop={10}
        className="mt-1 self-center rounded-full bg-white/65 px-6 py-2"
        style={{ maxWidth: "92%", shadowColor: "#1462B5", shadowOpacity: 0.14, shadowRadius: 7, shadowOffset: { width: 0, height: 4 } }}
      >
        {/* Tek satır, gerekirse küçülür: uzun bir ipucu balonu büyütüp altındaki
            oyunun üstüne bindiriyordu ve çakışan yerde dokunuşlar boşa gidiyordu. */}
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 17, lineHeight: 23, textAlign: "center", color: "#34618C" }}
        >
          {kind ? t(HINT_KEY[kind], mascotVars()) : ""}
        </Text>
      </Pressable>

      {/* Görev paneli (çerçeve) + etkinlik — sahne zemininin ÜSTÜNDE */}
      <View style={{ flex: 1, marginTop: 10 }}>
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 2,
            right: 2,
            top: 2,
            bottom: FLOOR_H + 2,
            borderRadius: 30,
            backgroundColor: "rgba(255,255,255,0.24)",
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.6)",
          }}
        />
        <View style={{ flex: 1, marginBottom: FLOOR_H }}>
        {/* "Yeni oyun!" ekranı açıkken oyunu MOUNT ETME: her oyun açılışta hedef harfi
            sesli söylüyor, o ses Pırıl'ın "yeni bir oyun açıldı" anlatımına biniyordu. */}
        {unlockVisible ? null : kind === "intro" ? (
        <View className="flex-1 items-center justify-center">
          <LetterIntro key={`intro-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "trace" ? (
        <View className="flex-1 items-center justify-center pb-1">
          <View style={{ width: "100%", maxWidth: 400, aspectRatio: 0.96, alignSelf: "center" }}>
            <Image source={images.playPanel} style={StyleSheet.absoluteFill} contentFit="fill" />
            <View style={{ position: "absolute", left: "9%", right: "9%", top: "9%", bottom: "11%" }}>
              <PaintTrace key={`trace-${id}`} letterId={id} onComplete={onCompleteStep} />
            </View>
          </View>
        </View>
      ) : kind === "hearTap" ? (
        <View className="flex-1 items-center justify-center">
          <HearTap key={`hearTap-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "match" ? (
        <View className="flex-1 items-center justify-center">
          <MatchGame key={`match-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "drag" ? (
        <View className="flex-1 items-center justify-center">
          <GiveToPiril key={`drag-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "balloon" ? (
        <View className="flex-1 items-center justify-center">
          <BalloonPop key={`balloon-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "catch" ? (
        <View className="flex-1 items-center justify-center">
          <SoundCatch key={`catch-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "dots" ? (
        <View className="flex-1 items-center justify-center">
          <ConfusePick key={`dots-${id}`} letterId={id} siblings={dotSiblings(id)} onComplete={onCompleteStep} />
        </View>
      ) : kind === "confuseSound" ? (
        <View className="flex-1 items-center justify-center">
          <ConfusePick key={`confuseSound-${id}`} letterId={id} siblings={soundSiblings(id)} onComplete={onCompleteStep} />
        </View>
      ) : kind === "recall" ? (
        <View className="flex-1 items-center justify-center">
          <RecallGame key={`recall-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : kind === "speak" ? (
        <View className="flex-1 items-center justify-center">
          <SpeakPractice key={`speak-${id}`} letterId={id} onComplete={onCompleteStep} />
        </View>
      ) : (
        <View className="flex-1" />
      )}
        </View>
      </View>

      {/* Sahne zemini (bulut bandı) + büyük host (sunucu) */}
      <View pointerEvents="none" style={{ position: "absolute", left: -18, right: -18, bottom: 0, height: FLOOR_H + 6 }}>
        <Image source={images.nodeCloud} style={{ position: "absolute", right: -6, bottom: -8, width: 196, height: 92, opacity: 0.8 }} contentFit="contain" />
      </View>
      <StageHost size={148} onReplay={() => playLetter(id)} />
      <CorrectBurst />
      <CheerOverlay />

      <NewGameUnlock visible={unlockVisible} kind={newGame ?? null} onDone={() => setUnlockVisible(false)} />
      <Celebration visible={celebrate} onDone={finishLetter} />
      <MosqueBuild visible={buildVisible} stageIndex={buildStage} onDone={goHome} />
      {/* 28 finali → Continue → ebeveyn e-posta opt-in → geri bildirim → home (Sohail) */}
      <MosqueFinale
        visible={finaleVisible}
        onDone={() => {
          setFinaleVisible(false);
          setEmailOptinVisible(true);
        }}
      />
      <ParentEmailOptin
        visible={emailOptinVisible}
        onClose={() => {
          setEmailOptinVisible(false);
          setFeedbackVisible(true);
        }}
      />
      <FeedbackModal visible={feedbackVisible} context="finale" onClose={goHome} />
    </GradientBg>
  );
}

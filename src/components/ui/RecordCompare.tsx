import { Image } from "expo-image";
import {
  createAudioPlayer,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  type AudioPlayer,
} from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { Mascot } from "@/components/ui/Mascot";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { mascotVars } from "@/lib/mascot";
import { letterDurationMs, playLetter, playNarration, playSfx, speechRemainingMs } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

const MAX_RECORD_MS = 3500;
/** "Kendini dinle" anlatımının süresi — kayıt onun ardından geri çalsın. */
const PLAYBACK_MS: Record<"en" | "tr", number> = { en: 1269, tr: 1206 };
const MIC = 104;
const MIC_ASPECT = 480 / 313; // ic_mic.webp kaynak oranı (h/w)
const RING = MIC + 34; // geri sayım halkası çapı

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * "Dinle → Kaydet → Kendini dinle" — üç adımlı, her adımı BARİZ konuşma aktivitesi.
 *
 * Abdulkadir (2. playtest turu): çocuklar (a) mikrofona NE ZAMAN basacaklarını bilmiyor,
 * (b) kaydın başladığını/bittiğini anlamıyor, (c) akış küçük çocuk için sezgisel değil,
 * (d) kendi seslerini duymak istiyorlar — geri oynatma öne çıkmalı.
 *
 * Bu yüzden:
 *   - Üstte 3 adımlı gösterge (kulak → mikrofon → hoparlör): çocuk nerede olduğunu görür.
 *   - Her adımda TEK bir büyük buton nabız atar → "şimdi buna bas" belirsizliği kalmaz.
 *
 * 3. tur (Abdulkadir, video): akış hâlâ karışıktı. "Önce dinle" diyordu ama harfi
 * duymak için BASMAK gerekiyordu ("harfi duyduğumdan emin değilim"); "şimdi sen söyle"
 * diyordu ama aslında mikrofona basmak gerekiyordu ("söyleyecek miyim, basacak mıyım?").
 * Çözüm: çocuk hiçbir şeye karar vermek zorunda kalmasın — harf KENDİLİĞİNDEN çalar,
 * kayıt bitince kendi sesi KENDİLİĞİNDEN geri çalar. Dokunması gereken tek an, kayıt.
 *   - Kayıt sırasında halka GERİ SAYAR (dolu → boş): ne zaman biteceği görünür.
 *   - Kayıt bitince kendi sesi BÜYÜK butonla öne çıkar; karşılaştırma ikincil kalır.
 *
 * GİZLİLİK: kayıt yalnız bellekte; hiçbir yere yazılmaz/gönderilmez, harf değişince silinir.
 * İzin yoksa/desteklenmiyorsa bileşen kendini gizler ve akışı ASLA bloklamaz.
 */
type Step = "listen" | "record" | "playback" | "unsupported";

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ["listen", "record", "playback"];
  const icons = [images.icEar, images.icMic, images.icSpeaker];
  const idx = order.indexOf(step);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {order.map((s, i) => {
        const active = i === idx;
        const done = i < idx;
        return (
          <View key={s} style={{ flexDirection: "row", alignItems: "center" }}>
            {i > 0 && (
              <View style={{ width: 12, height: 4, borderRadius: 2, marginHorizontal: 2, backgroundColor: i <= idx ? "#3FB984" : "rgba(0,0,0,0.12)" }} />
            )}
            <View
              style={{
                width: active ? 38 : 30,
                height: active ? 38 : 30,
                borderRadius: 19,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? "#FFFFFF" : "transparent",
                borderWidth: done ? 3 : 0,
                borderColor: "#3FB984",
              }}
            >
              <Image
                source={icons[i]}
                style={{ width: active ? 22 : 18, height: active ? 22 : 18, opacity: active || done ? 1 : 0.4 }}
                contentFit="contain"
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function RecordCompare({
  letterId,
  onRecordedChange,
  onStepChange,
}: {
  letterId: number;
  onRecordedChange?: (recorded: boolean) => void;
  /** Dış kabuk, adıma göre yer açabilsin diye (son adımda içerik en uzun). */
  onStepChange?: (step: "listen" | "record" | "playback" | "unsupported") => void;
}) {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>("listen");
  const [recording, setRecording] = useState(false);
  /** Harf tam ŞU AN çalıyor — dinleme butonu belirgin şekilde canlanır. */
  const [hearing, setHearing] = useState(false);
  const youPlayerRef = useRef<AudioPlayer | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const language = useSettingsStore((st) => st.language);

  // Aktif butonun nabzı — "şimdi buna bas" daveti
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * (recording ? 0.03 : 0.07) }] }));

  // Kayıt geri sayımı — halka dolu başlar, süre bitince boşalır (ne zaman biteceği GÖRÜNÜR)
  const CIRC = Math.PI * (RING - 8);
  const countdown = useSharedValue(0);
  const ringStyle = useAnimatedStyle(() => ({ opacity: recording ? 1 : 0 }));
  const countdownProps = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - countdown.value) }));

  /**
   * Mikrofon izni PEŞİNEN alınır.
   *
   * Eskiden izin ilk kayıt denemesinde soruluyordu: çocuk mikrofona basıyor,
   * karşısına sistem penceresi çıkıyor, ne olduğunu anlamıyor ve kayıt hiç
   * başlamıyordu (Abdulkadir 3. tur, çocuk videosu).
   */
  const permRef = useRef<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    requestRecordingPermissionsAsync()
      .then((p) => {
        if (!alive) return;
        permRef.current = p.granted;
        if (!p.granted) {
          setStep("unsupported");
          onRecordedChange?.(true); // izin yok — akışı kilitli bırakma
        }
      })
      .catch(() => {
        if (!alive) return;
        permRef.current = false;
        setStep("unsupported");
        onRecordedChange?.(true);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setStep("listen");
    setRecording(false);
    recordedOnceRef.current = false;
    onRecordedChange?.(false);
    youPlayerRef.current?.remove();
    youPlayerRef.current = null;
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      youPlayerRef.current?.remove();
      youPlayerRef.current = null;
      // Çocuk kayıt sürerken geri çıkabilir; ses oturumunu kayıt modunda bırakma.
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterId]);

  /**
   * Yalnız SON adımda konuşur ("kendini dinle").
   *
   * Dinle/kaydet adımlarının kendi anlatımları KALDIRILDI: etkinliğin talimatı
   * (hint_speak) zaten "önce beni dinle, sonra mikrofona dokun ve harfi sen söyle"
   * diyor — ikisi arka arkaya çalınca aynı şey iki kez söylenmiş oluyordu.
   */
  useEffect(() => {
    if (recording) return;
    const key = step === "listen" ? "speak1" : step === "record" ? "speak2" : step === "playback" ? "stepPlayback" : null;
    if (!key) return;
    const tt = setTimeout(() => playNarration(language, key), 250);
    return () => clearTimeout(tt);
  }, [step, recording, language]);

  /**
   * Kayıt, Pırıl'ın "şimdi sen söyle" repliği BİTİNCE başlar — daha erken başlarsa
   * çocuğun sesi yerine Pırıl'ın sesi kaydediliyor.
   */
  useEffect(() => {
    if (step !== "record" || recording || recordedOnceRef.current) return;
    let alive = true;
    const t = setTimeout(() => {
      if (!alive) return;
      const wait = speechRemainingMs();
      if (wait > 0) {
        const t2 = setTimeout(() => alive && startRecording(), wait + 300);
        timersRef.current.push(t2);
        return;
      }
      startRecording();
    }, 400);
    timersRef.current.push(t);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, recording]);

  // Harfi otomatik duyur, sonra kayıt adımına kendiliğinden geç (çocuk beklemesin).
  // playLetter konuşma kuyruğunda bekler: talimat bitmeden harf çalmaz.
  /**
   * Adımlar OTOMATİK İLERLEMEZ — her adımı çocuk kendi başlatır.
   *
   * Bir süre otomatik akış denendi (harf kendiliğinden çalıyor, adım kendiliğinden
   * geçiyordu) ama çocuğun kontrolünü elinden alıyordu: harfi duymadan mikrofon
   * ekranı geliyor gibi hissettiriyordu. Artık kulağa DOKUNUR → harfi duyar →
   * ses biter bitmez mikrofon adımı açılır.
   */
  const doListen = () => {
    if (hearing) return;
    haptics.tap();
    const queued = speechRemainingMs();
    const dur = letterDurationMs(letterId);
    playLetter(letterId);
    setTimeout(() => setHearing(true), queued);
    setTimeout(() => setHearing(false), queued + dur);
    setTimeout(() => setStep((cur) => (cur === "listen" ? "record" : cur)), queued + dur + 900);
  };

  /**
   * 2) Kaydet — ÇOCUK BASMAZ, kayıt kendiliğinden başlar.
   *
   * Videoda çocuk mikrofona basıyor, ekranda hiçbir şey değişmiyor (izin +
   * hazırlık birkaç yüz milisaniye sürüyor), tepki göremeyince tekrar basıyor
   * ve ya başlatmayı bozuyor ya da yeni başlamış kaydı durduruyordu. Ayrıca
   * "kayıt başlat" çocuk için anlamı olan bir eylem değil — asıl iş konuşmak.
   * Pırıl "şimdi sen söyle" dedikten sonra kayıt kendi başlıyor.
   */
  const startingRef = useRef(false);
  /** Bu harfte bir kez kaydedildiyse otomatik yeniden başlatma (tekrar kaydet elle). */
  const recordedOnceRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startRecording = async () => {
    if (startingRef.current || recording) return; // çift tetikleme koruması
    startingRef.current = true;
    try {
      if (permRef.current === false) {
        setStep("unsupported");
        onRecordedChange?.(true);
        return;
      }
      await setAudioModeAsync({ allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      haptics.tap();
      playSfx("ui_tap");
      setRecording(true);
      countdown.value = 1;
      countdown.value = withTiming(0, { duration: MAX_RECORD_MS, easing: Easing.linear });
      stopTimerRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
    } catch (err) {
      console.error("RecordCompare: kayıt başlatılamadı", err);
      setStep("unsupported");
      onRecordedChange?.(true);
    } finally {
      startingRef.current = false;
    }
  };

  const stopRecording = async () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      setRecording(false);
      if (recorder.uri) {
        recordedOnceRef.current = true;
        youPlayerRef.current?.remove();
        youPlayerRef.current = createAudioPlayer(recorder.uri);
        setStep("playback");
        onRecordedChange?.(true);
        haptics.success();
        playSfx("star_earned", 0.8);
        // Çocuk kendi sesini duymak için ayrıca basmak zorunda kalmasın (Abdulkadir:
        // "kendi seslerini duymak istiyorlar, geri oynatma öne çıkmalı").
        setTimeout(() => {
          youPlayerRef.current?.seekTo(0);
          youPlayerRef.current?.play();
        }, 900 + PLAYBACK_MS[language]);
      } else {
        setStep("record");
      }
    } catch (err) {
      console.error("RecordCompare: kayıt durdurulamadı", err);
      // Kayıt modu açık kalırsa iOS çalma sesini tamamen susturuyor — çocuk
      // uygulamayı kapatıp açsa bile "hiç ses yok" durumuna düşüyordu.
      try {
        await setAudioModeAsync({ allowsRecording: false });
      } catch {
        // ses oturumu erişilemiyorsa sessizce geç
      }
      setRecording(false);
      setStep("record");
    }
  };

  /** 3) Kendini dinle */
  const playYou = () => {
    haptics.tap();
    youPlayerRef.current?.seekTo(0);
    youPlayerRef.current?.play();
  };
  const playPiril = () => {
    playSfx("ui_tap");
    playLetter(letterId);
  };
  const recordAgain = () => {
    haptics.tap();
    recordedOnceRef.current = false;
    setStep("record");
    onRecordedChange?.(false);
  };

  useEffect(() => {
    onStepChange?.(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  /**
   * Mikrofon izni yoksa bileşen tamamen gizleniyordu — çocuk harfi bir kez daha
   * dinleyemeden adımı geçiyordu. Artık dinleme kısmı duruyor, yalnız kayıt yok.
   */
  const micDenied = step === "unsupported";

  return (
    <View style={{ alignItems: "center", gap: 14 }}>
      {!micDenied && <StepDots step={step} />}

      {/* 1) DİNLE — mikrofon izni olmasa da çalışır */}
      {(step === "listen" || micDenied) && (
        <Animated.View style={[pulseStyle, hearing ? { transform: [{ scale: 1.12 }] } : null]}>
          <Pressable onPress={doListen} hitSlop={24} style={{ alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: MIC,
                height: MIC,
                borderRadius: MIC / 2,
                backgroundColor: hearing ? "#FFF3D6" : "#FFFFFF",
                borderWidth: hearing ? 6 : 4,
                borderColor: "#F5A524",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#1462B5",
                shadowOpacity: 0.2,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              {/* Anlatım "kulağa dokun" diyor — buton da kulak olmalı. */}
              <Image source={images.icEar} style={{ width: 56, height: 56 }} contentFit="contain" />
            </View>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 18, color: hearing ? "#C97C10" : "#34618C" }}>
              {t(hearing ? "intro.stepHearing" : "intro.stepListen")}
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* 2) KAYDET — halka geri sayar, bitişi görünür */}
      {/* Kayıt kendiliğinden başlar — buton değil, DURUM göstergesi. Çocuk yalnız konuşur. */}
      {step === "record" && !micDenied && (
        <View style={{ alignItems: "center", gap: 10 }}>
          <View style={{ width: RING, height: RING, alignItems: "center", justifyContent: "center" }}>
            <Animated.View style={[{ position: "absolute", width: RING, height: RING }, ringStyle]}>
              <Svg width={RING} height={RING}>
                <Circle cx={RING / 2} cy={RING / 2} r={(RING - 8) / 2} stroke="rgba(240,100,90,0.2)" strokeWidth={8} fill="none" />
                <AnimatedCircle
                  cx={RING / 2}
                  cy={RING / 2}
                  r={(RING - 8) / 2}
                  stroke="#F0645A"
                  strokeWidth={8}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  animatedProps={countdownProps}
                  transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
                />
              </Svg>
            </Animated.View>
            <Animated.View style={pulseStyle}>
              <View
                style={{
                  width: MIC,
                  height: MIC,
                  borderRadius: MIC / 2,
                  backgroundColor: recording ? "#FFEDEB" : "#FFFFFF",
                  borderWidth: 4,
                  borderColor: recording ? "#F0645A" : "#3FB984",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#1462B5",
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <Image source={images.icMic} style={{ width: 62 / MIC_ASPECT, height: 62 }} contentFit="contain" />
              </View>
            </Animated.View>
          </View>
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 18, color: recording ? "#D8493F" : "#2E7D5B" }}>
            {recording ? t("intro.stepRecording") : t("intro.stepRecordWait")}
          </Text>
        </View>
      )}

      {/* 3) KENDİNİ DİNLE — kendi sesi BÜYÜK, karşılaştırma ikincil */}
      {step === "playback" && !micDenied && (
        <View style={{ alignItems: "center", gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Mascot size={46} pose="celebrate" />
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 17, color: "#3FB984" }}>{t("intro.recordCheer")}</Text>
          </View>

          <Animated.View style={pulseStyle}>
            <Pressable onPress={playYou} hitSlop={24} style={{ alignItems: "center", gap: 8 }}>
              <View
                style={{
                  width: MIC,
                  height: MIC,
                  borderRadius: MIC / 2,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 4,
                  borderColor: "#3FB984",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#1462B5",
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }}
              >
                <Image source={images.icSpeaker} style={{ width: 56, height: 56 }} contentFit="contain" />
              </View>
              <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 18, color: "#2E7D5B" }}>{t("intro.stepPlayback")}</Text>
            </Pressable>
          </Animated.View>

          {/* İkincil: Pırıl'la karşılaştır + tekrar kaydet */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 18, marginTop: 2 }}>
            <Pressable onPress={playPiril} hitSlop={16} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Image source={images.icSpeaker} style={{ width: 28, height: 28 }} contentFit="contain" />
              <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 14, color: "#5B6470" }}>{t("intro.playPiril", mascotVars())}</Text>
            </Pressable>
            <Pressable onPress={recordAgain} hitSlop={16}>
              <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 14, color: "#7A8593" }}>{t("intro.recordAgain")}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

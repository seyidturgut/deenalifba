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
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { Mascot } from "@/components/ui/Mascot";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { mascotVars } from "@/lib/mascot";
import { playLetter, playSfx } from "@/lib/sfx";

const MAX_RECORD_MS = 3500;
// Artık kendi tek-amaçlı "speak" ekranında (LetterIntro), bol boşluk var — 84'te kesilme
// büyük harf kartıyla AYNI ekranı paylaştığı için oluyordu, o sorun artık yok, tekrar büyüttük.
const MIC = 110;
const MIC_ASPECT = 480 / 313; // ic_mic.webp kaynak oranı (h/w)
const MIC_BOX = MIC + 16; // nabız animasyonunun taşması için pay (görsel kesilmeyi önler)

/**
 * "Kaydet ve karşılaştır" (Sohail/Abdulkadir onayladı; Abdulkadir canlıda deneyip
 * netleştirdi): çocuk kendi sesini kaydeder, Pırıl SICAK bir tepki verir (yargı/doğruluk
 * puanı YOK — yalnız "seni duydum, harikasın!"), sonra isterse kendi kaydı+Pırıl'ın
 * sesini karşılaştırmalı dinleyebilir.
 *
 * Abdulkadir'in somut istekleri: büyük mikrofon + net "Senin sıran!" daveti + kayıt
 * sırasında BARİZ "dinliyorum" animasyonu + kayıt sonrası sıcak tebrik.
 *
 * GİZLİLİK: kayıt yalnız bu ekranda, YALNIZ bellekte tutulur; hiçbir depoya/uzak
 * sunucuya yazılmaz/gönderilmez. Harf değişince veya ekrandan çıkınca serbest bırakılır.
 * Mikrofon izni reddedilirse veya desteklenmiyorsa bileşen sessizce gizlenir — ana akışı
 * hiçbir zaman engellemez (ebeveyn onDisabled ile "Hazırım"ı yalnız GÖSTERİLİYORSA kilitler).
 */
export function RecordCompare({ letterId, onRecordedChange }: { letterId: number; onRecordedChange?: (recorded: boolean) => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"idle" | "recording" | "recorded" | "unsupported">("idle");
  const youPlayerRef = useRef<AudioPlayer | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  // Nabız (idle/recording buton daveti)
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 550, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * (phase === "recording" ? 0.16 : 0.08) }] }));

  // "Dinliyorum" radar halkası — Abdulkadir: kayıt sırasında BARİZ bir animasyon olsun
  const ring = useSharedValue(0);
  useEffect(() => {
    if (phase === "recording") {
      ring.value = 0;
      ring.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.out(Easing.ease) }), -1, false);
    } else {
      ring.value = 0;
    }
  }, [phase]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: phase === "recording" ? 0.5 * (1 - ring.value) : 0,
    transform: [{ scale: 1 + ring.value * 0.9 }],
  }));

  // Harf değişince (yeni intro) sıfırla + eski kaydı serbest bırak
  useEffect(() => {
    setPhase("idle");
    onRecordedChange?.(false);
    youPlayerRef.current?.remove();
    youPlayerRef.current = null;
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      youPlayerRef.current?.remove();
      youPlayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letterId]);

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setPhase("unsupported");
        onRecordedChange?.(true); // izin yok — ana akışı ("Hazırım") kilitli bırakma
        return;
      }
      await setAudioModeAsync({ allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      haptics.tap();
      setPhase("recording");
      stopTimerRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
    } catch (err) {
      // mikrofon yok/izin yok/desteklenmiyor → sessizce gizle, ana akışı bozma
      // (console.error: chrome://inspect ile WebView'a bağlanınca GERÇEK hatayı görmek için —
      // izin verildiği halde kayıt başlamıyorsa buradaki mesaj kök nedeni gösterir)
      console.error("RecordCompare: kayıt başlatılamadı", err);
      setPhase("unsupported");
      onRecordedChange?.(true);
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
      if (recorder.uri) {
        youPlayerRef.current?.remove();
        youPlayerRef.current = createAudioPlayer(recorder.uri);
        setPhase("recorded");
        onRecordedChange?.(true);
        haptics.success();
        playSfx("star_earned", 0.8); // Pırıl'ın sıcak tepkisi — yargı yok, yalnız kutlama
      } else {
        setPhase("idle");
      }
    } catch (err) {
      console.error("RecordCompare: kayıt durdurulamadı", err);
      setPhase("idle");
    }
  };

  const playYou = () => {
    playSfx("ui_tap");
    youPlayerRef.current?.seekTo(0);
    youPlayerRef.current?.play();
  };
  const playPiril = () => {
    playSfx("ui_tap");
    playLetter(letterId);
  };
  const recordAgain = () => {
    haptics.tap();
    setPhase("idle");
    onRecordedChange?.(false);
  };

  if (phase === "unsupported") return null;

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      {phase !== "recorded" && (
        // Abdulkadir: mikrofon ORTADA, tek/kısa bir davet metni ALTINDA (yan yana değil) +
        // kayıt sırasında bariz "dinliyorum" halkası.
        <Pressable onPress={phase === "recording" ? stopRecording : startRecording} hitSlop={10} style={{ alignItems: "center", gap: 8 }}>
          <View style={{ width: MIC_BOX, height: MIC_BOX, alignItems: "center", justifyContent: "center" }}>
            {phase === "recording" && (
              <Animated.View
                pointerEvents="none"
                style={[{ position: "absolute", width: MIC, height: MIC, borderRadius: MIC / 2, backgroundColor: "#F0645A" }, ringStyle]}
              />
            )}
            <Animated.View style={pulseStyle}>
              <Image source={images.icMic} style={{ width: MIC / MIC_ASPECT, height: MIC }} contentFit="contain" />
            </Animated.View>
          </View>
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 18, color: "#34618C" }}>
            {phase === "recording" ? t("intro.recording") : t("intro.recordPrompt")}
          </Text>
        </Pressable>
      )}

      {phase === "recorded" && (
        <View style={{ alignItems: "center", gap: 10 }}>
          {/* Pırıl'ın sıcak tepkisi — yargı yok, yalnız kutlama (Abdulkadir) */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Mascot size={56} pose="celebrate" />
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 19, color: "#3FB984" }}>{t("intro.recordCheer")}</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 18 }}>
            <Pressable onPress={playYou} style={{ alignItems: "center", gap: 4 }}>
              <View
                style={{ width: 62, height: 62, borderRadius: 31, backgroundColor: "#FFFFFF", borderWidth: 3, borderColor: "#3FB984", alignItems: "center", justifyContent: "center", shadowColor: "#1462B5", shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
              >
                <Image source={images.icMic} style={{ width: 42 / MIC_ASPECT, height: 42 }} contentFit="contain" />
              </View>
              <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 14, color: "#5B6470" }}>{t("intro.playYou")}</Text>
            </Pressable>
            <Pressable onPress={playPiril} style={{ alignItems: "center", gap: 4 }}>
              <View style={{ width: 62, height: 62, alignItems: "center", justifyContent: "center" }}>
                <Image source={images.icListen} style={{ width: 56, height: 51 }} contentFit="contain" />
              </View>
              <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 14, color: "#5B6470" }}>{t("intro.playPiril", mascotVars())}</Text>
            </Pressable>
          </View>
          <Pressable onPress={recordAgain} hitSlop={8} style={{ paddingVertical: 4 }}>
            <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 14, color: "#7A8593" }}>{t("intro.recordAgain")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

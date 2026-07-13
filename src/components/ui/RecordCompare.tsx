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

import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { playLetter, playSfx } from "@/lib/sfx";

const MAX_RECORD_MS = 3500;

/**
 * "Kaydet ve karşılaştır" (Sohail/Abdulkadir): çocuk kendi sesini kaydeder, sonra
 * kendi kaydını + Pırıl'ın sesini yan yana dinleyebilir. YARGI/DOĞRULUK PUANI YOK —
 * yalnız "kendini duy, Pırıl'ı duy" karşılaştırması (aktif tekrar teşviki).
 *
 * GİZLİLİK: kayıt yalnız bu ekranda, YALNIZ bellekte tutulur; hiçbir depoya/uzak
 * sunucuya yazılmaz/gönderilmez. Harf değişince veya ekrandan çıkınca serbest bırakılır.
 * Mikrofon izni reddedilirse veya desteklenmiyorsa bileşen sessizce gizlenir — ana akışı
 * (Hazırım → devam) hiçbir zaman engellemez.
 */
export function RecordCompare({ letterId }: { letterId: number }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"idle" | "recording" | "recorded" | "unsupported">("idle");
  const youPlayerRef = useRef<AudioPlayer | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 550, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pulse.value * (phase === "recording" ? 0.16 : 0.08) }] }));

  // Harf değişince (yeni intro) sıfırla + eski kaydı serbest bırak
  useEffect(() => {
    setPhase("idle");
    youPlayerRef.current?.remove();
    youPlayerRef.current = null;
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      youPlayerRef.current?.remove();
      youPlayerRef.current = null;
    };
  }, [letterId]);

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setPhase("unsupported");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      haptics.tap();
      setPhase("recording");
      stopTimerRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
    } catch {
      // mikrofon yok/izin yok/desteklenmiyor → sessizce gizle, ana akışı bozma
      setPhase("unsupported");
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
        haptics.success();
      } else {
        setPhase("idle");
      }
    } catch {
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
  };

  if (phase === "unsupported") return null;

  return (
    <View style={{ alignItems: "center", gap: 6 }}>
      {phase !== "recorded" && (
        // Etiket mikrofonun YANINDA (satır düzeni) — altına koymak dikey yer yiyordu ve
        // kısa gerçek cihaz ekranlarında ScrollView'in görünür kutusundan taşıp
        // görünmez oluyordu (kullanıcı ekran görüntüsüyle bildirdi).
        <Pressable
          onPress={phase === "recording" ? stopRecording : startRecording}
          hitSlop={10}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
        >
          <Animated.View
            style={[
              {
                width: 46,
                height: 46,
                borderRadius: 23,
                backgroundColor: phase === "recording" ? "#F0645A" : "#FFFFFF",
                borderWidth: 3,
                borderColor: phase === "recording" ? "#D8493F" : "#F5A524",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#1462B5",
                shadowOpacity: 0.2,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              },
              pulseStyle,
            ]}
          >
            <Text style={{ fontSize: 20 }}>🎤</Text>
          </Animated.View>
          <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 12.5, color: "#5B6470", maxWidth: 170 }}>
            {phase === "recording" ? t("intro.recording") : t("intro.recordPrompt")}
          </Text>
        </Pressable>
      )}

      {phase === "recorded" && (
        <View style={{ alignItems: "center", gap: 4 }}>
          <View style={{ flexDirection: "row", gap: 14 }}>
            <Pressable onPress={playYou} style={{ alignItems: "center", gap: 3 }}>
              <View
                style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFFFFF", borderWidth: 3, borderColor: "#3FB984", alignItems: "center", justifyContent: "center", shadowColor: "#1462B5", shadowOpacity: 0.18, shadowRadius: 5, shadowOffset: { width: 0, height: 3 } }}
              >
                <Text style={{ fontSize: 21 }}>🎤</Text>
              </View>
              <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 12, color: "#5B6470" }}>{t("intro.playYou")}</Text>
            </Pressable>
            <Pressable onPress={playPiril} style={{ alignItems: "center", gap: 3 }}>
              <View style={{ width: 50, height: 50, alignItems: "center", justifyContent: "center" }}>
                <Image source={images.icListen} style={{ width: 45, height: 41 }} contentFit="contain" />
              </View>
              <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 12, color: "#5B6470" }}>{t("intro.playPiril")}</Text>
            </Pressable>
          </View>
          <Pressable onPress={recordAgain} hitSlop={8} style={{ paddingVertical: 2 }}>
            <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 12, color: "#7A8593" }}>{t("intro.recordAgain")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

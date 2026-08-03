import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { JuicyButton } from "@/components/ui/JuicyButton";
import { RecordCompare } from "@/components/ui/RecordCompare";
import { getLetter } from "@/data/letters";
import { getLetterPath, PATH_BOX } from "@/data/letterPaths";
import { suspendMusic } from "@/lib/sfx";

/**
 * "Konuş" adımı — dersin son adımı. Üstte hangi harfi söyleyeceği sabit durur,
 * altında üç adımlı akış: dinle → kaydet → kendini dinle (bkz. RecordCompare).
 *
 * NOT: Burada eskiden ayrı bir "Pırıl önce gösterir" demo fazı vardı. Abdulkadir'in
 * 2. tur geri bildiriminden sonra akışın 1. adımı zaten "dinle" olduğu için kaldırıldı —
 * iki ayrı dinleme anı çocuğu şaşırtıyor ve "ne zaman basacağım" belirsizliğini artırıyordu.
 */
export function SpeakPractice({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const letter = getLetter(letterId);
  const lp = getLetterPath(letterId);
  const [hasRecorded, setHasRecorded] = useState(false);
  /**
   * Son adımda (kendini dinle) içerik en uzun hâline geliyor ve ekrana sığmıyordu:
   * harf kartı yukarı taşıp ipucu balonunun üstüne biniyor, çakışan yerlerde
   * dokunma ölü alana düşüyordu. O adımda kart gizleniyor — çocuk zaten kendi
   * kaydını dinliyor, harfe bakmıyor.
   */
  const [speakStep, setSpeakStep] = useState<"listen" | "record" | "playback" | "unsupported">("listen");

  // Konuşma adımı boyunca müzik DURUR — çocuğun kendi kaydı net duyulsun (Abdulkadir).
  useEffect(() => {
    suspendMusic(true);
    return () => suspendMusic(false);
  }, []);

  if (!letter) return null;

  return (
    <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 16 }}>
      {/* Hangi harfi söyleyeceği — sabit referans (dinleme akışın 1. adımında) */}
      {speakStep !== "playback" && (
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 22,
          backgroundColor: "rgba(255,255,255,0.9)",
          borderWidth: 3,
          borderColor: "#F5A524",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {lp ? (
          <Svg width={58} height={58}>
            <G transform={`scale(${58 / PATH_BOX})`}>
              <Path d={lp.d} fill="#2A2A33" />
            </G>
          </Svg>
        ) : (
          <Text style={{ fontFamily: "Amiri_700Bold", fontSize: 46, color: "#2A2A33" }}>{letter.char}</Text>
        )}
      </View>
      )}

      <RecordCompare letterId={letterId} onRecordedChange={setHasRecorded} onStepChange={setSpeakStep} />

      <JuicyButton label={t("intro.continue")} tone="success" onPress={onComplete} disabled={!hasRecorded} />
    </View>
  );
}

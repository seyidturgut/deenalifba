import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { useTranslation } from "react-i18next";

import { JuicyButton } from "@/components/ui/JuicyButton";
import { RecordCompare } from "@/components/ui/RecordCompare";
import { getLetter } from "@/data/letters";
import { getLetterPath, PATH_BOX } from "@/data/letterPaths";
import { images } from "@/lib/images";
import { playLetter } from "@/lib/sfx";

/**
 * "Konuş" (kaydet & karşılaştır) adımı — dersin GERÇEK son adımı (Abdulkadir video
 * geri bildirimi: dinleme/yazma/pratik/tekrar BİTMEDEN çocuktan konuşmasını istemek
 * yanlıştı; artık her harfte, ama trace+pratik+recall'dan SONRA geliyor).
 *
 * Kendi tek-amaçlı ekranı: küçük "tekrar dinle" hapı + mikrofon ortada + tek kısa
 * davet metni altında (Abdulkadir: kalabalık/scroll gerektiren tek ekran yerine sade).
 */
export function SpeakPractice({ letterId, onComplete }: { letterId: number; onComplete: () => void }) {
  const { t } = useTranslation();
  const letter = getLetter(letterId);
  const lp = getLetterPath(letterId);
  const [hasRecorded, setHasRecorded] = useState(false);

  if (!letter) return null;

  return (
    <View style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", gap: 36 }}>
      <Pressable
        onPress={() => playLetter(letterId)}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.55)", borderRadius: 999, paddingVertical: 12, paddingHorizontal: 26 }}
      >
        <Image source={images.icListen} style={{ width: 46, height: 42 }} contentFit="contain" />
        {lp ? (
          <Svg width={56} height={56}>
            <G transform={`scale(${56 / PATH_BOX})`}>
              <Path d={lp.d} fill="#2A2A33" />
            </G>
          </Svg>
        ) : (
          <Text style={{ fontFamily: "Amiri_700Bold", fontSize: 44, color: "#2A2A33" }}>{letter.char}</Text>
        )}
      </Pressable>

      <RecordCompare letterId={letterId} onRecordedChange={setHasRecorded} />

      <JuicyButton label={t("intro.continue")} tone="success" onPress={onComplete} disabled={!hasRecorded} />
    </View>
  );
}

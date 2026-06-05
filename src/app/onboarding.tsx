import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { images } from "@/lib/images";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Karakterli oyunsal onboarding (Duolingo mantığı): maskot çocuğu elinden tutup
 * yönlendirir. Konuşma balonlarıyla anlatım + isim alma (PII, yalnız cihazda §4.B).
 */
export default function Onboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const setChildName = useSettingsStore((s) => s.setChildName);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");

  const finish = () => {
    if (name.trim().length > 0) setChildName(name);
    completeOnboarding();
    router.replace("/home");
  };

  const displayName = name.trim() || t("onboarding.friend");

  return (
    <GradientBg>
      <View className="flex-1 px-2">
        {/* Balon + maskot TEK küme (bitişik, ortada); maskot buluta basar */}
        <View className="flex-1 items-center justify-center" style={{ gap: 10 }}>
          {step === 0 && <SpeechBubble key="s0">{t("onboarding.p1")}</SpeechBubble>}
          {step === 1 && <SpeechBubble key="s1">{t("onboarding.p2")}</SpeechBubble>}
          {step === 2 && (
            <View className="items-center gap-4">
              <SpeechBubble key="s2">{t("onboarding.askName")}</SpeechBubble>
              <TextInput
                className="w-72 rounded-full border-2 border-white bg-white px-5 py-4 text-center"
                style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 22, color: "#2A2A33" }}
                placeholder={t("onboarding.namePlaceholder")}
                placeholderTextColor="#A9B4C2"
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => name.trim() && setStep(3)}
              />
            </View>
          )}
          {step === 3 && <SpeechBubble key="s3">{t("onboarding.done", { name: displayName })}</SpeechBubble>}

          {/* Maskot — buluta basar (havada/cücük durmasın), balon hemen üstünde */}
          <View style={{ width: 240, height: 206, alignItems: "center", justifyContent: "flex-end", marginTop: 2 }}>
            <Image source={images.nodeCloud} style={{ position: "absolute", bottom: 0, width: 210, height: 82 }} contentFit="contain" />
            <Mascot size={172} pose={step === 0 ? "wave" : step === 1 ? "point" : step === 3 ? "celebrate" : "idle"} />
          </View>
        </View>

        {/* Aksiyon (altta) */}
        <View className="items-center pb-8">
          {step === 0 && <JuicyButton label={t("onboarding.continue")} tone="accent" onPress={() => setStep(1)} />}
          {step === 1 && <JuicyButton label={t("onboarding.continue")} tone="accent" onPress={() => setStep(2)} />}
          {step === 2 && (
            <JuicyButton
              label={t("onboarding.ok")}
              tone="success"
              disabled={name.trim().length === 0}
              onPress={() => setStep(3)}
            />
          )}
          {step === 3 && <JuicyButton label={t("onboarding.start")} tone="success" onPress={finish} />}
        </View>
      </View>
    </GradientBg>
  );
}

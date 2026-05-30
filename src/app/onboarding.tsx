import { useRouter } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";

import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Karakterli oyunsal onboarding (Duolingo mantığı): maskot çocuğu elinden tutup
 * yönlendirir. Konuşma balonlarıyla anlatım + isim alma (PII, yalnız cihazda §4.B).
 */
export default function Onboarding() {
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

  const displayName = name.trim() || "arkadaşım";

  return (
    <GradientBg>
      <View className="flex-1 justify-between py-6">
        {/* Konuşma balonu (üstte) */}
        <View className="flex-1 items-center justify-center px-2">
          {step === 0 && (
            <SpeechBubble key="s0">Selam! 👋 Ben Pırıl.{"\n"}Hadi birlikte harfleri öğrenelim!</SpeechBubble>
          )}
          {step === 1 && (
            <SpeechBubble key="s1">Her harfi öğrendikçe sihirli camin büyüyecek! 🕌✨</SpeechBubble>
          )}
          {step === 2 && (
            <View className="items-center gap-5">
              <SpeechBubble key="s2">Önce adını söyle bakalım 😊</SpeechBubble>
              <TextInput
                className="w-72 rounded-full border-2 border-white bg-white px-5 py-4 text-center"
                style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 22, color: "#2A2A33" }}
                placeholder="Adını yaz"
                placeholderTextColor="#A9B4C2"
                value={name}
                onChangeText={setName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => name.trim() && setStep(3)}
              />
            </View>
          )}
          {step === 3 && (
            <SpeechBubble key="s3">Çok güzel, {displayName}! 🎉{"\n"}Hadi başlıyoruz! 🚀</SpeechBubble>
          )}
        </View>

        {/* Maskot (ortada, canlı; adıma göre poz değişir) */}
        <View className="items-center">
          <Mascot
            size={160}
            pose={step === 0 ? "wave" : step === 1 ? "point" : step === 3 ? "celebrate" : "idle"}
          />
        </View>

        {/* Aksiyon (altta) */}
        <View className="items-center pt-4">
          {step === 0 && <JuicyButton label="Devam ▶" tone="accent" onPress={() => setStep(1)} />}
          {step === 1 && <JuicyButton label="Devam ▶" tone="accent" onPress={() => setStep(2)} />}
          {step === 2 && (
            <JuicyButton
              label="Tamam"
              tone="success"
              disabled={name.trim().length === 0}
              onPress={() => setStep(3)}
            />
          )}
          {step === 3 && <JuicyButton label="Başla! 🚀" tone="success" onPress={finish} />}
        </View>
      </View>
    </GradientBg>
  );
}

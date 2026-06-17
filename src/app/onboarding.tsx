import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { SpeechBubble } from "@/components/ui/SpeechBubble";
import { haptics } from "@/lib/haptics";
import { images } from "@/lib/images";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Karakterli oyunsal onboarding (Duolingo mantığı): maskot çocuğu elinden tutup
 * yönlendirir. Konuşma balonlarıyla anlatım + isim alma (PII, yalnız cihazda §4.B).
 * KİŞİSELLEŞTİRME (müşteri madde 2): çocuk Pırıl'a isim + tema rengi seçer → "benim Pırıl'ım".
 */
const BUDDY_NAMES = ["Pırıl", "Hudu", "Nuri", "Cıvıl"];
const ACCENTS = ["#F5A524", "#2E8B9E", "#2FA869", "#3E7CC4", "#E0559E", "#8B5CF6"];

export default function Onboarding() {
  const { t } = useTranslation();
  const router = useRouter();
  const setChildName = useSettingsStore((s) => s.setChildName);
  const setMascotName = useSettingsStore((s) => s.setMascotName);
  const setAccentColor = useSettingsStore((s) => s.setAccentColor);
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [buddy, setBuddy] = useState(BUDDY_NAMES[0]);
  const [accent, setAccent] = useState(ACCENTS[0]);

  const finish = () => {
    if (name.trim().length > 0) setChildName(name);
    setMascotName(buddy);
    setAccentColor(accent);
    completeOnboarding();
    router.replace("/home");
  };

  const displayName = name.trim() || t("onboarding.friend");
  const showHalo = step >= 3; // kişiselleştirmeden sonra renkli hale görünür

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
          {step === 3 && (
            <View className="items-center gap-3">
              <SpeechBubble key="s3">{t("onboarding.customise")}</SpeechBubble>
              {/* İsim çipleri (dokunmayla, yazı gerekmez) */}
              <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 14, color: "#5C6B7A" }}>{t("onboarding.pickName")}</Text>
              <View className="flex-row flex-wrap justify-center" style={{ gap: 8, maxWidth: 300 }}>
                {BUDDY_NAMES.map((n) => {
                  const on = n === buddy;
                  return (
                    <Pressable
                      key={n}
                      onPress={() => { haptics.tap(); setBuddy(n); }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 9,
                        borderRadius: 20,
                        backgroundColor: on ? accent : "#FFFFFF",
                        borderWidth: 2,
                        borderColor: on ? accent : "#E4E8EE",
                      }}
                    >
                      <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 16, color: on ? "#FFFFFF" : "#3A3A44" }}>{n}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {/* Renk seçimi */}
              <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 14, color: "#5C6B7A", marginTop: 2 }}>{t("onboarding.pickColor")}</Text>
              <View className="flex-row justify-center" style={{ gap: 12 }}>
                {ACCENTS.map((c) => {
                  const on = c === accent;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => { haptics.tap(); setAccent(c); }}
                      style={{
                        width: on ? 40 : 34,
                        height: on ? 40 : 34,
                        borderRadius: 20,
                        backgroundColor: c,
                        borderWidth: on ? 4 : 0,
                        borderColor: "#FFFFFF",
                      }}
                    />
                  );
                })}
              </View>
            </View>
          )}
          {step === 4 && <SpeechBubble key="s4">{t("onboarding.buddyReady", { name: displayName, mascot: buddy })}</SpeechBubble>}

          {/* Maskot — buluta basar (havada/cücük durmasın), balon hemen üstünde */}
          <View style={{ width: 240, height: 206, alignItems: "center", justifyContent: "flex-end", marginTop: 2 }}>
            <Image source={images.nodeCloud} style={{ position: "absolute", bottom: 0, width: 210, height: 82 }} contentFit="contain" />
            {/* Seçilen renkli hale (sahiplenme ipucu) */}
            {showHalo && (
              <View
                pointerEvents="none"
                style={{ position: "absolute", bottom: 44, width: 168, height: 168, borderRadius: 84, backgroundColor: accent, opacity: 0.28 }}
              />
            )}
            <Mascot size={172} pose={step === 0 ? "wave" : step === 1 ? "point" : step === 4 ? "celebrate" : step === 3 ? "happy" : "idle"} />
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
          {step === 3 && <JuicyButton label={t("onboarding.ok")} tone="success" onPress={() => setStep(4)} />}
          {step === 4 && <JuicyButton label={t("onboarding.start")} tone="success" onPress={finish} />}
        </View>
      </View>
    </GradientBg>
  );
}

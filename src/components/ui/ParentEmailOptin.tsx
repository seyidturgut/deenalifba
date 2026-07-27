import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { ParentGate } from "@/features/parent-gate/ParentGate";
import { haptics } from "@/lib/haptics";
import { sendEmailOptinRemote } from "@/lib/remoteFeedback";
import { playSfx } from "@/lib/sfx";

/**
 * "Ebeveyn anı" — 28 harf finali sonrası e-posta opt-in (Sohail: beta'nın en değerli
 * veri noktası, "Stage 2 launch audience"; kendi sözüyle "be first to know").
 *
 * GİZLİLİK (PROJECT PROFILE §4.B — KVKK/COPPA/GDPR-K):
 * - EBEVEYN KAPISI ARKASINDA: çocuk kendi başına e-posta giremez (hem yasal hem veri
 *   kalitesi; kapı zaten abonelik/gizlilik görünümleri için kullanılıyor).
 * - Yalnız ebeveynin KENDİ yazdığı e-posta gönderilir; çocuğun adı/ilerlemesi/cihaz
 *   kimliği ASLA gönderilmez (bkz. remoteFeedback.ts).
 * - Tamamen İSTEĞE BAĞLI: "Şimdilik geç" her zaman görünür, akışı bloklamaz.
 */
export function ParentEmailOptin({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (visible) {
      setUnlocked(false);
      setEmail("");
      setSent(false);
    }
  }, [visible]);

  if (!visible) return null;

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = () => {
    if (!valid) return;
    sendEmailOptinRemote(email.trim()); // best-effort; ağ hatası akışı bozmaz
    playSfx("star_earned");
    haptics.success();
    setSent(true);
    setTimeout(onClose, 1400);
  };

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0B3566", alignItems: "center", justifyContent: "center", paddingHorizontal: 22 }}>
      {!unlocked ? (
        <View style={{ flex: 1, width: "100%", maxWidth: 360, alignSelf: "center", paddingTop: 24, paddingBottom: 28 }}>
          <ParentGate onSuccess={() => setUnlocked(true)} />
          <JuicyButton label={t("emailOptin.skip")} tone="primary" onPress={onClose} />
        </View>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%", maxWidth: 360, alignItems: "center" }}>
          <Animated.View
            entering={FadeIn.duration(300)}
            style={{ width: "100%", backgroundColor: "#FFFDF7", borderRadius: 28, borderWidth: 4, borderColor: "#FFD36B", paddingTop: 12, paddingBottom: 18, paddingHorizontal: 18, alignItems: "center" }}
          >
            <View style={{ marginTop: -56, marginBottom: 2 }}>
              <Mascot size={96} pose={sent ? "celebrate" : "happy"} />
            </View>

            {sent ? (
              <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 22, color: "#208AEF", textAlign: "center", paddingVertical: 22 }}>
                {t("emailOptin.thanks")}
              </Text>
            ) : (
              <>
                <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 21, color: "#208AEF", textAlign: "center", marginBottom: 6 }}>
                  {t("emailOptin.title")}
                </Text>
                <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: "#5C6B7A", textAlign: "center", marginBottom: 14, lineHeight: 20 }}>
                  {t("emailOptin.body")}
                </Text>

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t("emailOptin.placeholder")}
                  placeholderTextColor="#A9B4C2"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={120}
                  style={{ width: "100%", height: 52, borderRadius: 16, borderWidth: 2, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 14, fontFamily: "Nunito_700Bold", fontSize: 16, color: "#34414F" }}
                />

                {/* Ne için kullanılacağı açıkça yazılır (KVKK aydınlatma) */}
                <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 12, color: "#7A8593", textAlign: "center", marginTop: 10, lineHeight: 17 }}>
                  {t("emailOptin.privacy")}
                </Text>

                <View style={{ height: 12 }} />
                <View style={{ width: "100%", opacity: valid ? 1 : 0.5 }}>
                  <JuicyButton label={t("emailOptin.send")} tone="success" onPress={submit} />
                </View>
                <Pressable onPress={onClose} hitSlop={10} style={{ marginTop: 12, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 14, color: "#7A8593" }}>{t("emailOptin.skip")}</Text>
                </Pressable>
              </>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

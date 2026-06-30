import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { JuicyButton } from "@/components/ui/JuicyButton";
import { Mascot } from "@/components/ui/Mascot";
import { haptics } from "@/lib/haptics";
import { playSfx } from "@/lib/sfx";
import { useFeedbackStore, type FeedbackRating } from "@/stores/feedbackStore";

const FACES: { rating: FeedbackRating; emoji: string }[] = [
  { rating: "happy", emoji: "😊" },
  { rating: "neutral", emoji: "😐" },
  { rating: "sad", emoji: "😕" },
];

/**
 * Ebeveyn geri bildirim modal'ı (Sohail). In-world: Pırıl + 3 emoji + opsiyonel
 * metin + Send/Skip. Final (28 sonu) ve home pasif butonundan açılır.
 * Veri şimdilik cihazda (feedbackStore); uzak gönderim Sohail hedefi verince eklenir.
 */
export function FeedbackModal({ visible, context, onClose }: { visible: boolean; context: string; onClose: () => void }) {
  const { t } = useTranslation();
  const addFeedback = useFeedbackStore((s) => s.add);
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(null);
      setText("");
      setSent(false);
    }
  }, [visible]);

  if (!visible) return null;

  const pick = (r: FeedbackRating) => {
    setRating(r);
    haptics.tap();
    playSfx("ui_tap");
  };

  const submit = () => {
    if (!rating) return;
    addFeedback({ rating, text: text.trim(), context, at: Date.now() });
    playSfx("star_earned");
    haptics.success();
    setSent(true);
    setTimeout(onClose, 1100);
  };

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(11,53,102,0.96)", alignItems: "center", justifyContent: "center", paddingHorizontal: 22 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ width: "100%", maxWidth: 360, alignItems: "center" }}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={{ width: "100%", backgroundColor: "#FFFDF7", borderRadius: 28, borderWidth: 4, borderColor: "#FFD36B", paddingTop: 12, paddingBottom: 18, paddingHorizontal: 18, alignItems: "center" }}
        >
          {/* Pırıl (in-world, jenerik form değil) */}
          <View style={{ marginTop: -56, marginBottom: 2 }}>
            <Mascot size={96} pose={sent ? "celebrate" : "happy"} />
          </View>

          {sent ? (
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 22, color: "#208AEF", textAlign: "center", paddingVertical: 22 }}>
              {t("feedback.thanks")}
            </Text>
          ) : (
            <>
              <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 21, color: "#208AEF", textAlign: "center", marginBottom: 12 }}>
                {t("feedback.title")}
              </Text>

              {/* 3 emoji yüz — biri seçilir */}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginBottom: 14 }}>
                {FACES.map((f) => {
                  const active = rating === f.rating;
                  return (
                    <Pressable
                      key={f.rating}
                      onPress={() => pick(f.rating)}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 36,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: active ? "#FFE9B8" : "#F0F4F8",
                        borderWidth: active ? 3 : 2,
                        borderColor: active ? "#F5A524" : "#E2E8F0",
                        transform: [{ scale: active ? 1.08 : 1 }],
                      }}
                    >
                      <Text style={{ fontSize: 38 }}>{f.emoji}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Opsiyonel metin (ebeveyn için) */}
              <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#7A8593", alignSelf: "flex-start", marginBottom: 4 }}>
                {t("feedback.hint")}
              </Text>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t("feedback.placeholder")}
                placeholderTextColor="#A9B4C2"
                multiline
                maxLength={400}
                style={{ width: "100%", minHeight: 64, maxHeight: 120, borderRadius: 16, borderWidth: 2, borderColor: "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, fontFamily: "Nunito_700Bold", fontSize: 15, color: "#34414F", textAlignVertical: "top" }}
              />

              <View style={{ height: 12 }} />
              <View style={{ width: "100%", opacity: rating ? 1 : 0.5 }}>
                <JuicyButton label={t("feedback.send")} tone="success" onPress={submit} />
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={{ marginTop: 12, paddingVertical: 4 }}>
                <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 14, color: "#7A8593" }}>{t("feedback.skip")}</Text>
              </Pressable>
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

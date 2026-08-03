import { Component, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { Mascot } from "@/components/ui/Mascot";

/**
 * Hata sınırı — beklenmedik bir çökme tüm uygulamayı beyaz ekrana düşürmesin.
 *
 * Çocuk ne olduğunu anlayamaz, ebeveyn "bozuldu" deyip kapatır ve ilerleme
 * kaybolmuş gibi görünür. Oysa ilerleme cihazda duruyor: burada Pırıl'la birlikte
 * nazik bir ekran gösterip tek dokunuşla devam ettiriyoruz.
 *
 * Metin i18n'den DEĞİL, sabit iki dilde: hata çeviri katmanının kendisinden
 * geliyor olabilir.
 */
type Props = { children: ReactNode; language?: "tr" | "en" };
type State = { failed: boolean };

const TEXT = {
  tr: { title: "Bir şey ters gitti", body: "Merak etme, ilerlemen duruyor.", again: "Tekrar deneyelim" },
  en: { title: "Something went wrong", body: "Don't worry, your progress is safe.", again: "Let's try again" },
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    // Uzak hata raporlama YOK (çocuk verisi cihazdan çıkmaz). Geliştirme
    // günlüğüne yazmak, cihaz elimizdeyken sebebi görebilmek için yeterli.
    console.error("Beklenmedik hata:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const t = TEXT[this.props.language === "en" ? "en" : "tr"];

    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#BFE3FF", padding: 28, gap: 14 }}>
        <Mascot size={132} pose="happy" />
        <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "#0E5FC2", textAlign: "center" }}>{t.title}</Text>
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 16, color: "#34618C", textAlign: "center" }}>{t.body}</Text>
        <Pressable
          onPress={() => this.setState({ failed: false })}
          style={{
            marginTop: 8,
            backgroundColor: "#3FB984",
            borderRadius: 999,
            paddingHorizontal: 30,
            paddingVertical: 14,
            shadowColor: "#1462B5",
            shadowOpacity: 0.22,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
          }}
        >
          <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 19, color: "#FFFFFF" }}>{t.again}</Text>
        </Pressable>
      </View>
    );
  }
}

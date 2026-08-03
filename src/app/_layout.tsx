import "@/global.css";
import "@/i18n";

// Font'lar TEK TEK, alt yoldan alınıyor: paketin kökünden import edilince Metro
// ailenin BÜTÜN ağırlıklarını pakete koyuyor (25 dosya, ~4 MB) — oysa dördü
// kullanılıyor. Alt yol sadece o dosyayı getirir.
import Amiri_700Bold from "@expo-google-fonts/amiri/700Bold/Amiri_700Bold.ttf";
import Fredoka_600SemiBold from "@expo-google-fonts/fredoka/600SemiBold/Fredoka_600SemiBold.ttf";
import Fredoka_700Bold from "@expo-google-fonts/fredoka/700Bold/Fredoka_700Bold.ttf";
import Nunito_700Bold from "@expo-google-fonts/nunito/700Bold/Nunito_700Bold.ttf";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { setAudioModeAsync } from "expo-audio";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppErrorBoundary } from "@/components/ui/AppErrorBoundary";
import { startMusic, stopMusic } from "@/lib/sfx";
import { useSettingsStore } from "@/stores/settingsStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_700Bold,
    Amiri_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  /**
   * Ses oturumunu her açılışta ÇALMA moduna al.
   *
   * Konuşma etkinliği kayıt için oturumu kayıt moduna geçiriyor. Kayıt beklenmedik
   * bir yerde biterse (hata, çocuk geri çıkarsa, uygulama arkaya alınırsa) oturum
   * kayıt modunda kalıyor ve iOS bütün çalma sesini susturuyordu — ayarlarda ses
   * açık görünüyor ama hiçbir şey duyulmuyordu (Abdulkadir, 3. tur test).
   * Bileşen tarafında da kapatılıyor; burası son güvenlik ağı.
   */
  useEffect(() => {
    setAudioModeAsync({ allowsRecording: false }).catch(() => {});
  }, []);

  // Uygulama arkaya alınınca müzik DURSUN (Abdulkadir: force-close'a kadar çalıyordu).
  // Web/WebView'da AppState "background" vermiyor → visibilitychange ile de dinliyoruz.
  useEffect(() => {
    const pause = () => stopMusic();
    const resume = () => {
      if (useSettingsStore.getState().musicEnabled) startMusic();
    };

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        // Öne dönerken de oturumu çalma moduna al — kayıt sırasında arkaya
        // alınmışsa mod kayıtta kalmış olabilir.
        setAudioModeAsync({ allowsRecording: false }).catch(() => {});
        resume();
      } else pause();
    });

    let onVisibility: (() => void) | undefined;
    if (Platform.OS === "web" && typeof document !== "undefined") {
      onVisibility = () => (document.hidden ? pause() : resume());
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      sub.remove();
      if (onVisibility && typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, []);

  // Web/APK WebView: viewport zoom/pan kilidi. SPA çıktısında +html.tsx uygulanmadığı
  // için meta'yı runtime'da ayarlıyoruz. Bu olmadan APK'da harf çizerken parmak
  // sürükleme zoom-pan'e dönüşüp ekran sağa-sola kayıyordu (sağda beyaz boşluk).
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
    );
  }, []);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppErrorBoundary language={useSettingsStore.getState().language}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#EAF6FF" },
            animation: "fade",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="home" />
          <Stack.Screen name="harfler" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="learn/[letterId]" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="mosque" options={{ animation: "slide_from_bottom" }} />
          <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        </Stack>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import "@/global.css";
import "@/i18n";

import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";
import {
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  useFonts,
} from "@expo-google-fonts/fredoka";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from "@expo-google-fonts/nunito";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Amiri_400Regular,
    Amiri_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

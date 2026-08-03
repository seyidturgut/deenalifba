import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { GradientBg } from "@/components/ui/GradientBg";
import { JuicyButton } from "@/components/ui/JuicyButton";
import { ParentGate } from "@/features/parent-gate/ParentGate";
import { LETTERS, TOTAL_LETTERS } from "@/data/letters";
import type { AppLanguage } from "@/i18n";
import { resetAllProgress } from "@/lib/reset";
import { playSfx, syncMusicWithSetting } from "@/lib/sfx";
import { APP_VERSION_LABEL } from "@/lib/version";
import { useProgressStore } from "@/stores/progressStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useStreakStore } from "@/stores/streakStore";

/** Ekip test kodu — Sohail/Abdulkadir/Oliver'a ayrıca iletilir (çocuk bilmez). */
const TEAM_UNLOCK_CODE = "DEEN2026";

/** Ebeveyn haftalık özeti (İstikamet Zinciri Faz 3a) — kapı arkasında, ekran-görüntüsü alınası. */
function ParentSummary() {
  const { t } = useTranslation();
  const childName = useSettingsStore((s) => s.childName);
  useStreakStore((s) => s.practiceDays); // reaktivite
  const current = useStreakStore((s) => s.currentChain);
  const best = useStreakStore((s) => s.bestChain);
  const wv = useStreakStore.getState().weekView(Date.now());
  const completed = useProgressStore((s) => LETTERS.filter((l) => s.isLetterComplete(l.id)).length);
  const bestEver = Math.max(best, current);

  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 15, color: "#0E5FC2" }}>
        {t("settings.progressTitle")}{childName ? ` · ${childName}` : ""}
      </Text>
      {/* Son 7 gün — dolu=pratik (sonuncusu bugün) */}
      <View className="flex-row items-center" style={{ gap: 6 }}>
        {wv.flags.map((f, i) => (
          <View
            key={i}
            style={{ width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: f ? "#3FB984" : "rgba(0,0,0,0.08)" }}
          >
            {f && <Text style={{ fontSize: 11, color: "#fff" }}>🌙</Text>}
          </View>
        ))}
      </View>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: "#34618C" }}>{t("settings.weekDays", { n: wv.count })}</Text>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#5C6B7A" }}>{t("settings.chainCurrent", { n: current })}</Text>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#5C6B7A" }}>{t("settings.chainBest", { n: bestEver })}</Text>
      <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#5C6B7A" }}>{t("settings.lettersLearnedP", { n: completed, total: LETTERS.length })}</Text>
    </View>
  );
}

/**
 * Ayarlar — zararsız çocuk ayarları (dil/ses/müzik/titreşim) DOĞRUDAN açıktır.
 * Ebeveyn Kapısı (çarpma doğrulaması) yalnızca hassas "Ebeveyn Alanı"nı korur:
 * abonelik + gizlilik (PROJECT PROFILE §4.B — kapı abonelik/ebeveyn görünümleri içindir,
 * günlük ayar için değil).
 */
export default function Settings() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showGate, setShowGate] = useState(false);
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [jumpValue, setJumpValue] = useState("");
  // Ekip test kodu — çocuk kazara tüm bölümleri açmasın (kullanıcı ekibe iletecek)
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockCode, setUnlockCode] = useState("");
  const [unlockErr, setUnlockErr] = useState(false);

  const doNewGame = () => {
    resetAllProgress();
    playSfx("ui_tap");
    setShowReset(false);
    router.replace("/onboarding");
  };

  // Test/QA aracı — harf harf ilerleme/kilit beklemeden herhangi bir harfe git
  // (Abdulkadir: 28 harfin telaffuzunu tek tek kontrol etmesi gerekiyordu; freemium
  // kilidi zaten yalnız Harfler listesindeki dokunmayı kısıtlıyor, /learn/[id] rotasının
  // kendisi kilitsiz — ama APK'da (WebView kabuğu) adres çubuğu yok, URL yazılamıyor).
  const jumpToLetter = () => {
    const n = Math.round(Number(jumpValue));
    if (!n || n < 1 || n > TOTAL_LETTERS) return;
    playSfx("ui_tap");
    setJumpValue("");
    router.push(`/learn/${n}`);
  };

  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const musicEnabled = useSettingsStore((s) => s.musicEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const toggleMusic = useSettingsStore((s) => s.toggleMusic);
  const toggleHaptics = useSettingsStore((s) => s.toggleHaptics);

  const cardStyle = {
    shadowColor: "#1462B5",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  } as const;

  const Row = ({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: () => void }) => (
    <View className="flex-row items-center justify-between rounded-2xl bg-white px-5 py-4" style={cardStyle}>
      <Text className="text-lg font-bold text-ink">{label}</Text>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: "#37ACFF", false: "#CBD5E1" }} />
    </View>
  );

  const langs: { code: AppLanguage; label: string }[] = [
    { code: "tr", label: t("language.tr") },
    { code: "en", label: t("language.en") },
  ];

  return (
    <GradientBg>
      {/* Tüm ayarlar sayfası kaydırılabilir — içerik (özellikle alttaki 3 buton:
          Tanıtımı izle/Yeni Oyun/Kapat) kısa ekranlarda taşıyordu ve HİÇ scroll
          olmadığı için en alttaki buton erişilemez oluyordu. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        contentContainerClassName="gap-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-display text-3xl font-extrabold text-ink">{t("settings.title")}</Text>

        {/* Dil seçimi (TR varsayılan) */}
        <View className="flex-row items-center justify-between rounded-2xl bg-white px-5 py-4" style={cardStyle}>
          <Text className="text-lg font-bold text-ink">{t("settings.language")}</Text>
          <View className="flex-row gap-2">
            {langs.map((l) => {
              const active = language === l.code;
              return (
                <Pressable
                  key={l.code}
                  onPress={() => {
                    if (!active) {
                      setLanguage(l.code);
                      if (soundEnabled) playSfx("ui_tap");
                    }
                  }}
                  className="rounded-full px-4 py-2"
                  style={{ backgroundColor: active ? "#208AEF" : "#EDF1F5" }}
                >
                  <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 14, color: active ? "white" : "#5B6470" }}>
                    {l.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Çocuk-erişimli ayarlar — kapı YOK */}
        <Row label={t("settings.sound")} value={soundEnabled} onValueChange={toggleSound} />
        <Row
          label={t("settings.music")}
          value={musicEnabled}
          onValueChange={() => {
            toggleMusic();
            setTimeout(syncMusicWithSetting, 0);
          }}
        />
        <Row label={t("settings.haptics")} value={hapticsEnabled} onValueChange={toggleHaptics} />

        {/* Ebeveyn Alanı — kapı arkasında (abonelik/gizlilik) */}
        <View className="mt-1 gap-2 rounded-2xl bg-white px-5 py-4" style={cardStyle}>
          <Text className="text-lg font-bold text-ink">{t("settings.parentArea")}</Text>
          <Text className="text-sm font-semibold text-ink/55">{t("settings.parentAreaDesc")}</Text>
          {parentUnlocked ? (
            <ParentSummary />
          ) : (
            <JuicyButton label={t("settings.parentLogin")} tone="primary" onPress={() => { playSfx("ui_tap"); setShowGate(true); }} />
          )}
        </View>

        <View className="flex-1" />
        <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 13, color: "#7A8593", textAlign: "center", marginBottom: 8 }}>
          {APP_VERSION_LABEL}
        </Text>
        <JuicyButton label={t("settings.replayIntro")} tone="accent" onPress={() => router.push("/onboarding")} />

        {/* Harfe Atla (test/QA) — kilit/ilerleme beklemeden herhangi bir harfe git */}
        <View className="rounded-2xl bg-white px-5 py-4" style={cardStyle}>
          <Text className="text-lg font-bold text-ink">{t("settings.jumpToLetter")}</Text>
          {/* Her harf iki seviyeye bölününce seviye no ile harf sırası ayrıştı;
              test eden kişi 8'i "8. seviye" sanıp yanlış harfi dinliyordu. */}
          <Text className="mt-1 text-sm font-bold text-muted">{t("settings.jumpToLetterNote")}</Text>
          <View className="mt-3 flex-row items-center gap-3">
            <TextInput
              className="w-20 rounded-full border-2 border-primary-soft bg-canvas px-3 py-2 text-center text-xl font-bold"
              keyboardType="number-pad"
              value={jumpValue}
              onChangeText={setJumpValue}
              placeholder={`1-${TOTAL_LETTERS}`}
              maxLength={2}
              onSubmitEditing={jumpToLetter}
              accessibilityLabel={t("settings.jumpToLetter")}
            />
            <View className="flex-1">
              <JuicyButton label={t("settings.jumpGo")} tone="primary" onPress={jumpToLetter} />
            </View>
          </View>
        </View>

        {/* Tüm bölümleri aç (test) — ekip sonraki bölümleri denemek için 28'i beklemesin.
            Koda bağlı: çocuk kazara açıp tüm ilerlemeyi atlamasın. */}
        <JuicyButton
          label={t("settings.unlockAll")}
          tone="accent"
          onPress={() => { playSfx("ui_tap"); setUnlockCode(""); setUnlockErr(false); setShowUnlock(true); }}
        />

        {/* Yeni Oyun (test) — onaylı; tüm ilerlemeyi sıfırlar, onboarding'den başlar */}
        <JuicyButton label={t("settings.newGame")} tone="primary" onPress={() => { playSfx("ui_tap"); setShowReset(true); }} />
        <JuicyButton label={t("common.close")} tone="primary" onPress={() => router.back()} />
      </ScrollView>

      {/* Ebeveyn Kapısı yalnız hassas alan için — üst katman */}
      {showGate && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#0B3566", // opak → arka plan (ayarlar) görünmesin
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 28,
          }}
        >
          <ParentGate
            onSuccess={() => {
              setParentUnlocked(true);
              setShowGate(false);
            }}
          />
          {/* Kapat — proje buton tasarımı (JuicyButton) */}
          <View style={{ width: "100%", maxWidth: 360, alignSelf: "center" }}>
            <JuicyButton label={t("common.cancel")} tone="primary" onPress={() => setShowGate(false)} />
          </View>
        </View>
      )}

      {/* Ekip test kodu — "Tüm Bölümleri Aç" için */}
      {showUnlock && (
        <View
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#0B3566", paddingHorizontal: 24, alignItems: "center", justifyContent: "center" }}
        >
          <View style={{ width: "100%", maxWidth: 360, gap: 14 }}>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 22, color: "white", textAlign: "center" }}>
              {t("settings.unlockAllTitle")}
            </Text>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
              {t("settings.unlockAllBody")}
            </Text>
            <TextInput
              value={unlockCode}
              onChangeText={(v) => { setUnlockCode(v); setUnlockErr(false); }}
              placeholder={t("settings.unlockAllPlaceholder")}
              placeholderTextColor="#A9B4C2"
              autoCapitalize="characters"
              autoCorrect={false}
              style={{ height: 52, borderRadius: 16, borderWidth: 2, borderColor: unlockErr ? "#F0645A" : "#E2E8F0", backgroundColor: "#fff", paddingHorizontal: 14, fontFamily: "Fredoka_700Bold", fontSize: 18, color: "#34414F", textAlign: "center" }}
            />
            {unlockErr && (
              <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 14, color: "#FFC9C4", textAlign: "center" }}>
                {t("parentGate.wrong")}
              </Text>
            )}
            <JuicyButton
              label={t("settings.unlockAllConfirm")}
              tone="accent"
              onPress={() => {
                if (unlockCode.trim().toUpperCase() !== TEAM_UNLOCK_CODE) { setUnlockErr(true); return; }
                playSfx("ui_tap");
                useProgressStore.getState().unlockAllForTesting();
                setShowUnlock(false);
                router.replace("/home");
              }}
            />
            <JuicyButton label={t("common.cancel")} tone="primary" onPress={() => setShowUnlock(false)} />
          </View>
        </View>
      )}

      {/* Yeni Oyun onayı — opak, kazara silmeyi önler */}
      {showReset && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#0B3566",
            paddingHorizontal: 24,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ width: "100%", maxWidth: 360, gap: 14 }}>
            <Text style={{ fontFamily: "Fredoka_700Bold", fontSize: 24, color: "white", textAlign: "center" }}>
              {t("settings.resetTitle")}
            </Text>
            <Text style={{ fontFamily: "Nunito_700Bold", fontSize: 15, color: "rgba(255,255,255,0.85)", textAlign: "center" }}>
              {t("settings.resetBody")}
            </Text>
            <View style={{ height: 4 }} />
            <JuicyButton label={t("settings.resetConfirm")} tone="accent" onPress={doNewGame} />
            <JuicyButton label={t("common.cancel")} tone="primary" onPress={() => setShowReset(false)} />
          </View>
        </View>
      )}
    </GradientBg>
  );
}

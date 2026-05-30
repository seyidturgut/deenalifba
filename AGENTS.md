# Alif — Elif-Ba & Namaz EdTech App

4-10 yaş Müslüman çocuklar için İslami eğitim ve oyunlaştırma uygulaması.
Çocuk Arap harflerini (Elif-Ba) öğrenmekten Namaz'a uzanan bir yolculukta ilerler.

## Teknoloji
- **Expo SDK 56** + React Native + TypeScript. Versiyona özel dokümanlar: https://docs.expo.dev/versions/v56.0.0/
- **NativeWind v4** (Tailwind) — stiller `className` ile. Token'lar: `tailwind.config.js` + `src/theme/tokens.ts` (senkron tutulur).
- **expo-router** — dosya tabanlı navigasyon (`src/app/`).
- **Zustand** + `persist` (MMKV) — state. Store'lar: `src/stores/`.
- **MMKV v4** (Nitro tabanlı, `createMMKV()` — `new MMKV()` DEĞİL) hızlı KV; **expo-sqlite** ilişkisel/zaman temelli veri.
- **Skia + Rive + Lottie + Reanimated** — "Unity hissi" veren 2D oyun/animasyon katmanı (trace canvas, ödüller).
- **Offline-first**: tüm ses/vektör/font cihazda gömülü olmalı. Uzak senkron YOK.

## Mimari (src/)
- `data/` — domain tipleri + 28 harf seed (`letters.ts`, ilk 6 ücretsiz).
- `algorithms/sm2.ts` — Modifiye SM-2 aralıklı tekrar (saf, test edilebilir; kalite 0-3).
- `stores/` — settings (PII: childName burada, yalnız cihazda), progress, learning, mosque.
- `db/` — `storage.ts` (MMKV + zustand adaptörü), `database.ts` (SQLite şema).
- `lib/` — haptics, audio, `analyticsGuard.ts` (<13 izleme bypass), `freemium.ts`.
- `i18n/` — `tr.json` + `lexicon.ts` (terminoloji guard).
- `features/parent-gate/` — matematik tabanlı ebeveyn kapısı.
- `app/` — index (yönlendirme), onboarding, home, learn/[letterId] (4 adım), mosque, settings.

## ZORUNLU GUARDRAIL'ler (asla ihlal etme)
1. **Türkçe terminoloji** (`lang: tr`): **Namaz** (Salat değil), **Sure** (Surah değil),
   **Harf/Harfler** (Letter değil), **Abdest** (Wudu değil). Denetleyici: `src/i18n/lexicon.ts`
   — kullanıcıya gösterilen tüm tr metni `assertTurkishTerminology` ile test edilmeli.
2. **Çocuk güvenliği (KVKK/COPPA/GDPR-K)**: <13 oturumda davranışsal analitik YOK
   (`analyticsGuard.ts` üzerinden geçir, doğrudan SDK çağırma). Çocuğun adı (PII) yalnız
   cihazda (`settingsStore` + MMKV); uzak DB senkronu yasak.
3. **Ebeveyn Kapısı**: ayarlar/abonelik/ebeveyn görünümleri kapı arkasında.
4. **Freemium** (`freemium.ts`): ilk 6 harf serbest; sonrası abone değilse günde 1 kilit açma.
   Abonelik sonraki fazda RevenueCat ile.

## Komutlar
- `npm run ios` / `npm run android` / `npm run web`
- `npx tsc --noEmit` — tip kontrolü.

## Faz durumu
FAZ 0 (iskelet) tamam: yapı, store'lar, SM-2 çekirdeği, i18n+guard, navigasyon, placeholder ekranlar.
SONRAKİ: Skia trace canvas, gerçek puzzle/sounds mekanikleri, SQLite SRS persisti, Rive cami render, RevenueCat.
Asset'ler henüz YOK — placeholder (emoji/şekil) kullanılıyor; tasarım teslim edince değiştirilecek.

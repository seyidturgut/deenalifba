import { APP_VERSION } from "@/lib/version";
import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Ebeveyn geri bildirimi / e-posta opt-in'in UZAK gönderimi (Sohail beta isteği).
 * Hedef: Google Sheet'e bağlı Apps Script web uygulaması (kullanıcı dağıttı).
 *
 * GİZLİLİK (PROJECT PROFILE §4.B — KVKK/COPPA/GDPR-K) — KRİTİK:
 * Burada YALNIZCA ebeveynin KENDİ girdiği veri gönderilir. Gönderilenler:
 *   - emoji puanı (happy/neutral/sad)
 *   - ebeveynin yazdığı serbest metin
 *   - ebeveynin girdiği e-posta (yalnız opt-in ekranında)
 *   - uygulama sürümü + arayüz dili (hangi sürümden geldiğini anlamak için)
 * ASLA gönderilmez: çocuğun adı (childName), ilerleme/harf verisi, cihaz kimliği,
 * IP dışında herhangi bir tanımlayıcı, davranışsal analitik. Çocuk verisi cihazda kalır.
 *
 * Ağ hatası ana akışı ASLA bozmaz — çağıran taraf zaten yerel store'a yazar
 * (feedbackStore), bu gönderim "en iyi çaba" (best-effort) olarak sessizce başarısız olur.
 */
const ENDPOINT =
  "https://script.google.com/macros/s/AKfycbxSFhBwA31vIOom3rTr-BF8AXNnHTtXNEgeQnDxcig9gPQB4gNi0dZXp3Tc9Otkizj3/exec";

const TIMEOUT_MS = 8000;

type FeedbackPayload = {
  type: "feedback";
  rating: string;
  text: string;
  context: string;
};

type EmailPayload = {
  type: "email_optin";
  email: string;
};

/** Apps Script'e "en iyi çaba" POST — hata durumunda sessizce yutulur. */
async function post(body: FeedbackPayload | EmailPayload): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    await fetch(ENDPOINT, {
      method: "POST",
      // Apps Script'in CORS preflight'ı reddetmemesi için text/plain (basit istek);
      // gövde yine JSON, doPost içinde JSON.parse ediliyor.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        ...body,
        appVersion: APP_VERSION,
        lang: useSettingsStore.getState().language,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    // ağ yok / endpoint kapalı / zaman aşımı → sessizce geç, ana akış etkilenmez
    return false;
  }
}

/** Ebeveyn geri bildirimini (emoji + opsiyonel metin) uzak tabloya gönderir. */
export function sendFeedbackRemote(rating: string, text: string, context: string): void {
  void post({ type: "feedback", rating, text, context });
}

/** Ebeveynin "yeni bölüm çıkınca haber ver" e-postasını uzak tabloya gönderir. */
export function sendEmailOptinRemote(email: string): void {
  void post({ type: "email_optin", email });
}

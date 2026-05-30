/**
 * Davranışsal Analitik Guard (PROJECT PROFILE §4.B — KVKK / COPPA / GDPR-K).
 *
 * 13 yaş altı oturumlarda davranışsal analitik tamamen BYPASS edilir.
 * Tüm analitik çağrıları bu kapıdan geçmek ZORUNDADIR — doğrudan SDK çağrısı yapılmaz.
 *
 * Varsayılan güvenli (fail-safe): yaş bilinmiyorsa "çocuk" varsayılır ve
 * izleme yapılmaz.
 */

let isUnder13 = true; // fail-safe: aksi kanıtlanana kadar çocuk varsay

/** Ebeveyn doğrulaması / yaş girişi sonrası ayarlanır. */
export function setIsUnder13(value: boolean): void {
  isUnder13 = value;
}

export function getIsUnder13(): boolean {
  return isUnder13;
}

/**
 * Davranışsal olay gönderimi. 13 yaş altıysa SESSİZCE no-op.
 * Gerçek analitik SDK'sı (varsa) yalnız burada, 13+ için çağrılmalı.
 */
export function trackEvent(
  _name: string,
  _props?: Record<string, unknown>
): void {
  if (isUnder13) {
    // KVKK/COPPA: çocuk oturumunda davranışsal izleme yok.
    return;
  }
  // TODO(13+): onaylı analitik sağlayıcı entegrasyonu (PII'siz).
}

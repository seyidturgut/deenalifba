import { createAudioPlayer, type AudioSource } from "expo-audio";

/**
 * Ses oynatma sarmalayıcısı (offline-first: tüm ses dosyaları cihazda gömülü).
 *
 * Harf sesleri `Letter.audioKey` ile eşlenecek. Asset'ler henüz yok;
 * `audioSources` map'i ses ekibi teslim edince doldurulacak:
 *   const audioSources = { letter_01_elif: require('@/assets/audio/elif.mp3'), ... }
 */

const audioSources: Record<string, AudioSource> = {
  // TODO(assets): harf ses dosyaları gelince doldur.
};

/**
 * Verilen anahtarın sesini çalar. Asset yoksa sessizce no-op (geliştirme/placeholder).
 */
export function playAudio(audioKey: string): void {
  const source = audioSources[audioKey];
  if (!source) {
    if (__DEV__) console.warn(`[audio] eksik asset: ${audioKey}`);
    return;
  }
  const player = createAudioPlayer(source);
  player.play();
}

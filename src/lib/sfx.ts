import { createAudioPlayer, type AudioPlayer } from "expo-audio";

import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Ses efektleri + arka plan müziği. Offline: tüm sesler cihazda gömülü.
 * Ayarlardaki `soundEnabled` kapalıysa sessizce no-op.
 */

const SOURCES = {
  ui_tap: require("@/assets/audio/ui_tap.mp3"),
  ui_back: require("@/assets/audio/ui_back.mp3"),
  locked_tap: require("@/assets/audio/locked_tap.mp3"),
  trace_start: require("@/assets/audio/trace_start.mp3"),
  trace_success: require("@/assets/audio/trace_success.mp3"),
  correct_ding: require("@/assets/audio/correct_ding.mp3"),
  gentle_try_again: require("@/assets/audio/gentle_try_again.mp3"),
  star_earned: require("@/assets/audio/star_earned.mp3"),
  step_complete: require("@/assets/audio/step_complete.mp3"),
  letter_complete: require("@/assets/audio/letter_complete.mp3"),
  confetti_pop: require("@/assets/audio/confetti_pop.mp3"),
  mosque_build: require("@/assets/audio/mosque_build.mp3"),
  level_unlock: require("@/assets/audio/level_unlock.mp3"),
  daily_reward: require("@/assets/audio/daily_reward.mp3"),
  mascot_giggle: require("@/assets/audio/mascot_giggle.mp3"),
  mascot_jump: require("@/assets/audio/mascot_jump.mp3"),
  whoosh: require("@/assets/audio/whoosh.mp3"),
  welcome: require("@/assets/audio/welcome.mp3"),
  parent_gate_open: require("@/assets/audio/parent_gate_open.mp3"),
} as const;

export type SfxKey = keyof typeof SOURCES;

const players: Partial<Record<SfxKey, AudioPlayer>> = {};

function soundOn() {
  return useSettingsStore.getState().soundEnabled;
}

function musicOn() {
  return useSettingsStore.getState().musicEnabled;
}

/** Kısa ses efekti çal (gerekirse player'ı tembel oluştur, baştan oynat). */
export function playSfx(key: SfxKey, volume = 1) {
  if (!soundOn()) return;
  try {
    let p = players[key];
    if (!p) {
      p = createAudioPlayer(SOURCES[key]);
      players[key] = p;
    }
    p.volume = volume;
    p.seekTo(0);
    p.play();
  } catch {
    // ses kullanılamıyorsa sessizce geç
  }
}

/** Geriye dönük uyumluluk (Celebration). */
export function playSuccess() {
  playSfx("letter_complete");
}

// ---- Harf telaffuzları (Sesler oyunu) ----
// Metro statik require ister; harf id → ses dosyası (btn_N.mp3).
const LETTER_SOURCES: Record<number, number> = {
  1: require("@/assets/audio/alifba/btn_1.mp3"),
  2: require("@/assets/audio/alifba/btn_2.mp3"),
  3: require("@/assets/audio/alifba/btn_3.mp3"),
  4: require("@/assets/audio/alifba/btn_4.mp3"),
  5: require("@/assets/audio/alifba/btn_5.mp3"),
  6: require("@/assets/audio/alifba/btn_6.mp3"),
  7: require("@/assets/audio/alifba/btn_7.mp3"),
  8: require("@/assets/audio/alifba/btn_8.mp3"),
  9: require("@/assets/audio/alifba/btn_9.mp3"),
  10: require("@/assets/audio/alifba/btn_10.mp3"),
  11: require("@/assets/audio/alifba/btn_11.mp3"),
  12: require("@/assets/audio/alifba/btn_12.mp3"),
  13: require("@/assets/audio/alifba/btn_13.mp3"),
  14: require("@/assets/audio/alifba/btn_14.mp3"),
  15: require("@/assets/audio/alifba/btn_15.mp3"),
  16: require("@/assets/audio/alifba/btn_16.mp3"),
  17: require("@/assets/audio/alifba/btn_17.mp3"),
  18: require("@/assets/audio/alifba/btn_18.mp3"),
  19: require("@/assets/audio/alifba/btn_19.mp3"),
  20: require("@/assets/audio/alifba/btn_20.mp3"),
  21: require("@/assets/audio/alifba/btn_21.mp3"),
  22: require("@/assets/audio/alifba/btn_22.mp3"),
  23: require("@/assets/audio/alifba/btn_23.mp3"),
  24: require("@/assets/audio/alifba/btn_24.mp3"),
  25: require("@/assets/audio/alifba/btn_25.mp3"),
  26: require("@/assets/audio/alifba/btn_26.mp3"),
  27: require("@/assets/audio/alifba/btn_27.mp3"),
};

const letterPlayers: Record<number, AudioPlayer> = {};

/** Belirli bir harfin sesi var mı? */
export function hasLetterSound(id: number): boolean {
  return !!LETTER_SOURCES[id];
}

/** Harf telaffuzunu çal (Sesler oyunu). soundEnabled kapalıysa no-op. */
export function playLetter(id: number, volume = 1) {
  if (!soundOn()) return;
  const src = LETTER_SOURCES[id];
  if (!src) return;
  try {
    let p = letterPlayers[id];
    if (!p) {
      p = createAudioPlayer(src);
      letterPlayers[id] = p;
    }
    p.volume = volume;
    p.seekTo(0);
    p.play();
  } catch {
    // ses kullanılamıyorsa sessizce geç
  }
}

// ---- Arka plan müziği (dikişsiz loop, kısık) ----
let music: AudioPlayer | null = null;

export function startMusic() {
  if (!musicOn()) return;
  try {
    if (!music) {
      music = createAudioPlayer(require("@/assets/audio/bg_music_loop.mp3"));
      music.loop = true;
      music.volume = 0.3;
    }
    music.play();
  } catch {
    // yoksay
  }
}

export function stopMusic() {
  try {
    music?.pause();
  } catch {
    // yoksay
  }
}

/** Ayar değişince müziği aç/kapat. */
export function syncMusicWithSetting() {
  if (musicOn()) startMusic();
  else stopMusic();
}

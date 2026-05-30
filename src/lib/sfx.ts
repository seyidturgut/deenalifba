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

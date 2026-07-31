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
  // Doğru cevap "combo" seti — art arda doğruda perde yükselir (bkz. playCorrect)
  combo_1: require("@/assets/audio/combo_1.mp3"),
  combo_2: require("@/assets/audio/combo_2.mp3"),
  combo_3: require("@/assets/audio/combo_3.mp3"),
  combo_4: require("@/assets/audio/combo_4.mp3"),
  gentle_try_again: require("@/assets/audio/gentle_try_again.mp3"),
  star_earned: require("@/assets/audio/star_earned.mp3"),
  step_complete: require("@/assets/audio/step_complete.mp3"),
  letter_complete: require("@/assets/audio/letter_complete.mp3"),
  confetti_pop: require("@/assets/audio/confetti_pop.mp3"),
  balloon_pop: require("@/assets/audio/balloon_pop.mp3"),
  mosque_build: require("@/assets/audio/mosque_build.mp3"),
  level_unlock: require("@/assets/audio/level_unlock.mp3"),
  daily_reward: require("@/assets/audio/daily_reward.mp3"),
  mascot_giggle: require("@/assets/audio/mascot_giggle.mp3"),
  mashallah: require("@/assets/audio/mashallah.mp3"),
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
/** Harf seslerinin süresi — konuşma kuyruğunda yer ayırmak için (ms). */
const LETTER_MS: Record<number, number> = {"1":830,"2":748,"3":660,"4":728,"5":792,"6":694,"7":858,"8":855,"9":863,"10":626,"11":788,"12":867,"13":947,"14":900,"15":902,"16":578,"17":692,"18":794,"19":867,"20":688,"21":790,"22":774,"23":884,"24":848,"25":901,"26":744,"27":662,"28":676};

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
  28: require("@/assets/audio/alifba/btn_28.mp3"),
};

const letterPlayers: Record<number, AudioPlayer> = {};

/** Bir harf sesinin süresi (ms) — akışı ona göre bekletmek için. */
export function letterDurationMs(id: number) {
  return LETTER_MS[id] ?? 900;
}

/** Belirli bir harfin sesi var mı? */
export function hasLetterSound(id: number): boolean {
  return !!LETTER_SOURCES[id];
}

/** Harf telaffuzunu çal (Sesler oyunu). soundEnabled kapalıysa no-op. */
export function playLetter(id: number, volume = 1) {
  if (!soundOn()) return;
  const src = LETTER_SOURCES[id];
  if (!src) return;
  // Pırıl talimatı söylerken harfin sesi araya girmesin — oyunlar açılır açılmaz
  // harfi çalıyor, talimat da o an başlıyordu. Beklemeyi burada tek noktada çözüyoruz.
  const wait = speechRemainingMs();
  if (wait > 0) {
    const gen = speechGen;
    setTimeout(() => {
      if (gen === speechGen) playLetter(id, volume);
    }, wait + 180);
    return;
  }
  try {
    let p = letterPlayers[id];
    if (!p) {
      p = createAudioPlayer(src);
      letterPlayers[id] = p;
    }
    p.volume = volume;
    p.seekTo(0);
    p.play();
    // Harf de konuşma kanalını meşgul eder — yoksa talimat/anlatım üstüne biner.
    reserveSpeech(LETTER_MS[id] ?? 900);
  } catch {
    // ses kullanılamıyorsa sessizce geç
  }
}

// ---- Seviye 28 BÜYÜK FİNAL — Pırıl diyaloğu (dile göre, 3 cümle) ----
// ElevenLabs ile üretildi → sessizlikten 3 parçaya bölündü (bkz. proje notları).
const FINALE_SOURCES: Record<"en" | "tr", [number, number, number]> = {
  en: [
    require("@/assets/audio/finale_en_1.mp3"),
    require("@/assets/audio/finale_en_2.mp3"),
    require("@/assets/audio/finale_en_3.mp3"),
  ],
  tr: [
    require("@/assets/audio/finale_tr_1.mp3"),
    require("@/assets/audio/finale_tr_2.mp3"),
    require("@/assets/audio/finale_tr_3.mp3"),
  ],
};

/** Ölçülen klip süreleri (ms) — MosqueFinale'nin oto-ilerleme zamanlamasını buna göre ayarlaması için. */
export const FINALE_LINE_DURATIONS_MS: Record<"en" | "tr", [number, number, number]> = {
  en: [7066, 3104, 2261],
  tr: [5839, 3239, 2319],
};

const finalePlayers: Partial<Record<string, AudioPlayer>> = {};

/** Final diyaloğunun `line` (0,1,2) cümlesini `lang` dilinde çalar. */
export function playFinaleLine(lang: "en" | "tr", line: 0 | 1 | 2, volume = 1) {
  if (!soundOn()) return;
  try {
    const key = `${lang}_${line}`;
    let p = finalePlayers[key];
    if (!p) {
      p = createAudioPlayer(FINALE_SOURCES[lang][line]);
      finalePlayers[key] = p;
    }
    p.volume = volume;
    p.seekTo(0);
    p.play();
  } catch {
    // ses kullanılamıyorsa sessizce geç
  }
}

/** Devam eden final cümlelerini durdurur (faz değişince önceki cümle üst üste binmesin). */
export function stopFinaleLines() {
  Object.values(finalePlayers).forEach((p) => {
    try {
      p?.pause();
    } catch {
      // yoksay
    }
  });
}

// ---- Pırıl anlatımı — onboarding (cami konsepti) + cami inşa anı (Abdulkadir/Sohail
// playtest: "parents have to explain, spoken guidance rather than text"). ElevenLabs
// ile üretildi → sessizlikten 3'e bölündü (finale ile aynı yöntem).
const NARRATION_SOURCES: Record<"en" | "tr", Record<"onboarding1" | "onboarding2" | "mosqueBuilt" | "gardenGrown" | "newGame" | "level1Intro" | "mosqueHowto" | "gardenHowto" | "speak1" | "speak2" | "chForms1" | "chForms2" | "chForms3" | "posInitial" | "posMedial" | "posFinal" | "stepListen" | "stepRecord" | "stepPlayback", number>> = {
  en: {
    onboarding1: require("@/assets/audio/voice_onboarding1_en.mp3"),
    onboarding2: require("@/assets/audio/voice_onboarding2_en.mp3"),
    mosqueBuilt: require("@/assets/audio/voice_mosque_built_en.mp3"),
    gardenGrown: require("@/assets/audio/voice_garden_grown_en.mp3"),
    newGame: require("@/assets/audio/voice_new_game_en.mp3"),
    level1Intro: require("@/assets/audio/voice_level1_intro_en.mp3"),
    mosqueHowto: require("@/assets/audio/voice_mosque_howto_en.mp3"),
    gardenHowto: require("@/assets/audio/voice_garden_howto_en.mp3"),
    speak1: require("@/assets/audio/voice_speak1_en.mp3"),
    speak2: require("@/assets/audio/voice_speak2_en.mp3"),
    chForms1: require("@/assets/audio/voice_ch_forms1_en.mp3"),
    chForms2: require("@/assets/audio/voice_ch_forms2_en.mp3"),
    chForms3: require("@/assets/audio/voice_ch_forms3_en.mp3"),
    posInitial: require("@/assets/audio/voice_pos_initial_en.mp3"),
    posMedial: require("@/assets/audio/voice_pos_medial_en.mp3"),
    posFinal: require("@/assets/audio/voice_pos_final_en.mp3"),
    stepListen: require("@/assets/audio/voice_step_listen_en.mp3"),
    stepRecord: require("@/assets/audio/voice_step_record_en.mp3"),
    stepPlayback: require("@/assets/audio/voice_step_playback_en.mp3"),
  },
  tr: {
    onboarding1: require("@/assets/audio/voice_onboarding1_tr.mp3"),
    onboarding2: require("@/assets/audio/voice_onboarding2_tr.mp3"),
    mosqueBuilt: require("@/assets/audio/voice_mosque_built_tr.mp3"),
    gardenGrown: require("@/assets/audio/voice_garden_grown_tr.mp3"),
    newGame: require("@/assets/audio/voice_new_game_tr.mp3"),
    level1Intro: require("@/assets/audio/voice_level1_intro_tr.mp3"),
    mosqueHowto: require("@/assets/audio/voice_mosque_howto_tr.mp3"),
    gardenHowto: require("@/assets/audio/voice_garden_howto_tr.mp3"),
    speak1: require("@/assets/audio/voice_speak1_tr.mp3"),
    speak2: require("@/assets/audio/voice_speak2_tr.mp3"),
    chForms1: require("@/assets/audio/voice_ch_forms1_tr.mp3"),
    chForms2: require("@/assets/audio/voice_ch_forms2_tr.mp3"),
    chForms3: require("@/assets/audio/voice_ch_forms3_tr.mp3"),
    posInitial: require("@/assets/audio/voice_pos_initial_tr.mp3"),
    posMedial: require("@/assets/audio/voice_pos_medial_tr.mp3"),
    posFinal: require("@/assets/audio/voice_pos_final_tr.mp3"),
    stepListen: require("@/assets/audio/voice_step_listen_tr.mp3"),
    stepRecord: require("@/assets/audio/voice_step_record_tr.mp3"),
    stepPlayback: require("@/assets/audio/voice_step_playback_tr.mp3"),
  },
};

/** Ölçülen anlatım klip süreleri (ms) — oto-ilerleyen ekranların zamanlaması için. */
export const NARRATION_DURATIONS_MS: Record<"en" | "tr", Record<string, number>> = {
  en: {"chForms1":2720,"chForms2":6230,"chForms3":4320,"gardenGrown":3562,"gardenHowto":7525,"speak1":6420,"speak2":2737,"level1Intro":8816,"mosqueBuilt":3071,"mosqueHowto":7291,"newGame":3108,"onboarding1":3620,"onboarding2":3000,"posFinal":1362,"posInitial":1250,"posMedial":1150,"stepListen":680,"stepPlayback":1269,"stepRecord":820},
  tr: {"chForms1":2400,"chForms2":6741,"chForms3":4496,"gardenGrown":2529,"gardenHowto":6400,"speak1":3774,"speak2":2839,"level1Intro":8187,"mosqueBuilt":2537,"mosqueHowto":7455,"newGame":3438,"onboarding1":3050,"onboarding2":3190,"posFinal":1495,"posInitial":1240,"posMedial":1340,"stepListen":750,"stepPlayback":1206,"stepRecord":970},
};

const narrationPlayers: Partial<Record<string, AudioPlayer>> = {};

/** Pırıl'ın anlatım repliğini (`key`) `lang` dilinde çalar. */
export type NarrationKey =
  | "onboarding1"
  | "onboarding2"
  | "mosqueBuilt"
  | "gardenGrown"
  | "newGame"
  | "level1Intro"
  | "mosqueHowto"
  | "gardenHowto"
  | "chForms1"
  | "chForms2"
  | "chForms3"
  | "posInitial"
  | "posMedial"
  | "posFinal"
  | "stepListen"
  | "stepRecord"
  | "stepPlayback"
  | "speak1"
  | "speak2";

function playNarrationRaw(lang: "en" | "tr", key: NarrationKey, volume = 1) {
  if (!soundOn()) return;
  try {
    const cacheKey = `${lang}_${key}`;
    let p = narrationPlayers[cacheKey];
    if (!p) {
      p = createAudioPlayer(NARRATION_SOURCES[lang][key]);
      narrationPlayers[cacheKey] = p;
    }
    p.volume = volume;
    p.seekTo(0);
    p.play();
    reserveSpeech(NARRATION_DURATIONS_MS[lang][key] ?? 0);
  } catch {
    // ses kullanılamıyorsa sessizce geç
  }
}

/**
 * Pırıl'ın anlatım repliğini çalar. Başka bir replik konuşuyorsa SIRAYA GİRER —
 * "Konuş" adımında talimat, adım anlatımı ve harf sesi üst üste biniyordu.
 */
export function playNarration(lang: "en" | "tr", key: NarrationKey, volume = 1) {
  if (!soundOn()) return;
  const wait = speechRemainingMs();
  if (wait > 0) {
    const gen = speechGen;
    setTimeout(() => {
      if (gen === speechGen) playNarration(lang, key, volume);
    }, wait);
    return;
  }
  playNarrationRaw(lang, key, volume);
}

// ---- Arka plan müziği (dikişsiz loop, kısık) ----
let music: AudioPlayer | null = null;
const MUSIC_VOLUME = 0.3;
/** Konuşma/kayıt ekranında müzik tamamen DURUR — kısmak yetmiyor, çocuğun kendi
    kaydı net duyulmalı (Abdulkadir playtest + kullanıcı kararı). */
let suspended = false;

export function startMusic() {
  if (!musicOn() || suspended) return;
  try {
    if (!music) {
      music = createAudioPlayer(require("@/assets/audio/bg_music_loop.mp3"));
      music.loop = true;
    }
    music.volume = MUSIC_VOLUME;
    music.play();
  } catch {
    // yoksay
  }
}

/**
 * Konuşma/kayıt aktivitesi süresince müziği DURDUR, çıkınca geri başlat.
 * `suspended` bayrağı sayesinde bu sırada gelen startMusic() çağrıları da müziği açmaz.
 */
export function suspendMusic(on: boolean) {
  suspended = on;
  try {
    if (on) music?.pause();
    else if (musicOn()) startMusic();
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

/**
 * Doğru cevap sesi — ARDIŞIK doğrularda perde yükselir (combo).
 *
 * Can (AdMob/Voodoo, Sohail üzerinden): "Doğru cevaplar renk, animasyon ve sesle
 * anında tatmin edici bir geri bildirim vermeli." Her seferinde aynı 'ding' çalmak
 * seriyi duyulmaz kılıyordu; yükselen perde çocuğa 'üst üste doğru yapıyorum'
 * hissini veriyor — Royal Match'in bağımlılık yapan kısmı büyük ölçüde bu.
 */
const COMBO_MAX = 4;
let comboStep = 0;

export function playCorrect(volume = 1) {
  comboStep = Math.min(comboStep + 1, COMBO_MAX);
  playSfx(`combo_${comboStep}` as SfxKey, volume);
}

/** Yanlış cevapta / yeni etkinliğe geçişte seriyi sıfırla. */
export function resetCombo() {
  comboStep = 0;
}

/** Şu anki seri uzunluğu (görsel efektin şiddetini ayarlamak için). */
export function comboLevel(): number {
  return comboStep;
}

/**
 * Etkinlik TALIMATLARI — Pırıl her oyunun ne yapılacağını sesli söyler.
 *
 * Abdulkadir (madde 2): "Bütün talimatlar sesli olmalı. Özellikle talimatı
 * okuyamayan küçük çocuklar için ne yapması gerektiğini açıkça söylemeliyiz."
 */
export type HintKey =
  | "intro"
  | "trace"
  | "hearTap"
  | "match"
  | "drag"
  | "balloon"
  | "catch"
  | "word"
  | "dots"
  | "confuseSound"
  | "recall"
  | "speak"
  | "formFind"
  | "formWhich";

const HINT_SOURCES: Record<"en" | "tr", Record<HintKey, number>> = {
  en: {

    intro: require("@/assets/audio/hint_intro_en.mp3"),
    trace: require("@/assets/audio/hint_trace_en.mp3"),
    hearTap: require("@/assets/audio/hint_hearTap_en.mp3"),
    match: require("@/assets/audio/hint_match_en.mp3"),
    drag: require("@/assets/audio/hint_drag_en.mp3"),
    balloon: require("@/assets/audio/hint_balloon_en.mp3"),
    catch: require("@/assets/audio/hint_catch_en.mp3"),
    word: require("@/assets/audio/hint_word_en.mp3"),
    dots: require("@/assets/audio/hint_dots_en.mp3"),
    confuseSound: require("@/assets/audio/hint_confuseSound_en.mp3"),
    recall: require("@/assets/audio/hint_recall_en.mp3"),
    speak: require("@/assets/audio/hint_speak_en.mp3"),
    formFind: require("@/assets/audio/hint_formFind_en.mp3"),
    formWhich: require("@/assets/audio/hint_formWhich_en.mp3"),
  },
  tr: {

    intro: require("@/assets/audio/hint_intro_tr.mp3"),
    trace: require("@/assets/audio/hint_trace_tr.mp3"),
    hearTap: require("@/assets/audio/hint_hearTap_tr.mp3"),
    match: require("@/assets/audio/hint_match_tr.mp3"),
    drag: require("@/assets/audio/hint_drag_tr.mp3"),
    balloon: require("@/assets/audio/hint_balloon_tr.mp3"),
    catch: require("@/assets/audio/hint_catch_tr.mp3"),
    word: require("@/assets/audio/hint_word_tr.mp3"),
    dots: require("@/assets/audio/hint_dots_tr.mp3"),
    confuseSound: require("@/assets/audio/hint_confuseSound_tr.mp3"),
    recall: require("@/assets/audio/hint_recall_tr.mp3"),
    speak: require("@/assets/audio/hint_speak_tr.mp3"),
    formFind: require("@/assets/audio/hint_formFind_tr.mp3"),
    formWhich: require("@/assets/audio/hint_formWhich_tr.mp3"),
  },
};

/** Talimat süreleri — harfin sesi talimat biterken çalsın diye (çakışma önleme). */
const HINT_MS: Record<"en" | "tr", Record<HintKey, number>> = {
  en: {"intro": 1638, "trace": 3813, "hearTap": 2261, "match": 2906, "drag": 2351, "balloon": 2533, "catch": 3910, "word": 2291, "dots": 7675, "confuseSound": 5404, "recall": 2179, "speak": 5549, "formFind": 4903, "formWhich": 4721},
  tr: {"intro": 1639, "trace": 2909, "hearTap": 2104, "match": 2290, "drag": 2772, "balloon": 2890, "catch": 3613, "word": 2148, "dots": 4098, "confuseSound": 5214, "recall": 2431, "speak": 5323, "formFind": 3664, "formWhich": 3905},
};

const hintPlayers: Partial<Record<string, AudioPlayer>> = {};

/**
 * TEK KONUŞMA KANALI.
 *
 * Pırıl üç ayrı yerden konuşabiliyordu — etkinlik talimatı (playHint), adım
 * anlatımı (playNarration) ve harfin kendi sesi (playLetter) — ve hiçbiri
 * diğerinden haberdar değildi; "Konuş" adımında üçü aynı anda başlayıp
 * üst üste biniyordu. Artık hepsi bu tek kanaldan geçiyor: konuşan varsa
 * sonraki, o bitene kadar bekliyor.
 */
let speechBusyUntil = 0;
const SPEECH_GAP = 220; // replikler arası kısa nefes payı
/**
 * Kuyruk NESLİ. Ekran/adım değişince artar; o ana kadar sıraya girmiş ama henüz
 * çalmamış replikler iptal olur. Yoksa bir adımın talimatı, çocuk sonraki adıma
 * geçtikten sonra orada çalıyordu.
 */
let speechGen = 0;

/** Konuşan her şeyi kes ve bekleyen replikleri iptal et (ekran/adım değişimi). */
export function stopSpeech() {
  speechGen++;
  speechBusyUntil = 0;
  const stop = (p?: AudioPlayer) => {
    try {
      p?.pause();
      p?.seekTo(0);
    } catch {
      // oynatıcı yoksa/hazır değilse sessizce geç
    }
  };
  Object.values(hintPlayers).forEach(stop);
  Object.values(narrationPlayers).forEach(stop);
  Object.values(letterPlayers).forEach(stop);
}

/** Konuşmanın bitmesine kalan süre (ms). */
export function speechRemainingMs() {
  return Math.max(0, speechBusyUntil - Date.now());
}
function reserveSpeech(ms: number) {
  speechBusyUntil = Date.now() + ms + SPEECH_GAP;
}

export function playHint(lang: "en" | "tr", key: HintKey, volume = 1) {
  if (!soundOn()) return;
  const wait = speechRemainingMs();
  if (wait > 0) {
    const gen = speechGen;
    setTimeout(() => {
      if (gen === speechGen) playHint(lang, key, volume);
    }, wait);
    return;
  }
  try {
    const id = lang + ":" + key;
    let p = hintPlayers[id];
    if (!p) {
      p = createAudioPlayer(HINT_SOURCES[lang][key]);
      hintPlayers[id] = p;
    }
    p.volume = volume;
    p.seekTo(0);
    p.play();
    reserveSpeech(HINT_MS[lang][key]);
  } catch {
    // ses kullanılamıyorsa sessizce geç
  }
}

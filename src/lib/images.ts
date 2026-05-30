/**
 * Profesyonel illüstrasyon seti (AAA) — assets/illustrations/.
 * AI ile üretildi, tutarlı soft-2.5D stil. Final üründe tasarım ekibi güncelleyebilir.
 */
export const images = {
  // Maskot "Pırıl" — ifade seti (animasyon/anlatım için)
  mascot: require("@/assets/illustrations/mascot/piril_idle.png"),
  mascotHappy: require("@/assets/illustrations/mascot/piril_happy.png"),
  mascotCelebrate: require("@/assets/illustrations/mascot/piril_celebrate.png"),
  mascotWave: require("@/assets/illustrations/mascot/piril_wave.png"),
  mascotPoint: require("@/assets/illustrations/mascot/piril_point.png"),

  // Cami — inşa aşamaları (ilerlemeye göre frame-swap)
  mosque: require("@/assets/illustrations/mosque/mosque_stage_7.png"),
  mosqueStages: [
    require("@/assets/illustrations/mosque/mosque_stage_1.png"),
    require("@/assets/illustrations/mosque/mosque_stage_2.png"),
    require("@/assets/illustrations/mosque/mosque_stage_3.png"),
    require("@/assets/illustrations/mosque/mosque_stage_4.png"),
    require("@/assets/illustrations/mosque/mosque_stage_5.png"),
    require("@/assets/illustrations/mosque/mosque_stage_6.png"),
    require("@/assets/illustrations/mosque/mosque_stage_7.png"),
  ],

  // Ödüller
  star: require("@/assets/illustrations/rewards/star.png"),
  trophy: require("@/assets/illustrations/rewards/trophy.png"),
  gift: require("@/assets/illustrations/rewards/gift.png"),

  // İkonlar
  icMosque: require("@/assets/illustrations/icons/ic_mosque.png"),
  icSettings: require("@/assets/illustrations/icons/ic_settings.png"),
  icLock: require("@/assets/illustrations/icons/ic_lock.png"),
  icHome: require("@/assets/illustrations/icons/ic_home.png"),
  icLessons: require("@/assets/illustrations/icons/ic_lessons.png"),

  // Oynanış UI
  playPanel: require("@/assets/illustrations/ui/play_panel.png"),
  titleBanner: require("@/assets/illustrations/ui/title_banner.png"),
  progressTrack: require("@/assets/illustrations/ui/progress_track.png"),
  progressFill: require("@/assets/illustrations/ui/progress_fill.png"),

  // Adım ikonları (Çiz/Yapboz/Sesler/Tekrar)
  stepTrace: require("@/assets/illustrations/icons/ic_step_trace.png"),
  stepPuzzle: require("@/assets/illustrations/icons/ic_step_puzzle.png"),
  stepSounds: require("@/assets/illustrations/icons/ic_step_sounds.png"),
  stepRecall: require("@/assets/illustrations/icons/ic_step_recall.png"),

  // Yolculuk haritası düğümleri
  nodeTile: require("@/assets/illustrations/journey/node_tile.png"),
  nodeCloud: require("@/assets/illustrations/journey/node_cloud.png"),
  nodeGlow: require("@/assets/illustrations/journey/node_glow.png"),

  // Yardımcı işaretçi (çizimde "şuradan başla")
  handPointer: require("@/assets/illustrations/decor/hand_pointer.png"),

  // Arka plan
  bgSky: require("@/assets/illustrations/bg/bg_sky.png"),
} as const;

/** Öğrenme adımı → ikon eşlemesi */
export const STEP_ICON = {
  trace: images.stepTrace,
  puzzle: images.stepPuzzle,
  sounds: images.stepSounds,
  recall: images.stepRecall,
} as const;

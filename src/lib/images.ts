/**
 * Profesyonel illüstrasyon seti (AAA) — assets/illustrations/.
 * AI ile üretildi, tutarlı soft-2.5D stil. Final üründe tasarım ekibi güncelleyebilir.
 */
export const images = {
  // Maskot "Pırıl" — ifade seti (animasyon/anlatım için)
  mascot: require("@/assets/illustrations/mascot/piril_idle.webp"),
  mascotHappy: require("@/assets/illustrations/mascot/piril_happy.webp"),
  mascotCelebrate: require("@/assets/illustrations/mascot/piril_celebrate.webp"),
  mascotWave: require("@/assets/illustrations/mascot/piril_wave.webp"),
  mascotPoint: require("@/assets/illustrations/mascot/piril_point.webp"),

  // Cami — 12 kümülatif inşa aşaması (her seviyede bir parça)
  mosque: require("@/assets/illustrations/mosque/mosque_stage_12.webp"),
  mosqueStages: [
    require("@/assets/illustrations/mosque/mosque_stage_1.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_2.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_3.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_4.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_5.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_6.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_7.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_8.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_9.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_10.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_11.webp"),
    require("@/assets/illustrations/mosque/mosque_stage_12.webp"),
  ],

  // Ödüller
  star: require("@/assets/illustrations/rewards/star.webp"),
  trophy: require("@/assets/illustrations/rewards/trophy.webp"),
  gift: require("@/assets/illustrations/rewards/gift.webp"),

  // İkonlar
  icMosque: require("@/assets/illustrations/icons/ic_mosque.webp"),
  icSettings: require("@/assets/illustrations/icons/ic_settings.webp"),
  icLock: require("@/assets/illustrations/icons/ic_lock.webp"),
  icHome: require("@/assets/illustrations/icons/ic_home.webp"),
  icLessons: require("@/assets/illustrations/icons/ic_lessons.webp"),

  // Oynanış UI
  playPanel: require("@/assets/illustrations/ui/play_panel.webp"),
  titleBanner: require("@/assets/illustrations/ui/title_banner.webp"),
  progressTrack: require("@/assets/illustrations/ui/progress_track.webp"),
  progressFill: require("@/assets/illustrations/ui/progress_fill.webp"),

  // Adım ikonları (Çiz/Yapboz/Sesler/Tekrar)
  stepTrace: require("@/assets/illustrations/icons/ic_step_trace.webp"),
  stepPuzzle: require("@/assets/illustrations/icons/ic_step_puzzle.webp"),
  stepSounds: require("@/assets/illustrations/icons/ic_step_sounds.webp"),
  stepRecall: require("@/assets/illustrations/icons/ic_step_recall.webp"),

  // Yolculuk haritası düğümleri
  nodeTile: require("@/assets/illustrations/journey/node_tile.webp"),
  nodeCloud: require("@/assets/illustrations/journey/node_cloud.webp"),
  nodeGlow: require("@/assets/illustrations/journey/node_glow.webp"),

  // Yardımcı işaretçi (çizimde "şuradan başla")
  handPointer: require("@/assets/illustrations/decor/hand_pointer.webp"),

  // Arka plan
  bgSky: require("@/assets/illustrations/bg/bg_sky.webp"),
} as const;

/** Öğrenme adımı → ikon eşlemesi */
export const STEP_ICON = {
  trace: images.stepTrace,
  puzzle: images.stepPuzzle,
  sounds: images.stepSounds,
  recall: images.stepRecall,
} as const;

/**
 * Tasarım token'ları — TS tarafında (Skia, Reanimated, inline stiller) kullanmak için.
 * Tailwind/NativeWind ile senkron tutulur (bkz. tailwind.config.js).
 * Tasarım ekibinin style tile'ları gelince burası güncellenecek.
 */

export const colors = {
  primary: "#208AEF",
  primarySoft: "#E6F4FE",
  accent: "#F5A524",
  accentSoft: "#FFF3DC",
  success: "#3FB984",
  surface: "#FFFFFF",
  canvas: "#FAF7F0",
  ink: "#2A2A33",
  muted: "#8A8A99",
  // Çizim (trace) için stroke renkleri
  traceGuide: "#D9D9E3",
  traceInk: "#208AEF",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
  full: 999,
} as const;

/** Çocuk dostu: minimum dokunma hedefi WCAG/Apple öneri üstü tutulur. */
export const touchTarget = {
  min: 56,
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Premium "oyun hissi" için gradyan ve derinlik paletleri.
 * Juicy UI: canlı gradyanlar + "chunky" buton dudakları (3D his).
 */
export const gradients = {
  // Arka plan gökyüzü (sıcak, çocuk dostu)
  sky: ["#A9DBFF", "#E9F6FF"] as const,
  skyWarm: ["#FFE9C2", "#FFF6E8"] as const,
  // Butonlar — [üst, alt] yüz; lip = altındaki koyu kenar
  primary: { face: ["#37ACFF", "#1E83E8"] as const, lip: "#1462B5" },
  accent: { face: ["#FFCB5C", "#F5A524"] as const, lip: "#D07E12" },
  success: { face: ["#67D697", "#3FB984"] as const, lip: "#2C9168" },
  // Kart yüzeyi
  card: ["#FFFFFF", "#F4FAFF"] as const,
} as const;

export type GradientButtonTone = "primary" | "accent" | "success";

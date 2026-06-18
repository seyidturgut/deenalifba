import Constants from "expo-constants";

/**
 * Uygulama sürümü — tek kaynak app.json (`expo.version` + `expo.extra.build`).
 * Playtest'te hangi derlemenin test edildiğini görmek için ekranlarda gösterilir.
 * Yeni test derlemesi yayınlarken app.json içindeki `expo.extra.build`'i güncelle.
 */
const version = Constants.expoConfig?.version ?? "1.0.0";
const build = (Constants.expoConfig?.extra as { build?: string } | undefined)?.build ?? "";

export const APP_VERSION = `v${version}`;
export const APP_BUILD = build;
/** Gösterim etiketi, ör. "v1.0.0 · 2026.06.18" */
export const APP_VERSION_LABEL = build ? `v${version} · ${build}` : `v${version}`;

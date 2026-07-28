import { useSettingsStore } from "@/stores/settingsStore";

/**
 * Maskotun ADI — çocuk onboarding'de kendi ismini veriyor ("benim Pırıl'ım" sahipliği).
 *
 * Abdulkadir (playtest): "Nuri" seçildikten sonra uygulama bazı yerlerde HÂLÂ "Pırıl"
 * diyordu — seçilen ad her yerde tutarlı kullanılmalı. Metinlerde artık {{mascot}} /
 * {{mascotDative}} yer tutucuları var, buradan besleniyor.
 */
const DEFAULT_NAME = "Pırıl";

export function mascotName(): string {
  return useSettingsStore.getState().mascotName?.trim() || DEFAULT_NAME;
}

const BACK_VOWELS = "aıou";
const FRONT_VOWELS = "eiöü";
const VOWELS = BACK_VOWELS + FRONT_VOWELS;

/**
 * Türkçe yönelme hâli (-e/-a) — "Pırıl'a ver", "Nuri'ye ver", "Hudu'ya ver".
 * Son ünlüye göre kalın/ince, ünlüyle bitiyorsa araya kaynaştırma "y" girer.
 * (İngilizcede gerek yok; orada düz ad kullanılır.)
 */
export function toDative(name: string): string {
  const n = name.trim();
  if (!n) return n;
  const lower = n.toLocaleLowerCase("tr");
  let lastVowel = "";
  for (let i = lower.length - 1; i >= 0; i--) {
    if (VOWELS.includes(lower[i])) {
      lastVowel = lower[i];
      break;
    }
  }
  const suffix = FRONT_VOWELS.includes(lastVowel) ? "e" : "a";
  const endsWithVowel = VOWELS.includes(lower[lower.length - 1]);
  return `${n}'${endsWithVowel ? "y" : ""}${suffix}`;
}

/** i18n çağrılarına geçilecek ortak yer tutucular. */
export function mascotVars() {
  const name = mascotName();
  return { mascot: name, mascotDative: toDative(name) };
}

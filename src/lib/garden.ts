import { FORMS_GROUPS } from "@/data/formsLessons";
import { images } from "@/lib/images";

/**
 * "Bahçe" ödülü — cami 28. harfte BİTİYOR, ondan sonrası boş kalmasın diye.
 *
 * Harf Tanıma bölümündeki 7 seviyenin (29-35) her biri tamamlanınca aynı adada
 * bir şey daha canlanır: çiçekli ağaçlar → çiçek tarlaları ve kuşlar → şelale →
 * bahçe kapısı → okuma köşesi → akşam kandilleri → yıldızlı gece.
 * Hikâye: "Cami bitti, şimdi etrafı canlanıyor."
 */
export const GARDEN_STAGE_COUNT = images.gardenStages.length;

/** Tamamlanmış Harf Tanıma seviyesi sayısı = açılmış bahçe aşaması (0-7). */
export function gardenStage(formsCompleted: number[]): number {
  const done = new Set(formsCompleted);
  return FORMS_GROUPS.filter((g) => g.every((id) => done.has(id))).length;
}

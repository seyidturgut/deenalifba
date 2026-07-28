import { getLetter, LETTERS } from "@/data/letters";
import { getLetterForms, type LetterFormKind } from "@/data/letterForms";

/**
 * 1-28'deki oyunları "Harf Tanıma" bölümünde de kullanabilmek için ince bir katman.
 *
 * Abdulkadir (2. tur): "1-28'deki oyun çeşitliliği bu bölümde de korunmalı." Oyunlar
 * harfi metin karakteri olarak çiziyordu; pozisyonel formların Unicode karşılıkları
 * (Arabic Presentation Forms-B) zaten `letterForms.chars` içinde duruyor — oyunlara
 * yalnızca "hangi form" bilgisini geçmek yetiyor, mekaniğe dokunmaya gerek yok.
 */

/** Harfin metin karakteri: form verilirse o pozisyonel hâli, yoksa izole hâli. */
export function glyphChar(letterId: number, kind?: LetterFormKind): string {
  const forms = getLetterForms(letterId);
  const fallback = getLetter(letterId)?.char ?? "";
  if (!kind) return forms?.chars.isolated ?? fallback;
  return forms?.chars[kind] ?? fallback;
}

/** Formun SVG yolu + boyama ilerlemesi için form-içi noktalar (Boya oyunu). */
export function glyphShape(
  letterId: number,
  kind?: LetterFormKind
): { d: string; inner: [number, number][] } | undefined {
  const f = getLetterForms(letterId);
  const k = kind ?? "isolated";
  const d = f?.paths[k];
  const inner = f?.inners[k];
  if (!d || !inner) return undefined;
  return { d, inner };
}

/**
 * Bu forma sahip harf id'leri — çeldirici havuzu.
 * Bağlanmayan 6 harfin (ا د ذ ر ز و) baş/orta formu YOKTUR; onları havuza almak
 * çocuğa var olmayan bir şekil göstermek olurdu.
 */
export function lettersWithForm(kind?: LetterFormKind): number[] {
  return LETTERS.filter((l) => glyphChar(l.id, kind) && (!kind || getLetterForms(l.id)?.chars[kind])).map((l) => l.id);
}

/**
 * Hedeften farklı görünen çeldirici harfler seçer.
 * Karşılaştırma ÇİZİLEN karakter üzerinden yapılır — aynı forma sahip iki farklı
 * harf aynı gliflenirse (ör. noktasız gövdeler) çocuk haksız yere yanılır.
 */
export function pickDistractors(letterId: number, count: number, kind?: LetterFormKind): string[] {
  const targetChar = glyphChar(letterId, kind);
  const pool = lettersWithForm(kind).filter((id) => id !== letterId && glyphChar(id, kind) !== targetChar);
  const out: string[] = [];
  const seen = new Set<string>();
  while (out.length < count && pool.length) {
    const [id] = pool.splice(Math.floor(Math.random() * pool.length), 1);
    const ch = glyphChar(id, kind);
    if (seen.has(ch)) continue;
    seen.add(ch);
    out.push(ch);
  }
  return out;
}

export type { LetterFormKind };

/**
 * Harf çizim (trace) kılavuz stroke'ları — normalize koordinatlar (0..1).
 * Her harf bir veya birden çok stroke; her stroke [x,y] noktalarından oluşan polyline.
 *
 * NOT: Bunlar yaklaşık placeholder stroke'lardır (isolated formlar). Final üründe
 * tasarım ekibinin tam stroke-order referanslarıyla değiştirilecek. Verisi olmayan
 * harfler için trace ekranı glyph'i kılavuz olarak gösterip serbest çizime izin verir.
 */
export type Stroke = [number, number][];
export type LetterStrokes = Stroke[];

export const LETTER_STROKES: Record<number, LetterStrokes> = {
  // 1 Elif ا — dikey çubuk
  1: [[[0.5, 0.1], [0.5, 0.86]]],
  // 2 Be ب — alt tekne + alt nokta
  2: [
    [[0.18, 0.46], [0.24, 0.6], [0.4, 0.67], [0.5, 0.68], [0.6, 0.67], [0.76, 0.6], [0.82, 0.46]],
    [[0.49, 0.84], [0.51, 0.85]],
  ],
  // 3 Te ت — tekne + üstte iki nokta
  3: [
    [[0.18, 0.5], [0.24, 0.63], [0.4, 0.7], [0.5, 0.71], [0.6, 0.7], [0.76, 0.63], [0.82, 0.5]],
    [[0.41, 0.28], [0.43, 0.29]],
    [[0.57, 0.28], [0.59, 0.29]],
  ],
  // 4 Se ث — tekne + üstte üç nokta
  4: [
    [[0.18, 0.52], [0.24, 0.65], [0.4, 0.72], [0.5, 0.73], [0.6, 0.72], [0.76, 0.65], [0.82, 0.52]],
    [[0.5, 0.24], [0.51, 0.25]],
    [[0.4, 0.32], [0.41, 0.33]],
    [[0.6, 0.32], [0.61, 0.33]],
  ],
  // 5 Cim ج — kanca + içte nokta
  5: [
    [[0.26, 0.3], [0.5, 0.32], [0.68, 0.39], [0.5, 0.54], [0.32, 0.68], [0.5, 0.78], [0.7, 0.74]],
    [[0.5, 0.58], [0.52, 0.59]],
  ],
  // 6 Ha ح — kanca (noktasız)
  6: [
    [[0.26, 0.3], [0.56, 0.32], [0.7, 0.42], [0.46, 0.6], [0.32, 0.72], [0.52, 0.8], [0.72, 0.74]],
  ],
};

export function getStrokes(letterId: number): LetterStrokes | null {
  return LETTER_STROKES[letterId] ?? null;
}

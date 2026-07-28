// 28 harfin POZİSYONEL formlarını (izole/baş/orta/son) Amiri fontundan çıkarır
// → src/data/letterForms.ts
//
// Abdulkadir (2026-07-27): Harakat'tan ÖNCE "Harf Tanıma" bölümü gerekiyor — çocuk harfi
// tek başına bilse de kelime içinde şekil değiştiği için (ب → بـ ـبـ ـب) tanıyamıyor.
//
// Formlar Arabic Presentation Forms-B (U+FE70–U+FEFF) kod noktalarından alınır — Amiri'de
// hepsi mevcut (doğrulandı). GSUB shaping'e gerek yok.
// NOT: 6 harf (ا د ذ ر ز و) sonraki harfe BAĞLANMAZ → yalnız izole + son formu vardır.
//
// Kullanım: node scripts/gen-letter-forms.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FONT = resolve(ROOT, "node_modules/@expo-google-fonts/amiri/700Bold/Amiri_700Bold.ttf");
const OUT = resolve(ROOT, "src/data/letterForms.ts");
const BOX = 1000;
const PAD = 70;

// harf id → izole formun Presentation Forms-B başlangıç kod noktası.
// Sıra fontta sabittir: [izole, son, baş, orta] (bağlanmayanlarda yalnız [izole, son]).
// letters.ts sırası: 1 ا … 28 ي
const FORM_BASE = {
  1: 0xfe8d, // ا  (bağlanmaz)
  2: 0xfe8f, // ب
  3: 0xfe95, // ت
  4: 0xfe99, // ث
  5: 0xfe9d, // ج
  6: 0xfea1, // ح
  7: 0xfea5, // خ
  8: 0xfea9, // د  (bağlanmaz)
  9: 0xfeab, // ذ  (bağlanmaz)
  10: 0xfead, // ر (bağlanmaz)
  11: 0xfeaf, // ز (bağlanmaz)
  12: 0xfeb1, // س
  13: 0xfeb5, // ش
  14: 0xfeb9, // ص
  15: 0xfebd, // ض
  16: 0xfec1, // ط
  17: 0xfec5, // ظ
  18: 0xfec9, // ع
  19: 0xfecd, // غ
  20: 0xfed1, // ف
  21: 0xfed5, // ق
  22: 0xfed9, // ك
  23: 0xfedd, // ل
  24: 0xfee1, // م
  25: 0xfee5, // ن
  26: 0xfeed, // و (bağlanmaz)
  27: 0xfee9, // ه
  28: 0xfef1, // ي
};

/** Sonraki harfe bağlanmayan harfler — yalnız izole + son formu var. */
const NON_CONNECTING = new Set([1, 8, 9, 10, 11, 26]);

const lettersSrc = readFileSync(resolve(ROOT, "src/data/letters.ts"), "utf8");
const LETTERS = [...lettersSrc.matchAll(/id:\s*(\d+),\s*char:\s*"([^"]+)"/g)].map((m) => ({
  id: Number(m[1]),
  char: m[2],
}));
if (LETTERS.length !== 28) {
  console.error(`Beklenen 28 harf, bulunan ${LETTERS.length}`);
  process.exit(1);
}

const buf = readFileSync(FONT);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
const r1 = (n) => Math.round(n * 10) / 10;


/** Eğrileri düz çizgi parçalarına indirger (nokta-içinde testi için). */
function flatten(commands, steps = 12) {
  const polys = [];
  let poly = null;
  let cur = [0, 0];
  for (const c of commands) {
    if (c.type === "M") {
      if (poly && poly.length > 2) polys.push(poly);
      poly = [[c.x, c.y]];
      cur = [c.x, c.y];
    } else if (c.type === "L") {
      poly.push([c.x, c.y]);
      cur = [c.x, c.y];
    } else if (c.type === "Q") {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const x = mt * mt * cur[0] + 2 * mt * t * c.x1 + t * t * c.x;
        const y = mt * mt * cur[1] + 2 * mt * t * c.y1 + t * t * c.y;
        poly.push([x, y]);
      }
      cur = [c.x, c.y];
    } else if (c.type === "C") {
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const mt = 1 - t;
        const x = mt * mt * mt * cur[0] + 3 * mt * mt * t * c.x1 + 3 * mt * t * t * c.x2 + t * t * t * c.x;
        const y = mt * mt * mt * cur[1] + 3 * mt * mt * t * c.y1 + 3 * mt * t * t * c.y2 + t * t * t * c.y;
        poly.push([x, y]);
      }
      cur = [c.x, c.y];
    } else if (c.type === "Z") {
      if (poly && poly.length > 2) polys.push(poly);
      poly = null;
    }
  }
  if (poly && poly.length > 2) polys.push(poly);
  return polys;
}

/** Even-odd kuralıyla nokta-çokgen testi (delikler doğru çalışır). */
function insideEvenOdd(polys, x, y) {
  let inside = false;
  for (const poly of polys) {
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i];
      const [xj, yj] = poly[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

/** Glifi 1000×1000 kutuya normalize edip SVG path verisi üretir. */
function normalizedPath(glyph) {
  const raw = glyph.getPath(0, 0, 1000);
  const bb = raw.getBoundingBox();
  const w = bb.x2 - bb.x1;
  const h = bb.y2 - bb.y1;
  const s = (BOX - PAD * 2) / Math.max(w, h);
  const ox = (BOX - w * s) / 2 - bb.x1 * s;
  const oy = (BOX - h * s) / 2 - bb.y1 * s;
  const tx = (x) => x * s + ox;
  const ty = (y) => y * s + oy;
  let d = "";
  for (const c of raw.commands) {
    if (c.type === "M") d += `M${r1(tx(c.x))} ${r1(ty(c.y))}`;
    else if (c.type === "L") d += `L${r1(tx(c.x))} ${r1(ty(c.y))}`;
    else if (c.type === "C") d += `C${r1(tx(c.x1))} ${r1(ty(c.y1))} ${r1(tx(c.x2))} ${r1(ty(c.y2))} ${r1(tx(c.x))} ${r1(ty(c.y))}`;
    else if (c.type === "Q") d += `Q${r1(tx(c.x1))} ${r1(ty(c.y1))} ${r1(tx(c.x))} ${r1(ty(c.y))}`;
    else if (c.type === "Z") d += "Z";
  }

  // Boyama ilerlemesi için harf-İÇİ örnek noktalar (Boya oyunu bunları sayar).
  // Formun kendi noktaları olmadan izole harfin ızgarası kullanılırdı ve
  // "yeterince boyadım mı" hesabı tutmazdı.
  const polys = flatten(raw.commands).map((poly) => poly.map(([x, y]) => [tx(x), ty(y)]));
  const inner = [];
  const G = 30;
  for (let gy = 0; gy < G; gy++) {
    for (let gx = 0; gx < G; gx++) {
      const x = PAD + ((BOX - PAD * 2) * (gx + 0.5)) / G;
      const y = PAD + ((BOX - PAD * 2) * (gy + 0.5)) / G;
      if (insideEvenOdd(polys, x, y)) inner.push([Math.round(x), Math.round(y)]);
    }
  }
  const MAX = 220;
  const step = Math.max(1, Math.ceil(inner.length / MAX));
  return { d, inner: inner.filter((_, i) => i % step === 0) };
}

const FORM_KEYS = ["isolated", "final", "initial", "medial"];
const entries = [];

for (const { id, char } of LETTERS) {
  const base = FORM_BASE[id];
  if (!base) {
    console.error(`✗ ${id} ${char}: FORM_BASE eksik`);
    process.exit(1);
  }
  const count = NON_CONNECTING.has(id) ? 2 : 4;
  const forms = {};
  const inners = {};
  const chars = {};

  // GÜVENLİK KONTROLÜ: izole gösterim formu, harfin KENDİ glifiyle aynı olmalı.
  // (FORM_BASE'de iki harfi karıştırmak — ör. و ↔ ه — sessizce yanlış glif üretiyordu;
  //  bu kontrol o hatayı derleme zamanında yakalar.)
  const baseGlyph = font.charToGlyph(char);
  const isoGlyph = font.charToGlyph(String.fromCodePoint(base));
  if (!baseGlyph || !isoGlyph || baseGlyph.index !== isoGlyph.index) {
    console.error(
      `✗ ${id} ${char}: izole form (U+${base.toString(16).toUpperCase()}) bu harfe ait DEĞİL ` +
        `(glif ${isoGlyph?.index} ≠ ${baseGlyph?.index}) — FORM_BASE eşlemesi yanlış.`
    );
    process.exit(1);
  }
  for (let i = 0; i < count; i++) {
    const cp = base + i;
    const ch = String.fromCodePoint(cp);
    const glyph = font.charToGlyph(ch);
    if (!glyph || glyph.index === 0) {
      console.error(`✗ ${id} ${char} ${FORM_KEYS[i]}: glif yok (U+${cp.toString(16).toUpperCase()})`);
      process.exit(1);
    }
    const np = normalizedPath(glyph);
    forms[FORM_KEYS[i]] = np.d;
    inners[FORM_KEYS[i]] = np.inner;
    chars[FORM_KEYS[i]] = ch;
  }
  entries.push({ id, char, count, forms, inners, chars });
  console.log(`✓ ${String(id).padStart(2)} ${char}  ${count} form  (${Object.keys(forms).join(", ")})`);
}

const ts = `// OTOMATİK ÜRETİLDİ — node scripts/gen-letter-forms.mjs (Amiri_700Bold gliflerinden)
// Harflerin POZİSYONEL formları: izole / baş / orta / son.
// Abdulkadir (müfredat): çocuk harfi tek başına bilse de kelime içinde şekli değiştiği için
// tanıyamıyor — "Harf Tanıma" bölümü Harakat'tan ÖNCE gelmeli.
// NOT: 6 harf (ا د ذ ر ز و) sonrakine bağlanmaz → yalnız izole + son formu vardır.
import { PATH_BOX } from "./letterPaths";

export { PATH_BOX };

export type LetterFormKind = "isolated" | "initial" | "medial" | "final";

export type LetterForms = {
  /** Bu harfin sahip olduğu formlar (bağlanmayanlarda yalnız isolated+final) */
  paths: Partial<Record<LetterFormKind, string>>;
  /** Formun Unicode gösterim karakteri (metin gerekirse) */
  chars: Partial<Record<LetterFormKind, string>>;
  /** Form-İÇİ örnek noktalar — Boya oyununun ilerleme hesabı için */
  inners: Partial<Record<LetterFormKind, [number, number][]>>;
  /** Sonraki harfe bağlanır mı? (false → yalnız 2 form) */
  connects: boolean;
};

export const LETTER_FORMS: Record<number, LetterForms> = {
${entries
  .map(
    (e) =>
      `  // ${e.id} ${e.char}\n  ${e.id}: { paths: ${JSON.stringify(e.forms)}, chars: ${JSON.stringify(
        e.chars
      )}, inners: ${JSON.stringify(e.inners)}, connects: ${e.count === 4} },`
  )
  .join("\n")}
};

export function getLetterForms(id: number): LetterForms | undefined {
  return LETTER_FORMS[id];
}

/** Bu harfin gerçekten sahip olduğu form türleri. */
export function formKindsFor(id: number): LetterFormKind[] {
  const f = LETTER_FORMS[id];
  if (!f) return [];
  return (Object.keys(f.paths) as LetterFormKind[]);
}
`;
writeFileSync(OUT, ts);
console.log(`\nYazıldı: src/data/letterForms.ts (${Math.round(ts.length / 1024)} KB)`);

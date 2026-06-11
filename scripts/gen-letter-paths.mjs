// 28 harfin GERÇEK glif konturunu Amiri fontundan çıkarır → src/data/letterPaths.ts
// Çıktı (harf başına):
//  - d: SVG path verisi (1000×1000 kutuya normalize, harf ortalanmış)
//  - inner: harfin İÇİNDEKİ örnek noktalar (boyama ilerlemesi için, glif birimi)
// Kullanım: node scripts/gen-letter-paths.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FONT = resolve(ROOT, "node_modules/@expo-google-fonts/amiri/700Bold/Amiri_700Bold.ttf");
const OUT = resolve(ROOT, "src/data/letterPaths.ts");
const BOX = 1000; // normalize hedef kutu
const PAD = 70; // kutu içi kenar payı

// letters.ts'ten {id, char} çiftlerini çek
const lettersSrc = readFileSync(resolve(ROOT, "src/data/letters.ts"), "utf8");
const LETTERS = [...lettersSrc.matchAll(/id:\s*(\d+),\s*char:\s*"([^"]+)"/g)].map((m) => ({
  id: Number(m[1]),
  char: m[2],
}));
if (LETTERS.length !== 28) {
  console.error(`Beklenen 28 harf, bulunan ${LETTERS.length} — letters.ts formatı değişmiş olabilir.`);
  process.exit(1);
}

const buf = readFileSync(FONT);
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

/** Path komutlarını çokgenlere düzleştir (curve'leri örnekleyerek). */
function flatten(commands) {
  const polys = [];
  let poly = null;
  let cur = null;
  const CURVE_STEPS = 14;
  for (const c of commands) {
    if (c.type === "M") {
      if (poly && poly.length > 2) polys.push(poly);
      poly = [[c.x, c.y]];
      cur = [c.x, c.y];
    } else if (c.type === "L") {
      poly.push([c.x, c.y]);
      cur = [c.x, c.y];
    } else if (c.type === "C") {
      for (let i = 1; i <= CURVE_STEPS; i++) {
        const t = i / CURVE_STEPS;
        const mt = 1 - t;
        const x = mt * mt * mt * cur[0] + 3 * mt * mt * t * c.x1 + 3 * mt * t * t * c.x2 + t * t * t * c.x;
        const y = mt * mt * mt * cur[1] + 3 * mt * mt * t * c.y1 + 3 * mt * t * t * c.y2 + t * t * t * c.y;
        poly.push([x, y]);
      }
      cur = [c.x, c.y];
    } else if (c.type === "Q") {
      for (let i = 1; i <= CURVE_STEPS; i++) {
        const t = i / CURVE_STEPS;
        const mt = 1 - t;
        const x = mt * mt * cur[0] + 2 * mt * t * c.x1 + t * t * c.x;
        const y = mt * mt * cur[1] + 2 * mt * t * c.y1 + t * t * c.y;
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

/** Even-odd kuralıyla nokta-çokgen testi (tüm konturlar üzerinden; delikler doğru çalışır). */
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

const r1 = (n) => Math.round(n * 10) / 10;

const entries = [];
for (const { id, char } of LETTERS) {
  const glyph = font.charToGlyph(char);
  if (!glyph || glyph.index === 0) {
    console.error(`✗ ${id} ${char}: glif bulunamadı`);
    process.exit(1);
  }
  const raw = glyph.getPath(0, 0, 1000); // y-aşağı koordinat, baseline=0
  const bb = raw.getBoundingBox();
  const w = bb.x2 - bb.x1;
  const h = bb.y2 - bb.y1;
  const s = (BOX - PAD * 2) / Math.max(w, h);
  const ox = (BOX - w * s) / 2 - bb.x1 * s;
  const oy = (BOX - h * s) / 2 - bb.y1 * s;
  const tx = (x) => x * s + ox;
  const ty = (y) => y * s + oy;

  // normalize edilmiş path verisi
  let d = "";
  for (const c of raw.commands) {
    if (c.type === "M") d += `M${r1(tx(c.x))} ${r1(ty(c.y))}`;
    else if (c.type === "L") d += `L${r1(tx(c.x))} ${r1(ty(c.y))}`;
    else if (c.type === "C") d += `C${r1(tx(c.x1))} ${r1(ty(c.y1))} ${r1(tx(c.x2))} ${r1(ty(c.y2))} ${r1(tx(c.x))} ${r1(ty(c.y))}`;
    else if (c.type === "Q") d += `Q${r1(tx(c.x1))} ${r1(ty(c.y1))} ${r1(tx(c.x))} ${r1(ty(c.y))}`;
    else if (c.type === "Z") d += "Z";
  }

  // iç örnek noktaları (boyama ilerlemesi): normalize uzayda grid + even-odd test
  const polys = flatten(raw.commands).map((poly) => poly.map(([x, y]) => [tx(x), ty(y)]));
  const inner = [];
  const G = 30; // grid yoğunluğu
  for (let gy = 0; gy < G; gy++) {
    for (let gx = 0; gx < G; gx++) {
      const x = PAD + ((BOX - PAD * 2) * (gx + 0.5)) / G;
      const y = PAD + ((BOX - PAD * 2) * (gy + 0.5)) / G;
      if (insideEvenOdd(polys, x, y)) inner.push([Math.round(x), Math.round(y)]);
    }
  }
  // çok yoğunsa eşit aralıkla incelt (maks ~220 nokta)
  const MAX = 220;
  const step = Math.max(1, Math.ceil(inner.length / MAX));
  const sampled = inner.filter((_, i) => i % step === 0);

  entries.push({ id, char, d, inner: sampled });
  console.log(`✓ ${String(id).padStart(2)} ${char}  path=${d.length}b  iç nokta=${sampled.length}`);
}

const ts = `// OTOMATİK ÜRETİLDİ — node scripts/gen-letter-paths.mjs (Amiri_700Bold gliflerinden)
// Her harf: 1000×1000 kutuya normalize SVG path + harf-içi örnek noktalar (boyama ilerlemesi).
export const PATH_BOX = 1000;

export type LetterPath = {
  /** SVG path verisi (1000×1000 kutu, harf ortalanmış) */
  d: string;
  /** Harfin içindeki örnek noktalar [x,y] — boyama yüzdesi için */
  inner: [number, number][];
};

export const LETTER_PATHS: Record<number, LetterPath> = {
${entries.map((e) => `  // ${e.id} ${e.char}\n  ${e.id}: { d: "${e.d}", inner: ${JSON.stringify(e.inner)} },`).join("\n")}
};

export function getLetterPath(id: number): LetterPath | undefined {
  return LETTER_PATHS[id];
}
`;
writeFileSync(OUT, ts);
console.log(`\nYazıldı: src/data/letterPaths.ts (${Math.round(ts.length / 1024)} KB)`);

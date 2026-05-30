// Beyaz arka planı şeffaflaştırır (kenarlardan flood-fill — özne içindeki beyazı korur).
// Kullanım:  node scripts/strip-white-bg.mjs mascot-lantern mosque-full star-reward
// Girdi/çıktı: assets/generated/<isim>.png  →  assets/generated/<isim>.png (üzerine yazar)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "assets", "generated");

const THRESHOLD = 238; // bu değerin üstündeki R,G,B "beyaz" sayılır
const names = process.argv.slice(2);
if (names.length === 0) {
  console.error("Kullanım: node scripts/strip-white-bg.mjs <isim1> <isim2> ...");
  process.exit(1);
}

function stripOne(name) {
  const path = join(DIR, `${name}.png`);
  const png = PNG.sync.read(readFileSync(path));
  const { width: w, height: h, data } = png;
  const idx = (x, y) => (y * w + x) * 4;
  const isWhite = (i) =>
    data[i] >= THRESHOLD && data[i + 1] >= THRESHOLD && data[i + 2] >= THRESHOLD;

  const visited = new Uint8Array(w * h);
  const stack = [];
  // Tüm kenar piksellerini tohum yap
  for (let x = 0; x < w; x++) {
    stack.push([x, 0], [x, h - 1]);
  }
  for (let y = 0; y < h; y++) {
    stack.push([0, y], [w - 1, y]);
  }

  let cleared = 0;
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (visited[p]) continue;
    visited[p] = 1;
    const i = idx(x, y);
    if (!isWhite(i)) continue;
    data[i + 3] = 0; // şeffaf yap
    cleared++;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  writeFileSync(path, PNG.sync.write(png));
  console.log(`✓ ${name}: ${cleared} piksel şeffaflaştırıldı (${w}x${h})`);
}

for (const n of names) {
  try {
    stripOne(n);
  } catch (e) {
    console.error(`✗ ${n}: ${e.message}`);
  }
}

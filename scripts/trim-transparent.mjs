// Şeffaf kenar boşluğunu kırpar (içeriğin gerçek sınırlarına oturtur).
// Kullanım: node scripts/trim-transparent.mjs <dosya1> <dosya2> ...
// (yollar assets/illustrations/ köküne göre, uzantısız)

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(__dirname, "..", "assets", "illustrations");

const ALPHA_THRESHOLD = 8; // bu alfa üstü "dolu" sayılır
const names = process.argv.slice(2);

function trim(name) {
  const path = join(DIR, `${name}.png`);
  const png = PNG.sync.read(readFileSync(path));
  const { width: w, height: h, data } = png;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) {
    console.log(`✗ ${name}: tamamen şeffaf, atlandı`);
    return;
  }
  const pad = 2;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);
  const nw = maxX - minX + 1;
  const nh = maxY - minY + 1;
  const out = new PNG({ width: nw, height: nh });
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const si = ((minY + y) * w + (minX + x)) * 4;
      const di = (y * nw + x) * 4;
      out.data[di] = data[si];
      out.data[di + 1] = data[si + 1];
      out.data[di + 2] = data[si + 2];
      out.data[di + 3] = data[si + 3];
    }
  }
  writeFileSync(path, PNG.sync.write(out));
  console.log(`✓ ${name}: ${w}x${h} → ${nw}x${nh}  (oran ${(nw / nh).toFixed(2)})`);
}

for (const n of names) {
  try {
    trim(n);
  } catch (e) {
    console.error(`✗ ${n}: ${e.message}`);
  }
}

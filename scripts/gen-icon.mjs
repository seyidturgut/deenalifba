// App ikonu (kullanıcının app_icon.png'si) + splash/foreground (Pırıl) üretir. pngjs, saf Node.
// Kullanım: node scripts/gen-icon.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ILL = join(__dirname, "..", "assets", "illustrations");
const IMG = join(__dirname, "..", "assets", "images");
mkdirSync(IMG, { recursive: true });

function resize(src, dw, dh) {
  const out = new PNG({ width: dw, height: dh });
  for (let y = 0; y < dh; y++) {
    const sy = (y / dh) * src.height, y0 = Math.floor(sy), y1 = Math.min(src.height - 1, y0 + 1), fy = sy - y0;
    for (let x = 0; x < dw; x++) {
      const sx = (x / dw) * src.width, x0 = Math.floor(sx), x1 = Math.min(src.width - 1, x0 + 1), fx = sx - x0;
      const o = (y * dw + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = src.data[(y0 * src.width + x0) * 4 + c], p10 = src.data[(y0 * src.width + x1) * 4 + c];
        const p01 = src.data[(y1 * src.width + x0) * 4 + c], p11 = src.data[(y1 * src.width + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx, bot = p01 + (p11 - p01) * fx;
        out.data[o + c] = Math.round(top + (bot - top) * fy);
      }
    }
  }
  return out;
}

function onTransparent(fg, size, scale) {
  const W = size, fw = Math.round(W * scale), fh = fw;
  const small = resize(fg, fw, fh);
  const out = new PNG({ width: W, height: W });
  out.data.fill(0);
  const ox = Math.round((W - fw) / 2), oy = Math.round((W - fh) / 2);
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
    const si = (y * fw + x) * 4, di = ((oy + y) * W + (ox + x)) * 4;
    for (let c = 0; c < 4; c++) out.data[di + c] = small.data[si + c];
  }
  return out;
}

const appIcon = PNG.sync.read(readFileSync(join(ILL, "icons", "app_icon.png")));
const piril = PNG.sync.read(readFileSync(join(ILL, "mascot", "piril_idle.png")));

writeFileSync(join(IMG, "icon.png"), PNG.sync.write(resize(appIcon, 1024, 1024)));
console.log("✓ icon.png (1024) — app_icon");
writeFileSync(join(IMG, "favicon.png"), PNG.sync.write(resize(appIcon, 256, 256)));
console.log("✓ favicon.png (256)");
writeFileSync(join(IMG, "splash-icon.png"), PNG.sync.write(onTransparent(piril, 1024, 0.85)));
console.log("✓ splash-icon.png (1024) — Pırıl");
writeFileSync(join(IMG, "android-icon-foreground.png"), PNG.sync.write(onTransparent(piril, 1024, 0.6)));
console.log("✓ android-icon-foreground.png (1024) — Pırıl");
console.log("\nBitti → assets/images/");

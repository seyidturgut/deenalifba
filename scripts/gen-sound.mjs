// Neşeli bir "başarı" çıngırağı (success chime) üretir — saf Node, bağımlılık yok.
// Çıktı: assets/generated/success.wav (mono, 16-bit, 44.1kHz)
// Yükselen arpej (C5-E5-G5-C6) + yumuşak zarf. Placeholder ses; final ses ekibinden gelecek.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "assets", "generated");
mkdirSync(OUT, { recursive: true });

const SR = 44100;
const notes = [
  { f: 523.25, t: 0.0 }, // C5
  { f: 659.25, t: 0.09 }, // E5
  { f: 783.99, t: 0.18 }, // G5
  { f: 1046.5, t: 0.27 }, // C6
];
const dur = 0.7;
const n = Math.floor(SR * dur);
const samples = new Float32Array(n);

for (const note of notes) {
  const start = Math.floor(note.t * SR);
  for (let i = start; i < n; i++) {
    const tt = (i - start) / SR;
    const env = Math.exp(-tt * 6); // yumuşak sönüm
    // ana ton + hafif oktav parlaklığı
    const s =
      Math.sin(2 * Math.PI * note.f * tt) * 0.6 +
      Math.sin(2 * Math.PI * note.f * 2 * tt) * 0.15;
    samples[i] += s * env * 0.5;
  }
}

// normalize
let peak = 0;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(samples[i]));
const gain = peak > 0 ? 0.9 / peak : 1;

// 16-bit PCM WAV
const buf = Buffer.alloc(44 + n * 2);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + n * 2, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) {
  const v = Math.max(-1, Math.min(1, samples[i] * gain));
  buf.writeInt16LE((v * 32767) | 0, 44 + i * 2);
}

const out = join(OUT, "success.wav");
writeFileSync(out, buf);
console.log(`✓ success.wav → ${out} (${(buf.length / 1024).toFixed(0)} KB)`);

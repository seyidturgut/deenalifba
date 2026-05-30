// Alif — Gemini ile placeholder görsel asset üretici.
// Kullanım:  GEMINI_API_KEY=... node scripts/gen-assets.mjs
// Model: gemini-2.5-flash-image ("Nano Banana"). Çıktılar: assets/generated/*.png
//
// NOT: Bunlar PLACEHOLDER asset'lerdir. Final üründe tasarım ekibinin
// teslim ettiği gerçek illüstrasyonlarla değiştirilecektir.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("HATA: GEMINI_API_KEY tanımlı değil. .env'e ekleyin veya export edin.");
  process.exit(1);
}

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "assets", "generated");
mkdirSync(OUT_DIR, { recursive: true });

// Ortak stil — tüm asset'ler tutarlı görünsün diye.
const STYLE =
  "flat vector children's book illustration, soft rounded shapes, thick smooth outlines, " +
  "warm friendly palette with cream background (#FAF7F0), sky blue (#208AEF) and warm gold (#F5A524) accents, " +
  "cute and gentle, simple, high quality, centered composition, generous margins, NO text, NO words, NO letters";

// İslami çocuk eğitim uygulaması için placeholder asset'ler.
const ASSETS = [
  {
    name: "mascot-lantern",
    prompt:
      "A single cute friendly glowing Ramadan lantern (fanous) character with big happy cartoon eyes, " +
      "rosy cheeks, tiny waving arms, smiling warmly. Solid flat white background.",
  },
  {
    name: "mosque-full",
    prompt:
      "A cute small cartoon mosque with one round teal-blue dome, two slender minarets, a golden crescent on top, " +
      "arched door, small garden with a tree, soft and welcoming. Full daytime scene with soft sky and clouds.",
  },
  {
    name: "star-reward",
    prompt:
      "A single cheerful golden five-pointed star with a happy smiling face and rosy cheeks, sparkles around it. " +
      "Solid flat white background.",
  },
  {
    name: "onboarding-hero",
    prompt:
      "A warm cozy scene: a friendly glowing lantern and a happy golden star floating above a tiny cute mosque, " +
      "soft clouds and gentle sparkles, inviting and magical, for a children's learning app welcome screen.",
  },
];

async function generateOne(asset) {
  const body = {
    contents: [{ parts: [{ text: `${STYLE}. ${asset.prompt}` }] }],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${asset.name}: HTTP ${res.status} — ${txt.slice(0, 400)}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const img = parts.find((p) => p.inlineData?.data);
  if (!img) {
    throw new Error(`${asset.name}: yanıtta görsel yok — ${JSON.stringify(data).slice(0, 300)}`);
  }

  const out = join(OUT_DIR, `${asset.name}.png`);
  writeFileSync(out, Buffer.from(img.inlineData.data, "base64"));
  console.log(`✓ ${asset.name} → ${out}`);
}

console.log(`Model: ${MODEL} — ${ASSETS.length} asset üretiliyor...\n`);
let ok = 0;
for (const a of ASSETS) {
  try {
    await generateOne(a);
    ok++;
  } catch (e) {
    console.error(`✗ ${e.message}`);
  }
}
console.log(`\nBitti: ${ok}/${ASSETS.length} üretildi → assets/generated/`);

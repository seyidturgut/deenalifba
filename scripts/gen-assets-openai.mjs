// Alif — OpenAI (gpt-image-1) ile placeholder görsel asset üretici.
// Kullanım:  OPENAI_API_KEY=... node scripts/gen-assets-openai.mjs
// Avantaj: gpt-image-1 doğrudan ŞEFFAF PNG üretir (background: transparent).
//
// NOT: ChatGPT Plus DEĞİL — platform.openai.com'dan ayrı bir API anahtarı + kredi gerekir.
// Bunlar PLACEHOLDER asset'lerdir; final üründe tasarım ekibinin asset'leriyle değişir.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("HATA: OPENAI_API_KEY tanımlı değil. .env'e ekleyin veya export edin.");
  process.exit(1);
}

const ENDPOINT = "https://api.openai.com/v1/images/generations";
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "assets", "generated");
mkdirSync(OUT_DIR, { recursive: true });

const STYLE =
  "flat vector children's book illustration, soft rounded shapes, thick smooth outlines, " +
  "warm friendly palette, sky blue (#208AEF) and warm gold (#F5A524) accents, cute and gentle, " +
  "simple, high quality, centered, NO text, NO words, NO letters";

// transparent: şeffaf arka plan (sprite). opaque: dolu sahne (hero).
const ASSETS = [
  {
    name: "mascot-lantern",
    background: "transparent",
    prompt:
      "A single cute friendly glowing Ramadan lantern (fanous) character with big happy cartoon eyes, " +
      "rosy cheeks, tiny waving arms, smiling warmly.",
  },
  {
    name: "mosque-full",
    background: "transparent",
    prompt:
      "A cute small cartoon mosque with one round teal-blue dome, two slender minarets, a golden crescent on top, " +
      "arched door, small garden with a tree, soft and welcoming.",
  },
  {
    name: "star-reward",
    background: "transparent",
    prompt:
      "A single cheerful golden five-pointed star with a happy smiling face and rosy cheeks, sparkles around it.",
  },
  {
    name: "onboarding-hero",
    background: "opaque",
    prompt:
      "A warm cozy welcome scene for a children's app: a friendly glowing lantern and a happy golden star " +
      "floating above a tiny cute mosque, soft cream sky, gentle clouds and sparkles.",
  },
];

async function generateOne(asset) {
  const body = {
    model: "gpt-image-1",
    prompt: `${STYLE}. ${asset.prompt}`,
    size: "1024x1024",
    background: asset.background, // "transparent" | "opaque"
    n: 1,
  };

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${asset.name}: HTTP ${res.status} — ${txt.slice(0, 400)}`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${asset.name}: yanıtta görsel yok — ${JSON.stringify(data).slice(0, 300)}`);

  const out = join(OUT_DIR, `${asset.name}.png`);
  writeFileSync(out, Buffer.from(b64, "base64"));
  console.log(`✓ ${asset.name} (${asset.background}) → ${out}`);
}

console.log(`Model: gpt-image-1 — ${ASSETS.length} asset üretiliyor...\n`);
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

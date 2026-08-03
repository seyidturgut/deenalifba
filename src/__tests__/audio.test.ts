import { execFileSync } from "child_process";
import { existsSync } from "fs";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Ses tabloları ile GERÇEK dosyalar.
 *
 * Akış bu sürelere göre zamanlanıyor: harf sesi talimatın bitmesini bekliyor,
 * kayıt Pırıl susunca başlıyor, cami sahnesi anlatım kadar bekliyor. Bir ses
 * yeniden kaydedilip tablo güncellenmezse akış sessizce bozulur — ses üstüne
 * biner ya da ekran boşuna bekler. Bugün bu tablo elle güncellendi; bir daha
 * kaçmasın diye dosyalardan ölçülüp karşılaştırılıyor.
 */
const ROOT = join(__dirname, "../..");
const src = readFileSync(join(ROOT, "src/lib/sfx.ts"), "utf8");

const durationMs = (rel: string) => {
  const out = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", join(ROOT, rel)]);
  return Math.round(parseFloat(out.toString().trim()) * 1000);
};

const tableOf = (name: string) => {
  const m = src.match(new RegExp(`${name}[^=]*=\\s*\\{\\s*en:\\s*(\\{.*?\\}),\\s*tr:\\s*(\\{.*?\\}),`, "s"));
  if (!m) throw new Error(`${name} tablosu bulunamadı`);
  return { en: JSON.parse(m[1]), tr: JSON.parse(m[2]) };
};

const sourcesOf = (block: string) => {
  const out: Record<string, string> = {};
  const re = /(\w+):\s*require\("@\/assets\/audio\/([^"]+)"\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) out[m[1]] = m[2];
  return out;
};

// Kaynak listeleri: "en:" ve "tr:" bloklarının içindeki require'lar
const narrEn = sourcesOf(src.slice(src.indexOf("NARRATION_SOURCES"), src.indexOf("NARRATION_DURATIONS_MS")));

describe("ses tabloları gerçek dosyalarla uyuşuyor", () => {
  const TOLERANS = 60; // ms — yeniden kodlama küçük fark yaratabilir

  it("her anlatımın süresi tabloyla aynı", () => {
    const table = tableOf("NARRATION_DURATIONS_MS");
    const sapan: string[] = [];
    Object.entries(narrEn).forEach(([key, file]) => {
      (["en", "tr"] as const).forEach((lang) => {
        const rel = `assets/audio/${file.replace(/_(en|tr)\.mp3$/, `_${lang}.mp3`)}`;
        if (!existsSync(join(ROOT, rel))) return sapan.push(`${key} ${lang}: dosya yok (${rel})`);
        const beklenen = table[lang][key];
        if (beklenen === undefined) return sapan.push(`${key} ${lang}: tabloda yok`);
        const gercek = durationMs(rel);
        if (Math.abs(gercek - beklenen) > TOLERANS) sapan.push(`${key} ${lang}: tablo ${beklenen} ≠ dosya ${gercek}`);
      });
    });
    expect(sapan).toEqual([]);
  });

  it("her etkinlik talimatının süresi tabloyla aynı", () => {
    const table = tableOf("HINT_MS");
    const sapan: string[] = [];
    Object.keys(table.tr).forEach((key) => {
      (["en", "tr"] as const).forEach((lang) => {
        const rel = `assets/audio/hint_${key}_${lang}.mp3`;
        if (!existsSync(join(ROOT, rel))) return sapan.push(`${key} ${lang}: dosya yok`);
        const gercek = durationMs(rel);
        if (Math.abs(gercek - table[lang][key]) > TOLERANS) sapan.push(`${key} ${lang}: tablo ${table[lang][key]} ≠ dosya ${gercek}`);
      });
    });
    expect(sapan).toEqual([]);
  });

  it("28 harfin sesi var ve süre tablosu doğru", () => {
    const m = src.match(/const LETTER_MS[^=]*=\s*(\{.*?\});/s);
    const table = JSON.parse(m![1]);
    const sapan: string[] = [];
    for (let id = 1; id <= 28; id++) {
      const rel = `assets/audio/alifba/btn_${id}.mp3`;
      if (!existsSync(join(ROOT, rel))) { sapan.push(`harf ${id}: ses yok`); continue; }
      const gercek = durationMs(rel);
      if (Math.abs(gercek - table[String(id)]) > TOLERANS) sapan.push(`harf ${id}: tablo ${table[String(id)]} ≠ dosya ${gercek}`);
    }
    expect(sapan).toEqual([]);
  });

  it("talimatlar çocuğu bekletecek kadar uzun değil", () => {
    const table = tableOf("HINT_MS");
    const uzun = Object.entries(table.tr)
      .concat(Object.entries(table.en))
      .filter(([key, ms]) => key !== "speak" && (ms as number) > 3500)
      .map(([key, ms]) => `${key}=${ms}ms`);
    expect(uzun).toEqual([]);
  });
});

// Alif — müşteri sunumu PDF üreteci (TR+EN, markalı, kendi kendine yeten).
// HTML üretir → Chrome headless ile PDF'e çevrilir (build-deck.sh).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const b64 = (rel) => {
  const buf = readFileSync(resolve(ROOT, rel));
  return `data:image/webp;base64,${buf.toString("base64")}`;
};

const IMG = {
  mascot: b64("assets/illustrations/mascot/piril_celebrate.webp"),
  mascotIdle: b64("assets/illustrations/mascot/piril_idle.webp"),
  mosque: b64("assets/illustrations/mosque/mosque_stage_7.webp"),
  node: b64("assets/illustrations/journey/node_tile.webp"),
  cloud: b64("assets/illustrations/journey/node_cloud.webp"),
  gift: b64("assets/illustrations/rewards/gift.webp"),
  star: b64("assets/illustrations/rewards/star.webp"),
  trophy: b64("assets/illustrations/rewards/trophy.webp"),
  icHome: b64("assets/illustrations/icons/ic_home.webp"),
  icLessons: b64("assets/illustrations/icons/ic_lessons.webp"),
  icMosque: b64("assets/illustrations/icons/ic_mosque.webp"),
  icSettings: b64("assets/illustrations/icons/ic_settings.webp"),
};

const DATE = "30.05.2026";

const CSS = `
:root{
  --primary:#208AEF; --primary-d:#0E5FC2; --gold:#F5A524; --teal:#2E8B9E;
  --ink:#222933; --muted:#6B7682; --cream:#FAF7F0; --line:#E7E2D6; --green:#3FB984;
}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:0}
html,body{margin:0;padding:0;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);font-size:11.5px;line-height:1.5}
.page{position:relative;width:210mm;min-height:297mm;padding:20mm 18mm;page-break-after:always;overflow:hidden}
.page:last-child{page-break-after:auto}

/* Cover */
.cover{background:linear-gradient(170deg,#9FD2FF 0%,#CDE9FF 42%,#FBF3DE 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0}
.cover .mascot{width:190px;height:190px;object-fit:contain;filter:drop-shadow(0 12px 22px rgba(20,98,181,.28))}
.cover h1{font-size:62px;margin:8px 0 0;color:var(--primary-d);letter-spacing:-1px;text-shadow:0 2px 0 rgba(255,255,255,.7)}
.cover .tag{font-size:18px;color:#3a5168;font-weight:600;margin-top:6px}
.cover .tag2{font-size:13px;color:#5a6b7d;margin-top:2px}
.cover .meta{margin-top:34px;background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9);border-radius:16px;padding:14px 26px;font-size:12px;color:#41566a}
.cover .meta b{color:var(--primary-d)}
.cover .conf{position:absolute;bottom:16mm;font-size:10px;letter-spacing:2px;color:#6c8197;text-transform:uppercase}

/* Language band */
.langband{display:flex;align-items:center;gap:10px;border-bottom:3px solid var(--gold);padding-bottom:8px;margin-bottom:14px}
.langband .dot{width:34px;height:34px;border-radius:10px;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px}
.langband h2{margin:0;font-size:20px;color:var(--primary-d)}
.langband small{color:var(--muted);font-size:11px}

h3{font-size:14px;margin:18px 0 8px;color:var(--ink);display:flex;align-items:center;gap:8px}
h3 .ic{width:22px;height:22px;border-radius:7px;background:var(--cream);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:13px}
p{margin:6px 0}
.muted{color:var(--muted)}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin:8px 0;box-shadow:0 2px 6px rgba(40,60,90,.04)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
ul{margin:6px 0;padding-left:18px}
li{margin:3px 0}
.badge{display:inline-block;background:#EAF4FE;color:var(--primary-d);border-radius:999px;padding:2px 10px;font-size:10px;font-weight:700;margin:2px 4px 2px 0}
.badge.g{background:#FFF3DC;color:#9a6a12}
.badge.t{background:#E3F4F5;color:#1d6b76}
.stat{display:flex;gap:10px;margin:10px 0}
.stat .box{flex:1;background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:10px 12px;text-align:center}
.stat .box .n{font-size:24px;font-weight:800;color:var(--primary-d)}
.stat .box .l{font-size:10px;color:var(--muted);margin-top:2px}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px}
th,td{text-align:left;padding:7px 9px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--cream);color:#54606d;font-size:10px;text-transform:uppercase;letter-spacing:.4px}
.pill-done{color:var(--green);font-weight:700}
.pill-prog{color:var(--gold);font-weight:700}
.pill-plan{color:var(--muted);font-weight:700}
.gallery{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}
.gallery .it{width:64px;height:64px;border-radius:12px;background:#EAF4FE;border:1px solid var(--line);display:flex;align-items:center;justify-content:center}
.gallery .it img{max-width:54px;max-height:54px;object-fit:contain}
.steps{display:flex;gap:8px;margin:8px 0}
.steps .s{flex:1;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center}
.steps .s .e{font-size:20px}
.steps .s .t{font-weight:700;font-size:11px;margin-top:3px}
.steps .s .d{font-size:9.5px;color:var(--muted);margin-top:2px}
.foot{position:absolute;bottom:10mm;left:18mm;right:18mm;display:flex;justify-content:space-between;font-size:9px;color:#9aa6b2;border-top:1px solid var(--line);padding-top:6px}
.hero{display:flex;gap:14px;align-items:center;background:linear-gradient(120deg,#EAF4FE,#FBF3DE);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:6px}
.hero img{width:84px;height:84px;object-fit:contain}
`;

const foot = (lang) =>
  `<div class="foot"><span>Alif — Elif-Ba & Namaz · DeenStudios</span><span>${lang === "tr" ? "Gizli / Müşteriye Özel" : "Confidential / Client Only"} · ${DATE}</span></div>`;

// ---- içerik ----
const COVER = `
<section class="page cover">
  <img class="mascot" src="${IMG.mascot}"/>
  <h1>Alif</h1>
  <div class="tag">Elif-Ba & Namaz · İslami Eğitim Oyunu</div>
  <div class="tag2">Islamic Learning Game for Children (4–10)</div>
  <div class="meta">
    <b>Proje Durumu / Status:</b> MVP — Faz 1 (Web demo yayında) &nbsp;·&nbsp;
    <b>Tarih / Date:</b> ${DATE}<br/>
    <b>Demo:</b> deenalifba.vercel.app
  </div>
  <div class="conf">Hazırlayan: DeenStudios · Müşteri Sunumu</div>
</section>`;

const TR = `
<section class="page">
  <div class="langband"><div class="dot">TR</div><div><h2>Alif — Proje Sunumu</h2><small>Elif-Ba & Namaz · 4–10 yaş İslami eğitim ve oyunlaştırma uygulaması</small></div></div>

  <div class="hero">
    <img src="${IMG.mascotIdle}"/>
    <div>
      <b>Özet.</b> Çocuk, sevimli rehber <b>Pırıl</b> ile bir <b>yolculuk haritasında</b> ilerleyerek
      28 Arap harfini (Elif-Ba) öğrenir; her harfle birlikte kendi <b>sihirli camisini</b> inşa eder.
      Tamamen <b>çevrimdışı</b>, reklamsız ve çocuk güvenliği (KVKK/COPPA) önceliklidir.
    </div>
  </div>

  <div class="stat">
    <div class="box"><div class="n">28</div><div class="l">Harf (ilk 6 ücretsiz)</div></div>
    <div class="box"><div class="n">35</div><div class="l">Özgün görsel (WebP)</div></div>
    <div class="box"><div class="n">20</div><div class="l">Ses & müzik</div></div>
    <div class="box"><div class="n">2</div><div class="l">Dil (TR/EN)</div></div>
  </div>

  <h3><span class="ic">🎯</span> Mevcut Aşama</h3>
  <div class="card">
    <span class="badge">İskelet tamam</span><span class="badge">Ana ekran (yolculuk haritası)</span>
    <span class="badge">Çizim mekaniği</span><span class="badge">Yapboz mekaniği</span>
    <span class="badge">TR/EN dil</span><span class="badge">Web demo (Vercel)</span>
    <p class="muted">Şu an çekirdek öğrenme döngüsü ve ana ekran çalışır durumda; web üzerinden canlı demo sunulabiliyor. Sıradaki faz: ses & tekrar oyunları, ilerleme kalıcılığı ve cami inşa kutlaması.</p>
  </div>

  <h3><span class="ic">✅</span> Şimdiye Kadar Yapılanlar</h3>
  <ul>
    <li><b>Ana ekran (hub):</b> yıldız & “Cami İnşası %” göstergesi, maskot + selam, XP/seviye + günlük ödül sandığı, <b>parallax bulutlu yolculuk haritası</b> (illüstrasyon harf düğümleri: açık / aktif-parıltılı / bulut-kilitli), 4 ikonlu alt menü.</li>
    <li><b>Öğrenme döngüsü:</b> Çiz (parmakla harf izleme + kesik “nasıl çizilir” gösterimi) ve Yapboz (2×2 sürükle-bırak) oynanabilir.</li>
    <li><b>Karakterli onboarding</b> (Pırıl ile tanışma + isim), animasyonlu açılış, ayarlardan tekrar izlenebilir.</li>
    <li><b>Cami meta-oyunu:</b> ilerledikçe açılan 7 yapı parçası (temel→hilal).</li>
    <li><b>Ebeveyn Kapısı</b> (matematikli) yalnız hassas alanda; ses/dil ayarları çocuğa açık.</li>
    <li><b>İki dil (TR/EN)</b>, Türkçe terminoloji koruması (Namaz/Sure/Harf/Abdest).</li>
    <li><b>Performans:</b> görseller WebP’e çevrildi (~39 MB → ~5,6 MB, %86 küçülme).</li>
  </ul>

  <h3><span class="ic">🎨</span> Görsel Varlıklar (35 adet · WebP)</h3>
  <div class="gallery">
    <div class="it"><img src="${IMG.mascotIdle}"/></div>
    <div class="it"><img src="${IMG.mosque}"/></div>
    <div class="it"><img src="${IMG.node}"/></div>
    <div class="it"><img src="${IMG.cloud}"/></div>
    <div class="it"><img src="${IMG.gift}"/></div>
    <div class="it"><img src="${IMG.star}"/></div>
    <div class="it"><img src="${IMG.icHome}"/></div>
    <div class="it"><img src="${IMG.icMosque}"/></div>
    <div class="it"><img src="${IMG.icSettings}"/></div>
  </div>
  <p class="muted">Maskot ifadeleri (5), cami inşa aşamaları (7), yolculuk düğümleri (çerçeve/bulut/parıltı), ödüller (yıldız/kupa/sandık), alt menü & adım ikonları, oynanış paneli, gökyüzü arka planı — tutarlı yumuşak 2.5D stilde.</p>

  ${foot("tr")}
</section>

<section class="page">
  <div class="langband"><div class="dot">TR</div><div><h2>Oyun Mantığı & Teknoloji</h2><small>Çekirdek döngü, mekanikler ve altyapı</small></div></div>

  <h3><span class="ic">🔁</span> Öğrenme Döngüsü (her harf 4 adım)</h3>
  <div class="steps">
    <div class="s"><div class="e">✏️</div><div class="t">Çiz</div><div class="d">Harfi parmakla izle</div></div>
    <div class="s"><div class="e">🧩</div><div class="t">Yapboz</div><div class="d">Parçaları birleştir</div></div>
    <div class="s"><div class="e">🔊</div><div class="t">Sesler</div><div class="d">Dinle & doğru harfi seç</div></div>
    <div class="s"><div class="e">⭐</div><div class="t">Tekrar</div><div class="d">Aralıklı tekrar (SM-2)</div></div>
  </div>

  <h3><span class="ic">🕌</span> Oyun Akışı</h3>
  <div class="card">
    <p><b>Yolculuk:</b> 28 harf bir patika üzerinde sıralı düğümler; tamamlanan harf yıldız kazanır, sıradaki harf parlar, kilitliler bulut olarak görünür. İlk 6 harf ücretsiz; sonrası abonelik ya da günde 1 ücretsiz açılış.</p>
    <p><b>Cami meta-oyunu:</b> belirli harf eşiklerinde cami parçaları açılır (temel, duvar, kubbe, minare, çini, bahçe, hilal) — çocuğa kalıcı bir başarı ve motivasyon hedefi verir.</p>
    <p><b>Ödül & geri bildirim:</b> konfeti + yıldız + ses + nazik haptik; “ceza yok” ilkesi (yanlışta yumuşak yönlendirme).</p>
  </div>

  <h3><span class="ic">🎵</span> Ses Tasarımı (20 parça)</h3>
  <p class="muted">Arka plan müziği döngüsü + 19 ses efekti: dokunuş, doğru/yumuşak-tekrar, adım & harf tamamlama, yıldız/konfeti, seviye & cami açılışı, günlük ödül, maskot sesleri, ebeveyn kapısı, karşılama. Müzik ve ses ayrı ayrı açılıp kapanabilir.</p>

  <h3><span class="ic">🧱</span> Teknoloji</h3>
  <table>
    <tr><th>Katman</th><th>Seçim</th></tr>
    <tr><td>Uygulama</td><td>Expo SDK 56 · React Native · TypeScript (iOS / Android / Web tek kod tabanı)</td></tr>
    <tr><td>Arayüz</td><td>NativeWind (Tailwind) · Reanimated · Skia/SVG · expo-image</td></tr>
    <tr><td>Durum & Veri</td><td>Zustand + MMKV (hızlı, çevrimdışı) · SQLite (aralıklı tekrar)</td></tr>
    <tr><td>Öğrenme algoritması</td><td>Modifiye SM-2 (aralıklı tekrar)</td></tr>
    <tr><td>Güvenlik</td><td>Çevrimdışı-öncelikli · davranışsal analitik yok · veri cihazda</td></tr>
  </table>

  ${foot("tr")}
</section>

<section class="page">
  <div class="langband"><div class="dot">TR</div><div><h2>Yol Haritası</h2><small>Planlanan geliştirmeler</small></div></div>
  <table>
    <tr><th>Aşama</th><th>İçerik</th><th>Durum</th></tr>
    <tr><td>Faz 1 — Çekirdek</td><td>Ana ekran, çizim & yapboz, onboarding, TR/EN, web demo</td><td class="pill-done">Tamamlandı</td></tr>
    <tr><td>Faz 2 — Oynanış</td><td>“Sesler” ve “Tekrar” mini-oyunları, SQLite ile ilerleme kalıcılığı (SM-2)</td><td class="pill-prog">Sırada</td></tr>
    <tr><td>Faz 2 — Ödül</td><td>Cami inşa kutlama animasyonu (parça açılışında tam ekran)</td><td class="pill-prog">Sırada</td></tr>
    <tr><td>Faz 3 — İçerik</td><td>Harf sesleri (TTS/kayıt), hikâye & oyun bölümleri, başarı rozetleri</td><td class="pill-plan">Planlandı</td></tr>
    <tr><td>Faz 3 — Namaz</td><td>Namaz öğrenme modülü (hareketler, sure ezberi — aralıklı tekrar)</td><td class="pill-plan">Planlandı</td></tr>
    <tr><td>Faz 4 — İş modeli</td><td>Abonelik (RevenueCat), ebeveyn paneli & ilerleme raporu</td><td class="pill-plan">Planlandı</td></tr>
    <tr><td>Faz 4 — Yayın</td><td>App Store & Google Play; çoklu profil, bildirim hatırlatıcıları</td><td class="pill-plan">Planlandı</td></tr>
  </table>
  <div class="card">
    <b>Vizyon.</b> Çocuğun Elif-Ba’dan Namaz’a uzanan, oyunlaştırılmış ve güvenli bir öğrenme yolculuğu;
    ebeveyn için şeffaf ilerleme, çocuk için “kendi camini inşa etme” motivasyonu.
  </div>
  ${foot("tr")}
</section>`;

const EN = `
<section class="page">
  <div class="langband"><div class="dot">EN</div><div><h2>Alif — Project Overview</h2><small>Elif-Ba & Namaz · Islamic learning & gamification app for ages 4–10</small></div></div>

  <div class="hero">
    <img src="${IMG.mascotIdle}"/>
    <div>
      <b>Summary.</b> With the friendly guide <b>Pırıl</b>, the child advances along a <b>journey map</b>,
      learning the 28 Arabic letters (Elif-Ba) and <b>building their own magical mosque</b> along the way.
      Fully <b>offline</b>, ad-free, and child-safety first (KVKK/COPPA/GDPR-K).
    </div>
  </div>

  <div class="stat">
    <div class="box"><div class="n">28</div><div class="l">Letters (first 6 free)</div></div>
    <div class="box"><div class="n">35</div><div class="l">Custom visuals (WebP)</div></div>
    <div class="box"><div class="n">20</div><div class="l">Sounds & music</div></div>
    <div class="box"><div class="n">2</div><div class="l">Languages (TR/EN)</div></div>
  </div>

  <h3><span class="ic">🎯</span> Current Stage</h3>
  <div class="card">
    <span class="badge">Skeleton done</span><span class="badge">Home (journey map)</span>
    <span class="badge">Trace mechanic</span><span class="badge">Puzzle mechanic</span>
    <span class="badge">TR/EN</span><span class="badge">Web demo (Vercel)</span>
    <p class="muted">The core learning loop and home screen are functional; a live web demo is available. Next phase: sound & review games, progress persistence, and the mosque-building celebration.</p>
  </div>

  <h3><span class="ic">✅</span> Delivered So Far</h3>
  <ul>
    <li><b>Home hub:</b> star & “Mosque Build %” indicator, mascot + greeting, XP/level + daily reward chest, a <b>parallax journey map</b> (illustrated letter nodes: open / active-glow / cloud-locked), 4-icon bottom navigation.</li>
    <li><b>Learning loop:</b> Trace (finger-tracing with dashed “how-to-draw” guide) and Puzzle (2×2 drag & drop) are playable.</li>
    <li><b>Character-led onboarding</b> (meet Pırıl + name), animated splash, replayable from settings.</li>
    <li><b>Mosque meta-game:</b> 7 structure parts unlock as you progress (foundation→crescent).</li>
    <li><b>Parents’ Gate</b> (math) only on sensitive areas; sound/language are child-accessible.</li>
    <li><b>Bilingual (TR/EN)</b> with Turkish terminology safeguards.</li>
    <li><b>Performance:</b> images converted to WebP (~39 MB → ~5.6 MB, 86% smaller).</li>
  </ul>

  <h3><span class="ic">🎨</span> Visual Assets (35 · WebP)</h3>
  <div class="gallery">
    <div class="it"><img src="${IMG.mascotIdle}"/></div>
    <div class="it"><img src="${IMG.mosque}"/></div>
    <div class="it"><img src="${IMG.node}"/></div>
    <div class="it"><img src="${IMG.cloud}"/></div>
    <div class="it"><img src="${IMG.gift}"/></div>
    <div class="it"><img src="${IMG.trophy}"/></div>
    <div class="it"><img src="${IMG.icLessons}"/></div>
    <div class="it"><img src="${IMG.icMosque}"/></div>
    <div class="it"><img src="${IMG.icSettings}"/></div>
  </div>
  <p class="muted">Mascot expressions (5), mosque build stages (7), journey nodes (frame/cloud/glow), rewards (star/trophy/chest), navigation & step icons, gameplay panel, sky background — in a consistent soft 2.5D style.</p>

  ${foot("en")}
</section>

<section class="page">
  <div class="langband"><div class="dot">EN</div><div><h2>Game Logic & Technology</h2><small>Core loop, mechanics and stack</small></div></div>

  <h3><span class="ic">🔁</span> Learning Loop (4 steps per letter)</h3>
  <div class="steps">
    <div class="s"><div class="e">✏️</div><div class="t">Trace</div><div class="d">Trace the letter</div></div>
    <div class="s"><div class="e">🧩</div><div class="t">Puzzle</div><div class="d">Assemble the pieces</div></div>
    <div class="s"><div class="e">🔊</div><div class="t">Sounds</div><div class="d">Listen & pick the letter</div></div>
    <div class="s"><div class="e">⭐</div><div class="t">Review</div><div class="d">Spaced repetition (SM-2)</div></div>
  </div>

  <h3><span class="ic">🕌</span> Game Flow</h3>
  <div class="card">
    <p><b>Journey:</b> 28 letters as sequential nodes on a path; a completed letter earns a star, the next one glows, locked ones appear as clouds. First 6 letters free; then subscription or one free daily unlock.</p>
    <p><b>Mosque meta-game:</b> mosque parts unlock at letter thresholds (foundation, walls, dome, minaret, tiles, garden, crescent) — a lasting sense of achievement and motivation.</p>
    <p><b>Reward & feedback:</b> confetti + star + sound + gentle haptics; a “no punishment” principle (soft guidance on mistakes).</p>
  </div>

  <h3><span class="ic">🎵</span> Sound Design (20 pieces)</h3>
  <p class="muted">Background music loop + 19 sound effects: tap, correct / gentle-retry, step & letter completion, star/confetti, level & mosque unlock, daily reward, mascot voices, parents’ gate, welcome. Music and effects toggle independently.</p>

  <h3><span class="ic">🧱</span> Technology</h3>
  <table>
    <tr><th>Layer</th><th>Choice</th></tr>
    <tr><td>App</td><td>Expo SDK 56 · React Native · TypeScript (single codebase: iOS / Android / Web)</td></tr>
    <tr><td>UI</td><td>NativeWind (Tailwind) · Reanimated · Skia/SVG · expo-image</td></tr>
    <tr><td>State & Data</td><td>Zustand + MMKV (fast, offline) · SQLite (spaced repetition)</td></tr>
    <tr><td>Learning algorithm</td><td>Modified SM-2 (spaced repetition)</td></tr>
    <tr><td>Safety</td><td>Offline-first · no behavioral analytics · data stays on device</td></tr>
  </table>

  ${foot("en")}
</section>

<section class="page">
  <div class="langband"><div class="dot">EN</div><div><h2>Roadmap</h2><small>Planned development</small></div></div>
  <table>
    <tr><th>Phase</th><th>Scope</th><th>Status</th></tr>
    <tr><td>Phase 1 — Core</td><td>Home, trace & puzzle, onboarding, TR/EN, web demo</td><td class="pill-done">Done</td></tr>
    <tr><td>Phase 2 — Gameplay</td><td>“Sounds” and “Review” mini-games, SQLite progress persistence (SM-2)</td><td class="pill-prog">Next</td></tr>
    <tr><td>Phase 2 — Reward</td><td>Mosque-building celebration animation (full-screen on unlock)</td><td class="pill-prog">Next</td></tr>
    <tr><td>Phase 3 — Content</td><td>Letter sounds (TTS/recording), story & game sections, achievement badges</td><td class="pill-plan">Planned</td></tr>
    <tr><td>Phase 3 — Namaz</td><td>Prayer-learning module (movements, surah memorization — spaced repetition)</td><td class="pill-plan">Planned</td></tr>
    <tr><td>Phase 4 — Business</td><td>Subscription (RevenueCat), parent dashboard & progress report</td><td class="pill-plan">Planned</td></tr>
    <tr><td>Phase 4 — Launch</td><td>App Store & Google Play; multi-profile, reminder notifications</td><td class="pill-plan">Planned</td></tr>
  </table>
  <div class="card">
    <b>Vision.</b> A gamified, safe learning journey from Elif-Ba to Namaz;
    transparent progress for parents, and the motivation of “building your own mosque” for the child.
  </div>
  ${foot("en")}
</section>`;

const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"/><title>Alif — Müşteri Sunumu</title><style>${CSS}</style></head><body>${COVER}${TR}${EN}</body></html>`;

mkdirSync(resolve(ROOT, "docs"), { recursive: true });
writeFileSync(resolve(ROOT, "docs/Alif-Sunum.html"), html);
console.log("HTML yazıldı: docs/Alif-Sunum.html (" + Math.round(html.length / 1024) + " KB)");

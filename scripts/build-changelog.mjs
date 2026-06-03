// Alif — "Bugün ne yaptık" profesyonel rapor PDF üreteci (EN önce, sonra TR).
// HTML üretir → Chrome headless --print-to-pdf ile PDF'e çevrilir.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const b64 = (rel) => `data:image/webp;base64,${readFileSync(resolve(ROOT, rel)).toString("base64")}`;

const IMG = {
  mascot: b64("assets/illustrations/mascot/piril_celebrate.webp"),
  mascotIdle: b64("assets/illustrations/mascot/piril_idle.webp"),
  star: b64("assets/illustrations/rewards/star.webp"),
  node: b64("assets/illustrations/journey/node_tile.webp"),
  // bugünün asset'leri
  sIntro: b64("assets/illustrations/decor/ic_step_intro.webp"),
  sHear: b64("assets/illustrations/decor/ic_step_heartap.webp"),
  sMatch: b64("assets/illustrations/decor/ic_step_match.webp"),
  sDrag: b64("assets/illustrations/decor/ic_step_drag.webp"),
  sBalloon: b64("assets/illustrations/decor/ic_step_balloon.webp"),
  sCatch: b64("assets/illustrations/decor/ic_step_catch.webp"),
  basket: b64("assets/illustrations/decor/piril_basket.webp"),
  cardBack: b64("assets/illustrations/decor/card_back.webp"),
  balloon: b64("assets/illustrations/decor/balloon_pink.webp"),
  pop: b64("assets/illustrations/decor/pop_burst.webp"),
  lane: b64("assets/illustrations/decor/catch_lane.webp"),
  mosqueA: b64("assets/illustrations/mosque/mosque_stage_4.webp"),
  mosqueB: b64("assets/illustrations/mosque/mosque_stage_5.webp"),
};

const DATE = "01.06.2026";

const CSS = `
:root{--primary:#208AEF;--primary-d:#0E5FC2;--gold:#F5A524;--teal:#2E8B9E;--ink:#222933;--muted:#6B7682;--cream:#FAF7F0;--line:#E7E2D6;--green:#3FB984}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:0}
html,body{margin:0;padding:0;font-family:-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);font-size:11.5px;line-height:1.5}
.page{position:relative;width:210mm;min-height:297mm;padding:18mm 18mm 16mm;page-break-after:always;overflow:hidden}
.page:last-child{page-break-after:auto}
.cover{background:linear-gradient(170deg,#9FD2FF 0%,#CDE9FF 42%,#FBF3DE 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0}
.cover .mascot{width:170px;height:170px;object-fit:contain;filter:drop-shadow(0 12px 22px rgba(20,98,181,.28))}
.cover h1{font-size:54px;margin:8px 0 0;color:var(--primary-d);letter-spacing:-1px;text-shadow:0 2px 0 rgba(255,255,255,.7)}
.cover .tag{font-size:17px;color:#3a5168;font-weight:700;margin-top:8px}
.cover .tag2{font-size:13px;color:#5a6b7d;margin-top:2px}
.cover .meta{margin-top:30px;background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.9);border-radius:16px;padding:14px 26px;font-size:12px;color:#41566a}
.cover .meta b{color:var(--primary-d)}
.cover .conf{position:absolute;bottom:16mm;font-size:10px;letter-spacing:2px;color:#6c8197;text-transform:uppercase}
.langband{display:flex;align-items:center;gap:10px;border-bottom:3px solid var(--gold);padding-bottom:8px;margin-bottom:12px}
.langband .dot{width:34px;height:34px;border-radius:10px;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px}
.langband h2{margin:0;font-size:19px;color:var(--primary-d)}
.langband small{color:var(--muted);font-size:11px}
h3{font-size:13.5px;margin:15px 0 7px;color:var(--ink);display:flex;align-items:center;gap:8px}
h3 .ic{width:22px;height:22px;border-radius:7px;background:var(--cream);border:1px solid var(--line);display:flex;align-items:center;justify-content:center;font-size:13px}
p{margin:6px 0}.muted{color:var(--muted)}
.card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:11px 13px;margin:8px 0;box-shadow:0 2px 6px rgba(40,60,90,.04)}
ul{margin:6px 0;padding-left:18px}li{margin:3px 0}
.badge{display:inline-block;background:#EAF4FE;color:var(--primary-d);border-radius:999px;padding:2px 10px;font-size:10px;font-weight:700;margin:2px 4px 2px 0}
.badge.g{background:#FFF3DC;color:#9a6a12}.badge.t{background:#E3F4F5;color:#1d6b76}.badge.gr{background:#E6F7EE;color:#1f7a4d}
.stat{display:flex;gap:9px;margin:10px 0}
.stat .box{flex:1;background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:10px 8px;text-align:center}
.stat .box .n{font-size:22px;font-weight:800;color:var(--primary-d)}
.stat .box .l{font-size:9.5px;color:var(--muted);margin-top:2px}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:11px}
th,td{text-align:left;padding:7px 9px;border-bottom:1px solid var(--line);vertical-align:top}
th{background:var(--cream);color:#54606d;font-size:10px;text-transform:uppercase;letter-spacing:.4px}
.pill-done{color:var(--green);font-weight:700}.pill-fix{color:var(--gold);font-weight:700}
.gallery{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}
.gallery .it{width:62px;height:62px;border-radius:12px;background:#EAF4FE;border:1px solid var(--line);display:flex;align-items:center;justify-content:center}
.gallery .it img{max-width:52px;max-height:52px;object-fit:contain}
.gallery .it.wide{width:120px}
.gallery .cap{font-size:8.5px;color:var(--muted);text-align:center;width:62px;margin-top:-4px}
.steps{display:flex;gap:7px;margin:8px 0}
.steps .s{flex:1;background:#fff;border:1px solid var(--line);border-radius:12px;padding:8px 4px;text-align:center}
.steps .s img{width:30px;height:30px;object-fit:contain}
.steps .s .t{font-weight:800;font-size:10.5px;margin-top:3px;color:var(--ink)}
.steps .s .d{font-size:8.5px;color:var(--muted);margin-top:1px}
.foot{position:absolute;bottom:10mm;left:18mm;right:18mm;display:flex;justify-content:space-between;font-size:9px;color:#9aa6b2;border-top:1px solid var(--line);padding-top:6px}
.hero{display:flex;gap:14px;align-items:center;background:linear-gradient(120deg,#EAF4FE,#FBF3DE);border:1px solid var(--line);border-radius:14px;padding:13px;margin-bottom:4px}
.hero img{width:78px;height:78px;object-fit:contain}
.before{background:#FFF6F2;border:1px solid #F3D8CC;border-radius:10px;padding:8px 11px;margin:6px 0;font-size:10.5px}
.before b{color:#c0532b}
.after{background:#EEF9F1;border:1px solid #CBE9D5;border-radius:10px;padding:8px 11px;margin:6px 0;font-size:10.5px}
.after b{color:#1f7a4d}
.transition{display:flex;align-items:center;gap:10px;justify-content:center;margin:8px 0}
.transition img{width:96px;height:96px;object-fit:contain;background:#FBF3DE;border:1px solid var(--line);border-radius:12px;padding:4px}
.transition .arrow{font-size:26px;color:var(--gold)}
`;

const foot = (lang) =>
  `<div class="foot"><span>Alif — Elif-Ba & Namaz · DeenStudios</span><span>${lang === "tr" ? "Günlük İlerleme Raporu" : "Daily Progress Report"} · ${DATE}</span></div>`;

const COVER = `
<section class="page cover">
  <img class="mascot" src="${IMG.mascot}"/>
  <h1>Alif</h1>
  <div class="tag">Daily Progress Report · Günlük İlerleme Raporu</div>
  <div class="tag2">No-Reading Game Pool v3 · Yazısız Oyun Havuzu v3</div>
  <div class="meta"><b>Date / Tarih:</b> ${DATE} &nbsp;·&nbsp; <b>Demo:</b> deenalifba.vercel.app &nbsp;·&nbsp; <b>Repo:</b> github.com/seyidturgut/deenalifba</div>
  <div class="conf">DeenStudios · Internal / Client</div>
</section>`;

// ---------------- EN ----------------
const EN = `
<section class="page">
  <div class="langband"><div class="dot">EN</div><div><h2>What We Built Today — Overview</h2><small>Redesign of the practice games around a strict "no-reading" principle</small></div></div>

  <div class="hero">
    <img src="${IMG.mascotIdle}"/>
    <div><b>Headline.</b> We replaced the old text-driven practice games with a <b>variable, no-reading game pool</b>: children can't read yet, so every game is understood through <b>audio (Pırıl speaks the target) + an obvious visual mechanic</b>. We also added all the supporting artwork, fixed the mosque "build" cutscene, and shipped everything to the live demo.</div>
  </div>

  <div class="stat">
    <div class="box"><div class="n">5</div><div class="l">New games</div></div>
    <div class="box"><div class="n">12</div><div class="l">New illustrations</div></div>
    <div class="box"><div class="n">1</div><div class="l">New sound</div></div>
    <div class="box"><div class="n">3</div><div class="l">Bug fixes</div></div>
    <div class="box"><div class="n">1</div><div class="l">Deploy</div></div>
  </div>

  <h3><span class="ic">🎯</span> The "No-Reading" Principle</h3>
  <div class="card">
    <p>Every kid-facing game now follows one rule: <b>the target is spoken by Pırıl (auto + a big 🔊 "Listen" button)</b>, the mechanic is self-evident (tap / match / drag / pop / catch), and on-screen text is decoration only. Mistakes are never punished — gentle wobble + soft sound.</p>
    <span class="badge gr">Audio-first</span><span class="badge gr">Obvious mechanic</span><span class="badge gr">No punishment</span><span class="badge">Removed: "Spot" & "Sounds" (text-based)</span>
  </div>

  <h3><span class="ic">🧩</span> The Lesson Flow (per letter)</h3>
  <div class="steps">
    <div class="s"><img src="${IMG.sIntro}"/><div class="t">Learn</div><div class="d">Meet letter + sound</div></div>
    <div class="s"><img src="${IMG.node}"/><div class="t">Connect</div><div class="d">Constellation trace</div></div>
    <div class="s"><img src="${IMG.sHear}"/><div class="t">Practice ×1–2</div><div class="d">From the pool below</div></div>
    <div class="s"><img src="${IMG.star}"/><div class="t">Review</div><div class="d">Spaced repetition</div></div>
  </div>
  <p class="muted">The practice step now varies per letter (deterministic rotation) so lessons never feel repetitive.</p>

  ${foot("en")}
</section>

<section class="page">
  <div class="langband"><div class="dot">EN</div><div><h2>The 5 New Practice Games</h2><small>All audio-driven, all wordless</small></div></div>

  <table>
    <tr><th>Game</th><th>Icon</th><th>How it works</th></tr>
    <tr><td><b>Hear &amp; Tap</b><br/><span class="muted">Duy &amp; Dokun</span></td><td><img src="${IMG.sHear}" width="30"/></td><td>Pırıl says the letter; the child taps the correct one of 4 cards. (Merges the old Spot + Sounds into one wordless game.)</td></tr>
    <tr><td><b>Match</b><br/><span class="muted">Eşleştir</span></td><td><img src="${IMG.sMatch}" width="30"/></td><td>6 face-down cards = 3 pairs. Flip &amp; match identical letters; flipping plays that letter's sound. Progress stars show pairs left.</td></tr>
    <tr><td><b>Give to Pırıl</b><br/><span class="muted">Pırıl'a Ver</span></td><td><img src="${IMG.sDrag}" width="30"/></td><td>Drag the correct letter <b>up into Pırıl's basket</b>. A looping ghost-card + hand <b>demo</b> teaches the gesture; big pulsing target.</td></tr>
    <tr><td><b>Balloon Pop</b><br/><span class="muted">Balon Patlat</span></td><td><img src="${IMG.sBalloon}" width="30"/></td><td>Letter balloons float up; pop the correct ones (3 to win) with a burst effect + pop sound.</td></tr>
    <tr><td><b>Catch</b><br/><span class="muted">Yakala</span></td><td><img src="${IMG.sCatch}" width="30"/></td><td>Letters slide <b>right → left</b> on a cloud-river lane; catch the correct one as it passes (3 to win).</td></tr>
  </table>

  <h3><span class="ic">🎨</span> New Step Icons (StepBar)</h3>
  <p class="muted">Replaced plain emoji with consistent illustrated icons matching the existing pencil/star set:</p>
  <div class="gallery">
    <div><div class="it"><img src="${IMG.sIntro}"/></div><div class="cap">Learn</div></div>
    <div><div class="it"><img src="${IMG.sHear}"/></div><div class="cap">Hear&amp;Tap</div></div>
    <div><div class="it"><img src="${IMG.sMatch}"/></div><div class="cap">Match</div></div>
    <div><div class="it"><img src="${IMG.sDrag}"/></div><div class="cap">Give</div></div>
    <div><div class="it"><img src="${IMG.sBalloon}"/></div><div class="cap">Balloon</div></div>
    <div><div class="it"><img src="${IMG.sCatch}"/></div><div class="cap">Catch</div></div>
  </div>

  <h3><span class="ic">🖼️</span> New Game Art</h3>
  <div class="gallery">
    <div><div class="it"><img src="${IMG.basket}"/></div><div class="cap">Pırıl + basket</div></div>
    <div><div class="it"><img src="${IMG.cardBack}"/></div><div class="cap">Card back</div></div>
    <div><div class="it"><img src="${IMG.balloon}"/></div><div class="cap">Balloon</div></div>
    <div><div class="it"><img src="${IMG.pop}"/></div><div class="cap">Pop burst</div></div>
    <div><div class="it wide"><img src="${IMG.lane}"/></div><div class="cap">Catch lane</div></div>
  </div>
  <p class="muted">Single pink balloon sprite is <b>re-tinted in code</b> (6-color palette) so balloons are colorful without extra art.</p>

  ${foot("en")}
</section>

<section class="page">
  <div class="langband"><div class="dot">EN</div><div><h2>Fixes, Tools &amp; Delivery</h2><small>Polish, bug fixes and the technology used today</small></div></div>

  <h3><span class="ic">🕌</span> Mosque Cutscene — "from → to"</h3>
  <div class="transition"><img src="${IMG.mosqueA}"/><span class="arrow">➜</span><img src="${IMG.mosqueB}"/></div>
  <div class="before"><b>Before:</b> the new stage just "popped" in — you couldn't tell what changed. Worse, on the web demo the dark overlay &amp; card didn't even render.</div>
  <div class="after"><b>After:</b> it shows the <b>previous</b> stage first, then the new part <b>grows in</b> with a crossfade + sparkle. Root cause fix: the backdrop/card used Reanimated <code>entering</code> (FadeIn/ZoomIn), which is unreliable on React Native Web — switched to shared-value animations (works on web + native).</div>

  <h3><span class="ic">🐞</span> Other Fixes</h3>
  <ul>
    <li><b>Balloon pop effect was invisible</b> — the burst lived inside the layer whose opacity faded to 0; separated position from body so the burst shows.</li>
    <li><b>Match "doesn't continue"</b> — added a 3-star pair-progress indicator so it's clear all pairs must be matched.</li>
    <li><b>Consistency</b> — all progress indicators now use the illustrated star (no more emoji).</li>
  </ul>

  <h3><span class="ic">🧱</span> Technology &amp; Tools Used Today</h3>
  <table>
    <tr><th>Area</th><th>Used</th></tr>
    <tr><td>App / UI</td><td>Expo SDK 56 · React Native · TypeScript · NativeWind (Tailwind)</td></tr>
    <tr><td>Animation / Gesture</td><td>react-native-reanimated · react-native-gesture-handler · react-native-svg</td></tr>
    <tr><td>Media</td><td>expo-image (WebP) · expo-audio · expo-haptics</td></tr>
    <tr><td>State / i18n</td><td>Zustand + MMKV · i18next (TR/EN) · Turkish terminology guard</td></tr>
    <tr><td>Asset pipeline</td><td>AI image generation (prompts) → transparent-trim (pngjs) → <b>cwebp</b> WebP (~1.5 MB → ~100–180 KB each)</td></tr>
    <tr><td>QA</td><td>Live preview (390×844) verification of every game · <code>tsc --noEmit</code> clean</td></tr>
    <tr><td>Delivery</td><td>Git → GitHub (<code>main</code>) → Vercel auto-deploy</td></tr>
  </table>

  <h3><span class="ic">✅</span> Verification &amp; Deploy</h3>
  <div class="card"><span class="badge gr">Type-check clean</span><span class="badge gr">5 games verified in preview</span><span class="badge gr">Mosque cutscene verified</span><span class="badge">Secret scan passed</span><span class="badge t">Pushed to main → Vercel</span>
  <p class="muted">Commit <code>129976c</code> shipped to the live demo. Remaining: optional extra balloon colors, and Phase B (28 letter→word illustrations).</p></div>

  ${foot("en")}
</section>`;

// ---------------- TR ----------------
const TR = `
<section class="page">
  <div class="langband"><div class="dot">TR</div><div><h2>Bugün Ne Yaptık — Özet</h2><small>Pratik oyunlarının katı bir "yazısız" ilkeyle yeniden tasarımı</small></div></div>

  <div class="hero">
    <img src="${IMG.mascotIdle}"/>
    <div><b>Başlık.</b> Eski, yazıya dayalı pratik oyunlarını <b>değişken, yazısız bir oyun havuzu</b> ile değiştirdik: çocuklar okuyamaz, bu yüzden her oyun <b>ses (Pırıl hedefi söyler) + bariz görsel mekanik</b> ile anlaşılır. Ayrıca tüm destekleyici görselleri ekledik, cami "inşa" sahnesini düzelttik ve hepsini canlı demoya gönderdik.</div>
  </div>

  <div class="stat">
    <div class="box"><div class="n">5</div><div class="l">Yeni oyun</div></div>
    <div class="box"><div class="n">12</div><div class="l">Yeni illüstrasyon</div></div>
    <div class="box"><div class="n">1</div><div class="l">Yeni ses</div></div>
    <div class="box"><div class="n">3</div><div class="l">Hata düzeltme</div></div>
    <div class="box"><div class="n">1</div><div class="l">Yayın</div></div>
  </div>

  <h3><span class="ic">🎯</span> "Yazısız" İlkesi</h3>
  <div class="card">
    <p>Çocuğa dönük her oyun artık tek kural: <b>hedefi Pırıl sesli söyler (otomatik + büyük 🔊 "Dinle")</b>, mekanik kendiliğinden bellidir (dokun / eşleştir / sürükle / patlat / yakala), ekrandaki yazı yalnız dekordur. Yanlışta ceza yok — nazik sallanma + yumuşak ses.</p>
    <span class="badge gr">Ses-öncelikli</span><span class="badge gr">Bariz mekanik</span><span class="badge gr">Ceza yok</span><span class="badge">Kaldırıldı: "Bul" &amp; "Sesler" (yazılı)</span>
  </div>

  <h3><span class="ic">🧩</span> Ders Akışı (her harf)</h3>
  <div class="steps">
    <div class="s"><img src="${IMG.sIntro}"/><div class="t">Tanı</div><div class="d">Harf + ses</div></div>
    <div class="s"><img src="${IMG.node}"/><div class="t">Birleştir</div><div class="d">Takımyıldız</div></div>
    <div class="s"><img src="${IMG.sHear}"/><div class="t">Pratik ×1–2</div><div class="d">Aşağıdaki havuzdan</div></div>
    <div class="s"><img src="${IMG.star}"/><div class="t">Tekrar</div><div class="d">Aralıklı tekrar</div></div>
  </div>
  <p class="muted">Pratik adımı artık her harfte değişir (deterministik dönüşüm) → ders tekdüze olmaz.</p>

  ${foot("tr")}
</section>

<section class="page">
  <div class="langband"><div class="dot">TR</div><div><h2>5 Yeni Pratik Oyunu</h2><small>Hepsi sesli, hepsi yazısız</small></div></div>

  <table>
    <tr><th>Oyun</th><th>İkon</th><th>Nasıl çalışır</th></tr>
    <tr><td><b>Duy &amp; Dokun</b></td><td><img src="${IMG.sHear}" width="30"/></td><td>Pırıl harfi söyler; çocuk 4 karttan doğrusuna dokunur. (Eski "Bul" + "Sesler"i tek yazısız oyunda birleştirir.)</td></tr>
    <tr><td><b>Eşleştir</b></td><td><img src="${IMG.sMatch}" width="30"/></td><td>6 kapalı kart = 3 çift. Aynı harfleri çevirip eşleştir; çevirince o harfin sesi çalar. Yıldızlar kaç çift kaldığını gösterir.</td></tr>
    <tr><td><b>Pırıl'a Ver</b></td><td><img src="${IMG.sDrag}" width="30"/></td><td>Doğru harfi <b>yukarı, Pırıl'ın sepetine sürükle</b>. Tekrarlayan hayalet-kart + el <b>demosu</b> hareketi öğretir; büyük nabızlı hedef.</td></tr>
    <tr><td><b>Balon Patlat</b></td><td><img src="${IMG.sBalloon}" width="30"/></td><td>Harfli balonlar yükselir; doğruları patlat (3 doğru → biter) — patlama efekti + pop sesi.</td></tr>
    <tr><td><b>Yakala</b></td><td><img src="${IMG.sCatch}" width="30"/></td><td>Harfler bir bulut-nehri şeritte <b>sağdan sola kayar</b>; doğru olanı geçerken yakala (3 doğru → biter).</td></tr>
  </table>

  <h3><span class="ic">🎨</span> Yeni Adım İkonları (StepBar)</h3>
  <p class="muted">Düz emojiler, mevcut kalem/yıldız setiyle uyumlu illüstrasyon ikonlarla değişti:</p>
  <div class="gallery">
    <div><div class="it"><img src="${IMG.sIntro}"/></div><div class="cap">Tanı</div></div>
    <div><div class="it"><img src="${IMG.sHear}"/></div><div class="cap">Duy&amp;Dokun</div></div>
    <div><div class="it"><img src="${IMG.sMatch}"/></div><div class="cap">Eşleştir</div></div>
    <div><div class="it"><img src="${IMG.sDrag}"/></div><div class="cap">Ver</div></div>
    <div><div class="it"><img src="${IMG.sBalloon}"/></div><div class="cap">Balon</div></div>
    <div><div class="it"><img src="${IMG.sCatch}"/></div><div class="cap">Yakala</div></div>
  </div>

  <h3><span class="ic">🖼️</span> Yeni Oyun Görselleri</h3>
  <div class="gallery">
    <div><div class="it"><img src="${IMG.basket}"/></div><div class="cap">Pırıl + sepet</div></div>
    <div><div class="it"><img src="${IMG.cardBack}"/></div><div class="cap">Kart arkası</div></div>
    <div><div class="it"><img src="${IMG.balloon}"/></div><div class="cap">Balon</div></div>
    <div><div class="it"><img src="${IMG.pop}"/></div><div class="cap">Patlama</div></div>
    <div><div class="it wide"><img src="${IMG.lane}"/></div><div class="cap">Yakala şeridi</div></div>
  </div>
  <p class="muted">Tek pembe balon sprite'ı <b>kodla renklendiriliyor</b> (6 renkli palet) → ek görsel olmadan renkli balonlar.</p>

  ${foot("tr")}
</section>

<section class="page">
  <div class="langband"><div class="dot">TR</div><div><h2>Düzeltmeler, Araçlar &amp; Yayın</h2><small>Cila, hata düzeltmeleri ve bugün kullanılan teknoloji</small></div></div>

  <h3><span class="ic">🕌</span> Cami Sahnesi — "nereden → nereye"</h3>
  <div class="transition"><img src="${IMG.mosqueA}"/><span class="arrow">➜</span><img src="${IMG.mosqueB}"/></div>
  <div class="before"><b>Önce:</b> yeni aşama "lap" diye geliyordu — neyin değiştiği belli olmuyordu. Üstelik web demosunda koyu zemin &amp; kart hiç görünmüyordu.</div>
  <div class="after"><b>Sonra:</b> önce <b>önceki</b> aşama gösteriliyor, sonra yeni parça <b>büyüyerek</b> beliriyor (crossfade + parıltı). Kök neden: backdrop/kart Reanimated <code>entering</code> (FadeIn/ZoomIn) kullanıyordu → React Native Web'de güvenilir değil; shared-value animasyonuna çevrildi (web + cihaz çalışıyor).</div>

  <h3><span class="ic">🐞</span> Diğer Düzeltmeler</h3>
  <ul>
    <li><b>Balon patlama efekti görünmüyordu</b> — efekt, opacity'si 0'a inen katmanın içindeydi; konum ile gövde ayrıldı, efekt artık görünür.</li>
    <li><b>Eşleştir "devam etmiyor" algısı</b> — 3 yıldızlı çift-ilerleme göstergesi eklendi; tüm çiftlerin eşleşmesi gerektiği belli oldu.</li>
    <li><b>Tutarlılık</b> — tüm ilerleme göstergeleri artık illüstrasyon yıldız (emoji yok).</li>
  </ul>

  <h3><span class="ic">🧱</span> Bugün Kullanılan Teknoloji &amp; Araçlar</h3>
  <table>
    <tr><th>Alan</th><th>Kullanılan</th></tr>
    <tr><td>Uygulama / Arayüz</td><td>Expo SDK 56 · React Native · TypeScript · NativeWind (Tailwind)</td></tr>
    <tr><td>Animasyon / Hareket</td><td>react-native-reanimated · gesture-handler · react-native-svg</td></tr>
    <tr><td>Medya</td><td>expo-image (WebP) · expo-audio · expo-haptics</td></tr>
    <tr><td>Durum / Dil</td><td>Zustand + MMKV · i18next (TR/EN) · Türkçe terminoloji koruması</td></tr>
    <tr><td>Asset hattı</td><td>AI ile görsel üretimi (promptlar) → şeffaf kırpma (pngjs) → <b>cwebp</b> WebP (~1,5 MB → ~100–180 KB)</td></tr>
    <tr><td>Kalite</td><td>Canlı önizleme (390×844) ile her oyunun doğrulanması · <code>tsc --noEmit</code> temiz</td></tr>
    <tr><td>Yayın</td><td>Git → GitHub (<code>main</code>) → Vercel otomatik deploy</td></tr>
  </table>

  <h3><span class="ic">✅</span> Doğrulama &amp; Yayın</h3>
  <div class="card"><span class="badge gr">Tip kontrolü temiz</span><span class="badge gr">5 oyun önizlemede doğrulandı</span><span class="badge gr">Cami sahnesi doğrulandı</span><span class="badge">Secret tarama temiz</span><span class="badge t">main'e push → Vercel</span>
  <p class="muted">Commit <code>129976c</code> canlı demoya gönderildi. Kalan: opsiyonel ek balon renkleri ve Faz B (28 harf→kelime illüstrasyonu).</p></div>

  ${foot("tr")}
</section>`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Alif — Daily Progress ${DATE}</title><style>${CSS}</style></head><body>${COVER}${EN}${TR}</body></html>`;

mkdirSync(resolve(ROOT, "docs"), { recursive: true });
writeFileSync(resolve(ROOT, "docs/Alif-Bugun.html"), html);
console.log("HTML yazıldı: docs/Alif-Bugun.html (" + Math.round(html.length / 1024) + " KB)");

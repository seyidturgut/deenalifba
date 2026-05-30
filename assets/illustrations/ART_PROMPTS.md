# Alif — Profesyonel İllüstrasyon Seti (AAA) — Üretim Prompt'ları

Amaç: Toca Boca / Sago Mini / Duolingo seviyesinde **tutarlı, premium** bir görsel set.
AAA görünümün sırrı tek tek güzel görseller DEĞİL → **tutarlılık**. Bunu 3 kuralla sağlıyoruz.

---

## ⭐ EN ÖNEMLİ 3 KURAL (bunlar olmadan "hava" gelmez)

1. **STİL KİLİDİ'ni her prompt'un BAŞINA birebir yapıştır** (aşağıda). Değiştirme.
2. **Önce maskotu (piril_idle) üret. Sonra her görselde onu referans görsel olarak ekle** ve şunu yaz:
   *"in the exact same art style, rendering, lighting and color palette as the attached reference image."*
   (ChatGPT'de görseli yükle + prompt). Bu, tüm setin aynı elden çıkmış gibi durmasını sağlar.
3. **Hepsini TEK sohbette üret.** Sohbet bağlamı stili korur. Araç: ChatGPT "Create image" (gpt-image-1).

---

## 🎨 STİL KİLİDİ  (her prompt'un başına yapıştır — kelimesi kelimesine)

> Premium mobile game illustration for a children's Islamic learning app. Soft-rendered 2.5D style: smooth rounded chunky shapes, clean confident dark-teal outlines, soft cel-shading with gentle smooth gradients, subtle ambient occlusion, warm soft top-light with a delicate rim-light, glossy highlights, cozy and magical wholesome mood, high production value like Toca Boca, Sago Mini and Duolingo. Color palette: sky blue #37ACFF, deep blue #1E83E8, warm gold #F5A524, cream #FAF7F0, soft teal #2E8B9E, mint #6FB36A. Crisp, polished, premium app-store quality.

## ⚙️ TEKNİK KURALLAR (her görsele uygula)
- **Şeffaf arka plan** (transparent background). ChatGPT yapamazsa: *plain solid flat #F2F2F2 gray background, isolated, no scene* → ben temizlerim.
- **1:1 kare**, mümkünse **2048×2048**, yüksek çözünürlük.
- **Ortalanmış**, bol kenar boşluğu, **tek nesne**.
- **METİN YOK, harf yok, kelime yok, imza yok.**
- Sahne görselleri (bg/*) hariç hepsi şeffaf/izole.

---

## 1) MASKOT "Pırıl" — ifade seti  → `assets/illustrations/mascot/`
> Aynı karakter, aynı boyut/çerçeveleme, sadece ifade/poz değişir. Bu set ile göz kırpma,
> konuşma, tepki animasyonlarını (Rive olmadan, frame-swap ile) yapabilirim.

Karakter tanımı (her poza ekle): *a cute friendly Ramadan lantern (fanous) character named Pırıl, golden metal frame with deep-blue glass panels decorated with tiny stars and a crescent moon, a glowing soft star-shaped face inside, big sparkly happy eyes, rosy cheeks, two short blue arms, no legs.*

| Dosya | Poz / ifade |
|---|---|
| `piril_idle.png` | standing calm, gentle smile, looking forward (BUNU İLK ÜRET — referans) |
| `piril_blink.png` | identical pose, eyes closed (happy ^_^) — göz kırpma için |
| `piril_talk.png` | identical pose, mouth open mid-speech, friendly |
| `piril_happy.png` | big joyful smile, eyes sparkling |
| `piril_celebrate.png` | both arms up, cheering, confetti-ready excited face |
| `piril_wave.png` | one arm waving hello |
| `piril_point.png` | one arm pointing forward/up (yönlendirme için) |
| `piril_think.png` | curious thinking face, one hand near cheek |
| `piril_encourage.png` | warm gentle supportive smile (yanlışta cesaretlendirme) |
| `piril_sleep.png` | eyes closed peacefully, tiny "z" optional |

## 2) ARKA PLAN SAHNELERİ  → `assets/illustrations/bg/`  (şeffaf DEĞİL, tam sahne, 9:16 dikey)
> Tek stil, aynı ışık. Parallax için katmanlı düşün (uzak gökyüzü + yakın zemin).

| Dosya | Sahne |
|---|---|
| `bg_sky.png` | dreamy warm daytime sky, soft fluffy clouds, faint sparkles, gentle gradient — ana ekran zemini (9:16) |
| `bg_sunset.png` | cozy warm sunset/dusk sky with crescent moon and stars — akşam varyantı (9:16) |
| `bg_ground.png` | soft rolling green hills with tiny flowers and bushes, foreground strip (geniş, alt şerit) |
| `bg_intro.png` | magical welcome scene: glowing sky, floating sparkles and lanterns, inviting (9:16) |

## 3) CAMİ — inşa aşamaları  → `assets/illustrations/mosque/`  (şeffaf, AYNI kamera/açı/boyut)
> Çok önemli: **aynı açı, aynı çerçeve, aynı ışık**, sadece daha fazla parça eklenmiş.
> Bunları ilerlemeye göre sırayla göstereceğim (frame-swap inşa hissi).

Ortak: *a cute stylized mosque, isometric-ish 3/4 view, centered, same camera and scale across all stages.*

| Dosya | Aşama |
|---|---|
| `mosque_stage_1.png` | only the stone foundation platform |
| `mosque_stage_2.png` | foundation + cream walls and arched door |
| `mosque_stage_3.png` | + decorative gold tile band around walls |
| `mosque_stage_4.png` | + large teal-blue dome on top |
| `mosque_stage_5.png` | + two slender minarets with small domes |
| `mosque_stage_6.png` | + green garden, bushes and flowers around base |
| `mosque_stage_7.png` | + golden crescent finial on the dome, fully complete, a few sparkles |

## 4) ÖDÜL & GERİ BİLDİRİM  → `assets/illustrations/rewards/`  (şeffaf)
| Dosya | Görsel |
|---|---|
| `star.png` | a cheerful golden five-pointed star with a happy face and sparkles |
| `star_empty.png` | same star but gray/uncollected (dim, no face glow) |
| `confetti_piece_*.png` | a few small confetti pieces (gold, blue, mint, pink) — opsiyonel |
| `trophy.png` | a cute golden trophy with stars |
| `gift.png` | a wrapped gift box, blue with gold ribbon |
| `badge_frame.png` | a circular gold rosette/badge frame (içine ikon koyacağım) |
| `sparkle.png` | a single soft glowing sparkle/star-burst |

## 5) İKONLAR  → `assets/illustrations/icons/`  (şeffaf, basit, kalın, tutarlı)
> Hepsi aynı dolgun yuvarlak ikon stili, gold/blue. Tek nesne, net silüet.
| Dosya | İkon |
|---|---|
| `ic_home.png` | cozy little house |
| `ic_mosque.png` | tiny mosque silhouette icon |
| `ic_settings.png` | rounded gear |
| `ic_sound_on.png` / `ic_sound_off.png` | speaker on / muted |
| `ic_back.png` | rounded left arrow |
| `ic_lock.png` | cute padlock |
| `ic_play.png` | rounded play triangle |
| `ic_heart.png` | soft heart (can/ödül) |
| `ic_star_small.png` | small star (HUD) |

## 6) UI PARÇALARI  → `assets/illustrations/ui/`  (şeffaf, 9-patch düşünmeden, geniş)
| Dosya | Parça |
|---|---|
| `panel.png` | a rounded glossy card/panel with soft inner highlight (içerik kabı) |
| `button_primary.png` | a chunky glossy blue 3D game button (boş, üstüne yazı koyacağım) |
| `button_gold.png` | a chunky glossy gold 3D game button |
| `ribbon_title.png` | a decorative banner/ribbon for screen titles |
| `progress_track.png` / `progress_fill.png` | rounded progress bar boş / dolu (gold) |
| `speech_bubble.png` | a rounded white speech bubble with tail (maskot konuşması) |

## 7) DEKOR  → `assets/illustrations/decor/`  (şeffaf, arka plan süsleri)
| Dosya | Görsel |
|---|---|
| `cloud_1.png`, `cloud_2.png` | soft fluffy stylized clouds |
| `lantern_hanging.png` | a small decorative hanging lantern |
| `star_tiny_*.png` | tiny twinkle stars |
| `plant_bush.png`, `plant_flower.png` | a cute bush / a small flower |
| `pattern_tile.png` | a seamless subtle islamic geometric pattern tile (çok açık, arka plan dokusu) |

## 8) MARKA  → `assets/illustrations/`  (kare)
| Dosya | Görsel |
|---|---|
| `app_icon.png` | Pırıl maskotu, marka mavi gradyan zeminde, app icon kompozisyonu, 1024×1024 (şeffaf değil) |
| `wordmark.png` | "Alif" kelime-markası — *ama harf üretemediği için bunu ben tipografiyle yaparım, atla* |

---

## ✅ Üretim sırası (önerilen)
1. `piril_idle` → indir, bundan sonra **her prompt'a referans olarak ekle**.
2. Diğer maskot ifadeleri (referanslı).
3. Cami aşamaları (1→7, hepsinde "same camera/scale as previous").
4. Ödüller → ikonlar → UI → dekor → arka planlar → app icon.

## Bittiğinde
İlgili alt klasörlere bu isimlerle koy, bana **"setler hazır"** de. Ben:
- Maskot ifade setiyle **göz kırpma + konuşma + tepki** animasyonu (Rive olmadan, frame-swap),
- Cami aşamalarıyla **inşa hissi** (ilerlemeye göre),
- Tüm ekranları yeni illüstrasyon/ikon/UI ile **giydirme** yaparım.

> Not: Şeffaflık çıkmazsa düz gri/beyaz zeminde ver, ben arka planı temizlerim (`strip-white-bg.mjs`).

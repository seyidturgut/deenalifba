# Pırıl (Hüdhüd) — Kopyala‑Yapıştır Prompt Dosyası

Karakter: **Hüdhüd (hoopoe) — adı "Pırıl"**. Kod puppet için parça‑parça PNG.
Her parça **aynı kare tuval**, kendi yerinde, gerisi **şeffaf**. Dosya yeri: `assets/illustrations/piril/`.

> En güvenli yol: **MASTER**'ı üret → Photopea/Photoshop'ta parçaları kes (göz/gaga/kanat altını fill ile doldur).
> Tutarlılık için aracın **referans görsel** özelliğini kullan (Midjourney `--cref` / image‑to‑image): master'ı referans ver, sonra "only the …" promptlarıyla parça üret.

---

## 0) MASTER — önce bunu üret
```
A cute friendly hoopoe bird mascot named Piril for an Islamic kids' learning app: round huggable body, soft cinnamon and cream feathers, the hoopoe's iconic fan-shaped head crest with soft black-tipped bands, big warm friendly eyes, a short gentle rounded (not sharp) beak, tiny rounded wings, little stubby legs, a subtle warm glow and a few sparkles, gentle trustworthy guide vibe. Front view, full body, standing, wings slightly out, soft 2.5D premium kids-game illustration, smooth rounded forms, soft volumetric lighting, warm pastel palette with gold accents, glossy highlights, soft drop shadow, clean edges, no text, centered, isolated on a fully transparent background, square 1:1
```

---

## Parça promptları (her biri ayrı dosya)

### body.webp  ★  (gövde + baş + tepe + bacaklar — GÖZSÜZ, GAGASIZ, KANATSIZ)
```
Cute hoopoe mascot Piril, soft cinnamon and cream feathers, iconic fan crest with soft black-tipped bands, gold accents, soft 2.5D premium kids-game illustration, glossy highlights, clean edges. Show ONLY the body, head, crest and little legs with a blank smooth face (NO eyes, NO beak) and NO wings, front view, centered, same square framing and scale as the full character, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### eyes_open.webp  ★
```
Cute hoopoe mascot Piril style, soft 2.5D premium kids-game illustration, glossy highlights. Show ONLY a pair of big warm friendly open cartoon eyes, positioned exactly where they sit on the front-facing character's face, same square framing and scale, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### eyes_closed.webp  ★  (göz kırpma)
```
Cute hoopoe mascot Piril style, soft 2.5D premium kids-game illustration, glossy highlights. Show ONLY a pair of closed, happy curved-line cartoon eyes (blinking), positioned exactly where the eyes sit on the front-facing character's face, same square framing and scale, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### mouth_closed.webp  ★  (gaga kapalı — varsayılan)
```
Cute hoopoe mascot Piril style, soft 2.5D premium kids-game illustration, glossy highlights. Show ONLY a small closed gentle rounded beak, positioned exactly where the beak sits on the front-facing character's face, same square framing and scale, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### mouth_smile.webp  ★  (gaga hafif açık / mutlu)
```
Cute hoopoe mascot Piril style, soft 2.5D premium kids-game illustration, glossy highlights. Show ONLY a small slightly-open happy beak (cheerful), positioned exactly where the beak sits on the front-facing character's face, same square framing and scale, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### mouth_open.webp  ★  (gaga açık / konuşma)
```
Cute hoopoe mascot Piril style, soft 2.5D premium kids-game illustration, glossy highlights. Show ONLY a small open chirping beak (mouth open, talking), positioned exactly where the beak sits on the front-facing character's face, same square framing and scale, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### arm_l.webp  ★  (sol kanat)
```
Cute hoopoe mascot Piril style, soft cinnamon feathers, gold accents, soft 2.5D premium kids-game illustration, glossy highlights. Show ONLY the LEFT small rounded wing, positioned exactly where it attaches to the front-facing character's body, resting slightly out, same square framing and scale, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### arm_r.webp  ★  (sağ kanat — selam/işaret bunu kullanır)
```
Cute hoopoe mascot Piril style, soft cinnamon feathers, gold accents, soft 2.5D premium kids-game illustration, glossy highlights. Show ONLY the RIGHT small rounded wing, positioned exactly where it attaches to the front-facing character's body, resting slightly out, same square framing and scale, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### glow.webp  ○  (arka ışık halkası)
```
A soft warm circular glow halo with a few tiny sparkles, gentle golden light, no outline, soft 2.5D premium kids-game illustration, centered, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### shadow.webp  ○  (zemin gölgesi)
```
A single soft oval ground shadow, soft blurred edges, semi-transparent dark blue-grey, no outline, positioned in the lower-center where a standing character would cast it, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### pupils.webp  ○  (göz bebekleri — bakış için)
```
Cute cartoon eye pupils only — two small dark rounded pupils with a tiny white highlight, positioned exactly where the pupils sit inside the open eyes of the front-facing character, same square framing and scale, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

### cheeks.webp  ○  (yanak allık — mutlu olunca)
```
Two soft round rosy blush cheek marks only, gentle peach-pink, soft edges, positioned exactly where the cheeks sit on the front-facing character's face, same square framing and scale, everything else fully transparent, no text, isolated on a fully transparent background, square 1:1
```

---

## İpuçları
- **Tutarlılık:** Master'ı referans görsel olarak ver (cref/image‑to‑image), sonra "only the …" promptlarını çalıştır.
- **Hizalama:** Tüm parçalar **aynı tuval boyutu + aynı konum** olmalı (kod üst üste koyar). Şüphedeysen master'dan kes.
- **Min. set (★):** body, eyes_open, eyes_closed, mouth_closed/smile/open, arm_l, arm_r → bunlarla harika sonuç çıkar. ○ olanlar bonus.
- PNG ver → ben WebP yaparım. Hepsi `assets/illustrations/piril/` altına.

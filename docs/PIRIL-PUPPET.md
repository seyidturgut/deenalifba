# Pırıl — Kod Puppet (AI PNG ile) Teslim Rehberi

> **KARAKTER KARARI:** Pırıl artık **Hüdhüd (hoopoe / rehber kuş)** — isim "Pırıl" kalır.
> Parça eşlemesi: **kol → kanat** (`arm_l`/`arm_r` = sol/sağ kanat), **ağız → gaga**
> (`mouth_closed/smile/open` = gaga kapalı / hafif açık / açık). Tepe (crest) gövdeye dahil.
> Kod & dosya adları aynı kalır.


Seçilen yol: **Kod puppet.** Sen AI ile **parçalara ayrılmış PNG**'leri üretirsin; rigleme +
animasyonun tamamını **ben kodda** yaparım (nefes, göz kırpma, kol, konuşma ağzı, bakış).
Rive/öğrenme/dev-build YOK; web demoda da çalışır.

---

## Altın kural: "AYNI TUVAL" yöntemi
Her parça **aynı kare tuval** üzerinde, **kendi doğru yerinde**, **gerisi şeffaf** olacak.
Örn. hepsi 1024×1024. Böylece kodda üst üste koyunca **kusursuz hizalanır** — sen hizayla uğraşmazsın.

> Yani parçaları kesip kenara koyma. Tam karakteri çiz, sonra her parçayı **kendi katmanında bırakıp
> gerisini sil** → o katmanı tek başına dışa aktar. Diğer her şey o karede şeffaf kalır.

## AI'dan parçaları nasıl alırsın (en kolay 2 yol)
**Yol 1 — tek karakter + kesme (önerilen):**
1. AI'da tek, net, **önden** Pırıl üret (şeffaf arka plan).
2. Photopea (ücretsiz, tarayıcı) / Photoshop'ta aç → çoğalt → her parça için bir kopyada
   sadece o parçayı bırak, gerisini sil. Kol/ağız **altında kalan gövdeyi** "generative/content-aware fill"
   ile doldur (boşluk kalmasın).
3. Her katmanı **aynı tuval boyutunda** PNG olarak dışa aktar.

**Yol 2 — ifade/parça varyasyonları:** AI'a "aynı karakter, sadece gözler kapalı / sadece ağız açık"
gibi tek tek ürettir (tutarlılık riski var; Yol 1 daha güvenli).

---

## Teslim edilecek parçalar
Dosya yeri: `assets/illustrations/piril/<ad>.webp` (PNG verirsen ben WebP'e çeviririm).
Hepsi opsiyonel — vermediğin atlanır; **yıldız (★) olanlar minimum iyi sonuç için önerilir.**

| Dosya adı | İçerik | Önem |
|---|---|---|
| `body` | Gövde: fener + kubbe + hilal + yıldız yüz tabanı (**gözsüz, ağızsız, kolsuz**) | ★ |
| `eyes_open` | Gözler açık | ★ |
| `eyes_closed` | Gözler kapalı (göz kırpma için) | ★ |
| `mouth_closed` | Ağız kapalı (varsayılan) | ★ |
| `mouth_smile` | Gülümseme (mutlu) | ★ |
| `mouth_open` | Ağız açık (konuşma/şaşkın) | ★ |
| `arm_l` | Sol kol + el | ★ |
| `arm_r` | Sağ kol + el (selam/işaret bunu kullanır) | ★ |
| `glow` | Arka ışık halkası (nabız atar) | ○ |
| `shadow` | Zemin gölgesi | ○ |
| `pupils` | Göz bebekleri (ayrı → bakış takibi) | ○ |
| `cheeks` | Yanak/allık (mutlu olunca belirir) | ○ |

**Notlar**
- Hepsi **aynı kare**, **şeffaf**, parça kendi yerinde.
- Kollar gövdeden hafif **ayrık** çizilsin (omuzdan döndüreceğim).
- 2x çözünürlük yeter (1024² ideal). PNG/WebP fark etmez.

---

## Sen verince ben ne yapacağım (~10 dk)
1. PNG'leri `assets/illustrations/piril/` altına koyup WebP'e çeviririm.
2. `src/lib/piril/parts.ts` içindeki `pirilParts` require haritasını doldururum.
3. O kadar — `Mascot` otomatik puppet'e geçer (kod hazır: `src/components/ui/PirilPuppet.tsx`).
   Tüm ekranlardaki Pırıl **aynı anda** canlanır.
4. Önizlemede idle/mutlu/kutlama/selam/konuşma test edip ince ayar yaparım.

## Şu an hazır olan kod
- `src/components/ui/PirilPuppet.tsx` — çok katmanlı Reanimated puppet (idle nefes, blink, tap zıplama,
  pose: happy/celebrate/wave/point, `talking` ile ağız döngüsü, `look` ile bakış).
- `src/lib/piril/parts.ts` — parça sözleşmesi + (boş) require haritası.
- `src/components/ui/Mascot.tsx` — tek giriş; parça yoksa statik, varsa puppet.

> Bonus: ileride sesle senkron ağız için `playLetter` çalarken `talking=true` bağlanır (küçük ek).

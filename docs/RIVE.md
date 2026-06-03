# Pırıl — Rive Entegrasyonu (A→Z)

Maskot Pırıl'ı statik WebP'den **Rive** (rigli, etkileşimli, lip-sync'li) sürüme taşıma rehberi.
**İş bölümü:** Çizim+rigleme **sen/illüstratör** (Rive editöründe), kod bağlama **bende** (iskelet hazır).

---

## 1) Ne teslim edeceksin
**Tek dosya:** `piril.riv` → projeye `assets/rive/piril.riv` olarak konacak.

Bu dosya **rivapp** (rive.app) editöründe üretilir. Illustrator yalnız **katmanlı çizimi** verir;
o çizim Rive'a aktarılıp **riglenir** (kemik + mesh) ve **State Machine** kurulur.

### `.riv` İÇİNDE OLMASI GEREKENLER (sözleşme — birebir bu adlar)
> Adlar büyük/küçük harf duyarlı. Kaynak: `src/lib/rive/pirilContract.ts`

| Öğe | Ad |
|---|---|
| Artboard | `Piril` |
| State Machine | `Piril` |
| Trigger | `happy` |
| Trigger | `celebrate` |
| Trigger | `wave` |
| Trigger | `point` |
| Trigger | `tapped` |
| Boolean | `talk` (ses çalarken lip-sync) |
| Number | `lookX` (-100..100, opsiyonel) |
| Number | `lookY` (-100..100, opsiyonel) |

**Varsayılan durum:** hiçbir trigger ateşlenmezse **idle** (nefes + ara sıra göz kırpma) oynamalı.

### Rigleme için katman/parça listesi (illüstratöre)
Her biri **ayrı katman**, eklemler **alttan ~10px örtüşmeli**:
- Gövde (fener) · üst kubbe + hilal · arka glow/halo · zemin gölgesi
- Yüz tabanı (yıldız)
- Göz akı (L/R) · göz bebeği (L/R, ayrı → bakış) · üst göz kapağı (L/R, kırpma)
- Kaş (L/R) · yanak/allık (L/R)
- Ağız: en az 4 viseme — kapalı / gülümseme / açık "A" / "O" (lip-sync)
- Sol kol+el · Sağ kol+el (omuzdan döner)
- Format: **vektör (SVG) tercih**; PNG ise şeffaf + 2x.

### State Machine'de kurulacak geçişler
- `idle` (loop) → varsayılan
- `happy`, `celebrate`, `wave`, `point`, `tapped` → tek seferlik animasyon, bitince idle'a döner
- `talk` true iken ağız visemeleri döner (idle'ın üstüne bindirme/blend)
- (ops.) `lookX/lookY` → göz bebeği/baş hedefe bakar

---

## 2) Kod tarafı (HAZIR — iskelet kuruldu)
- `src/lib/rive/pirilContract.ts` — sözleşme (adlar + pose→trigger eşleme).
- `src/components/ui/PirilRive.tsx` — Rive maskot bileşeni (Mascot ile **aynı arayüz**: `size/pose/onTap`). Web'de `null` döner → statik sürüme düşer.
- `src/components/ui/Mascot.tsx` — içinde **MASCOT_USE_RIVE** bayrağı + yorumlu delegasyon bloğu (tek noktadan açılır).

> `.riv` gelene kadar `PirilRive.tsx` hiçbir yerden import edilmiyor → mevcut build (web demo dahil) etkilenmez.

---

## 3) Hazır olunca devreye alma (benim yapacağım — ~5 dk)
```bash
# 1) paket (DEV BUILD gerekir — Expo Go'da çalışmaz)
npx expo install rive-react-native
# 2) .riv dosyasını koy
#    assets/rive/piril.riv
# 3) native bundle için resourceName="piril" (iOS/Android asset) ya da source=require(...)
```
Sonra `Mascot.tsx`:
- `MASCOT_USE_RIVE = true`
- üstteki `import { PirilRive }` + gövdedeki delegasyon bloğunun yorumunu kaldır.

Bağlama bu kadar — tüm ekranlar `<Mascot pose=.../>` kullandığı için **başka hiçbir yer değişmez**.

---

## 4) Önemli notlar / sınırlar
- **Expo Go DEĞİL:** `rive-react-native` native modül → `expo prebuild` + dev build (EAS ya da yerel) gerekir.
- **Web demo (Vercel):** `rive-react-native` web'i desteklemez → web'de statik WebP Pırıl kalır. (İstenirse web için ayrı `@rive-app/react-canvas` ile sarmalanabilir; sonraki faz.)
- **Lip-sync:** `playLetter`/ses başlarken `talk=true`, bitince `false` (ses süresine göre). Bunu ses katmanına (`sfx.ts`) küçük bir callback ile bağlarız.
- **Boyut:** `.riv` genelde KB'ler — offline/boyut hedefine uygun.

---

## 5) Hızlı kontrol listesi (sen)
- [ ] Illustrator'da katmanlı Pırıl (yukarıdaki parça listesi)
- [ ] Rive editöründe import + rig (kemik/mesh)
- [ ] State Machine `Piril` + yukarıdaki input adları
- [ ] idle/ happy/ celebrate/ wave/ point/ tapped + talk test edildi
- [ ] `piril.riv` export → bana gönder

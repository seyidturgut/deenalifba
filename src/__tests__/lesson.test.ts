import { buildLesson, GAME_UNLOCKS, isGameUnlocked, newlyUnlockedGame } from "@/data/lesson";
import { LETTERS } from "@/data/letters";
import { useProgressStore } from "@/stores/progressStore";

/**
 * Ders kurgusu.
 *
 * "Öğren" seviyesine oyun sızarsa ya da "oyna" seviyesi boş kalırsa çocuk
 * eksik ders görür; kademeli açılım kayarsa ilk harfte yine her mekanikle
 * karşılaşır — düzeltilen şikayet geri gelir.
 */
describe("ders kurgusu", () => {
  beforeEach(() => useProgressStore.getState().reset());

  it("öğren seviyesi her zaman tanı + boya", () => {
    LETTERS.forEach((l) => expect(buildLesson(l.id, "learn")).toEqual(["intro", "trace"]));
  });

  it("oyna seviyesi konuşmayla biter ve boş kalmaz", () => {
    LETTERS.forEach((l) => {
      const lesson = buildLesson(l.id, "play");
      expect(lesson.length).toBeGreaterThan(0);
      expect(lesson[lesson.length - 1]).toBe("speak");
    });
  });

  it("öğrenme adımları oyna seviyesine sızmaz", () => {
    LETTERS.forEach((l) => {
      const lesson = buildLesson(l.id, "play");
      expect(lesson).not.toContain("intro");
      expect(lesson).not.toContain("trace");
    });
  });

  it("oyun sayısı ilerledikçe artar (shib: önce bir, sonra iki, sonra üç)", () => {
    const oyunSayisi = (id: number) =>
      buildLesson(id, "play").filter((k) => k !== "speak" && k !== "recall").length;
    // İlk harfte hiç mini oyun yok: çocuk harfi tanıyor, yazıyor, söylüyor.
    // İlk oyun 2. harfte "Yeni oyun!" ekranıyla duyurularak geliyor.
    expect(oyunSayisi(1)).toBe(0);
    expect(oyunSayisi(2)).toBe(1);
    expect(oyunSayisi(4)).toBe(2);
    expect(oyunSayisi(10)).toBe(3);
  });

  it("ilk harfte hiçbir mini oyun açık değil", () => {
    Object.entries(GAME_UNLOCKS).forEach(([kind, from]) => {
      expect(from).toBeGreaterThan(1);
      expect(isGameUnlocked(kind as never, 1)).toBe(false);
    });
  });

  it("kilitli bir oyun derse asla girmez", () => {
    LETTERS.forEach((l) => {
      buildLesson(l.id, "play").forEach((kind) => {
        if (kind in GAME_UNLOCKS) expect(isGameUnlocked(kind as never, l.id)).toBe(true);
      });
    });
  });

  it("her açılan oyun tam bir harfte duyurulur", () => {
    const duyurulan = LETTERS.map((l) => newlyUnlockedGame(l.id)).filter(Boolean);
    expect(new Set(duyurulan).size).toBe(duyurulan.length); // aynı oyun iki kez duyurulmaz
    expect(new Set(duyurulan)).toEqual(new Set(Object.keys(GAME_UNLOCKS)));
  });

  it("tekrar edilecek harf yoksa Tekrar adımı eklenmez", () => {
    // Hiçbir harf tamamlanmamışken 2. harfin dersinde tekrar olmamalı
    expect(buildLesson(2, "play")).not.toContain("recall");
    useProgressStore.getState().completePart(1, "learn");
    useProgressStore.getState().completePart(1, "play");
    expect(buildLesson(2, "play")).toContain("recall");
  });

  it("aynı harf her zaman aynı dersi verir", () => {
    LETTERS.forEach((l) => expect(buildLesson(l.id, "play")).toEqual(buildLesson(l.id, "play")));
  });
});

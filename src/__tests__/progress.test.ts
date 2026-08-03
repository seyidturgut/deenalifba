import { LETTERS } from "@/data/letters";
import { useProgressStore } from "@/stores/progressStore";

/**
 * İlerleme ve GÖÇ.
 *
 * Buradaki bir hata en pahalısı: çocuğun ilerlemesi sessizce kaybolur ve geri
 * getirmenin yolu yoktur. Her harf ikiye bölündüğünde eski kayıtların geçerli
 * kalması gerekiyordu.
 */
const reset = () => useProgressStore.getState().reset();

describe("ilerleme", () => {
  beforeEach(reset);

  it("başlangıçta hiçbir şey tamamlanmamıştır", () => {
    const s = useProgressStore.getState();
    expect(s.isPartComplete(1, "learn")).toBe(false);
    expect(s.isLetterComplete(1)).toBe(false);
  });

  it("iki parça da bitince harf tamamlanır", () => {
    const s = () => useProgressStore.getState();
    s().completePart(3, "learn");
    expect(s().isLetterComplete(3)).toBe(false); // yarısı yetmez
    s().completePart(3, "play");
    expect(s().isLetterComplete(3)).toBe(true);
  });

  it("aynı parça iki kez işaretlenince mükerrer kayıt olmaz", () => {
    const s = () => useProgressStore.getState();
    s().completePart(5, "learn");
    s().completePart(5, "learn");
    expect(s().completedParts.filter((k) => k === "5:learn")).toHaveLength(1);
  });

  it("ESKİ KAYIT: harf tamamlanmışsa iki parçası da tamam sayılır", () => {
    // Yeni alan olmayan bir kayıt — 12 harfi bitirmiş bir çocuk.
    const done = LETTERS.slice(0, 12).map((l) => l.id);
    useProgressStore.setState({ completedLetters: done, completedParts: [] });
    const s = useProgressStore.getState();
    done.forEach((id) => {
      expect(s.isPartComplete(id, "learn")).toBe(true);
      expect(s.isPartComplete(id, "play")).toBe(true);
    });
    // 13. harf açılmamış olmalı
    expect(s.isPartComplete(13, "learn")).toBe(false);
  });

  it("test aracı 28 harfin iki parçasını da açar", () => {
    useProgressStore.getState().unlockAllForTesting();
    const s = useProgressStore.getState();
    LETTERS.forEach((l) => {
      expect(s.isPartComplete(l.id, "learn")).toBe(true);
      expect(s.isPartComplete(l.id, "play")).toBe(true);
      expect(s.isLetterComplete(l.id)).toBe(true);
    });
  });

  it("sıfırlama her şeyi temizler", () => {
    useProgressStore.getState().unlockAllForTesting();
    reset();
    const s = useProgressStore.getState();
    expect(s.completedParts).toHaveLength(0);
    expect(s.completedLetters).toHaveLength(0);
    expect(s.isLetterComplete(1)).toBe(false);
  });
});

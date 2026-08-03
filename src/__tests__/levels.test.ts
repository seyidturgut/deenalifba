import { LETTERS } from "@/data/letters";
import { LEVELS, LETTER_LEVEL_COUNT, levelByNo, levelNoOf, partKey } from "@/data/levels";

/**
 * Seviye eşlemesi.
 *
 * Burada bir kayma sessizce yaşanır: harita doğru görünür ama çocuk yanlış harfe
 * gider. Nitekim her harf ikiye bölününce seviye no ile harf no ayrıştı ve bu
 * bir tur yanlış geri bildirime yol açtı.
 */
describe("seviye eşlemesi", () => {
  it("her harf tam iki seviye üretir", () => {
    expect(LETTERS).toHaveLength(28);
    expect(LEVELS).toHaveLength(56);
    expect(LETTER_LEVEL_COUNT).toBe(56);
  });

  it("seviye numaraları 1'den başlar ve boşluksuz artar", () => {
    LEVELS.forEach((lv, i) => expect(lv.no).toBe(i + 1));
  });

  it("harf N → öğren 2N-1, oyna 2N", () => {
    LETTERS.forEach((l, i) => {
      expect(levelNoOf(l.id, "learn")).toBe(i * 2 + 1);
      expect(levelNoOf(l.id, "play")).toBe(i * 2 + 2);
    });
  });

  it("bilinen harfler doğru seviyelere düşer", () => {
    // Abdulkadir'in karıştırdığı iki harf — dāl 8. harf ama 8. seviye değil.
    expect(levelNoOf(8, "learn")).toBe(15);
    expect(levelNoOf(11, "learn")).toBe(21);
    expect(levelNoOf(28, "play")).toBe(56);
  });

  it("levelByNo ile levelNoOf birbirinin tersi", () => {
    LEVELS.forEach((lv) => {
      const back = levelByNo(lv.no);
      expect(back?.letterId).toBe(lv.letterId);
      expect(back?.part).toBe(lv.part);
      expect(levelNoOf(lv.letterId, lv.part)).toBe(lv.no);
    });
  });

  it("her seviyenin bir harfi vardır ve her harf iki kez geçer", () => {
    const sayim = new Map<number, number>();
    LEVELS.forEach((lv) => sayim.set(lv.letterId, (sayim.get(lv.letterId) ?? 0) + 1));
    expect(sayim.size).toBe(28);
    sayim.forEach((n) => expect(n).toBe(2));
  });

  it("parça anahtarı çakışmaz", () => {
    const keys = LEVELS.map((lv) => partKey(lv.letterId, lv.part));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

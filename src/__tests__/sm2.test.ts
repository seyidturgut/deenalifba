import { createInitialSrsState, reviewLetter } from "@/algorithms/sm2";

/**
 * Aralıklı tekrar. Bozulursa çocuk ya bildiği harfi durmadan tekrar eder ya da
 * unuttuğu harf bir daha hiç karşısına çıkmaz — ikisi de sessizce olur.
 */
const SIMDI = 1_700_000_000_000;
const GUN = 24 * 60 * 60 * 1000;

describe("SM-2", () => {
  it("yeni harf hemen çalışılabilir", () => {
    const s = createInitialSrsState(5, SIMDI);
    expect(s.dueAt).toBe(SIMDI);
    expect(s.repetitions).toBe(0);
  });

  it("doğru cevaplar aralığı büyütür", () => {
    let s = createInitialSrsState(5, SIMDI);
    const araliklar: number[] = [];
    for (let i = 0; i < 4; i++) {
      s = reviewLetter(s, 3, SIMDI + i * GUN);
      araliklar.push(s.intervalDays);
    }
    for (let i = 1; i < araliklar.length; i++) expect(araliklar[i]).toBeGreaterThanOrEqual(araliklar[i - 1]);
    expect(s.repetitions).toBe(4);
  });

  it("başarısızlık tekrarı sıfırlar ama harfi cezalandırmaz", () => {
    let s = createInitialSrsState(5, SIMDI);
    s = reviewLetter(s, 3, SIMDI);
    s = reviewLetter(s, 3, SIMDI + GUN);
    const oncekiEase = s.easeFactor;
    s = reviewLetter(s, 0, SIMDI + 2 * GUN);
    expect(s.repetitions).toBe(0);
    expect(s.dueAt).toBeLessThanOrEqual(SIMDI + 2 * GUN + GUN); // yakında geri gelir
    expect(s.easeFactor).toBeLessThanOrEqual(oncekiEase);
  });

  it("kolaylık katsayısı tabanın altına inmez", () => {
    let s = createInitialSrsState(5, SIMDI);
    for (let i = 0; i < 20; i++) s = reviewLetter(s, 0, SIMDI + i * GUN);
    expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("her tekrar son çalışma zamanını kaydeder ve geleceğe bakar", () => {
    let s = createInitialSrsState(5, SIMDI);
    s = reviewLetter(s, 2, SIMDI);
    expect(s.lastReviewedAt).toBe(SIMDI);
    expect(s.dueAt).toBeGreaterThan(SIMDI);
  });

  it("saf fonksiyon: girdiyi değiştirmez", () => {
    const s = createInitialSrsState(5, SIMDI);
    const kopya = { ...s };
    reviewLetter(s, 3, SIMDI);
    expect(s).toEqual(kopya);
  });
});

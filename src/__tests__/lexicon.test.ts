import tr from "@/i18n/tr.json";
import { assertTurkishTerminology, findTerminologyViolations } from "@/i18n/lexicon";

/**
 * Türkçe İslami terminoloji — projenin zorunlu kuralı.
 * "Salat/Surah/Wudu" gibi transliterasyonlar kullanıcıya asla görünmemeli.
 */
describe("Türkçe terminoloji", () => {
  it("tr.json'da tek bir ihlal yok", () => {
    expect(() => assertTurkishTerminology(tr as Record<string, unknown>)).not.toThrow();
  });

  it("denetleyici gerçekten yakalıyor", () => {
    expect(findTerminologyViolations("Salat vakti geldi").length).toBeGreaterThan(0);
    expect(findTerminologyViolations("Namaz vakti geldi")).toHaveLength(0);
  });
});

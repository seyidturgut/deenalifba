import { formKindsFor, getLetterForms } from "@/data/letterForms";
import { LETTERS } from "@/data/letters";
import { glyphChar, glyphShape, lettersWithForm, pickDistractors } from "@/lib/formGlyph";

/**
 * Harf formları.
 *
 * Bağlanmayan altı harfin (ا د ذ ر ز و) baş/orta şekli YOKTUR. Bunlar çeldirici
 * havuzuna sızarsa çocuğa var olmayan bir şekil gösterilir. Ayrıca kod noktası
 * eşlemesinde bir karışıklık bir kez sessizce yanlış glif ürettirdi.
 */
const BAGLANMAYAN = [1, 8, 9, 10, 11, 26];

describe("harf formları", () => {
  it("bağlanmayan altı harfin yalnız izole ve son şekli var", () => {
    BAGLANMAYAN.forEach((id) => {
      const kinds = formKindsFor(id);
      expect(kinds.sort()).toEqual(["final", "isolated"]);
      expect(getLetterForms(id)?.connects).toBe(false);
    });
  });

  it("diğer 22 harfin dört şekli var", () => {
    LETTERS.filter((l) => !BAGLANMAYAN.includes(l.id)).forEach((l) => {
      expect(formKindsFor(l.id).sort()).toEqual(["final", "initial", "isolated", "medial"]);
    });
  });

  it("her formun hem yolu hem boyama noktaları var", () => {
    LETTERS.forEach((l) => {
      formKindsFor(l.id).forEach((kind) => {
        const shape = glyphShape(l.id, kind);
        expect(shape).toBeDefined();
        expect(shape!.d.length).toBeGreaterThan(20);
        expect(shape!.inner.length).toBeGreaterThan(10); // boyama ilerlemesi bunlarla sayılıyor
      });
    });
  });

  it("çeldirici havuzuna o forma sahip olmayan harf girmez", () => {
    (["initial", "medial"] as const).forEach((kind) => {
      const havuz = lettersWithForm(kind);
      BAGLANMAYAN.forEach((id) => expect(havuz).not.toContain(id));
      expect(havuz).toHaveLength(22);
    });
  });

  it("çeldiriciler hedefle aynı görünmez ve birbirini tekrar etmez", () => {
    LETTERS.forEach((l) => {
      formKindsFor(l.id).forEach((kind) => {
        const hedef = glyphChar(l.id, kind);
        const celdiriciler = pickDistractors(l.id, 3, kind);
        expect(celdiriciler).not.toContain(hedef);
        expect(new Set(celdiriciler).size).toBe(celdiriciler.length);
      });
    });
  });

  it("her harfin izole şekli kendine özgüdür", () => {
    const izole = LETTERS.map((l) => glyphChar(l.id));
    expect(new Set(izole).size).toBe(28);
  });
});

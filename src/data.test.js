/* Tests de la lógica de precios — el núcleo crítico del cotizador. */
import { describe, it, expect } from "vitest";
import {
  computeQuote,
  baysForWidth,
  melaminaById,
  furnitureById,
  fmtAR,
  MELAMINAS,
  FURNITURE,
} from "./data.jsx";

const mesatv = furnitureById("mesatv"); // base 118000, perBay 74000, widths [900,1800,2700]
const consola = furnitureById("consola"); // base 184000, perBay 0, width [900]

describe("baysForWidth", () => {
  it("redondea el ancho a cuerpos de 900 mm", () => {
    expect(baysForWidth(mesatv, 900)).toBe(1);
    expect(baysForWidth(mesatv, 1800)).toBe(2);
    expect(baysForWidth(mesatv, 2700)).toBe(3);
  });

  it("redondea anchos intermedios", () => {
    expect(baysForWidth(mesatv, 1350)).toBe(2); // 1.5 → 2
  });

  it("nunca devuelve menos de 1 cuerpo", () => {
    expect(baysForWidth(mesatv, 100)).toBe(1);
    expect(baysForWidth(mesatv, 0)).toBe(1);
  });
});

describe("melaminaById", () => {
  it("encuentra una melamina existente", () => {
    expect(melaminaById("tribal").id).toBe("tribal");
  });

  it("cae a la primera melamina ante un id desconocido", () => {
    expect(melaminaById("no-existe")).toBe(MELAMINAS[0]);
  });
});

describe("computeQuote", () => {
  it("devuelve total 0 sin mueble", () => {
    expect(computeQuote({ furniture: null })).toEqual({ total: 0, breakdown: [] });
  });

  it("calcula un mueble de 1 cuerpo con melamina y sin patas", () => {
    // base 118000 + melamina tribal (×1.14): +16520 = 134520
    const q = computeQuote({
      furniture: mesatv,
      line: "BASE",
      width: 900,
      material: "tribal",
      legs: "sin",
    });
    expect(q.bays).toBe(1);
    expect(q.total).toBe(134520);
    expect(q.fixed).toBe(false); // mesatv tiene 3 anchos
  });

  it("suma cuerpos extra y patas", () => {
    // base 118000 + 1 cuerpo (74000) = 192000
    // + grisbasalto (×1.06): +11520 = 203520
    // + patas rectas 14800 = 218320
    const q = computeQuote({
      furniture: mesatv,
      line: "BASE",
      width: 1800,
      material: "grisbasalto",
      legs: "rectas",
    });
    expect(q.bays).toBe(2);
    expect(q.total).toBe(218320);
    // breakdown: base, +1 cuerpo, melamina, patas (línea BASE ×1.0 no aparece)
    expect(q.breakdown).toHaveLength(4);
    expect(q.breakdown.some((b) => b.label.includes("Patas"))).toBe(true);
  });

  it("marca fixed=true para muebles de un solo ancho", () => {
    const q = computeQuote({
      furniture: consola,
      line: "BASE",
      width: 900,
      material: "sauco",
      legs: "conicas",
    });
    // base 184000 + sauco (×1.18): +33120 = 217120 + cónicas 19600 = 236720
    expect(q.total).toBe(236720);
    expect(q.fixed).toBe(true);
  });

  it("no agrega costo de cuerpos cuando perBay es 0", () => {
    const q = computeQuote({
      furniture: consola,
      line: "BASE",
      width: 900,
      material: "sauco",
      legs: "sin",
    });
    expect(q.breakdown.some((b) => b.label.includes("cuerpo"))).toBe(false);
  });

  it("cae a defaults ante línea/melamina/patas desconocidas", () => {
    const q = computeQuote({
      furniture: mesatv,
      line: "??",
      width: 900,
      material: "??",
      legs: "??",
    });
    expect(typeof q.total).toBe("number");
    expect(q.total).toBeGreaterThan(0);
  });
});

describe("fmtAR", () => {
  it("formatea en pesos argentinos con separador de miles", () => {
    expect(fmtAR(1234567)).toBe("$1.234.567");
  });

  it("redondea al entero más cercano", () => {
    expect(fmtAR(99.6)).toBe("$100");
    expect(fmtAR(0)).toBe("$0");
  });
});

describe("catálogo", () => {
  it("todo mueble tiene base, anchos y ancho por defecto válido", () => {
    for (const f of FURNITURE) {
      expect(f.base).toBeGreaterThan(0);
      expect(f.widths.length).toBeGreaterThan(0);
      expect(f.widths).toContain(f.defW);
    }
  });
});

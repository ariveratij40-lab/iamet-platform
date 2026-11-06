import { describe, it, expect } from "vitest";
import { leerVeredicto, PRESENTACION_CATEGORIA, ORDEN_CATEGORIA } from "../shared/lead-verdict";

describe("lectura del veredicto del lead", () => {
  it("lee un veredicto válido desde scoreBreakdown.ai", () => {
    const v = leerVeredicto({ companySize: 35, ai: { categoria: "proyecto", resumen: "400 puntos", confianza: 0.8, fuente: "ia" } });
    expect(v?.categoria).toBe("proyecto");
    expect(v?.resumen).toBe("400 puntos");
    expect(v?.fuente).toBe("ia");
  });

  it("devuelve null si no hay veredicto de IA", () => {
    expect(leerVeredicto({ companySize: 35 })).toBeNull();
    expect(leerVeredicto(null)).toBeNull();
    expect(leerVeredicto(undefined)).toBeNull();
  });

  it("ignora una categoría inválida", () => {
    expect(leerVeredicto({ ai: { categoria: "otra" } })).toBeNull();
  });

  it("toda categoría tiene presentación y orden", () => {
    for (const c of ["proyecto", "consulta", "ruido"] as const) {
      expect(PRESENTACION_CATEGORIA[c].etiqueta).toBeTruthy();
      expect(typeof ORDEN_CATEGORIA[c]).toBe("number");
    }
    expect(ORDEN_CATEGORIA.proyecto).toBeLessThan(ORDEN_CATEGORIA.ruido);
  });
});

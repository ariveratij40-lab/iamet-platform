import { describe, it, expect } from "vitest";
import { visitorGuidance, visitorSystemPrompt } from "../shared/visitor-assistant";

describe("REPSE en el asistente", () => {
  it("responde a '¿tienen REPSE?' confirmando y con botón de contacto", () => {
    const r = visitorGuidance("¿tienen repse?");
    expect(r.reply).toMatch(/REPSE vigente/i);
    expect(r.reply).toMatch(/deducibles|responsabilidad solidaria/i);
    expect(r.actions.some(a => a.href === "/cotizacion")).toBe(true);
  });

  it("entra también por términos relacionados (deducible, responsabilidad solidaria)", () => {
    expect(visitorGuidance("mis facturas serían deducibles?").reply).toMatch(/REPSE/i);
    expect(visitorGuidance("hay responsabilidad solidaria?").reply).toMatch(/REPSE/i);
  });

  it("la pregunta de garantía NO se confunde con REPSE", () => {
    expect(visitorGuidance("quiero tramitar una garantía").reply).toMatch(/garantía/i);
  });

  it("el conocimiento de REPSE está en el prompt, sin inventar folio", () => {
    const p = visitorSystemPrompt(1);
    expect(p).toMatch(/REPSE VIGENTE/);
    expect(p).toMatch(/NO afirmes un número de folio/);
  });
});

import { describe, it, expect } from "vitest";
import { visitorGuidance, visitorSystemPrompt } from "../shared/visitor-assistant";

describe("Crédito en el asistente", () => {
  it("responde a '¿manejan crédito?' confirmando y con botón de contacto", () => {
    const r = visitorGuidance("¿manejan crédito?");
    expect(r.reply).toMatch(/cr[eé]dito comercial/i);
    expect(r.reply).toMatch(/persona moral|persona f[ií]sica|expediente/i);
    expect(r.actions.some(a => a.href === "/cotizacion")).toBe(true);
  });

  it("entra también por términos relacionados (financiamiento, línea de crédito, buró)", () => {
    expect(visitorGuidance("ofrecen financiamiento?").reply).toMatch(/cr[eé]dito/i);
    expect(visitorGuidance("quiero una línea de crédito").reply).toMatch(/cr[eé]dito/i);
    expect(visitorGuidance("piden autorización de buró de crédito?").reply).toMatch(/cr[eé]dito/i);
  });

  it("no promete monto, plazo ni tasa en la respuesta directa", () => {
    const r = visitorGuidance("¿me pueden dar crédito?");
    expect(r.reply).toMatch(/el equipo tras evaluar el expediente/i);
  });

  it("la pregunta de garantía NO se confunde con crédito", () => {
    expect(visitorGuidance("quiero tramitar una garantía").reply).toMatch(/garantía/i);
  });

  it("el conocimiento de crédito está en el prompt, sin inventar condiciones", () => {
    const p = visitorSystemPrompt(1);
    expect(p).toMatch(/CRÉDITO COMERCIAL/);
    expect(p).toMatch(/NO inventes el monto, el plazo, la tasa/);
  });
});

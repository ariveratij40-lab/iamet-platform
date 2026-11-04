import { describe, it, expect } from "vitest";
import {
  visitorClosureGuidance,
  visitorSystemPrompt,
} from "../shared/visitor-assistant";

// El cierre por turnos (heredado del asistente del CRM) evita el chat
// infinito: al avanzar, el asistente deja de preguntar y empuja a dejar datos.
describe("cierre por turnos del asistente", () => {
  it("en los primeros turnos permite preguntar", () => {
    expect(visitorClosureGuidance(1)).toMatch(/pregunta clave|UNA pregunta/i);
    expect(visitorClosureGuidance(2)).toMatch(/reduce preguntas/i);
  });

  it("en el cierre ya NO termina con pregunta y empuja a cotizar", () => {
    const cierre = visitorClosureGuidance(3);
    expect(cierre).toMatch(/NO termines con una pregunta/i);
    expect(cierre).toMatch(/Cotizar proyecto/i);
  });

  it("en los últimos turnos no pregunta y da un paso concreto", () => {
    const fin = visitorClosureGuidance(6);
    expect(fin).toMatch(/NO hagas preguntas/i);
    expect(fin).toMatch(/deje sus datos/i);
  });

  it("el system prompt incorpora la etapa del turno recibido", () => {
    expect(visitorSystemPrompt(1)).toContain("turno 1");
    expect(visitorSystemPrompt(4)).toContain("NO hagas preguntas");
  });

  it("el conocimiento de cableado quedó disponible para el modelo", () => {
    const p = visitorSystemPrompt(1);
    expect(p).toMatch(/Cat6A/);
    expect(p).toMatch(/fibra óptica monomodo y multimodo/);
    expect(p).toMatch(/Fluke/);
  });

  it("mantiene la regla anti-complacencia heredada del CRM", () => {
    expect(visitorSystemPrompt(1)).toMatch(/NUNCA abras con/i);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  veredictoPorReglas,
  parsearVeredictos,
  calificarLeads,
} from "./lead-qualification";
import { invokeLLM } from "./_core/llm";

vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

const base = {
  id: 1,
  email: "contacto@empresa.com",
  company: "Empresa",
  industry: "manufactura",
  companySize: null as any,
  verticalSlug: null as any,
  problemDescription: "",
};

describe("filtro barato por reglas (sin IA)", () => {
  it("correo desechable → ruido, sin preguntar a la IA", () => {
    const v = veredictoPorReglas({ ...base, email: "x@mailinator.com" });
    expect(v?.categoria).toBe("ruido");
    expect(v?.fuente).toBe("reglas");
  });

  it("correo inválido → ruido", () => {
    expect(veredictoPorReglas({ ...base, email: "sin-arroba" })?.categoria).toBe("ruido");
  });

  it("formulario vacío sin solución → ruido", () => {
    expect(veredictoPorReglas({ ...base, problemDescription: "hola" })?.categoria).toBe("ruido");
  });

  it("spam ajeno a IAMET → ruido", () => {
    const v = veredictoPorReglas({ ...base, problemDescription: "ofrezco SEO y backlinks" });
    expect(v?.categoria).toBe("ruido");
  });

  it("empresa grande + vertical + descripción detallada → proyecto, sin IA", () => {
    const v = veredictoPorReglas({
      ...base,
      companySize: "500+",
      verticalSlug: "infraestructura",
      problemDescription: "Necesitamos cablear una planta nueva de 3 pisos con 400 puntos de red Cat6A y fibra entre racks, con certificacion Fluke y cuarto de telecomunicaciones TR.",
    });
    expect(v?.categoria).toBe("proyecto");
    expect(v?.fuente).toBe("reglas");
  });

  it("caso dudoso → null (lo decide la IA)", () => {
    const v = veredictoPorReglas({
      ...base,
      companySize: "11-50",
      verticalSlug: "cctv",
      problemDescription: "Queremos mejorar la vigilancia de nuestra bodega.",
    });
    expect(v).toBeNull();
  });
});

describe("parseo del lote de la IA", () => {
  it("extrae veredictos de un JSON válido", () => {
    const out = parsearVeredictos('{"veredictos":[{"id":7,"categoria":"proyecto","resumen":"400 cámaras","confianza":0.8}]}');
    expect(out[7].categoria).toBe("proyecto");
    expect(out[7].fuente).toBe("ia");
    expect(out[7].confianza).toBe(0.8);
  });

  it("tolera texto alrededor del JSON", () => {
    const out = parsearVeredictos('Claro:\n{"veredictos":[{"id":3,"categoria":"ruido","resumen":"spam"}]} listo');
    expect(out[3].categoria).toBe("ruido");
  });

  it("ignora categorías inválidas y basura", () => {
    expect(Object.keys(parsearVeredictos('{"veredictos":[{"id":1,"categoria":"otra"}]}'))).toHaveLength(0);
    expect(Object.keys(parsearVeredictos("no es json"))).toHaveLength(0);
  });
});

describe("calificarLeads: reglas primero, IA solo para dudosos y con tope", () => {
  beforeEach(() => vi.mocked(invokeLLM).mockReset());

  it("no llama a la IA si las reglas ya deciden todo", async () => {
    await calificarLeads([
      { ...base, id: 1, email: "x@mailinator.com" },
      { ...base, id: 2, companySize: "500+", verticalSlug: "infraestructura", problemDescription: "Planta nueva de 3 pisos: 400 puntos Cat6A, fibra entre racks, certificacion Fluke y cuarto de telecomunicaciones; requerimos propuesta con alcance completo." },
    ]);
    expect(invokeLLM).not.toHaveBeenCalled();
  });

  it("respeta el tope maxAI: no manda más dudosos que el límite", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: '{"veredictos":[]}' } }] } as any);
    const dudosos = Array.from({ length: 10 }, (_, i) => ({
      ...base, id: i + 1, companySize: "11-50" as any, verticalSlug: "cctv",
      problemDescription: "Queremos mejorar la vigilancia de la bodega.",
    }));
    await calificarLeads(dudosos, { maxAI: 3 });
    const enviados = vi.mocked(invokeLLM).mock.calls[0][0].messages[1].content as string;
    expect(enviados.split("\n").length).toBe(3);
  });

  it("si la IA responde basura, no rompe: devuelve solo lo de reglas", async () => {
    vi.mocked(invokeLLM).mockResolvedValue({ choices: [{ message: { content: "lo siento, no puedo" } }] } as any);
    const out = await calificarLeads([
      { ...base, id: 1, email: "x@mailinator.com" },
      { ...base, id: 2, companySize: "11-50" as any, verticalSlug: "cctv", problemDescription: "Mejorar vigilancia bodega." },
    ]);
    expect(out[1].categoria).toBe("ruido");
    expect(out[2]).toBeUndefined();
  });
});

import { beforeEach, describe, it, expect, vi } from "vitest";
import { visitorAssistantRouter } from "./routers/visitorAssistant";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";

vi.mock("./_core/env", () => ({ ENV: { llmApiKey: "test" } }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));
vi.mock("./assistant-history", () => ({
  recordAssistantTurn: vi.fn().mockResolvedValue(null),
}));

const caller = () =>
  visitorAssistantRouter.createCaller({
    req: { headers: {} } as any,
    res: {} as any,
    user: null,
  });

// Extrae el system prompt que el handler le mandó al LLM.
function systemPromptDe(call: any): string {
  const msgs = call[0].messages as Array<{ role: string; content: string }>;
  return msgs.find(m => m.role === "system")?.content ?? "";
}

describe("el turno fluye hasta el prompt a través del handler real", () => {
  beforeEach(() => {
    (ENV as any).llmApiKey = "test";
    vi.mocked(invokeLLM).mockReset();
    vi.mocked(invokeLLM).mockResolvedValue({
      choices: [{ message: { content: "ok" } }],
    } as any);
  });

  it("primer turno → etapa inicial (puede preguntar)", async () => {
    await caller().chat({ messages: [{ role: "user", content: "Necesito cableado" }] });
    const p = systemPromptDe(vi.mocked(invokeLLM).mock.calls[0]);
    expect(p).toContain("turno 1");
    expect(p).toMatch(/pregunta clave|UNA pregunta/i);
  });

  it("cuarto turno del visitante → cierre sin preguntas", async () => {
    await caller().chat({
      messages: [
        { role: "user", content: "Necesito cableado" },
        { role: "assistant", content: "¿En qué ciudad?" },
        { role: "user", content: "Tijuana, 40 puntos" },
        { role: "assistant", content: "Entendido." },
        { role: "user", content: "¿Certifican?" },
        { role: "assistant", content: "Sí, con Fluke." },
        { role: "user", content: "¿Y fibra?" },
      ],
    });
    const p = systemPromptDe(vi.mocked(invokeLLM).mock.calls[0]);
    expect(p).toContain("turno 4");
    expect(p).toMatch(/NO hagas preguntas/i);
    expect(p).toMatch(/deje sus datos/i);
  });
});

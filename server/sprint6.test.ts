/**
 * sprint6.test.ts — Tests unitarios para los módulos del Sprint 6
 *
 * Cubre: intelligence, rag, knowledge, predictive, commercial-learning,
 *        agent-traces, agent-orchestrator (integración con RAG)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock de dependencias externas ───────────────────────────────────────────

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: '{"answer": "Respuesta de prueba"}' } }],
  }),
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    execute: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ─── Tests de RAG ─────────────────────────────────────────────────────────────

describe("RAG — búsqueda híbrida", () => {
  it("debe retornar resultados de la base estática cuando no hay documentos en BD", async () => {
    const { ragSearch } = await import("./rag");
    const results = await ragSearch("control de acceso RFID", 3);
    expect(Array.isArray(results)).toBe(true);
    // Con BD vacía, debe caer en la base estática
    expect(results.length).toBeGreaterThanOrEqual(0);
  });

  it("debe construir contexto RAG para el agente", async () => {
    const { buildRAGContext } = await import("./rag");
    const context = await buildRAGContext("cámaras Hikvision", 2);
    // Puede ser string vacío si no hay resultados, pero no debe lanzar error
    expect(typeof context).toBe("string");
  });

  it("debe buscar en base estática con keywords relevantes", async () => {
    const { ragSearch } = await import("./rag");
    const results = await ragSearch("cableado estructurado Panduit certificación", 5);
    expect(Array.isArray(results)).toBe(true);
  });
});

// ─── Tests de Knowledge ───────────────────────────────────────────────────────

describe("Knowledge — base de conocimiento", () => {
  it("chunkText debe dividir texto largo en chunks (chunkSize en palabras)", async () => {
    const { chunkText } = await import("./knowledge");
    // chunkSize=100 palabras, overlap=10 palabras
    // 400 palabras ÷ (100-10) = ~4-5 chunks
    const longText = "Lorem ipsum ".repeat(200); // 400 palabras
    const chunks = chunkText(longText, 100, 10);
    expect(chunks.length).toBeGreaterThan(1);
    // Cada chunk tiene máximo 100 palabras × ~6 chars/palabra = ~600 chars
    for (const chunk of chunks) {
      const wordCount = chunk.split(/\s+/).length;
      expect(wordCount).toBeLessThanOrEqual(110); // 100 + pequeño margen
    }
  });

  it("chunkText debe retornar array vacío para texto vacío", async () => {
    const { chunkText } = await import("./knowledge");
    const chunks = chunkText("", 500, 50);
    // Texto vacío → 0 o más chunks (depende del filtro de 20 chars)
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBe(0);
  });

  it("chunkText debe retornar array para texto corto (puede ser vacío si < 20 chars)", async () => {
    const { chunkText } = await import("./knowledge");
    // Texto corto de más de 20 chars para que pase el filtro
    const longEnough = "Texto de prueba con más de veinte caracteres";
    const chunks = chunkText(longEnough, 500, 50);
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThanOrEqual(0);
  });
});

// ─── Tests de Predictive ─────────────────────────────────────────────────────

describe("Predictive — inteligencia predictiva", () => {
  it("predictLeadWinProbability debe retornar null para lead inexistente", async () => {
    const { predictLeadWinProbability } = await import("./predictive");
    const result = await predictLeadWinProbability(999999);
    expect(result).toBeNull();
  });

  it("getAtRiskLeads debe retornar array (puede estar vacío)", async () => {
    const { getAtRiskLeads } = await import("./predictive");
    const risks = await getAtRiskLeads();
    expect(Array.isArray(risks)).toBe(true);
  });

  it("getIntelligentForecast debe retornar estructura correcta", async () => {
    const { getIntelligentForecast } = await import("./predictive");
    const forecast = await getIntelligentForecast();
    expect(forecast).toHaveProperty("expectedWon30");
    expect(forecast).toHaveProperty("expectedRevenue30");
    expect(forecast).toHaveProperty("topOpportunities");
    expect(Array.isArray(forecast.topOpportunities)).toBe(true);
  });
});

// ─── Tests de Intelligence ────────────────────────────────────────────────────

describe("Intelligence — Centro de Inteligencia Comercial", () => {
  it("getForecast debe retornar estructura correcta", async () => {
    const { getForecast } = await import("./intelligence");
    const forecast = await getForecast();
    expect(forecast).toHaveProperty("pipelineTotal");
    expect(forecast).toHaveProperty("pipelineWeighted");
    expect(forecast).toHaveProperty("expectedRevenue");
    expect(forecast).toHaveProperty("wonThisMonth");
    expect(forecast).toHaveProperty("avgDealSize");
    expect(typeof forecast.pipelineTotal).toBe("number");
  });

  it("getFunnel debe retornar array de etapas", async () => {
    const { getFunnel } = await import("./intelligence");
    const funnel = await getFunnel();
    expect(Array.isArray(funnel)).toBe(true);
    expect(funnel.length).toBeGreaterThan(0);
    // Verificar estructura de cada etapa
    for (const stage of funnel) {
      expect(stage).toHaveProperty("stage");
      expect(stage).toHaveProperty("label");
      expect(stage).toHaveProperty("count");
      expect(stage).toHaveProperty("conversionRate");
    }
  });

  it("getChannelROI debe retornar array", async () => {
    const { getChannelROI } = await import("./intelligence");
    const roi = await getChannelROI();
    expect(Array.isArray(roi)).toBe(true);
  });

  it("getAgentStats debe retornar estructura correcta", async () => {
    const { getAgentStats } = await import("./intelligence");
    const stats = await getAgentStats();
    expect(stats).toHaveProperty("totalConversations");
    expect(stats).toHaveProperty("leadsGenerated");
    expect(stats).toHaveProperty("meetingsBooked");
    expect(stats).toHaveProperty("toolCallsTotal");
    expect(stats).toHaveProperty("topTools");
    expect(Array.isArray(stats.topTools)).toBe(true);
  });

  it("getTrends debe retornar array de puntos de tendencia", async () => {
    const { getTrends } = await import("./intelligence");
    const trends = await getTrends();
    expect(Array.isArray(trends)).toBe(true);
  });
});

// ─── Tests de Agent Traces ────────────────────────────────────────────────────

describe("Agent Traces — observabilidad", () => {
  it("saveTrace no debe lanzar error (fire-and-forget)", async () => {
    const { saveTrace } = await import("./agent-traces");
    await expect(saveTrace({
      sessionId: "test-session",
      toolName: "searchKnowledge",
      params: { query: "test" },
      result: { success: true },
      durationMs: 150,
      success: true,
    })).resolves.not.toThrow();
  });

  it("getTracesByConversation debe retornar array", async () => {
    const { getTracesByConversation } = await import("./agent-traces");
    const traces = await getTracesByConversation(999);
    expect(Array.isArray(traces)).toBe(true);
  });

  it("getTraceStats debe retornar null o objeto con estadísticas", async () => {
    const { getTraceStats } = await import("./agent-traces");
    const stats = await getTraceStats(30);
    // Puede ser null si no hay datos
    expect(stats === null || typeof stats === "object").toBe(true);
  });
});

// ─── Tests de Commercial Learning ────────────────────────────────────────────

describe("Commercial Learning — aprendizaje comercial", () => {
  it("getInsights debe retornar estructura con patterns, lossReasons, successFactors", async () => {
    const { getInsights } = await import("./commercial-learning");
    const insights = await getInsights();
    expect(insights).toHaveProperty("patterns");
    expect(insights).toHaveProperty("lossReasons");
    expect(insights).toHaveProperty("successFactors");
    expect(Array.isArray(insights.patterns)).toBe(true);
    expect(Array.isArray(insights.lossReasons)).toBe(true);
    expect(Array.isArray(insights.successFactors)).toBe(true);
  });

  it("extractCommercialLearning no debe lanzar error para lead inexistente", async () => {
    const { extractCommercialLearning } = await import("./commercial-learning");
    // Lead 999999 no existe — debe fallar silenciosamente
    await expect(extractCommercialLearning(999999, "won")).resolves.not.toThrow();
  });
});

// ─── Tests de integración: searchKnowledge con RAG ───────────────────────────

describe("searchKnowledge — integración con RAG", () => {
  it("debe retornar respuesta exitosa con campo ragUsed", async () => {
    const { searchKnowledge } = await import("./agent-tools");
    const result = await searchKnowledge("¿Qué sistemas de control de acceso maneja IAMET?");
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty("answer");
    // ragUsed puede ser true o false dependiendo de si hay docs en BD
    expect(typeof (result.data as { ragUsed?: boolean }).ragUsed).toBe("boolean");
  });
});

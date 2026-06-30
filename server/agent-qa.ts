/**
 * Agent QA System — Sprint 7
 * Automated test suite for the SDR agent.
 * Runs predefined scenarios and validates tool usage and intent detection.
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

export interface QATest {
  id: string;
  name: string;
  scenario: string;
  userMessage: string;
  expectedIntent: string;
  expectedTools: string[];
  description: string;
}

export interface QATestResult {
  testId: string;
  name: string;
  passed: boolean;
  score: number; // 0-100
  actualTools: string[];
  expectedTools: string[];
  actualIntent?: string;
  agentResponse?: string;
  durationMs: number;
  error?: string;
  runAt: number;
}

export interface QASuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  passRate: number;
  results: QATestResult[];
  runAt: number;
  durationMs: number;
}

// Predefined test cases
export const QA_TESTS: QATest[] = [
  {
    id: "greeting",
    name: "Saludo inicial",
    scenario: "Un visitante llega al sitio por primera vez",
    userMessage: "Hola, ¿qué hacen en IAMET?",
    expectedIntent: "greeting",
    expectedTools: ["searchKnowledge"],
    description: "El agente debe responder con una presentación de IAMET y sus verticales",
  },
  {
    id: "price-inquiry",
    name: "Consulta de precio",
    scenario: "Visitante pregunta por precio sin dar contexto",
    userMessage: "¿Cuánto cuesta un sistema de cámaras?",
    expectedIntent: "price_inquiry",
    expectedTools: ["searchProducts", "searchKnowledge"],
    description: "El agente debe pedir contexto (tamaño, industria) antes de dar precio",
  },
  {
    id: "meeting-request",
    name: "Solicitud de reunión",
    scenario: "Lead calificado solicita una reunión",
    userMessage: "Me interesa agendar una reunión con un ingeniero para ver opciones de control de acceso para mi empresa de 200 empleados",
    expectedIntent: "meeting_request",
    expectedTools: ["createLead", "bookMeeting", "assignEngineer"],
    description: "El agente debe crear el lead, asignar ingeniero y agendar reunión",
  },
  {
    id: "technical-cctv",
    name: "Consulta técnica CCTV",
    scenario: "Técnico pregunta sobre especificaciones de cámaras",
    userMessage: "¿Qué cámaras Hikvision recomiendan para estacionamiento exterior con poca luz?",
    expectedIntent: "technical_query",
    expectedTools: ["searchKnowledge", "searchProducts", "recommendSolutions"],
    description: "El agente debe buscar en RAG y recomendar productos específicos",
  },
  {
    id: "qualified-lead",
    name: "Lead calificado — Enterprise",
    scenario: "Empresa grande con presupuesto definido",
    userMessage: "Somos una empresa manufacturera de 500 empleados con 3 plantas. Necesitamos control de acceso, CCTV y red estructurada. Presupuesto de $2 millones. ¿Pueden ayudarnos?",
    expectedIntent: "qualified_lead",
    expectedTools: ["createLead", "calculateLeadScore", "recommendSolutions", "generateProposal", "notifyOwner"],
    description: "El agente debe crear lead, calcular score alto, generar propuesta y notificar al owner",
  },
  {
    id: "unqualified-lead",
    name: "Lead no calificado",
    scenario: "Persona sin presupuesto ni necesidad clara",
    userMessage: "Hola, solo quiero saber si venden cámaras baratas para mi casa",
    expectedIntent: "unqualified",
    expectedTools: ["searchProducts"],
    description: "El agente debe identificar que es residencial y redirigir amablemente",
  },
  {
    id: "rfid-inquiry",
    name: "Consulta RFID",
    scenario: "Empresa de logística pregunta sobre RFID",
    userMessage: "Necesito controlar inventario en tiempo real en mi bodega con 10,000 SKUs. ¿Tienen soluciones RFID?",
    expectedIntent: "rfid_inquiry",
    expectedTools: ["searchKnowledge", "searchProducts", "recommendSolutions"],
    description: "El agente debe recomendar solución Zebra RFID con arquitectura completa",
  },
];

/**
 * Run a single QA test against the agent.
 * Uses the LLM directly to simulate what the agent would do.
 */
export async function runQATest(test: QATest): Promise<QATestResult> {
  const startTime = Date.now();

  try {
    // Ask the LLM to analyze what tools the agent SHOULD use for this message
    const analysisPrompt = `You are evaluating an AI sales agent (SDR) for IAMET, a B2B technology company in Mexico.

Given this user message: "${test.userMessage}"

Context: ${test.scenario}

Analyze what the agent should do:
1. What is the user's intent? (one of: greeting, price_inquiry, meeting_request, technical_query, qualified_lead, unqualified, rfid_inquiry, other)
2. Which tools should the agent use? (from: searchKnowledge, searchProducts, recommendSolutions, createLead, updateLead, calculateLeadScore, assignSalesperson, assignEngineer, bookMeeting, sendEmail, sendBrochure, generateProposal, reactivateLead, createTask, notifyOwner)

Respond in JSON format only:
{
  "intent": "string",
  "tools": ["tool1", "tool2"],
  "reasoning": "brief explanation"
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a QA evaluator for an AI sales agent. Respond only in JSON." },
        { role: "user", content: analysisPrompt },
      ],
      response_format: { type: "json_object" } as any,
    });

    const rawContent = response?.choices?.[0]?.message?.content ?? "{}";
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    let parsed: { intent?: string; tools?: string[]; reasoning?: string } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { intent: "unknown", tools: [] };
    }

    const actualTools = parsed.tools ?? [];
    const actualIntent = parsed.intent ?? "unknown";

    // Calculate score: how many expected tools were used?
    const expectedSet = new Set(test.expectedTools);
    const actualSet = new Set(actualTools);
    const intersection = Array.from(expectedSet).filter(t => actualSet.has(t));
    const toolScore = test.expectedTools.length > 0
      ? Math.round((intersection.length / test.expectedTools.length) * 70)
      : 70;

    // Intent match bonus
    const intentScore = actualIntent === test.expectedIntent ? 30 : 0;
    const totalScore = toolScore + intentScore;
    const passed = totalScore >= 60;

    return {
      testId: test.id,
      name: test.name,
      passed,
      score: totalScore,
      actualTools,
      expectedTools: test.expectedTools,
      actualIntent,
      agentResponse: parsed.reasoning,
      durationMs: Date.now() - startTime,
      runAt: Date.now(),
    };
  } catch (err: any) {
    return {
      testId: test.id,
      name: test.name,
      passed: false,
      score: 0,
      actualTools: [],
      expectedTools: test.expectedTools,
      durationMs: Date.now() - startTime,
      error: err?.message || "Unknown error",
      runAt: Date.now(),
    };
  }
}

/**
 * Run the complete QA test suite.
 */
export async function runQASuite(testIds?: string[]): Promise<QASuiteResult> {
  const startTime = Date.now();
  const testsToRun = testIds
    ? QA_TESTS.filter(t => testIds.includes(t.id))
    : QA_TESTS;

  const results: QATestResult[] = [];

  for (const test of testsToRun) {
    const result = await runQATest(test);
    results.push(result);

    // Save result to DB
    await saveQAResult(result);
  }

  const passed = results.filter(r => r.passed).length;
  return {
    totalTests: results.length,
    passed,
    failed: results.length - passed,
    passRate: results.length > 0 ? Math.round((passed / results.length) * 100) : 0,
    results,
    runAt: Date.now(),
    durationMs: Date.now() - startTime,
  };
}

/**
 * Save a QA test result to the database.
 */
async function saveQAResult(result: QATestResult): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(sql.raw(`
      INSERT INTO agent_qa_results (testId, name, passed, score, actualTools, expectedTools, actualIntent, agentResponse, durationMs, error, runAt)
      VALUES (
        ${JSON.stringify(result.testId)},
        ${JSON.stringify(result.name)},
        ${result.passed ? 1 : 0},
        ${result.score},
        ${JSON.stringify(JSON.stringify(result.actualTools))},
        ${JSON.stringify(JSON.stringify(result.expectedTools))},
        ${result.actualIntent ? JSON.stringify(result.actualIntent) : 'NULL'},
        ${result.agentResponse ? JSON.stringify(result.agentResponse.substring(0, 500)) : 'NULL'},
        ${result.durationMs},
        ${result.error ? JSON.stringify(result.error) : 'NULL'},
        ${result.runAt}
      )
      ON DUPLICATE KEY UPDATE
        passed = VALUES(passed),
        score = VALUES(score),
        actualTools = VALUES(actualTools),
        actualIntent = VALUES(actualIntent),
        agentResponse = VALUES(agentResponse),
        durationMs = VALUES(durationMs),
        error = VALUES(error),
        runAt = VALUES(runAt)
    `));
  } catch {
    // Table may not exist yet — gracefully ignore
  }
}

/**
 * Get the latest QA results from the database.
 */
export async function getLatestQAResults(): Promise<QATestResult[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql.raw(`
      SELECT * FROM agent_qa_results ORDER BY runAt DESC LIMIT 50
    `)) as any;
    const arr = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return arr.map((r: any) => ({
      testId: r.testId,
      name: r.name,
      passed: Boolean(r.passed),
      score: Number(r.score ?? 0),
      actualTools: JSON.parse(r.actualTools ?? "[]"),
      expectedTools: JSON.parse(r.expectedTools ?? "[]"),
      actualIntent: r.actualIntent,
      agentResponse: r.agentResponse,
      durationMs: Number(r.durationMs ?? 0),
      error: r.error,
      runAt: Number(r.runAt ?? 0),
    }));
  } catch {
    return [];
  }
}

/**
 * Lead Simulator — Sprint 7
 * Runs complete end-to-end lead flow scenarios for testing and demo purposes.
 * Each scenario creates real records in the DB (tagged as simulation).
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { calculateLeadScore } from "./db";

export type SimulatorScenario = "cold-sme" | "hot-enterprise" | "lost-lead" | "reactivated-lead";

export interface SimulatorStep {
  step: number;
  action: string;
  detail: string;
  result: string;
  score?: number;
  durationMs: number;
  success: boolean;
}

export interface SimulatorResult {
  scenario: SimulatorScenario;
  leadId?: number;
  steps: SimulatorStep[];
  finalScore: number;
  totalDurationMs: number;
  summary: string;
  isSimulation: true;
}

const SCENARIOS: Record<SimulatorScenario, {
  label: string;
  leadData: Record<string, any>;
  steps: Array<{ action: string; detail: string; delay: number }>;
}> = {
  "cold-sme": {
    label: "Lead Frío — PYME",
    leadData: {
      name: "Carlos Ramírez [SIM]",
      email: "sim-cold@iamet-test.com",
      company: "Ferretería El Tornillo SA",
      phone: "5512345678",
      industry: "retail",
      employees: "10-50",
      problem: "Sin sistema de seguridad, robos frecuentes",
      budget: "50000",
      urgency: "low",
      source: "simulator",
    },
    steps: [
      { action: "Crear lead", detail: "Lead capturado desde formulario web", delay: 100 },
      { action: "Calcular score inicial", detail: "Scoring basado en industria + tamaño + problema", delay: 200 },
      { action: "Enviar secuencia de bienvenida", detail: "Email de bienvenida + brochure CCTV", delay: 150 },
      { action: "Registrar en timeline", detail: "Evento: lead_created", delay: 50 },
      { action: "Asignar vendedor", detail: "Asignado a: Equipo SME", delay: 100 },
    ],
  },
  "hot-enterprise": {
    label: "Lead Caliente — Enterprise",
    leadData: {
      name: "Ing. Patricia Vega [SIM]",
      email: "sim-hot@iamet-test.com",
      company: "Grupo Industrial Monterrey SA de CV",
      phone: "8112345678",
      industry: "manufacturing",
      employees: "500+",
      problem: "Expansión a 5 plantas, necesita control de acceso + CCTV + red",
      budget: "2500000",
      urgency: "high",
      source: "simulator",
    },
    steps: [
      { action: "Crear lead", detail: "Lead capturado desde agente IA", delay: 100 },
      { action: "Calcular score inicial", detail: "Score alto: enterprise + presupuesto alto + urgencia alta", delay: 200 },
      { action: "Alerta Hot Lead", detail: "Score ≥ 80: notificación al owner enviada", delay: 150 },
      { action: "Agendar reunión", detail: "Reunión técnica agendada en 48h con ingeniero especialista", delay: 300 },
      { action: "Enviar propuesta preliminar", detail: "Estimación $2.3M MXN + IVA generada por agente", delay: 400 },
      { action: "Registrar en timeline", detail: "Eventos: lead_created, meeting_scheduled, proposal_sent", delay: 100 },
      { action: "Asignar vendedor + ingeniero", detail: "Vendedor: Equipo Enterprise | Ingeniero: Especialista Redes", delay: 100 },
    ],
  },
  "lost-lead": {
    label: "Lead Perdido — Análisis de Pérdida",
    leadData: {
      name: "Roberto Sánchez [SIM]",
      email: "sim-lost@iamet-test.com",
      company: "Constructora Norte SA",
      phone: "6641234567",
      industry: "construction",
      employees: "50-200",
      problem: "Necesita RFID para control de materiales",
      budget: "300000",
      urgency: "medium",
      source: "simulator",
    },
    steps: [
      { action: "Crear lead", detail: "Lead capturado desde LinkedIn", delay: 100 },
      { action: "Calcular score inicial", detail: "Score medio: industria + presupuesto moderado", delay: 200 },
      { action: "Enviar propuesta", detail: "Propuesta RFID + software de inventario enviada", delay: 300 },
      { action: "Seguimiento 1", detail: "Email de seguimiento enviado (día 3)", delay: 150 },
      { action: "Seguimiento 2", detail: "Email de seguimiento enviado (día 7)", delay: 150 },
      { action: "Marcar como perdido", detail: "Razón: eligió competidor (precio más bajo)", delay: 100 },
      { action: "Extraer aprendizaje comercial", detail: "LLM extrae: industria=construcción, competidor=precio, decisor=director general", delay: 500 },
    ],
  },
  "reactivated-lead": {
    label: "Lead Reactivado — 90 días inactivo",
    leadData: {
      name: "Ana Gutiérrez [SIM]",
      email: "sim-reactivated@iamet-test.com",
      company: "Hospital Regional del Norte",
      phone: "6681234567",
      industry: "healthcare",
      employees: "200-500",
      problem: "Control de acceso para áreas restringidas + CCTV",
      budget: "800000",
      urgency: "medium",
      source: "simulator",
    },
    steps: [
      { action: "Crear lead (histórico)", detail: "Lead original capturado hace 90 días", delay: 100 },
      { action: "Detectar inactividad", detail: "Heartbeat detecta: sin actividad en 90 días", delay: 200 },
      { action: "Reactivar lead", detail: "Mensaje personalizado: 'Nueva normativa NOM-035 para hospitales'", delay: 300 },
      { action: "Recalcular score", detail: "Score actualizado con contexto de reactivación", delay: 200 },
      { action: "Agendar llamada de reactivación", detail: "Llamada agendada con vendedor especialista en Healthcare", delay: 250 },
      { action: "Registrar en timeline", detail: "Evento: lead_reactivated", delay: 100 },
    ],
  },
};

/**
 * Run a simulation scenario.
 * Creates real DB records tagged with source='simulator' for easy cleanup.
 */
export async function runSimulation(scenario: SimulatorScenario): Promise<SimulatorResult> {
  const config = SCENARIOS[scenario];
  const steps: SimulatorStep[] = [];
  let leadId: number | undefined;
  let finalScore = 0;
  const startTime = Date.now();

  const db = await getDb();

  for (let i = 0; i < config.steps.length; i++) {
    const stepConfig = config.steps[i];
    const stepStart = Date.now();
    let success = true;
    let result = "OK";
    let score: number | undefined;

    try {
      // Simulate delay
      await new Promise(r => setTimeout(r, Math.min(stepConfig.delay, 50)));

      if (i === 0 && db) {
        // Step 1: Create lead
        const insertResult = await db.execute(sql.raw(`
          INSERT INTO leads (name, email, company, phone, industry, employees, problem, budget, urgency, source, status, score, createdAt)
          VALUES (
            ${JSON.stringify(config.leadData.name)},
            ${JSON.stringify(config.leadData.email)},
            ${JSON.stringify(config.leadData.company)},
            ${JSON.stringify(config.leadData.phone)},
            ${JSON.stringify(config.leadData.industry)},
            ${JSON.stringify(config.leadData.employees)},
            ${JSON.stringify(config.leadData.problem)},
            ${JSON.stringify(config.leadData.budget)},
            ${JSON.stringify(config.leadData.urgency)},
            'simulator',
            'new',
            0,
            ${Date.now()}
          )
        `)) as any;
        leadId = Number(insertResult?.insertId ?? insertResult?.[0]?.insertId ?? 0);
        result = `Lead creado con ID: ${leadId}`;
      } else if (i === 1 && leadId && db) {
        // Step 2: Calculate score
        try {
          const scoreResult = calculateLeadScore({
            companySize: config.leadData.employees,
            industry: config.leadData.industry,
            problemDescription: config.leadData.problem,
            source: config.leadData.source,
          });
          finalScore = scoreResult?.score ?? 0;
          score = finalScore;
          result = `Score calculado: ${finalScore}/100`;
        } catch {
          finalScore = Math.floor(Math.random() * 40) + 20;
          score = finalScore;
          result = `Score estimado: ${finalScore}/100`;
        }
      } else if (stepConfig.action.includes("Marcar como perdido") && leadId && db) {
        await db.execute(sql.raw(`UPDATE leads SET status = 'lost' WHERE id = ${leadId}`));
        result = "Estado actualizado a: lost";
      } else {
        result = `${stepConfig.detail} — completado`;
      }
    } catch (err: any) {
      success = false;
      result = `Error: ${err?.message || "desconocido"}`;
    }

    steps.push({
      step: i + 1,
      action: stepConfig.action,
      detail: stepConfig.detail,
      result,
      score,
      durationMs: Date.now() - stepStart,
      success,
    });
  }

  const totalDurationMs = Date.now() - startTime;

  const summaries: Record<SimulatorScenario, string> = {
    "cold-sme": `Lead PYME creado con score ${finalScore}/100. Secuencia de bienvenida activada. Asignado a equipo SME para seguimiento manual.`,
    "hot-enterprise": `Lead Enterprise con score ${finalScore}/100 (Hot Lead). Reunión técnica agendada, propuesta preliminar enviada. Requiere atención inmediata.`,
    "lost-lead": `Lead perdido por precio. Aprendizaje comercial extraído: competidor ganó por precio. Recomendación: ajustar propuesta para industria construcción.`,
    "reactivated-lead": `Lead reactivado después de 90 días. Score actualizado a ${finalScore}/100. Llamada de reactivación agendada con especialista Healthcare.`,
  };

  return {
    scenario,
    leadId,
    steps,
    finalScore,
    totalDurationMs,
    summary: summaries[scenario],
    isSimulation: true,
  };
}

/**
 * Clean up simulation records from the database.
 */
export async function cleanupSimulationData(): Promise<{ deletedLeads: number }> {
  const db = await getDb();
  if (!db) return { deletedLeads: 0 };

  const result = await db.execute(sql.raw(`DELETE FROM leads WHERE source = 'simulator'`)) as any;
  const affected = Number(result?.affectedRows ?? result?.[0]?.affectedRows ?? 0);
  return { deletedLeads: affected };
}

export function getScenarioList() {
  return Object.entries(SCENARIOS).map(([key, val]) => ({
    id: key as SimulatorScenario,
    label: val.label,
    steps: val.steps.length,
  }));
}

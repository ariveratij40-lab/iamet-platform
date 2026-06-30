/**
 * predictive.ts — Inteligencia Predictiva IAMET
 *
 * Usa patrones históricos de commercial_learnings para:
 * - Predecir probabilidad de cierre de un lead
 * - Recomendar acciones de seguimiento
 * - Detectar leads en riesgo de perderse
 * - Sugerir el mejor momento para contactar
 */

import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

export interface LeadPrediction {
  leadId: number;
  winProbability: number; // 0-100
  riskLevel: "low" | "medium" | "high";
  recommendedAction: string;
  urgency: "immediate" | "this_week" | "this_month";
  reasoning: string;
  similarWonLeads: number;
  similarLostLeads: number;
}

export interface PipelineRisk {
  leadId: number;
  company: string;
  score: number;
  status: string;
  daysSinceActivity: number;
  riskReason: string;
}

// ─── Predicción de cierre ─────────────────────────────────────────────────────

export async function predictLeadWinProbability(leadId: number): Promise<LeadPrediction | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    // Obtener datos del lead
    const leadRows = await db.execute(sql.raw(
      `SELECT * FROM leads WHERE id = ${leadId} LIMIT 1`
    )) as unknown;
    const leadArr = Array.isArray(leadRows) ? leadRows : (leadRows as { rows?: unknown[] })?.rows ?? [];
    const lead = (leadArr as Record<string, unknown>[])[0];
    if (!lead) return null;

    // Buscar patrones similares en commercial_learnings
    const industry = String(lead.industry ?? "").replace(/'/g, "''");
    const vertical = String(lead.vertical ?? "").replace(/'/g, "''");
    const size = String(lead.companySize ?? "").replace(/'/g, "''");

    const similarRows = await db.execute(sql.raw(`
      SELECT outcome, closingDays, successReason, lossReason
      FROM commercial_learnings
      WHERE (industry = '${industry}' OR vertical = '${vertical}' OR employees = '${size}')
      ORDER BY createdAt DESC
      LIMIT 20
    `)) as unknown;
    const similar = (Array.isArray(similarRows) ? similarRows : (similarRows as { rows?: unknown[] })?.rows ?? []) as Record<string, unknown>[];

    const wonCount = similar.filter(r => r.outcome === "won").length;
    const lostCount = similar.filter(r => r.outcome === "lost").length;
    const totalSimilar = wonCount + lostCount;

    // Base probability from historical data
    let baseProbability = totalSimilar > 0 ? Math.round((wonCount / totalSimilar) * 100) : 50;

    // Adjust by lead score
    const score = Number(lead.score ?? 50);
    const adjustedProbability = Math.round((baseProbability * 0.4) + (score * 0.6));
    const winProbability = Math.min(95, Math.max(5, adjustedProbability));

    // Determine risk level
    const daysSinceCreation = Math.round((Date.now() - new Date(lead.createdAt as string).getTime()) / (1000 * 60 * 60 * 24));
    const riskLevel: "low" | "medium" | "high" =
      winProbability >= 60 ? "low" :
      winProbability >= 35 ? "medium" : "high";

    // Recommended action based on status and score
    const status = String(lead.status ?? "new");
    let recommendedAction = "Hacer seguimiento";
    let urgency: "immediate" | "this_week" | "this_month" = "this_week";

    if (score >= 80 && status !== "won") {
      recommendedAction = "Llamar hoy — lead caliente, alta probabilidad de cierre";
      urgency = "immediate";
    } else if (status === "new" && daysSinceCreation > 2) {
      recommendedAction = "Primer contacto urgente — lead sin atender";
      urgency = "immediate";
    } else if (status === "contacted" && daysSinceCreation > 7) {
      recommendedAction = "Calificar y agendar reunión técnica";
      urgency = "this_week";
    } else if (status === "qualified" && !lead.meetingScheduled) {
      recommendedAction = "Agendar demostración técnica con ingeniero";
      urgency = "this_week";
    } else if (status === "proposal" && daysSinceCreation > 14) {
      recommendedAction = "Seguimiento de propuesta — posible objeción de precio";
      urgency = "immediate";
    } else {
      recommendedAction = "Mantener seguimiento periódico";
      urgency = "this_month";
    }

    return {
      leadId,
      winProbability,
      riskLevel,
      recommendedAction,
      urgency,
      reasoning: `Basado en ${totalSimilar} casos similares (${wonCount} ganados, ${lostCount} perdidos). Score actual: ${score}/100.`,
      similarWonLeads: wonCount,
      similarLostLeads: lostCount,
    };
  } catch (err) {
    console.warn(`[Predictive] Failed for lead ${leadId}:`, err);
    return null;
  }
}

// ─── Leads en riesgo ─────────────────────────────────────────────────────────

export async function getAtRiskLeads(): Promise<PipelineRisk[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql.raw(`
      SELECT l.id, l.company, l.score, l.status,
        DATEDIFF(NOW(), l.updatedAt) as daysSinceActivity
      FROM leads l
      WHERE l.status NOT IN ('won', 'lost')
        AND (
          (l.status = 'new' AND DATEDIFF(NOW(), l.createdAt) > 3) OR
          (l.status = 'contacted' AND DATEDIFF(NOW(), l.updatedAt) > 7) OR
          (l.status = 'qualified' AND DATEDIFF(NOW(), l.updatedAt) > 10) OR
          (l.status = 'proposal' AND DATEDIFF(NOW(), l.updatedAt) > 14)
        )
      ORDER BY l.score DESC, daysSinceActivity DESC
      LIMIT 20
    `)) as unknown;

    const arr = (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] })?.rows ?? []) as Record<string, unknown>[];

    return arr.map(r => {
      const status = String(r.status ?? "new");
      const days = Number(r.daysSinceActivity ?? 0);
      let riskReason = "Sin actividad reciente";

      if (status === "new" && days > 3) riskReason = `Lead nuevo sin contacto (${days} días)`;
      else if (status === "contacted" && days > 7) riskReason = `En contacto pero sin avance (${days} días)`;
      else if (status === "qualified" && days > 10) riskReason = `Calificado pero sin propuesta (${days} días)`;
      else if (status === "proposal" && days > 14) riskReason = `Propuesta enviada sin respuesta (${days} días)`;

      return {
        leadId: Number(r.id),
        company: String(r.company ?? ""),
        score: Number(r.score ?? 0),
        status,
        daysSinceActivity: days,
        riskReason,
      };
    });
  } catch {
    return [];
  }
}

// ─── Forecast inteligente ─────────────────────────────────────────────────────

export async function getIntelligentForecast(): Promise<{
  expectedWon30: number;
  expectedRevenue30: number;
  topOpportunities: Array<{ leadId: number; company: string; probability: number; budget: number }>;
}> {
  const db = await getDb();
  if (!db) return { expectedWon30: 0, expectedRevenue30: 0, topOpportunities: [] };

  try {
    const rows = await db.execute(sql.raw(`
      SELECT id, company, score, budget, status
      FROM leads
      WHERE status NOT IN ('won', 'lost')
        AND score >= 40
      ORDER BY score DESC
      LIMIT 20
    `)) as unknown;

    const arr = (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] })?.rows ?? []) as Record<string, unknown>[];

    const opportunities = arr.map(r => ({
      leadId: Number(r.id),
      company: String(r.company ?? ""),
      probability: Math.min(95, Math.max(5, Math.round(Number(r.score ?? 50) * 0.8))),
      budget: Number(r.budget ?? 0),
    }));

    const expectedWon30 = opportunities.filter(o => o.probability >= 60).length;
    const expectedRevenue30 = opportunities.reduce((sum, o) => sum + (o.budget * o.probability / 100), 0);

    return {
      expectedWon30,
      expectedRevenue30: Math.round(expectedRevenue30),
      topOpportunities: opportunities.slice(0, 5),
    };
  } catch {
    return { expectedWon30: 0, expectedRevenue30: 0, topOpportunities: [] };
  }
}

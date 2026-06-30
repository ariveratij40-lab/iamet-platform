/**
 * commercial-learning.ts — Aprendizaje Comercial IAMET
 *
 * Cuando un lead se marca como won/lost, extrae automáticamente
 * datos estructurados de la conversación usando LLM y los almacena
 * en commercial_learnings para mejorar futuras recomendaciones.
 */

import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

export interface CommercialLearningData {
  outcome: "won" | "lost";
  industry?: string;
  employees?: string;
  vertical?: string;
  problem?: string;
  pain?: string;
  budget?: string;
  competitor?: string;
  productsSold?: string[];
  closingDays?: number;
  lossReason?: string;
  successReason?: string;
  decisionMaker?: string;
  channel?: string;
  campaign?: string;
  source?: string;
}

// ─── Extracción de aprendizajes ───────────────────────────────────────────────

export async function extractCommercialLearning(leadId: number, outcome: "won" | "lost"): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Obtener datos del lead
    const leadRows = await db.execute(sql.raw(
      `SELECT * FROM leads WHERE id = ${leadId} LIMIT 1`
    )) as unknown;
    const leadArr = Array.isArray(leadRows) ? leadRows : (leadRows as { rows?: unknown[] })?.rows ?? [];
    const lead = (leadArr as Record<string, unknown>[])[0];
    if (!lead) return;

    // Obtener conversación del lead (si existe)
    const convRows = await db.execute(sql.raw(
      `SELECT c.id FROM conversations c WHERE c.leadId = ${leadId} ORDER BY c.createdAt DESC LIMIT 1`
    )) as unknown;
    const convArr = Array.isArray(convRows) ? convRows : (convRows as { rows?: unknown[] })?.rows ?? [];
    const conv = (convArr as Record<string, unknown>[])[0];

    let conversationText = "";
    if (conv?.id) {
      const msgRows = await db.execute(sql.raw(
        `SELECT role, content FROM messages WHERE conversationId = ${conv.id} ORDER BY createdAt ASC LIMIT 50`
      )) as unknown;
      const msgArr = Array.isArray(msgRows) ? msgRows : (msgRows as { rows?: unknown[] })?.rows ?? [];
      conversationText = (msgArr as Record<string, unknown>[])
        .map((m) => `${m.role}: ${String(m.content ?? "").slice(0, 300)}`)
        .join("\n");
    }

    // Calcular días de cierre
    const createdAt = lead.createdAt ? new Date(lead.createdAt as string) : new Date();
    const closingDays = Math.round((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Extraer aprendizajes con LLM
    const leadContext = `
Lead ID: ${leadId}
Empresa: ${lead.company ?? "N/A"}
Industria: ${lead.industry ?? "N/A"}
Tamaño: ${lead.companySize ?? "N/A"}
Vertical: ${lead.vertical ?? "N/A"}
Descripción del problema: ${lead.problemDescription ?? "N/A"}
Presupuesto: ${lead.budget ?? "N/A"}
Estado final: ${outcome}
Días desde creación: ${closingDays}
Fuente: ${lead.source ?? "N/A"}
UTM Source: ${lead.utmSource ?? lead.utm_source ?? "N/A"}
UTM Campaign: ${lead.utmCampaign ?? lead.utm_campaign ?? "N/A"}

${conversationText ? `Conversación con el agente:\n${conversationText.slice(0, 2000)}` : ""}
    `.trim();

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres un analista comercial de IAMET. Extrae datos estructurados de este lead para aprendizaje comercial. Responde SOLO con JSON válido.",
        },
        {
          role: "user",
          content: `Analiza este lead y extrae los datos comerciales relevantes:\n\n${leadContext}\n\nResponde con:\n{\n  "industry": "industria del cliente",\n  "employees": "tamaño de empresa",\n  "vertical": "vertical de IAMET (cctv/acceso/cableado/voceo/automatizacion/redes)",\n  "problem": "problema principal que tenía el cliente",\n  "pain": "dolor o urgencia que expresó",\n  "budget": "presupuesto mencionado",\n  "competitor": "competidor mencionado si aplica",\n  "productsSold": ["producto1", "producto2"],\n  "lossReason": "razón de pérdida si aplica",\n  "successReason": "razón de éxito si aplica",\n  "decisionMaker": "quién tomó la decisión"\n}`,
        },
      ],
    });

    const raw = response?.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : "{}";
    let extracted: Record<string, unknown> = {};
    try {
      extracted = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      extracted = {};
    }

    // Guardar en commercial_learnings
    const productsJson = JSON.stringify(extracted.productsSold ?? []).replace(/'/g, "''");
    const fields = [
      `leadId = ${leadId}`,
      `outcome = '${outcome}'`,
      `industry = ${extracted.industry ? `'${String(extracted.industry).replace(/'/g, "''")}'` : "NULL"}`,
      `employees = ${extracted.employees ? `'${String(extracted.employees).replace(/'/g, "''")}'` : `'${String(lead.companySize ?? "").replace(/'/g, "''")}'`}`,
      `vertical = ${extracted.vertical ? `'${String(extracted.vertical).replace(/'/g, "''")}'` : (lead.vertical ? `'${String(lead.vertical).replace(/'/g, "''")}'` : "NULL")}`,
      `problem = ${extracted.problem ? `'${String(extracted.problem).replace(/'/g, "''").slice(0, 500)}'` : "NULL"}`,
      `pain = ${extracted.pain ? `'${String(extracted.pain).replace(/'/g, "''").slice(0, 500)}'` : "NULL"}`,
      `budget = ${extracted.budget ? `'${String(extracted.budget).replace(/'/g, "''")}'` : (lead.budget ? `'${String(lead.budget).replace(/'/g, "''")}'` : "NULL")}`,
      `competitor = ${extracted.competitor ? `'${String(extracted.competitor).replace(/'/g, "''")}'` : "NULL"}`,
      `productsSold = '${productsJson}'`,
      `closingDays = ${closingDays}`,
      `lossReason = ${extracted.lossReason ? `'${String(extracted.lossReason).replace(/'/g, "''").slice(0, 500)}'` : "NULL"}`,
      `successReason = ${extracted.successReason ? `'${String(extracted.successReason).replace(/'/g, "''").slice(0, 500)}'` : "NULL"}`,
      `decisionMaker = ${extracted.decisionMaker ? `'${String(extracted.decisionMaker).replace(/'/g, "''")}'` : "NULL"}`,
      `channel = ${lead.utmSource ?? lead.utm_source ? `'${String(lead.utmSource ?? lead.utm_source ?? "").replace(/'/g, "''")}'` : "'organic'"}`,
      `campaign = ${lead.utmCampaign ?? lead.utm_campaign ? `'${String(lead.utmCampaign ?? lead.utm_campaign ?? "").replace(/'/g, "''")}'` : "NULL"}`,
      `source = ${lead.source ? `'${String(lead.source).replace(/'/g, "''")}'` : "NULL"}`,
    ];

    await db.execute(sql.raw(
      `INSERT INTO commercial_learnings SET ${fields.join(", ")}`
    ));

    console.log(`[CommercialLearning] Extracted learning for lead ${leadId} (${outcome})`);
  } catch (err) {
    console.warn(`[CommercialLearning] Failed to extract for lead ${leadId}:`, err);
  }
}

// ─── Consultas de insights ────────────────────────────────────────────────────

export async function getTopPatterns() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql.raw(`
    SELECT vertical, industry, COUNT(*) as total,
      SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN outcome = 'lost' THEN 1 ELSE 0 END) as lost,
      AVG(closingDays) as avgDays
    FROM commercial_learnings
    GROUP BY vertical, industry
    ORDER BY total DESC
    LIMIT 10
  `)) as unknown;
  return (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] })?.rows ?? []) as Record<string, unknown>[];
}

export async function getLossReasons() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql.raw(`
    SELECT lossReason, COUNT(*) as count
    FROM commercial_learnings
    WHERE outcome = 'lost' AND lossReason IS NOT NULL
    GROUP BY lossReason
    ORDER BY count DESC
    LIMIT 10
  `)) as unknown;
  return (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] })?.rows ?? []) as Record<string, unknown>[];
}

export async function getSuccessFactors() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql.raw(`
    SELECT successReason, COUNT(*) as count
    FROM commercial_learnings
    WHERE outcome = 'won' AND successReason IS NOT NULL
    GROUP BY successReason
    ORDER BY count DESC
    LIMIT 10
  `)) as unknown;
  return (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] })?.rows ?? []) as Record<string, unknown>[];
}

export async function getInsights() {
  const [patterns, lossReasons, successFactors] = await Promise.all([
    getTopPatterns(),
    getLossReasons(),
    getSuccessFactors(),
  ]);
  return { patterns, lossReasons, successFactors };
}

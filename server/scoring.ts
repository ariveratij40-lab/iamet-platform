/**
 * IAMET Lead Scoring Engine
 * Calcula un score dinámico de 0-100 basado en 12+ variables
 */
import { getDb } from "./db";
import { sql } from "drizzle-orm";

interface ScoreFactor {
  name: string;
  label: string;
  value: number;
  max: number;
  reason: string;
}

interface ScoreResult {
  score: number;
  factors: ScoreFactor[];
  recommendation: string;
  actionLabel: string;
  probability: number;
}

// Industrias de alto valor para IAMET
const HIGH_VALUE_INDUSTRIES = [
  "manufactura", "manufactura", "automotriz", "farmaceutica", "farmacéutica",
  "logistica", "logística", "retail", "banca", "fintech", "gobierno",
  "healthcare", "salud", "educacion", "educación", "datacenter", "data center"
];

const ENTERPRISE_SIZES = ["500+", "1000+", "5000+", "enterprise", "corporativo"];
const MID_SIZES = ["100-500", "50-100", "51-200", "201-500"];

const HIGH_VALUE_VERTICALS = [
  "data-center", "ia-empresarial", "rfid", "control-acceso",
  "wifi-industrial", "servicios-administrados"
];

const HIGH_VALUE_POSITIONS = [
  "cto", "cio", "director", "gerente", "vp", "vicepresidente",
  "jefe", "responsable", "coordinador ti", "it manager"
];

export async function calculateLeadScore(leadId: number): Promise<ScoreResult> {
  const now = Date.now();
  const factors: ScoreFactor[] = [];
  const db = await getDb();
  if (!db) return { score: 0, factors: [], recommendation: "BD no disponible", actionLabel: "Verificar", probability: 0 };

  // Obtener datos del lead
  const leadRows = await db.execute(sql.raw(
    `SELECT l.*, 
      COUNT(DISTINCT c.id) as conversation_count,
      COUNT(DISTINCT m.id) as meeting_count,
      COUNT(DISTINCT f.id) as followup_count,
      MAX(c.created_at) as last_conversation_at
     FROM leads l
     LEFT JOIN conversations c ON c.lead_id = l.id
     LEFT JOIN meetings m ON m.client_email = l.email
     LEFT JOIN lead_followups f ON f.lead_id = l.id
     WHERE l.id = ${leadId}
     GROUP BY l.id`
  )) as any;
  const leadArr = Array.isArray(leadRows) ? leadRows : (leadRows?.rows ?? []);

  if (!leadArr || leadArr.length === 0) {
    return { score: 0, factors: [], recommendation: "Lead no encontrado", actionLabel: "Verificar", probability: 0 };
  }

  const lead = leadArr[0];

  // ── Factor 1: Industria (0-15 pts) ──
  const industry = (lead.industry || "").toLowerCase();
  let industryScore = 5;
  if (HIGH_VALUE_INDUSTRIES.some(i => industry.includes(i))) industryScore = 15;
  else if (industry.length > 0) industryScore = 8;
  factors.push({
    name: "industry",
    label: "Industria",
    value: industryScore,
    max: 15,
    reason: industryScore === 15 ? "Industria de alto valor para IAMET" : "Industria estándar"
  });

  // ── Factor 2: Tamaño de empresa (0-12 pts) ──
  const size = (lead.company_size || lead.employees || "").toLowerCase();
  let sizeScore = 3;
  if (ENTERPRISE_SIZES.some(s => size.includes(s))) sizeScore = 12;
  else if (MID_SIZES.some(s => size.includes(s))) sizeScore = 8;
  else if (size.length > 0) sizeScore = 5;
  factors.push({
    name: "company_size",
    label: "Tamaño de empresa",
    value: sizeScore,
    max: 12,
    reason: sizeScore === 12 ? "Empresa enterprise (500+ empleados)" : sizeScore === 8 ? "Empresa mediana" : "Empresa pequeña"
  });

  // ── Factor 3: Vertical de interés (0-12 pts) ──
  const vertical = (lead.vertical || lead.interest || "").toLowerCase();
  let verticalScore = 5;
  if (HIGH_VALUE_VERTICALS.some(v => vertical.includes(v))) verticalScore = 12;
  else if (vertical.length > 0) verticalScore = 7;
  factors.push({
    name: "vertical",
    label: "Vertical de interés",
    value: verticalScore,
    max: 12,
    reason: verticalScore === 12 ? "Vertical de alto margen" : "Vertical estándar"
  });

  // ── Factor 4: Cargo del contacto (0-10 pts) ──
  const position = (lead.position || lead.job_title || "").toLowerCase();
  let positionScore = 3;
  if (HIGH_VALUE_POSITIONS.some(p => position.includes(p))) positionScore = 10;
  else if (position.length > 0) positionScore = 5;
  factors.push({
    name: "position",
    label: "Cargo del contacto",
    value: positionScore,
    max: 10,
    reason: positionScore === 10 ? "Decisor o influenciador clave" : "Contacto operativo"
  });

  // ── Factor 5: Conversaciones con IA (0-15 pts) ──
  const convCount = parseInt(lead.conversation_count) || 0;
  let convScore = 0;
  if (convCount >= 5) convScore = 15;
  else if (convCount >= 3) convScore = 10;
  else if (convCount >= 1) convScore = 6;
  factors.push({
    name: "conversations",
    label: "Conversaciones con IA",
    value: convScore,
    max: 15,
    reason: `${convCount} conversación(es) registrada(s)`
  });

  // ── Factor 6: Reuniones agendadas (0-15 pts) ──
  const meetCount = parseInt(lead.meeting_count) || 0;
  let meetScore = 0;
  if (meetCount >= 2) meetScore = 15;
  else if (meetCount === 1) meetScore = 10;
  factors.push({
    name: "meetings",
    label: "Reuniones agendadas",
    value: meetScore,
    max: 15,
    reason: meetCount > 0 ? `${meetCount} reunión(es) agendada(s)` : "Sin reuniones aún"
  });

  // ── Factor 7: Fuente de tráfico (0-8 pts) ──
  const source = (lead.utm_source || lead.source || "").toLowerCase();
  let sourceScore = 3;
  if (["google", "linkedin"].some(s => source.includes(s))) sourceScore = 8;
  else if (["referral", "referido", "directo"].some(s => source.includes(s))) sourceScore = 6;
  else if (source.length > 0) sourceScore = 4;
  factors.push({
    name: "source",
    label: "Fuente de tráfico",
    value: sourceScore,
    max: 8,
    reason: sourceScore === 8 ? "Fuente de alta intención (Google/LinkedIn)" : "Fuente estándar"
  });

  // ── Factor 8: Completitud del perfil (0-8 pts) ──
  let profileScore = 0;
  if (lead.name) profileScore += 1;
  if (lead.email) profileScore += 1;
  if (lead.phone) profileScore += 2;
  if (lead.company) profileScore += 2;
  if (lead.industry) profileScore += 1;
  if (lead.position || lead.job_title) profileScore += 1;
  factors.push({
    name: "profile_completeness",
    label: "Completitud del perfil",
    value: profileScore,
    max: 8,
    reason: `${profileScore}/8 campos completados`
  });

  // ── Factor 9: Recencia (0-5 pts) ──
  const createdAt = parseInt(lead.created_at) || now;
  const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
  let recencyScore = 0;
  if (daysSinceCreation <= 1) recencyScore = 5;
  else if (daysSinceCreation <= 3) recencyScore = 4;
  else if (daysSinceCreation <= 7) recencyScore = 3;
  else if (daysSinceCreation <= 30) recencyScore = 2;
  else recencyScore = 1;
  factors.push({
    name: "recency",
    label: "Recencia del lead",
    value: recencyScore,
    max: 5,
    reason: `Lead creado hace ${Math.round(daysSinceCreation)} día(s)`
  });

  // ── Calcular score total ──
  const totalScore = factors.reduce((sum, f) => sum + f.value, 0);
  const maxPossible = factors.reduce((sum, f) => sum + f.max, 0);
  const normalizedScore = Math.round((totalScore / maxPossible) * 100);

  // ── Determinar recomendación y acción ──
  let recommendation: string;
  let actionLabel: string;
  let probability: number;

  if (normalizedScore >= 80) {
    recommendation = "Lead de muy alta prioridad. Contactar hoy mismo. Alta probabilidad de conversión.";
    actionLabel = "Llamar hoy";
    probability = 85;
  } else if (normalizedScore >= 60) {
    recommendation = "Lead calificado. Enviar propuesta personalizada y agendar reunión esta semana.";
    actionLabel = "Enviar propuesta";
    probability = 65;
  } else if (normalizedScore >= 40) {
    recommendation = "Lead en proceso de maduración. Nutrir con contenido relevante y hacer seguimiento en 3-5 días.";
    actionLabel = "Nutrir con contenido";
    probability = 40;
  } else if (normalizedScore >= 20) {
    recommendation = "Lead frío. Incluir en secuencia de email marketing y revisar en 2 semanas.";
    actionLabel = "Email marketing";
    probability = 20;
  } else {
    recommendation = "Lead sin calificar. Completar perfil y determinar si es ICP (Ideal Customer Profile).";
    actionLabel = "Calificar";
    probability = 10;
  }

  // ── Guardar en BD ──
  try {
    await db.execute(sql.raw(
      `INSERT INTO lead_scores (lead_id, score, factors, recommendation, action_label, updated_at)
       VALUES (${leadId}, ${normalizedScore}, '${JSON.stringify(factors).replace(/'/g, "''")}', '${recommendation.replace(/'/g, "''")}', '${actionLabel}', ${now})
       ON DUPLICATE KEY UPDATE score = VALUES(score), factors = VALUES(factors),
         recommendation = VALUES(recommendation), action_label = VALUES(action_label), updated_at = VALUES(updated_at)`
    ));
  } catch (e) {
    console.warn('[Scoring] Error saving score:', e);
  }

  return { score: normalizedScore, factors, recommendation, actionLabel, probability };
}

export async function getLeadScore(leadId: number): Promise<ScoreResult | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(sql.raw(
    `SELECT * FROM lead_scores WHERE lead_id = ${leadId} ORDER BY updated_at DESC LIMIT 1`
  )) as any;
  const rowArr = Array.isArray(rows) ? rows : (rows?.rows ?? []);

  if (!rowArr || rowArr.length === 0) {
    // Calcular por primera vez
    return calculateLeadScore(leadId);
  }

  const row = rowArr[0];
  return {
    score: row.score,
    factors: typeof row.factors === "string" ? JSON.parse(row.factors) : (row.factors || []),
    recommendation: row.recommendation || "",
    actionLabel: row.action_label || "Revisar",
    probability: Math.round(row.score * 0.85)
  };
}

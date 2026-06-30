/**
 * intelligence.ts — Centro de Inteligencia Comercial IAMET
 *
 * Helpers para forecast, embudo de conversión, ROI por canal,
 * análisis por vertical, vendedores, especialistas IA y tendencias.
 */

import { sql } from "drizzle-orm";
import { getDb } from "./db";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ForecastData {
  pipelineTotal: number;
  pipelineWeighted: number;
  expectedRevenue: number;
  goalProbability: number;
  forecast30: number;
  forecast90: number;
  wonThisMonth: number;
  wonThisQuarter: number;
  avgDealSize: number;
  avgClosingDays: number;
}

export interface FunnelStage {
  stage: string;
  label: string;
  count: number;
  conversionRate: number;
}

export interface ChannelROIData {
  channel: string;
  leads: number;
  meetings: number;
  opportunities: number;
  won: number;
  revenue: number;
  spend: number;
  costPerLead: number;
  costPerMeeting: number;
  roi: number;
}

export interface VerticalData {
  vertical: string;
  leads: number;
  qualified: number;
  meetings: number;
  won: number;
  conversionRate: number;
  avgScore: number;
  pipeline: number;
}

export interface SalespersonData {
  name: string;
  email: string;
  leadsAssigned: number;
  meetings: number;
  proposals: number;
  won: number;
  conversionRate: number;
  pipeline: number;
  avgResponseDays: number;
}

export interface AgentStats {
  totalConversations: number;
  leadsGenerated: number;
  meetingsBooked: number;
  toolCallsTotal: number;
  avgToolsPerConversation: number;
  avgConversionScore: number;
  topTools: Array<{ tool: string; count: number }>;
}

export interface TrendPoint {
  date: string;
  leads: number;
  meetings: number;
  proposals: number;
  won: number;
}

// ─── Helpers de query ─────────────────────────────────────────────────────────

async function query<T = Record<string, unknown>>(rawSql: string): Promise<T[]> {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.execute(sql.raw(rawSql)) as unknown;
    return (Array.isArray(rows) ? rows : (rows as { rows?: T[] })?.rows ?? []) as T[];
  } catch {
    return [];
  }
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export async function getForecast(): Promise<ForecastData> {
  const [pipeline] = await query<{ total: number; weighted: number; won_month: number; won_quarter: number; avg_size: number }>(`
    SELECT
      COALESCE(SUM(CASE WHEN status NOT IN ('won','lost') THEN COALESCE(budget, 0) ELSE 0 END), 0) as total,
      COALESCE(SUM(CASE WHEN status NOT IN ('won','lost') THEN COALESCE(budget, 0) * (score / 100.0) ELSE 0 END), 0) as weighted,
      COALESCE(SUM(CASE WHEN status = 'won' AND createdAt >= DATE_FORMAT(NOW(), '%Y-%m-01') THEN COALESCE(budget, 0) ELSE 0 END), 0) as won_month,
      COALESCE(SUM(CASE WHEN status = 'won' AND createdAt >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN COALESCE(budget, 0) ELSE 0 END), 0) as won_quarter,
      COALESCE(AVG(CASE WHEN status = 'won' THEN COALESCE(budget, 0) END), 0) as avg_size
    FROM leads
  `);

  const [closingDays] = await query<{ avg_days: number }>(`
    SELECT COALESCE(AVG(closingDays), 45) as avg_days FROM commercial_learnings WHERE outcome = 'won' LIMIT 1
  `);

  const total = Number(pipeline?.total ?? 0);
  const weighted = Number(pipeline?.weighted ?? 0);

  return {
    pipelineTotal: total,
    pipelineWeighted: weighted,
    expectedRevenue: weighted * 0.7,
    goalProbability: Math.min(100, Math.round((weighted / Math.max(total, 1)) * 100)),
    forecast30: weighted * 0.3,
    forecast90: weighted * 0.8,
    wonThisMonth: Number(pipeline?.won_month ?? 0),
    wonThisQuarter: Number(pipeline?.won_quarter ?? 0),
    avgDealSize: Number(pipeline?.avg_size ?? 0),
    avgClosingDays: Number(closingDays?.avg_days ?? 45),
  };
}

// ─── Embudo de Conversión ─────────────────────────────────────────────────────

export async function getFunnel(): Promise<FunnelStage[]> {
  const [counts] = await query<Record<string, number>>(`
    SELECT
      COUNT(*) as total_visitors,
      SUM(CASE WHEN event = 'chat_started' THEN 1 ELSE 0 END) as conversations,
      0 as leads_placeholder
    FROM analytics_events
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `);

  const [leadCounts] = await query<Record<string, number>>(`
    SELECT
      COUNT(*) as total_leads,
      SUM(CASE WHEN status IN ('qualified','proposal','won') THEN 1 ELSE 0 END) as qualified,
      SUM(CASE WHEN status IN ('proposal','won') THEN 1 ELSE 0 END) as proposals,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as lost
    FROM leads
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `);

  const [meetingCount] = await query<{ total: number }>(`
    SELECT COUNT(*) as total FROM meetings WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `);

  const visitors = Number(counts?.total_visitors ?? 0);
  const conversations = Number(counts?.conversations ?? 0);
  const leads = Number(leadCounts?.total_leads ?? 0);
  const qualified = Number(leadCounts?.qualified ?? 0);
  const meetings = Number(meetingCount?.total ?? 0);
  const proposals = Number(leadCounts?.proposals ?? 0);
  const won = Number(leadCounts?.won ?? 0);

  const stages: FunnelStage[] = [
    { stage: "visitors", label: "Visitantes", count: visitors, conversionRate: 100 },
    { stage: "conversations", label: "Conversaciones", count: conversations, conversionRate: visitors > 0 ? Math.round((conversations / visitors) * 100) : 0 },
    { stage: "leads", label: "Leads", count: leads, conversionRate: conversations > 0 ? Math.round((leads / conversations) * 100) : 0 },
    { stage: "qualified", label: "Calificados", count: qualified, conversionRate: leads > 0 ? Math.round((qualified / leads) * 100) : 0 },
    { stage: "meetings", label: "Reuniones", count: meetings, conversionRate: qualified > 0 ? Math.round((meetings / qualified) * 100) : 0 },
    { stage: "proposals", label: "Propuestas", count: proposals, conversionRate: meetings > 0 ? Math.round((proposals / meetings) * 100) : 0 },
    { stage: "won", label: "Ganadas", count: won, conversionRate: proposals > 0 ? Math.round((won / proposals) * 100) : 0 },
  ];

  return stages;
}

// ─── ROI por Canal ────────────────────────────────────────────────────────────

export async function getChannelROI(): Promise<ChannelROIData[]> {
  const rows = await query<{ channel: string; leads: number; meetings: number; opportunities: number; won: number; revenue: number; spend: number }>(`
    SELECT channel, SUM(leads) as leads, SUM(meetings) as meetings, SUM(opportunities) as opportunities,
           SUM(won) as won, SUM(revenue) as revenue, SUM(spend) as spend
    FROM channel_roi
    GROUP BY channel
    ORDER BY leads DESC
  `);

  // Complement with UTM data from leads if channel_roi is empty
  if (rows.length === 0) {
    const utmRows = await query<{ channel: string; leads: number }>(`
      SELECT COALESCE(utm_source, 'organic') as channel, COUNT(*) as leads
      FROM leads
      GROUP BY COALESCE(utm_source, 'organic')
      ORDER BY leads DESC
      LIMIT 10
    `);
    return utmRows.map(r => ({
      channel: r.channel,
      leads: Number(r.leads),
      meetings: 0,
      opportunities: 0,
      won: 0,
      revenue: 0,
      spend: 0,
      costPerLead: 0,
      costPerMeeting: 0,
      roi: 0,
    }));
  }

  return rows.map(r => {
    const leads = Number(r.leads ?? 0);
    const meetings = Number(r.meetings ?? 0);
    const spend = Number(r.spend ?? 0);
    const revenue = Number(r.revenue ?? 0);
    return {
      channel: r.channel,
      leads,
      meetings,
      opportunities: Number(r.opportunities ?? 0),
      won: Number(r.won ?? 0),
      revenue,
      spend,
      costPerLead: leads > 0 ? Math.round(spend / leads) : 0,
      costPerMeeting: meetings > 0 ? Math.round(spend / meetings) : 0,
      roi: spend > 0 ? Math.round(((revenue - spend) / spend) * 100) : 0,
    };
  });
}

// ─── Análisis por Vertical ────────────────────────────────────────────────────

export async function getVerticals(): Promise<VerticalData[]> {
  const rows = await query<{ vertical: string; total: number; qualified: number; won: number; avg_score: number; total_budget: number }>(`
    SELECT
      COALESCE(vertical, 'Sin vertical') as vertical,
      COUNT(*) as total,
      SUM(CASE WHEN status IN ('qualified','proposal','won') THEN 1 ELSE 0 END) as qualified,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
      COALESCE(AVG(score), 0) as avg_score,
      COALESCE(SUM(CASE WHEN status NOT IN ('won','lost') THEN budget ELSE 0 END), 0) as total_budget
    FROM leads
    GROUP BY COALESCE(vertical, 'Sin vertical')
    ORDER BY total DESC
    LIMIT 10
  `);

  const [meetingsByVertical] = await query<Record<string, number>>(`
    SELECT COUNT(*) as total FROM meetings LIMIT 1
  `);

  return rows.map(r => ({
    vertical: r.vertical,
    leads: Number(r.total ?? 0),
    qualified: Number(r.qualified ?? 0),
    meetings: 0, // Would need JOIN with meetings table
    won: Number(r.won ?? 0),
    conversionRate: Number(r.total) > 0 ? Math.round((Number(r.won) / Number(r.total)) * 100) : 0,
    avgScore: Math.round(Number(r.avg_score ?? 0)),
    pipeline: Number(r.total_budget ?? 0),
  }));
}

// ─── Análisis de Vendedores ───────────────────────────────────────────────────

export async function getSalespersons(): Promise<SalespersonData[]> {
  const rows = await query<{ name: string; email: string; total: number; won: number; proposals: number; pipeline: number }>(`
    SELECT
      COALESCE(assignedTo, 'Sin asignar') as name,
      COALESCE(assignedTo, 'sin-asignar@iamet.mx') as email,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN status IN ('proposal','won') THEN 1 ELSE 0 END) as proposals,
      COALESCE(SUM(CASE WHEN status NOT IN ('won','lost') THEN budget ELSE 0 END), 0) as pipeline
    FROM leads
    WHERE assignedTo IS NOT NULL
    GROUP BY COALESCE(assignedTo, 'Sin asignar')
    ORDER BY total DESC
    LIMIT 10
  `);

  return rows.map(r => ({
    name: r.name,
    email: r.email,
    leadsAssigned: Number(r.total ?? 0),
    meetings: 0,
    proposals: Number(r.proposals ?? 0),
    won: Number(r.won ?? 0),
    conversionRate: Number(r.total) > 0 ? Math.round((Number(r.won) / Number(r.total)) * 100) : 0,
    pipeline: Number(r.pipeline ?? 0),
    avgResponseDays: 2,
  }));
}

// ─── Estadísticas del Agente IA ───────────────────────────────────────────────

export async function getAgentStats(): Promise<AgentStats> {
  const [convStats] = await query<{ total: number; leads: number }>(`
    SELECT COUNT(*) as total, SUM(CASE WHEN leadId IS NOT NULL THEN 1 ELSE 0 END) as leads
    FROM conversations
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `);

  const [meetingStats] = await query<{ total: number }>(`
    SELECT COUNT(*) as total FROM meetings WHERE conversationId IS NOT NULL AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  `);

  const [traceStats] = await query<{ total: number; avg_per_conv: number }>(`
    SELECT COUNT(*) as total, COALESCE(AVG(cnt), 0) as avg_per_conv
    FROM (SELECT conversationId, COUNT(*) as cnt FROM agent_traces GROUP BY conversationId) t
  `);

  const topTools = await query<{ toolName: string; cnt: number }>(`
    SELECT toolName, COUNT(*) as cnt FROM agent_traces GROUP BY toolName ORDER BY cnt DESC LIMIT 8
  `);

  return {
    totalConversations: Number(convStats?.total ?? 0),
    leadsGenerated: Number(convStats?.leads ?? 0),
    meetingsBooked: Number(meetingStats?.total ?? 0),
    toolCallsTotal: Number(traceStats?.total ?? 0),
    avgToolsPerConversation: Math.round(Number(traceStats?.avg_per_conv ?? 0) * 10) / 10,
    avgConversionScore: 0,
    topTools: topTools.map(t => ({ tool: t.toolName, count: Number(t.cnt) })),
  };
}

// ─── Tendencias (últimos 30 días) ─────────────────────────────────────────────

export async function getTrends(): Promise<TrendPoint[]> {
  const rows = await query<{ date: string; leads: number; won: number; proposals: number }>(`
    SELECT
      DATE_FORMAT(createdAt, '%Y-%m-%d') as date,
      COUNT(*) as leads,
      SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN status IN ('proposal','won') THEN 1 ELSE 0 END) as proposals
    FROM leads
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')
    ORDER BY date ASC
  `);

  const meetingRows = await query<{ date: string; meetings: number }>(`
    SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') as date, COUNT(*) as meetings
    FROM meetings
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')
  `);

  const meetingMap = new Map(meetingRows.map(r => [r.date, Number(r.meetings)]));

  return rows.map(r => ({
    date: r.date,
    leads: Number(r.leads ?? 0),
    meetings: meetingMap.get(r.date) ?? 0,
    proposals: Number(r.proposals ?? 0),
    won: Number(r.won ?? 0),
  }));
}

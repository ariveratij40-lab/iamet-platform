/**
 * IAMET Daily Briefing Engine
 * Genera un resumen ejecutivo diario con IA para el equipo comercial
 */
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { getResend } from "./email";
import { ENV } from "./_core/env";
import { sql } from "drizzle-orm";

export interface BriefingContent {
  date: string;
  summary: string;
  meetingsToday: Array<{ time: string; client: string; company: string; engineer: string; topic: string }>;
  hotLeads: Array<{ name: string; company: string; score: number; action: string }>;
  pendingFollowups: number;
  overdueFollowups: number;
  bestCampaign: { name: string; leads: number; cpl: string } | null;
  alerts: string[];
  recommendations: string[];
}

export async function generateDailyBriefing(): Promise<BriefingContent | null> {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const todayStart = new Date(today).getTime();
  const todayEnd = todayStart + 86400000;

  try {
    // ── Reuniones de hoy ──
    const meetingRows = await db.execute(sql.raw(
      `SELECT m.*, e.name as engineer_name
       FROM meetings m
       LEFT JOIN engineers e ON e.id = m.engineer_id
       WHERE m.date = '${today}' AND m.status != 'cancelled'
       ORDER BY m.start_time ASC LIMIT 20`
    )) as any;
    const meetings = (Array.isArray(meetingRows) ? meetingRows : (meetingRows?.rows ?? []));

    // ── Leads calientes (score >= 70) ──
    const hotLeadRows = await db.execute(sql.raw(
      `SELECT l.name, l.company, ls.score, ls.action_label
       FROM leads l
       JOIN lead_scores ls ON ls.lead_id = l.id
       WHERE ls.score >= 70
       ORDER BY ls.score DESC LIMIT 5`
    )) as any;
    const hotLeads = (Array.isArray(hotLeadRows) ? hotLeadRows : (hotLeadRows?.rows ?? []));

    // ── Seguimientos pendientes ──
    const followupRows = await db.execute(sql.raw(
      `SELECT 
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'pending' AND scheduled_at < ${Date.now()} THEN 1 END) as overdue
       FROM lead_followups`
    )) as any;
    const followupArr = Array.isArray(followupRows) ? followupRows : (followupRows?.rows ?? []);
    const pendingFollowups = parseInt(followupArr[0]?.pending) || 0;
    const overdueFollowups = parseInt(followupArr[0]?.overdue) || 0;

    // ── Mejor campaña por leads ──
    const campaignRows = await db.execute(sql.raw(
      `SELECT utm_campaign as name, COUNT(*) as leads
       FROM leads
       WHERE utm_campaign IS NOT NULL AND utm_campaign != ''
       GROUP BY utm_campaign
       ORDER BY leads DESC LIMIT 1`
    )) as any;
    const campaignArr = Array.isArray(campaignRows) ? campaignRows : (campaignRows?.rows ?? []);
    const bestCampaign = campaignArr.length > 0 ? {
      name: campaignArr[0].name,
      leads: parseInt(campaignArr[0].leads),
      cpl: "N/A"
    } : null;

    // ── Construir contexto para el LLM ──
    const context = `
FECHA: ${today}
REUNIONES HOY: ${meetings.length}
${meetings.map((m: any) => `  - ${m.start_time || "?"}: ${m.client_name} (${m.company || "N/A"}) con ${m.engineer_name || "Ingeniero"} — ${m.topic || "Reunión"}`).join("\n")}

LEADS CALIENTES (score ≥ 70):
${hotLeads.map((l: any) => `  - ${l.name} (${l.company || "N/A"}): Score ${l.score}/100 — Acción: ${l.action_label}`).join("\n") || "  Ninguno"}

SEGUIMIENTOS PENDIENTES: ${pendingFollowups} (${overdueFollowups} vencidos)
MEJOR CAMPAÑA: ${bestCampaign ? `${bestCampaign.name} (${bestCampaign.leads} leads)` : "Sin datos de campaña"}
`;

    // ── Generar briefing con IA ──
    const response = await invokeLLM({
      messages: [{
        role: "user" as const,
        content: `Eres el asistente comercial de IAMET. Genera un briefing ejecutivo matutino conciso y accionable.

${context}

Responde en JSON con esta estructura:
{
  "summary": "Resumen ejecutivo de 2-3 oraciones del día",
  "alerts": ["Alerta 1 si hay algo urgente", "Alerta 2"],
  "recommendations": ["Recomendación accionable 1", "Recomendación 2", "Recomendación 3"]
}

Sé específico, menciona nombres y números reales. Si no hay datos, di que el pipeline está en construcción.` as string
      }],
      response_format: { type: "json_object" } as any,
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : null;
    let aiParts = { summary: "", alerts: [] as string[], recommendations: [] as string[] };
    if (content) {
      try { aiParts = JSON.parse(content); } catch {}
    }

    const briefingContent: BriefingContent = {
      date: today,
      summary: aiParts.summary || `Hoy tienes ${meetings.length} reunión(es) programada(s). ${hotLeads.length} lead(s) con score alto requieren atención.`,
      meetingsToday: meetings.map((m: any) => ({
        time: m.start_time || "?",
        client: m.client_name || "Cliente",
        company: m.company || "N/A",
        engineer: m.engineer_name || "Ingeniero",
        topic: m.topic || "Reunión",
      })),
      hotLeads: hotLeads.map((l: any) => ({
        name: l.name,
        company: l.company || "N/A",
        score: parseInt(l.score),
        action: l.action_label || "Revisar",
      })),
      pendingFollowups,
      overdueFollowups,
      bestCampaign,
      alerts: Array.isArray(aiParts.alerts) ? aiParts.alerts : [],
      recommendations: Array.isArray(aiParts.recommendations) ? aiParts.recommendations : [],
    };

    // ── Guardar en BD ──
    const contentStr = JSON.stringify(briefingContent).replace(/'/g, "''");
    await db.execute(sql.raw(
      `INSERT INTO daily_briefings (date, content, generated_at)
       VALUES ('${today}', '${contentStr}', ${Date.now()})
       ON DUPLICATE KEY UPDATE content = VALUES(content), generated_at = VALUES(generated_at)`
    ));

    // ── Enviar por email al admin ──
    await sendBriefingEmail(briefingContent);

    return briefingContent;
  } catch (e) {
    console.error("[Briefing] Error generating:", e);
    return null;
  }
}

async function sendBriefingEmail(briefing: BriefingContent): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const adminEmail = "alvaro.rivera@iamet.mx";
  if (!adminEmail) return;

  const meetingsList = briefing.meetingsToday.length > 0
    ? briefing.meetingsToday.map(m => `<li><strong>${m.time}</strong> — ${m.client} (${m.company}) con ${m.engineer}: ${m.topic}</li>`).join("")
    : "<li>Sin reuniones programadas para hoy</li>";

  const hotLeadsList = briefing.hotLeads.length > 0
    ? briefing.hotLeads.map(l => `<li><strong>${l.name}</strong> (${l.company}) — Score: <span style="color:#00d4ff">${l.score}/100</span> — ${l.action}</li>`).join("")
    : "<li>Sin leads calientes en este momento</li>";

  const alertsList = briefing.alerts.length > 0
    ? briefing.alerts.map(a => `<li style="color:#f59e0b">⚠️ ${a}</li>`).join("")
    : "";

  const recsList = briefing.recommendations.map(r => `<li>✅ ${r}</li>`).join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Inter,sans-serif;background:#0a0f1e;color:#e2e8f0;margin:0;padding:0">
  <div style="max-width:600px;margin:0 auto;padding:32px">
    <div style="background:linear-gradient(135deg,#1a2744,#0d1b3e);border-radius:12px;padding:24px;margin-bottom:24px;border:1px solid #2a3a6e">
      <h1 style="color:#00d4ff;margin:0 0 8px;font-size:22px">☀️ Briefing IAMET — ${briefing.date}</h1>
      <p style="color:#94a3b8;margin:0;font-size:14px">Resumen ejecutivo matutino generado por IA</p>
    </div>

    <div style="background:#111827;border-radius:8px;padding:20px;margin-bottom:16px;border-left:4px solid #00d4ff">
      <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:16px">📊 Resumen del Día</h2>
      <p style="color:#94a3b8;margin:0;line-height:1.6">${briefing.summary}</p>
    </div>

    ${alertsList ? `<div style="background:#111827;border-radius:8px;padding:20px;margin-bottom:16px;border-left:4px solid #f59e0b">
      <h2 style="color:#f59e0b;margin:0 0 12px;font-size:16px">⚠️ Alertas</h2>
      <ul style="margin:0;padding-left:20px;color:#94a3b8">${alertsList}</ul>
    </div>` : ""}

    <div style="background:#111827;border-radius:8px;padding:20px;margin-bottom:16px">
      <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:16px">📅 Reuniones Hoy (${briefing.meetingsToday.length})</h2>
      <ul style="margin:0;padding-left:20px;color:#94a3b8;line-height:1.8">${meetingsList}</ul>
    </div>

    <div style="background:#111827;border-radius:8px;padding:20px;margin-bottom:16px">
      <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:16px">🔥 Leads Calientes (${briefing.hotLeads.length})</h2>
      <ul style="margin:0;padding-left:20px;color:#94a3b8;line-height:1.8">${hotLeadsList}</ul>
    </div>

    <div style="background:#111827;border-radius:8px;padding:20px;margin-bottom:16px">
      <h2 style="color:#e2e8f0;margin:0 0 12px;font-size:16px">📬 Seguimientos</h2>
      <p style="color:#94a3b8;margin:0">Pendientes: <strong style="color:#e2e8f0">${briefing.pendingFollowups}</strong> | Vencidos: <strong style="color:#ef4444">${briefing.overdueFollowups}</strong></p>
      ${briefing.bestCampaign ? `<p style="color:#94a3b8;margin:8px 0 0">Mejor campaña: <strong style="color:#00d4ff">${briefing.bestCampaign.name}</strong> (${briefing.bestCampaign.leads} leads)</p>` : ""}
    </div>

    ${recsList ? `<div style="background:#111827;border-radius:8px;padding:20px;margin-bottom:16px;border-left:4px solid #10b981">
      <h2 style="color:#10b981;margin:0 0 12px;font-size:16px">💡 Recomendaciones IA</h2>
      <ul style="margin:0;padding-left:20px;color:#94a3b8;line-height:1.8">${recsList}</ul>
    </div>` : ""}

    <div style="text-align:center;padding-top:24px;border-top:1px solid #1e293b">
      <p style="color:#475569;font-size:12px;margin:0">IAMET Evolución Tecnológica · Briefing generado automáticamente por IA</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: "IAMET IA <noreply@iamet.mx>",
      to: adminEmail,
      subject: `☀️ Briefing IAMET ${briefing.date} — ${briefing.meetingsToday.length} reuniones, ${briefing.hotLeads.length} leads calientes`,
      html,
    });
  } catch (e) {
    console.warn("[Briefing] Error sending email:", e);
  }
}

export async function getLatestBriefings(limit = 7): Promise<BriefingContent[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql.raw(
      `SELECT * FROM daily_briefings ORDER BY generated_at DESC LIMIT ${limit}`
    )) as any;
    const arr = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return arr.map((r: any) => {
      try {
        return typeof r.content === "string" ? JSON.parse(r.content) : r.content;
      } catch {
        return { date: r.date, summary: "Error al cargar briefing", meetingsToday: [], hotLeads: [], pendingFollowups: 0, overdueFollowups: 0, bestCampaign: null, alerts: [], recommendations: [] };
      }
    });
  } catch (e) {
    console.warn("[Briefing] Error fetching:", e);
    return [];
  }
}

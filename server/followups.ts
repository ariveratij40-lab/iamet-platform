/**
 * followups.ts — Motor de Seguimiento Automático de Leads (IA Comercial)
 *
 * Secuencias:
 *   POST-NO-SHOW (meeting cancelado/no asistió):
 *     +24h  → Email IA personalizado (reactivación)
 *     +48h  → Email IA con caso de uso relevante
 *     +72h  → Tarea para vendedor (notificación owner)
 *     +7d   → Email IA de nuevo seguimiento
 *
 *   POST-LEAD-SIN-REUNIÓN (lead sin meeting agendado):
 *     +24h  → Email IA invitando a agendar
 *     +48h  → Email IA con caso de uso de su vertical
 *     +7d   → Email IA con oferta de diagnóstico gratuito
 */

import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { getResend } from "./email";
import { sql } from "drizzle-orm";

const ADMIN_EMAIL = "alvaro.rivera@iamet.mx";
const FROM_EMAIL = "noreply@iamet.mx";
const VENDOR_EMAIL = "alvaro.rivera@iamet.mx";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FollowupRecord {
  id: number;
  leadId: number | null;
  meetingId: number | null;
  sequence: number;
  scheduledAt: number;
  sentAt: number | null;
  status: string;
  channel: string;
  emailSubject: string | null;
  emailBody: string | null;
  triggerType: string | null;
}

interface LeadRow {
  id: number;
  contactName: string;
  company: string;
  email: string;
  verticalSlug: string | null;
  problemDescription: string | null;
  score: number | null;
  utmSource: string | null;
  utmCampaign: string | null;
}

interface MeetingRow {
  id: number;
  clientName: string;
  clientEmail: string;
  company: string | null;
  topic: string;
  date: string;
  startTime: string;
  engineerName: string;
  status: string;
  utmSource: string | null;
  utmCampaign: string | null;
}

// ─── Generación de Email con IA ───────────────────────────────────────────────

async function generateFollowupEmail(opts: {
  type: "no_show_1" | "no_show_2" | "no_show_4" | "lead_1" | "lead_2" | "lead_3";
  clientName: string;
  company: string;
  vertical?: string | null;
  topic?: string;
  meetingDate?: string;
  problemDescription?: string | null;
}): Promise<{ subject: string; htmlBody: string }> {
  const prompts: Record<string, string> = {
    no_show_1: `Eres el equipo comercial de IAMET, empresa líder en tecnología empresarial en México.
Escribe un email de reactivación para ${opts.clientName} de ${opts.company} que agendó una reunión el ${opts.meetingDate ?? "recientemente"} pero no asistió.
Tema de la reunión: ${opts.topic ?? "soluciones tecnológicas"}.
Vertical: ${opts.vertical ?? "tecnología"}.
El email debe: ser cálido pero profesional, reconocer que pudo haber surgido algo, ofrecer reagendar con facilidad, incluir una propuesta de valor breve.
Máximo 150 palabras. Formato HTML simple (sin CSS externo). Incluye asunto en la primera línea como "Asunto: [texto]".`,

    no_show_2: `Eres el equipo comercial de IAMET.
Escribe un email de seguimiento para ${opts.clientName} de ${opts.company} que no asistió a su reunión.
Vertical de interés: ${opts.vertical ?? "tecnología empresarial"}.
Este es el segundo contacto. Incluye un caso de éxito breve o estadística relevante de la vertical.
Ofrece una demo rápida de 15 minutos. Máximo 150 palabras. Formato HTML simple. Asunto en primera línea como "Asunto: [texto]".`,

    no_show_4: `Eres el equipo comercial de IAMET.
Escribe un email de último seguimiento para ${opts.clientName} de ${opts.company}.
Han pasado 7 días desde su reunión no asistida. Sé directo: ofrece una llamada de 10 minutos esta semana.
Menciona que si no es el momento adecuado, con gusto los contactas en el futuro.
Máximo 120 palabras. Formato HTML simple. Asunto en primera línea como "Asunto: [texto]".`,

    lead_1: `Eres el equipo comercial de IAMET.
${opts.clientName} de ${opts.company} dejó sus datos interesado en ${opts.vertical ?? "soluciones tecnológicas"}.
Problema descrito: ${opts.problemDescription ?? "optimización tecnológica"}.
Escribe un email de bienvenida invitándolo a agendar una reunión con un ingeniero especialista.
Menciona que la reunión es gratuita y sin compromiso. Máximo 150 palabras. HTML simple. Asunto en primera línea.`,

    lead_2: `Eres el equipo comercial de IAMET.
Escribe un email de seguimiento para ${opts.clientName} de ${opts.company} interesado en ${opts.vertical ?? "tecnología"}.
Incluye un caso de uso específico de cómo IAMET resolvió un problema similar en otra empresa.
Invita a agendar una reunión. Máximo 150 palabras. HTML simple. Asunto en primera línea.`,

    lead_3: `Eres el equipo comercial de IAMET.
Escribe un email final de seguimiento para ${opts.clientName} de ${opts.company}.
Ofrece un diagnóstico tecnológico gratuito de 30 minutos para identificar oportunidades de mejora.
Sé conciso y directo. Máximo 120 palabras. HTML simple. Asunto en primera línea.`,
  };

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Eres un experto en ventas B2B de tecnología empresarial. Escribes emails de seguimiento efectivos, cálidos y profesionales en español." },
        { role: "user", content: prompts[opts.type] },
      ],
    });

    const rawContent = response.choices?.[0]?.message?.content ?? "";
    const content = typeof rawContent === 'string' ? rawContent : '';
    const lines = content.split("\n");
    const subjectLine = lines.find((l: string) => l.startsWith("Asunto:"));
    const subject = subjectLine ? subjectLine.replace("Asunto:", "").trim() : `Seguimiento IAMET — ${opts.company}`;
    const bodyLines = lines.filter((l: string) => !l.startsWith("Asunto:")).join("\n").trim();
    const htmlBody = bodyLines.includes("<") ? bodyLines : `<p>${bodyLines.replace(/\n/g, "</p><p>")}</p>`;

    return { subject, htmlBody };
  } catch {
    return {
      subject: `Seguimiento IAMET — ${opts.company}`,
      htmlBody: `<p>Hola ${opts.clientName},</p><p>Nos gustaría retomar el contacto contigo. ¿Tienes disponibilidad esta semana para una llamada rápida?</p><p>Saludos,<br>Equipo IAMET</p>`,
    };
  }
}

// ─── Programar seguimientos para un lead nuevo ────────────────────────────────

export async function scheduleLeadFollowups(leadId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = Date.now();
  const sequences = [
    { seq: 1, delay: 24 * 60 * 60 * 1000, channel: "email", trigger: "lead_no_meeting" },
    { seq: 2, delay: 48 * 60 * 60 * 1000, channel: "email", trigger: "lead_no_meeting" },
    { seq: 3, delay: 7 * 24 * 60 * 60 * 1000, channel: "email", trigger: "lead_no_meeting" },
  ];

  for (const s of sequences) {
    await db.execute(sql.raw(`
      INSERT INTO lead_followups (lead_id, sequence, scheduled_at, status, channel, trigger_type, created_at)
      VALUES (${leadId}, ${s.seq}, ${now + s.delay}, 'pending', '${s.channel}', '${s.trigger}', ${now})
    `));
  }
}

// ─── Programar seguimientos post-no-show ─────────────────────────────────────

export async function scheduleNoShowFollowups(meetingId: number, leadId?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = Date.now();
  const sequences = [
    { seq: 1, delay: 24 * 60 * 60 * 1000, channel: "email", trigger: "no_show" },
    { seq: 2, delay: 48 * 60 * 60 * 1000, channel: "email", trigger: "no_show" },
    { seq: 3, delay: 72 * 60 * 60 * 1000, channel: "task", trigger: "no_show" },
    { seq: 4, delay: 7 * 24 * 60 * 60 * 1000, channel: "email", trigger: "no_show" },
  ];

  for (const s of sequences) {
    await db.execute(sql.raw(`
      INSERT INTO lead_followups (lead_id, meeting_id, sequence, scheduled_at, status, channel, trigger_type, created_at)
      VALUES (
        ${leadId ?? 'NULL'},
        ${meetingId},
        ${s.seq},
        ${now + s.delay},
        'pending',
        '${s.channel}',
        '${s.trigger}',
        ${now}
      )
    `));
  }
}

// ─── Handler del Heartbeat (ejecutado cada hora) ──────────────────────────────

export async function processLeadFollowups(): Promise<{ processed: number; sent: number; errors: number }> {
  const db = await getDb();
  if (!db) return { processed: 0, sent: 0, errors: 0 };

  const now = Date.now();
  let processed = 0, sent = 0, errors = 0;

  // Obtener seguimientos pendientes que ya deben ejecutarse
  const pendingResult = await db.execute(sql.raw(`
    SELECT * FROM lead_followups
    WHERE status = 'pending' AND scheduled_at <= ${now}
    ORDER BY scheduled_at ASC
    LIMIT 20
  `));
  const pending: FollowupRecord[] = ((pendingResult as any)[0] ?? pendingResult as any) as FollowupRecord[];

  for (const followup of pending) {
    processed++;
    try {
      if (followup.channel === "task") {
        // Notificar al vendedor
        let leadInfo = "";
        if (followup.leadId) {
          const lr = await db.execute(sql.raw(`SELECT * FROM leads WHERE id = ${followup.leadId} LIMIT 1`));
          const lead: LeadRow = (((lr as any)[0] ?? lr as any)[0]) as LeadRow;
          if (lead) leadInfo = `Lead: ${lead.contactName} (${lead.company}) — ${lead.email}`;
        }
        if (followup.meetingId) {
          const mr = await db.execute(sql.raw(`
            SELECT m.*, s.date, s.startTime, e.name as engineerName
            FROM meetings m
            JOIN availability_slots s ON m.slotId = s.id
            JOIN engineers e ON m.engineerId = e.id
            WHERE m.id = ${followup.meetingId} LIMIT 1
          `));
          const meeting: MeetingRow = (((mr as any)[0] ?? mr as any)[0]) as MeetingRow;
          if (meeting) leadInfo = `Cliente: ${meeting.clientName} (${meeting.company ?? ''}) — ${meeting.clientEmail}\nReunión: ${meeting.date} ${meeting.startTime}`;
        }

        const resend = getResend();
        if (resend) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: VENDOR_EMAIL,
            subject: `⚠️ Tarea de seguimiento — Lead sin respuesta (72h)`,
            html: `<h3>Acción requerida: seguimiento manual</h3><p>Han pasado 72 horas sin respuesta de este prospecto. Se recomienda contacto directo.</p><pre>${leadInfo}</pre><p>Accede al panel admin para ver el historial completo.</p>`,
          });
        }
        sent++;
      } else {
        // Email IA personalizado
        let lead: LeadRow | null = null;
        let meeting: MeetingRow | null = null;

        if (followup.leadId) {
          const lr = await db.execute(sql.raw(`SELECT * FROM leads WHERE id = ${followup.leadId} LIMIT 1`));
          lead = (((lr as any)[0] ?? lr as any)[0]) as LeadRow ?? null;
        }
        if (followup.meetingId) {
          const mr = await db.execute(sql.raw(`
            SELECT m.*, s.date, s.startTime, e.name as engineerName
            FROM meetings m
            JOIN availability_slots s ON m.slotId = s.id
            JOIN engineers e ON m.engineerId = e.id
            WHERE m.id = ${followup.meetingId} LIMIT 1
          `));
          meeting = (((mr as any)[0] ?? mr as any)[0]) as MeetingRow ?? null;
        }

        if (!lead && !meeting) {
          await db.execute(sql.raw(`UPDATE lead_followups SET status = 'skipped' WHERE id = ${followup.id}`));
          continue;
        }

        const clientName = meeting?.clientName ?? lead?.contactName ?? "Cliente";
        const company = meeting?.company ?? lead?.company ?? "su empresa";
        const clientEmail = meeting?.clientEmail ?? lead?.email ?? "";
        const vertical = lead?.verticalSlug ?? null;
        const topic = meeting?.topic;
        const meetingDate = meeting?.date;
        const problemDescription = lead?.problemDescription;

        if (!clientEmail) {
          await db.execute(sql.raw(`UPDATE lead_followups SET status = 'skipped' WHERE id = ${followup.id}`));
          continue;
        }

        // Determinar tipo de email
        const triggerType = followup.triggerType ?? "lead_no_meeting";
        const typeMap: Record<string, "no_show_1" | "no_show_2" | "no_show_4" | "lead_1" | "lead_2" | "lead_3"> = {
          "no_show-1": "no_show_1",
          "no_show-2": "no_show_2",
          "no_show-4": "no_show_4",
          "lead_no_meeting-1": "lead_1",
          "lead_no_meeting-2": "lead_2",
          "lead_no_meeting-3": "lead_3",
        };
        const emailType = typeMap[`${triggerType}-${followup.sequence}`] ?? "lead_1";

        const { subject, htmlBody } = await generateFollowupEmail({
          type: emailType,
          clientName,
          company,
          vertical,
          topic,
          meetingDate,
          problemDescription,
        });

        const resend = getResend();
        if (resend) {
          await resend.emails.send({
            from: FROM_EMAIL,
            to: clientEmail,
            subject,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #0a0f1e; padding: 20px; text-align: center;">
                  <img src="https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/Logo%20IAMET%202026%20Transparente%20.jpg" alt="IAMET" height="50" />
                </div>
                <div style="padding: 30px; background: #ffffff;">
                  ${htmlBody}
                  <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
                  <p style="font-size: 12px; color: #999;">
                    IAMET Evolución Tecnológica — Ciudad de México<br>
                    <a href="https://iamettech-ssx5e88n.manus.space">iamettech-ssx5e88n.manus.space</a>
                  </p>
                </div>
              </div>
            `,
          });
          sent++;

          // Guardar el email generado para auditoría
          const safeSubject = subject.replace(/'/g, "''");
          const safeBody = htmlBody.replace(/'/g, "''").substring(0, 2000);
          await db.execute(sql.raw(`
            UPDATE lead_followups
            SET status = 'sent', sent_at = ${Date.now()}, email_subject = '${safeSubject}', email_body = '${safeBody}'
            WHERE id = ${followup.id}
          `));
          continue;
        }
      }

      await db.execute(sql.raw(`UPDATE lead_followups SET status = 'sent', sent_at = ${Date.now()} WHERE id = ${followup.id}`));
    } catch (err) {
      errors++;
      await db.execute(sql.raw(`UPDATE lead_followups SET status = 'failed' WHERE id = ${followup.id}`));
    }
  }

  return { processed, sent, errors };
}

// ─── Obtener seguimientos para el panel admin ─────────────────────────────────

export async function getFollowups(opts: { status?: string; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return [];

  const statusFilter = opts.status ? `WHERE f.status = '${opts.status}'` : "";
  const limit = opts.limit ?? 50;

  const result = await db.execute(sql.raw(`
    SELECT
      f.*,
      l.contactName as leadName, l.company as leadCompany, l.email as leadEmail,
      m.clientName as meetingClientName, m.clientEmail as meetingClientEmail,
      m.company as meetingCompany
    FROM lead_followups f
    LEFT JOIN leads l ON f.lead_id = l.id
    LEFT JOIN meetings m ON f.meeting_id = m.id
    ${statusFilter}
    ORDER BY f.scheduled_at DESC
    LIMIT ${limit}
  `));

  return ((result as any)[0] ?? result as any) as any[];
}

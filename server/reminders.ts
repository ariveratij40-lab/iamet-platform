/**
 * reminders.ts — Recordatorios Inteligentes de Reuniones
 *
 * Envía recordatorios a 3 destinatarios (cliente, ingeniero, vendedor)
 * en 3 momentos clave antes de cada reunión confirmada:
 *   - 24 horas antes
 *   - 2 horas antes
 *   - 30 minutos antes
 *
 * Cada email incluye:
 *   - Detalles de la reunión (fecha, hora, participantes)
 *   - Links de Google Meet, Microsoft Teams y archivo .ics (Google Calendar)
 *   - Botón de cancelación para el cliente
 */

import { getDb } from "./db";
import { getResend } from "./email";
import { sql } from "drizzle-orm";
import { ENV } from "./_core/env";

const VENDOR_EMAIL = "alvaro.rivera@iamet.mx";
const FROM_EMAIL = "noreply@iamet.mx";
const SITE_BASE_URL = ENV.appUrl ?? "https://iamettech-ssx5e88n.manus.space";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface ReminderRecord {
  id: number;
  meetingId: number;
  reminderType: string;
  recipient: string;
  scheduledAt: number;
  sentAt: number | null;
  status: string;
}

interface MeetingWithDetails {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  company: string | null;
  topic: string;
  cancelToken: string | null;
  meetingUrl: string | null;
  date: string;
  startTime: string;
  endTime: string;
  engineerName: string;
  engineerEmail: string;
  status: string;
}

// ─── Generar Google Calendar Link ─────────────────────────────────────────────

function buildGoogleCalendarLink(meeting: MeetingWithDetails): string {
  const dateStr = meeting.date.replace(/-/g, "");
  const startStr = `${dateStr}T${meeting.startTime.replace(":", "")}00`;
  const endStr = `${dateStr}T${meeting.endTime.replace(":", "")}00`;
  const title = encodeURIComponent(`Reunión IAMET — ${meeting.topic}`);
  const details = encodeURIComponent(`Reunión con ${meeting.engineerName} de IAMET Evolución Tecnológica.\nTema: ${meeting.topic}`);
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
}

// ─── Generar ICS para Outlook/Apple Calendar ──────────────────────────────────

function buildIcsContent(meeting: MeetingWithDetails): string {
  const dateStr = meeting.date.replace(/-/g, "");
  const startStr = `${dateStr}T${meeting.startTime.replace(":", "")}00`;
  const endStr = `${dateStr}T${meeting.endTime.replace(":", "")}00`;
  const uid = `meeting-${meeting.id}@iamet.mx`;
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IAMET Evolución Tecnológica//ES",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:Reunión IAMET — ${meeting.topic}`,
    `DESCRIPTION:Reunión con ${meeting.engineerName} de IAMET.\\nTema: ${meeting.topic}`,
    `ORGANIZER;CN=IAMET:mailto:${FROM_EMAIL}`,
    `ATTENDEE;CN=${meeting.clientName}:mailto:${meeting.clientEmail}`,
    `ATTENDEE;CN=${meeting.engineerName}:mailto:${meeting.engineerEmail}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// ─── Plantilla HTML de Recordatorio ──────────────────────────────────────────

function buildReminderHtml(opts: {
  recipientName: string;
  meeting: MeetingWithDetails;
  reminderType: "24h" | "2h" | "30min";
  recipient: "client" | "engineer" | "vendor";
  googleCalendarLink: string;
  teamsLink: string;
  meetLink: string;
  cancelUrl?: string;
}): string {
  const { recipientName, meeting, reminderType, recipient, googleCalendarLink, teamsLink, meetLink, cancelUrl } = opts;

  const timeLabels: Record<string, string> = {
    "24h": "mañana",
    "2h": "en 2 horas",
    "30min": "en 30 minutos",
  };

  const urgencyColors: Record<string, string> = {
    "24h": "#2563eb",
    "2h": "#d97706",
    "30min": "#dc2626",
  };

  const urgencyLabel = timeLabels[reminderType] ?? reminderType;
  const headerColor = urgencyColors[reminderType] ?? "#2563eb";

  const recipientIntro: Record<string, string> = {
    client: `Tu reunión con <strong>${meeting.engineerName}</strong> de IAMET es ${urgencyLabel}.`,
    engineer: `Tienes una reunión con <strong>${meeting.clientName}</strong> (${meeting.company ?? "cliente"}) ${urgencyLabel}.`,
    vendor: `Recordatorio: reunión entre <strong>${meeting.engineerName}</strong> y <strong>${meeting.clientName}</strong> (${meeting.company ?? ""}) ${urgencyLabel}.`,
  };

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recordatorio de Reunión — IAMET</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#131319;border-radius:16px;border:1px solid #1e2030;overflow:hidden;max-width:560px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${headerColor} 0%,${headerColor}cc 100%);padding:28px 40px;text-align:center;">
            <img src="https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/Logo%20IAMET%202026%20Transparente%20.jpg"
                 alt="IAMET" height="44" style="height:44px;width:auto;" />
            <p style="margin:10px 0 0;font-size:13px;color:rgba(255,255,255,0.9);font-weight:600;letter-spacing:0.03em;">
              ⏰ RECORDATORIO DE REUNIÓN
            </p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px 40px;">
          <p style="margin:0 0 20px;font-size:16px;color:#f1f5f9;line-height:1.6;">
            Hola <strong>${recipientName}</strong>,<br/>
            ${recipientIntro[recipient] ?? ""}
          </p>

          <!-- Detalles de la reunión -->
          <table cellpadding="0" cellspacing="0" width="100%"
                 style="margin-bottom:24px;background:#0f172a;border-radius:12px;border:1px solid #1e2030;overflow:hidden;">
            <tr><td colspan="2" style="padding:10px 16px;background:#0d0d14;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Detalles de la reunión</td></tr>
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#64748b;width:120px;">📅 Fecha</td>
              <td style="padding:10px 16px;font-size:14px;color:#f1f5f9;font-weight:600;">${meeting.date}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#64748b;">🕐 Hora</td>
              <td style="padding:10px 16px;font-size:14px;color:#f1f5f9;font-weight:600;">${meeting.startTime} – ${meeting.endTime} (CDMX)</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#64748b;">👤 Ingeniero</td>
              <td style="padding:10px 16px;font-size:13px;color:#e2e8f0;">${meeting.engineerName}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#64748b;">🏢 Cliente</td>
              <td style="padding:10px 16px;font-size:13px;color:#e2e8f0;">${meeting.clientName}${meeting.company ? ` — ${meeting.company}` : ""}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-size:13px;color:#64748b;vertical-align:top;">📋 Tema</td>
              <td style="padding:10px 16px;font-size:13px;color:#94a3b8;">${meeting.topic}</td>
            </tr>
          </table>

          <!-- Botones de acceso -->
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#f1f5f9;">Unirse a la reunión:</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding-right:8px;">
                <a href="${meetLink}"
                   style="display:inline-block;padding:10px 20px;background:#1a73e8;border-radius:8px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">
                  🎥 Google Meet
                </a>
              </td>
              <td style="padding-right:8px;">
                <a href="${teamsLink}"
                   style="display:inline-block;padding:10px 20px;background:#5558af;border-radius:8px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">
                  💼 Teams
                </a>
              </td>
              <td>
                <a href="${googleCalendarLink}"
                   style="display:inline-block;padding:10px 20px;background:#0f172a;border:1px solid #334155;border-radius:8px;font-size:13px;font-weight:600;color:#94a3b8;text-decoration:none;">
                  📆 Calendario
                </a>
              </td>
            </tr>
          </table>

          ${recipient === "client" && cancelUrl ? `
          <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
            ¿No puedes asistir? <a href="${cancelUrl}" style="color:#ef4444;text-decoration:none;">Cancelar reunión</a>
          </p>
          ` : ""}
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0d0d14;padding:16px 40px;border-top:1px solid #1e2030;text-align:center;">
            <p style="margin:0;font-size:12px;color:#475569;">
              © 2025 IAMET Evolución Tecnológica — Ciudad de México
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

// ─── Programar recordatorios para una reunión ─────────────────────────────────

export async function scheduleMeetingReminders(meetingId: number, meetingDatetime: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = Date.now();
  const meetingTs = meetingDatetime.getTime();

  const reminders: Array<{ type: string; offset: number; recipients: string[] }> = [
    { type: "24h", offset: 24 * 60 * 60 * 1000, recipients: ["client", "engineer", "vendor"] },
    { type: "2h", offset: 2 * 60 * 60 * 1000, recipients: ["client", "engineer", "vendor"] },
    { type: "30min", offset: 30 * 60 * 1000, recipients: ["client", "engineer", "vendor"] },
  ];

  for (const r of reminders) {
    const scheduledAt = meetingTs - r.offset;
    if (scheduledAt <= now) continue; // ya pasó, no programar

    for (const recipient of r.recipients) {
      await db.execute(sql.raw(`
        INSERT INTO meeting_reminders (meeting_id, reminder_type, recipient, scheduled_at, status, created_at)
        VALUES (${meetingId}, '${r.type}', '${recipient}', ${scheduledAt}, 'pending', ${now})
      `));
    }
  }
}

// ─── Handler del Heartbeat (ejecutado cada 30 minutos) ────────────────────────

export async function processMeetingReminders(): Promise<{ processed: number; sent: number; errors: number }> {
  const db = await getDb();
  if (!db) return { processed: 0, sent: 0, errors: 0 };

  const now = Date.now();
  let processed = 0, sent = 0, errors = 0;

  // Obtener recordatorios pendientes que deben enviarse ahora
  const pendingResult = await db.execute(sql.raw(`
    SELECT * FROM meeting_reminders
    WHERE status = 'pending' AND scheduled_at <= ${now}
    ORDER BY scheduled_at ASC
    LIMIT 30
  `));
  const pending: ReminderRecord[] = ((pendingResult as any)[0] ?? pendingResult as any) as ReminderRecord[];

  for (const reminder of pending) {
    processed++;
    try {
      // Obtener detalles de la reunión
      const mr = await db.execute(sql.raw(`
        SELECT m.*, s.date, s.startTime, s.endTime,
               e.name as engineerName, e.email as engineerEmail
        FROM meetings m
        JOIN availability_slots s ON m.slotId = s.id
        JOIN engineers e ON m.engineerId = e.id
        WHERE m.id = ${reminder.meetingId} LIMIT 1
      `));
      const meeting: MeetingWithDetails = (((mr as any)[0] ?? mr as any)[0]) as MeetingWithDetails;

      if (!meeting || meeting.status === "cancelled") {
        await db.execute(sql.raw(`UPDATE meeting_reminders SET status = 'skipped' WHERE id = ${reminder.id}`));
        continue;
      }

      // Generar links de reunión
      const googleCalendarLink = buildGoogleCalendarLink(meeting);
      // Links genéricos de Meet/Teams (en producción se generarían dinámicamente)
      const meetLink = `https://meet.google.com/new?hs=122&authuser=0`;
      const teamsLink = `https://teams.microsoft.com/l/meetup-join/new`;
      const cancelUrl = meeting.cancelToken
        ? `${SITE_BASE_URL}/cancelar-reunion?token=${meeting.cancelToken}`
        : undefined;

      // Determinar destinatario y datos
      let toEmail = "";
      let toName = "";

      if (reminder.recipient === "client") {
        toEmail = meeting.clientEmail;
        toName = meeting.clientName;
      } else if (reminder.recipient === "engineer") {
        toEmail = meeting.engineerEmail;
        toName = meeting.engineerName;
      } else if (reminder.recipient === "vendor") {
        toEmail = VENDOR_EMAIL;
        toName = "Equipo Comercial IAMET";
      }

      if (!toEmail) {
        await db.execute(sql.raw(`UPDATE meeting_reminders SET status = 'skipped' WHERE id = ${reminder.id}`));
        continue;
      }

      const reminderType = reminder.reminderType as "24h" | "2h" | "30min";
      const recipient = reminder.recipient as "client" | "engineer" | "vendor";

      const subjectLabels: Record<string, string> = {
        "24h": "mañana",
        "2h": "en 2 horas",
        "30min": "en 30 minutos",
      };

      const subject = `⏰ Recordatorio: Reunión IAMET ${subjectLabels[reminderType] ?? ""} — ${meeting.date} ${meeting.startTime}`;

      const html = buildReminderHtml({
        recipientName: toName,
        meeting,
        reminderType,
        recipient,
        googleCalendarLink,
        teamsLink,
        meetLink,
        cancelUrl,
      });

      const resend = getResend();
      if (resend) {
        await resend.emails.send({
          from: `IAMET Reuniones <${FROM_EMAIL}>`,
          to: toEmail,
          subject,
          html,
        });
        sent++;
      }

      await db.execute(sql.raw(`UPDATE meeting_reminders SET status = 'sent', sent_at = ${Date.now()} WHERE id = ${reminder.id}`));
    } catch (err) {
      errors++;
      await db.execute(sql.raw(`UPDATE meeting_reminders SET status = 'failed' WHERE id = ${reminder.id}`));
    }
  }

  return { processed, sent, errors };
}

// ─── Obtener recordatorios para el panel admin ────────────────────────────────

export async function getMeetingReminders(opts: { meetingId?: number; status?: string } = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: string[] = [];
  if (opts.meetingId) conditions.push(`r.meeting_id = ${opts.meetingId}`);
  if (opts.status) conditions.push(`r.status = '${opts.status}'`);
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await db.execute(sql.raw(`
    SELECT r.*, m.clientName, m.clientEmail, m.company, m.topic,
           s.date, s.startTime, e.name as engineerName
    FROM meeting_reminders r
    JOIN meetings m ON r.meeting_id = m.id
    JOIN availability_slots s ON m.slotId = s.id
    JOIN engineers e ON m.engineerId = e.id
    ${where}
    ORDER BY r.scheduled_at DESC
    LIMIT 100
  `));

  return ((result as any)[0] ?? result as any) as any[];
}

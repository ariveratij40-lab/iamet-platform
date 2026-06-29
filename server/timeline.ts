/**
 * IAMET Lead Timeline Engine
 * Registra y retorna la historia completa de cada prospecto
 */
import { getDb } from "./db";
import { sql } from "drizzle-orm";

export type TimelineEventType =
  | "lead_created"
  | "conversation_started"
  | "meeting_scheduled"
  | "meeting_confirmed"
  | "meeting_cancelled"
  | "email_sent"
  | "followup_sent"
  | "reminder_sent"
  | "quote_requested"
  | "status_changed"
  | "score_updated"
  | "recommendation_generated"
  | "page_visit"
  | "attribution_captured";

export interface TimelineEvent {
  id: number;
  leadId: number;
  type: TimelineEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

const TYPE_ICONS: Record<TimelineEventType, string> = {
  lead_created: "user-plus",
  conversation_started: "message-circle",
  meeting_scheduled: "calendar",
  meeting_confirmed: "calendar-check",
  meeting_cancelled: "calendar-x",
  email_sent: "mail",
  followup_sent: "send",
  reminder_sent: "bell",
  quote_requested: "file-text",
  status_changed: "refresh-cw",
  score_updated: "trending-up",
  recommendation_generated: "sparkles",
  page_visit: "eye",
  attribution_captured: "link",
};

export async function addTimelineEvent(
  leadId: number,
  type: TimelineEventType,
  title: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = Date.now();
  const metaStr = metadata ? JSON.stringify(metadata).replace(/'/g, "''") : "{}";
  const descStr = (description || "").replace(/'/g, "''");
  const titleStr = title.replace(/'/g, "''");

  try {
    await db.execute(sql.raw(
      `INSERT INTO lead_timeline (lead_id, type, title, description, metadata, created_at)
       VALUES (${leadId}, '${type}', '${titleStr}', '${descStr}', '${metaStr}', ${now})`
    ));
  } catch (e) {
    console.warn("[Timeline] Error adding event:", e);
  }
}

export async function getLeadTimeline(leadId: number): Promise<TimelineEvent[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const rows = await db.execute(sql.raw(
      `SELECT * FROM lead_timeline WHERE lead_id = ${leadId} ORDER BY created_at ASC`
    )) as any;
    const arr = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return arr.map((r: any) => ({
      id: r.id,
      leadId: r.lead_id,
      type: r.type as TimelineEventType,
      title: r.title,
      description: r.description,
      metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata || "{}") : (r.metadata || {}),
      createdAt: parseInt(r.created_at) || 0,
      icon: TYPE_ICONS[r.type as TimelineEventType] || "circle",
    }));
  } catch (e) {
    console.warn("[Timeline] Error fetching timeline:", e);
    return [];
  }
}

export function getTimelineIcon(type: TimelineEventType): string {
  return TYPE_ICONS[type] || "circle";
}

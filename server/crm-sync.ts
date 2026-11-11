/**
 * crm-sync.ts — Sincronización de leads del sitio hacia el CRM de IAMET (Django).
 *
 * Cada lead del formulario de contacto se empuja al CRM, donde se convierte en un
 * prospecto del kanban de prospección. Portado del sitio anterior: el endpoint
 * receptor del CRM ya existe y espera exactamente este payload.
 *
 * Config (variables de entorno):
 *   CRM_SYNC_URL   → p.ej. https://crm.iamet.mx/app/api/leads/web/
 *   CRM_SYNC_TOKEN → token de "Leads Web" del Panel de Administración del CRM
 *
 * Resiliencia: si el CRM no responde, el lead queda con crm_synced_at NULL y el
 * reintento (reintentarLeadsPendientes) lo vuelve a enviar. El CRM deduplica por
 * externalId, así que reintentar nunca duplica prospectos. Nunca lanza.
 */
import { and, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { leads, type Lead } from "../drizzle/schema";

function crmConfig(): { url: string; token: string } | null {
  // El pase al CRM corporativo es manual. Ni formularios ni reintentos envían datos.
  // Restaurar una integración automática requiere un cambio explícito de código.
  return null;
}

// El payload que el CRM espera (mismo shape que usaba el sitio anterior).
function leadPayload(lead: Lead) {
  return {
    externalId: String(lead.id),
    company: lead.company,
    contactName: lead.contactName,
    email: lead.email,
    phone: lead.phone ?? "",
    industry: lead.industry ?? "",
    companySize: lead.companySize ?? "",
    problemDescription: lead.problemDescription ?? "",
    verticalSlug: lead.verticalSlug ?? "",
    source: lead.source,
    utmSource: lead.utmSource ?? "",
    utmMedium: lead.utmMedium ?? "",
    utmCampaign: lead.utmCampaign ?? "",
  };
}

/** Empuja un lead al CRM. Devuelve true si quedó sincronizado. Nunca lanza. */
export async function syncLeadToCRM(leadId: number): Promise<boolean> {
  const cfg = crmConfig();
  if (!cfg) return false; // integración no configurada — el reintento lo tomará luego

  const db = await getDb();
  if (!db) return false;

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return false;
  if (lead.crmSyncedAt) return true; // ya sincronizado

  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
      body: JSON.stringify(leadPayload(lead)),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
    if (res.ok && body.success) {
      await db.update(leads).set({ crmSyncedAt: new Date(), crmSyncError: null }).where(eq(leads.id, leadId));
      return true;
    }
    const errMsg = `CRM respondió ${res.status}: ${body.error ?? "sin detalle"}`;
    await db.update(leads).set({ crmSyncError: errMsg.slice(0, 500) }).where(eq(leads.id, leadId));
    return false;
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await db.update(leads).set({ crmSyncError: `Sin conexión con el CRM: ${errMsg}`.slice(0, 500) }).where(eq(leads.id, leadId));
    return false;
  }
}

/** Reintenta los leads pendientes (últimos 30 días). Lo llama un cron/endpoint. */
export async function reintentarLeadsPendientes(): Promise<{
  configured: boolean; pending: number; synced: number; failed: number;
}> {
  const cfg = crmConfig();
  if (!cfg) return { configured: false, pending: 0, synced: 0, failed: 0 };
  const db = await getDb();
  if (!db) return { configured: true, pending: 0, synced: 0, failed: 0 };

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const pendientes = await db
    .select({ id: leads.id })
    .from(leads)
    .where(and(isNull(leads.crmSyncedAt), gte(leads.createdAt, cutoff)))
    .orderBy(leads.id)
    .limit(50);

  let synced = 0, failed = 0;
  for (const { id } of pendientes) {
    if (await syncLeadToCRM(id)) synced++;
    else failed++;
  }
  return { configured: true, pending: pendientes.length, synced, failed };
}

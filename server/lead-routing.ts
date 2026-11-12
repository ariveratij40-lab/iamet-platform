/**
 * lead-routing.ts — El filtro en vivo: clasifica un lead al llegar y decide si
 * sube al CRM de IAMET (ventas) o se queda solo en el CRM del sitio.
 *
 * Flujo que pidió el negocio: TODO llega al CRM del sitio; solo lo potencial
 * sube al CRM de IAMET. Así ventas no ve ruido.
 *
 * Híbrido (2026-11-12) con la revisión manual de leadReview:
 *
 *   formulario → CRM del sitio (siempre)
 *                     │
 *                clasificador (reglas gratis + IA barata solo si es dudoso)
 *                     │
 *          proyecto ──┴── consulta / ruido
 *             │                 │
 *   CRM de IAMET (auto)   cola de revisión MANUAL (leadReview)
 *   + marcado "transferido"    de Alvaro, para que un humano decida
 *   en el tablero de Alvaro
 *
 * Así los proyectos claros suben solos (sin que un humano los reprocese) y el
 * resto cae en la revisión manual. Barato y sin espera para el visitante: corre
 * en segundo plano (el formulario ya respondió). La IA solo se usa para UN lead
 * dudoso, una llamada. Si no se puede clasificar (IA caída), NO sube: se queda
 * para la revisión manual. Nunca lanza.
 */
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { leads, leadReviews, leadReviewEvents } from "../drizzle/schema";
import { emptyReview } from "../shared/lead-review";
import { calificarLeads, type LeadCategoria } from "./lead-qualification";
import { guardarVeredicto } from "./lead-qualification-sweep";
import { categoriasPermitidas } from "./lead-routing-config";
import { syncLeadToCRM } from "./crm-sync";

export type ResultadoEnrutado = {
  categoria: LeadCategoria | null; // null si no se pudo clasificar
  enviado: boolean; // true si subió al CRM de IAMET
};

/**
 * Clasifica el lead y lo enruta. Pensado para correr fire-and-forget justo
 * después de crear el lead. Nunca lanza.
 */
export async function clasificarYEnrutar(leadId: number): Promise<ResultadoEnrutado> {
  const db = await getDb();
  if (!db) return { categoria: null, enviado: false };

  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return { categoria: null, enviado: false };
  if (lead.crmSyncedAt) return { categoria: null, enviado: true }; // ya estaba arriba

  // 1) Clasifica: reglas gratis; IA barata solo si es dudoso (un lead, una llamada).
  const veredictos = await calificarLeads([lead], { maxAI: 1 });
  const v = veredictos[lead.id] ?? null;
  if (v) await guardarVeredicto(db, lead.id, v);

  // 2) Enruta: al CRM de IAMET solo si la categoría pasa el filtro configurado.
  const permitidas = await categoriasPermitidas();
  if (!v || !permitidas.has(v.categoria)) {
    return { categoria: v?.categoria ?? null, enviado: false };
  }
  const enviado = await syncLeadToCRM(leadId);
  // Al subir solo, lo dejamos marcado como "transferido" en el tablero de
  // revisión manual (leadReview), para que un humano no lo reprocese ni lo
  // vuelva a enviar (sin duplicados en el CRM).
  if (enviado) await marcarTransferidoAuto(db, leadId).catch(() => {});
  return { categoria: v.categoria, enviado };
}

/**
 * Marca un lead como "transferido" automáticamente en leadReview (tablas de
 * Alvaro), sin pisar una ficha que un humano ya haya empezado (onConflictDoNothing).
 * Nunca lanza.
 */
async function marcarTransferidoAuto(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  leadId: number
): Promise<void> {
  const now = new Date();
  const base = {
    status: "transferred" as const,
    version: 1,
    fields: {
      ...emptyReview,
      contactVerified: true,
      needConfirmed: true,
      serviceFit: true,
      areaFit: true,
      notes: "Transferido automáticamente por el filtro de IA (lead proyecto).",
      reference: `auto:${leadId}`,
    },
    reviewedBy: 0, // 0 = sistema (no es un administrador humano)
    reviewerName: "Filtro automático",
  };
  const inserted = await db
    .insert(leadReviews)
    .values({ leadId, ...base, updatedAt: now, transferredAt: now })
    .onConflictDoNothing({ target: leadReviews.leadId })
    .returning({ leadId: leadReviews.leadId });
  // Solo dejamos el evento de historial si realmente insertamos la ficha.
  if (inserted.length)
    await db.insert(leadReviewEvents).values({ leadId, ...base, createdAt: now });
}

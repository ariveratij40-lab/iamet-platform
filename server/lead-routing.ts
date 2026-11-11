/**
 * lead-routing.ts — El filtro en vivo: clasifica un lead al llegar y decide si
 * sube al CRM de IAMET (ventas) o se queda solo en el CRM del sitio.
 *
 * Flujo que pidió el negocio: TODO llega al CRM del sitio; solo lo potencial
 * sube al CRM de IAMET. Así ventas no ve ruido.
 *
 *   formulario → CRM del sitio (siempre)
 *                     │
 *                clasificador (reglas gratis + IA barata solo si es dudoso)
 *                     │
 *          proyecto ──┴── consulta / ruido
 *             │                 │
 *       CRM de IAMET      se queda en el sitio
 *
 * Barato y sin espera para el visitante: esto corre en segundo plano (el
 * formulario ya respondió). La IA solo se usa para UN lead dudoso, una llamada.
 * Si no se puede clasificar (IA caída), NO sube: se queda en el sitio y el
 * barrido (`calificarLeadsRecientes`) lo reintenta después. Nunca lanza.
 */
import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { leads } from "../drizzle/schema";
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
  return { categoria: v.categoria, enviado };
}

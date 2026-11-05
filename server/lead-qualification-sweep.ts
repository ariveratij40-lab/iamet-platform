/**
 * lead-qualification-sweep.ts — Barrido que califica los leads nuevos y guarda
 * el veredicto. Equivale al `analizar_correos_recientes` del CRM: corre de vez
 * en cuando sobre lo reciente, no en cada envío del formulario (así el visitante
 * no espera a la IA al dar "Enviar").
 *
 * Guarda el veredicto DENTRO de `scoreBreakdown.ai` (campo json ya existente):
 * no cambia la base de datos. El `score` numérico del sitio no se toca aquí;
 * esto solo agrega el porqué legible para quien revisa la lista de contactos.
 */
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { leads } from "../drizzle/schema";
import { calificarLeads, type LeadVeredicto } from "./lead-qualification";

const VENTANA_HORAS_DEFECTO = 48;
const MAX_IA_DEFECTO = 15;

/** ¿Este lead ya tiene veredicto de IA guardado en scoreBreakdown.ai? */
function yaCalificado(scoreBreakdown: unknown): boolean {
  return !!(scoreBreakdown && typeof scoreBreakdown === "object" &&
    "ai" in (scoreBreakdown as Record<string, unknown>));
}

export type ResultadoBarrido = {
  revisados: number;
  calificados: number;
  porReglas: number;
  porIA: number;
};

/**
 * Califica los leads recientes aún sin veredicto. Reglas primero (gratis), IA
 * solo para los dudosos y con tope. Devuelve un conteo; nunca lanza — si no hay
 * base de datos o la IA falla, deja los leads como estaban.
 */
export async function calificarLeadsRecientes(opts: {
  ventanaHoras?: number;
  maxIA?: number;
  signal?: AbortSignal;
} = {}): Promise<ResultadoBarrido> {
  const vacio: ResultadoBarrido = { revisados: 0, calificados: 0, porReglas: 0, porIA: 0 };
  const db = await getDb();
  if (!db) return vacio;

  const ventana = opts.ventanaHoras ?? VENTANA_HORAS_DEFECTO;
  const desde = new Date(Date.now() - ventana * 3600_000);

  const recientes = await db
    .select()
    .from(leads)
    .where(sql`${leads.createdAt} >= ${desde}`)
    .orderBy(desc(leads.createdAt))
    .limit(200);

  // Solo los que aún no tienen veredicto de IA guardado.
  const pendientes = recientes.filter((l: typeof recientes[number]) => !yaCalificado(l.scoreBreakdown));
  if (pendientes.length === 0) return { ...vacio, revisados: recientes.length };

  const veredictos = await calificarLeads(pendientes, {
    maxAI: opts.maxIA ?? MAX_IA_DEFECTO,
    signal: opts.signal,
  });

  let porReglas = 0;
  let porIA = 0;
  for (const lead of pendientes) {
    const v = veredictos[lead.id];
    if (!v) continue;
    await guardarVeredicto(db, lead.id, lead.scoreBreakdown, v);
    if (v.fuente === "ia") porIA++;
    else porReglas++;
  }

  return {
    revisados: recientes.length,
    calificados: porReglas + porIA,
    porReglas,
    porIA,
  };
}

/** Mete el veredicto en scoreBreakdown.ai sin pisar lo que ya trae el desglose. */
async function guardarVeredicto(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  leadId: number,
  breakdownActual: unknown,
  veredicto: LeadVeredicto
): Promise<void> {
  const base = (breakdownActual && typeof breakdownActual === "object")
    ? (breakdownActual as Record<string, unknown>)
    : {};
  const nuevo = {
    ...base,
    ai: {
      categoria: veredicto.categoria,
      resumen: veredicto.resumen,
      confianza: veredicto.confianza,
      fuente: veredicto.fuente,
      calificadoEn: new Date().toISOString(),
    },
  };
  await db.update(leads).set({ scoreBreakdown: nuevo }).where(eq(leads.id, leadId));
}

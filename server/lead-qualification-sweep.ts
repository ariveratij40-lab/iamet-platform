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
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb, isMysqlDb } from "./db";
import { leads } from "../drizzle/schema";
import { calificarLeads, type LeadVeredicto } from "./lead-qualification";

const VENTANA_HORAS_DEFECTO = 48;
const MAX_IA_DEFECTO = 15;

function sinVeredicto() {
  const campo = leads.scoreBreakdown;
  return isMysqlDb()
    ? sql`COALESCE(JSON_CONTAINS_PATH(${campo}, 'one', '$.ai'), 0) = 0`
    : sql`(${campo}->'ai') IS NULL`;
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

  const pendientes = await db
    .select()
    .from(leads)
    .where(and(gte(leads.createdAt, desde), sinVeredicto()))
    .orderBy(desc(leads.createdAt), desc(leads.id))
    .limit(200);

  if (pendientes.length === 0) return vacio;

  const veredictos = await calificarLeads(pendientes, {
    maxAI: opts.maxIA ?? MAX_IA_DEFECTO,
    signal: opts.signal,
  });

  let porReglas = 0;
  let porIA = 0;
  for (const lead of pendientes) {
    const v = veredictos[lead.id];
    if (!v) continue;
    if (!(await guardarVeredicto(db, lead.id, v))) continue;
    if (v.fuente === "ia") porIA++;
    else porReglas++;
  }

  return {
    revisados: pendientes.length,
    calificados: porReglas + porIA,
    porReglas,
    porIA,
  };
}

/** Mete el veredicto en scoreBreakdown.ai sin pisar lo que ya trae el desglose. */
async function guardarVeredicto(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  leadId: number,
  veredicto: LeadVeredicto
): Promise<boolean> {
  const campo = leads.scoreBreakdown;
  const payload = JSON.stringify({ ...veredicto, calificadoEn: new Date().toISOString() });
  const condicion = and(eq(leads.id, leadId), sinVeredicto());
  if (isMysqlDb()) {
    const [result] = await db.update(leads).set({
      scoreBreakdown: sql`JSON_SET(IF(JSON_TYPE(${campo}) = 'OBJECT', ${campo}, JSON_OBJECT()), '$.ai', JSON_EXTRACT(${payload}, '$'))`,
    }).where(condicion);
    return result.affectedRows > 0;
  }
  const updated = await db.update(leads).set({
    scoreBreakdown: sql`jsonb_set(CASE WHEN json_typeof(${campo}::json) = 'object'
      THEN ${campo}::jsonb ELSE '{}'::jsonb END, '{ai}', ${payload}::jsonb)`,
  }).where(condicion).returning({ id: leads.id });
  return updated.length > 0;
}

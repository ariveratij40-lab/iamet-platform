/**
 * blog/megabomba.ts — El "detector de mega noticia".
 *
 * Un vigilante que corre varias veces al día (código, sin IA, gratis): revisa lo
 * más buscado en México (Google Trends) y, si algo CRUZA EL UMBRAL de volumen y
 * no es deporte ni política, lo GUARDA como la nota destacada de mañana. Si más
 * tarde aparece algo aún más grande, lo reemplaza: al final del día queda el
 * bombazo del día.
 *
 * El publicador de las 7 AM revisa si hay una mega guardada; si la hay, la IA
 * escribe sobre ESA (se salta la rotación). Si no, publica el tema del día.
 *
 * Así nunca se pierde lo grande aunque reviente a media tarde, y la IA sigue
 * corriendo una sola vez al día.
 */
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { appSettings } from "../../drizzle/schema";
import { limpiarTexto } from "./sources";

// Volumen mínimo de búsquedas para considerar algo "mega". Ajustable.
export const UMBRAL_MEGA = 50000;
// Cuántas horas vale una mega guardada (para no publicar algo ya viejo).
const VIGENCIA_HORAS = 28;
const CLAVE = "blog_mega_pendiente";

// Palabras que delatan deporte o política local — el vigilante las salta.
const DESCARTE =
  /\b(vs\.?|liga|fútbol|futbol|gol|partido|clásico|clasico|champions|fifa|nba|nfl|mlb|tenis|atp|wta|f1|fórmula|formula|boxeo|ufc|eliminatoria|jornada|posiciones|alineaci|elección|eleccion|electoral|senado|diputad|presidencia|gobernador|morena|pri|pan|candidat)\b/i;

export type MegaNoticia = {
  titulo: string;
  contexto: string;
  volumen: number;
  detectadoEn: string; // ISO
};

/** Convierte "100,000+" / "2 mil" / "500+" a un número aproximado. */
export function parsearVolumen(txt: string): number {
  const s = (txt || "").toLowerCase().replace(/[,\s]/g, "");
  const n = parseInt(s.replace(/[^0-9]/g, ""), 10) || 0;
  if (/mill|m\+?$/.test(s)) return n * 1_000_000;
  if (/mil|k\+?$/.test(s)) return n * 1000;
  return n;
}

/** Extrae las tendencias con su volumen del RSS de Google Trends. */
export function parsearTrends(xml: string): Array<{ titulo: string; volumen: number; contexto: string }> {
  const out: Array<{ titulo: string; volumen: number; contexto: string }> = [];
  for (const b of xml.split(/<item>/).slice(1)) {
    const titulo = limpiarTexto((b.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ""));
    const vol = parsearVolumen(b.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1] ?? "");
    const contexto = limpiarTexto(b.match(/<ht:news_item_title>([\s\S]*?)<\/ht:news_item_title>/)?.[1] ?? "");
    if (titulo.length > 3) out.push({ titulo, volumen: vol, contexto });
  }
  return out;
}

async function leerMega(db: any): Promise<MegaNoticia | null> {
  const [row] = await db.select().from(appSettings).where(eq(appSettings.key, CLAVE)).limit(1);
  if (!row) return null;
  try {
    return JSON.parse(row.value) as MegaNoticia;
  } catch {
    return null;
  }
}

async function guardarMega(db: any, mega: MegaNoticia): Promise<void> {
  const value = JSON.stringify(mega);
  await db.insert(appSettings).values({ key: CLAVE, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
}

/**
 * Revisa Google Trends y guarda la mega noticia del día si cruza el umbral y
 * supera a la que ya estuviera guardada. Nunca lanza. Pensado para el cron de
 * monitoreo (cada pocas horas).
 */
export async function detectarMega(opts: { signal?: AbortSignal } = {}): Promise<{ guardada: boolean; titulo?: string; volumen?: number }> {
  const db = await getDb();
  if (!db) return { guardada: false };
  try {
    const r = await fetch("https://trends.google.com/trending/rss?geo=MX", {
      headers: { "User-Agent": "IametBlogBot/1.0 (contacto@iamet.mx)" },
      signal: opts.signal ?? AbortSignal.timeout(15000),
    });
    if (!r.ok) return { guardada: false };
    const trends = parsearTrends(await r.text());

    // La mejor candidata: mayor volumen, por encima del umbral, que no sea deporte/política.
    const candidata = trends
      .filter(t => t.volumen >= UMBRAL_MEGA && !DESCARTE.test(t.titulo) && !DESCARTE.test(t.contexto))
      .sort((a, b) => b.volumen - a.volumen)[0];
    if (!candidata) return { guardada: false };

    // Solo reemplaza si es más grande que la ya guardada (y vigente).
    const previa = await leerMega(db);
    const previaVigente = previa && Date.now() - new Date(previa.detectadoEn).getTime() < VIGENCIA_HORAS * 3600_000;
    if (previaVigente && previa!.volumen >= candidata.volumen) {
      return { guardada: false, titulo: previa!.titulo, volumen: previa!.volumen };
    }

    await guardarMega(db, {
      titulo: candidata.titulo,
      contexto: candidata.contexto,
      volumen: candidata.volumen,
      detectadoEn: new Date().toISOString(),
    });
    return { guardada: true, titulo: candidata.titulo, volumen: candidata.volumen };
  } catch {
    return { guardada: false };
  }
}

/** Devuelve la mega pendiente si sigue vigente; null si no hay o ya caducó. */
export async function megaPendiente(): Promise<MegaNoticia | null> {
  const db = await getDb();
  if (!db) return null;
  const mega = await leerMega(db);
  if (!mega) return null;
  if (Date.now() - new Date(mega.detectadoEn).getTime() >= VIGENCIA_HORAS * 3600_000) return null;
  return mega;
}

/** Borra la mega guardada (tras publicarla). */
export async function limpiarMega(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(appSettings).where(eq(appSettings.key, CLAVE));
}

/**
 * blog/sources.ts — De dónde sale el tema del blog diario.
 *
 * TODO esto es código, sin IA y sin costo: trae titulares frescos de varios
 * temas (tecnología, videojuegos, cine, IA) desde Google News en español de
 * México — una fuente pública, confiable y sin llave. El trabajo de la IA
 * (elegir y redactar) viene después, una sola vez al día.
 *
 * Se rota el tema por día del año para variar el contenido y no repetir.
 */

// Temas de donde traemos titulares. Pensados para "puerta de entrada": cosas
// que cualquiera quiere leer, no solo clientes de IAMET.
export const TEMAS = [
  "tecnología",
  "videojuegos",
  "estrenos de cine",
  "inteligencia artificial",
  "gadgets y celulares",
  "ciencia y espacio",
  "streaming y series",
];

export type Titular = {
  titulo: string;
  fuente: string;
  resumen: string;
  enlace: string;
  tema: string;
};

const UA = "Mozilla/5.0 (compatible; IametBlogBot/1.0)";

function urlGoogleNews(tema: string): string {
  const q = encodeURIComponent(tema);
  return `https://news.google.com/rss/search?q=${q}&hl=es-419&gl=MX&ceid=MX:es-419`;
}

// Quita etiquetas HTML y entidades comunes de un fragmento de RSS.
export function limpiarTexto(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Separa "Titular - Fuente" en sus dos partes (Google News los une así).
function partirTituloFuente(titulo: string): { titulo: string; fuente: string } {
  const i = titulo.lastIndexOf(" - ");
  if (i > 10) return { titulo: titulo.slice(0, i).trim(), fuente: titulo.slice(i + 3).trim() };
  return { titulo: titulo.trim(), fuente: "" };
}

/** Parsea el RSS de Google News (regex ligero, sin dependencias). */
export function parsearRss(xml: string, tema: string): Titular[] {
  const items: Titular[] = [];
  const bloques = xml.split(/<item>/).slice(1);
  for (const b of bloques) {
    const titRaw = b.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const desc = b.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "";
    const link = b.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? "";
    if (!titRaw) continue;
    const { titulo, fuente } = partirTituloFuente(limpiarTexto(titRaw));
    if (titulo.length < 12) continue;
    items.push({
      titulo,
      fuente,
      resumen: limpiarTexto(desc).slice(0, 300),
      enlace: limpiarTexto(link),
      tema,
    });
  }
  return items;
}

async function traerTema(tema: string, signal?: AbortSignal): Promise<Titular[]> {
  try {
    const r = await fetch(urlGoogleNews(tema), {
      headers: { "User-Agent": UA },
      signal: signal ?? AbortSignal.timeout(15000),
    });
    if (!r.ok) return [];
    return parsearRss(await r.text(), tema).slice(0, 12);
  } catch {
    return [];
  }
}

/**
 * Trae una lista de titulares candidatos del día. Rota el tema principal por
 * fecha para variar, y suma uno o dos temas más para que la IA tenga de dónde
 * elegir. Devuelve [] si ninguna fuente respondió (el llamador no publica).
 */
/** El tema que le toca a una fecha, por rotación. */
export function temaDelDia(fecha = new Date()): string {
  const dia = Math.floor((fecha.getTime() - Date.UTC(fecha.getUTCFullYear(), 0, 0)) / 86400000);
  return TEMAS[dia % TEMAS.length];
}

/**
 * Titulares del tema que toca hoy. UN solo tema (la variedad la da la rotación
 * día a día, y la mega noticia entra aparte como destacada). Trae más titulares
 * de ese tema para que la IA tenga de dónde escoger.
 */
export async function titularesDelDia(opts: { fecha?: Date; signal?: AbortSignal } = {}): Promise<Titular[]> {
  const tema = temaDelDia(opts.fecha ?? new Date());
  const lista = await traerTema(tema, opts.signal);
  return lista.slice(0, 12);
}

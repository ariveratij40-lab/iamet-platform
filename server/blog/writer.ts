/**
 * blog/writer.ts — La ÚNICA llamada de IA del blog diario.
 *
 * Hace doble trabajo en una sola llamada (barato): de la lista de titulares que
 * trajo el código, la IA ELIGE el más interesante para público general y ESCRIBE
 * un blog corto, fácil de leer y con un gancho curioso. También propone la
 * palabra con la que el código buscará la foto. El modelo no sale a internet ni
 * decide nada más.
 */
import { invokeLLM } from "../_core/llm";
import type { Titular } from "./sources";

export type BlogGenerado = {
  titulo: string;
  slug: string;
  entradilla: string; // resumen de una o dos líneas
  cuerpo: string; // el artículo, en párrafos (markdown simple)
  metaDescripcion: string; // para buscadores
  palabraImagen: string; // en inglés, para buscar la foto en bancos
  temaElegido: string; // el titular de origen, para no repetir
};

const SISTEMA =
  "Eres el editor de un blog de divulgación tecnológica y de cultura digital de " +
  "IAMET, una empresa de tecnología en México. Tu blog es una PUERTA DE ENTRADA: " +
  "artículos cortos y entretenidos que cualquier persona querría leer y compartir, " +
  "no publicidad de IAMET.\n" +
  "De la lista de titulares de hoy, ELIGE UNO: el más interesante, curioso o " +
  "comentado para público general (tecnología, videojuegos, cine, ciencia, IA, " +
  "gadgets). EVITA deportes, política local y notas tristes o sensibles. Si algún " +
  "titular viene marcado con [DESTACADO], es la gran noticia del día: PREFIÉRELO, " +
  "salvo que sea deporte, política o algo sensible. Quita la marca [DESTACADO] del título.\n" +
  "Luego ESCRIBE un blog en español de México: título atractivo (sin clickbait " +
  "engañoso), una entradilla de 1-2 líneas, y un cuerpo de 3 a 4 párrafos cortos " +
  "(máximo ~250 palabras en total), fácil de leer, con un dato o ángulo curioso.\n" +
  "REGLA DE ORO — que el artículo CUMPLA lo que promete: si el tema es un truco, " +
  "una lista, un tutorial o unos códigos/pasos, DA ejemplos concretos y útiles de " +
  "verdad (usa tu conocimiento general, que es información pública, no un invento). " +
  "NUNCA escribas 'existe un truco con códigos' o 'hay ciertos pasos' sin DECIR " +
  "cuáles son: un texto que promete algo y no lo entrega es un mal artículo. Si no " +
  "puedes dar el contenido concreto de ese titular, ELIGE OTRO titular de la lista " +
  "que sí puedas desarrollar completo.\n" +
  "Sobre los HECHOS DE LA NOTICIA (fechas, cifras, declaraciones, qué pasó): no " +
  "inventes ni exageres lo que no esté en el titular o el resumen. Lo que sí puedes " +
  "aportar libremente es contexto y conocimiento general del tema para que el " +
  "artículo sea útil. Cierra con una frase que invite a seguir explorando el sitio, " +
  "sin vender nada.\n" +
  'Responde SOLO un JSON: {"titulo","entradilla","cuerpo","metaDescripcion",' +
  '"palabraImagen","temaElegido"}. "cuerpo" usa saltos de línea dobles entre ' +
  'párrafos. "palabraImagen" es 1-2 palabras EN INGLÉS para buscar una foto ' +
  'genérica del tema (ej. "video game", "cinema", "space"). "temaElegido" es el ' +
  "titular que elegiste, tal cual.";

function acentoSlug(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function lista(titulares: Titular[]): string {
  return titulares
    .map((t, i) => `${i + 1}. [${t.tema}] ${t.titulo}${t.resumen ? ` — ${t.resumen}` : ""}`)
    .join("\n");
}

/** Extrae el JSON del texto del modelo, tolerante a texto alrededor. */
export function parsearBlog(texto: string): BlogGenerado | null {
  const m = texto.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let d: any;
  try {
    d = JSON.parse(m[0]);
  } catch {
    return null;
  }
  const titulo = String(d?.titulo ?? "").trim();
  const cuerpo = String(d?.cuerpo ?? "").trim();
  if (titulo.length < 8 || cuerpo.length < 60) return null;
  return {
    titulo: titulo.slice(0, 160),
    slug: acentoSlug(titulo) || `blog-${Date.now()}`,
    entradilla: String(d?.entradilla ?? "").trim().slice(0, 300),
    cuerpo: cuerpo.slice(0, 4000),
    metaDescripcion: String(d?.metaDescripcion ?? d?.entradilla ?? "").trim().slice(0, 200),
    palabraImagen: String(d?.palabraImagen ?? "technology").trim().slice(0, 40) || "technology",
    temaElegido: String(d?.temaElegido ?? titulo).trim().slice(0, 200),
  };
}

/**
 * Elige y redacta en una sola llamada. Devuelve null si no hay titulares, si no
 * hay clave de IA, o si el modelo falla — el llamador simplemente no publica hoy.
 */
export async function redactarBlog(
  titulares: Titular[],
  opts: { signal?: AbortSignal } = {}
): Promise<BlogGenerado | null> {
  if (titulares.length === 0) return null;
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: SISTEMA },
        { role: "user", content: `Titulares de hoy:\n${lista(titulares)}` },
      ],
      maxTokens: 700,
      signal: opts.signal ?? AbortSignal.timeout(30000),
    });
    const texto = result.choices?.[0]?.message?.content;
    return parsearBlog(typeof texto === "string" ? texto : "");
  } catch {
    return null;
  }
}

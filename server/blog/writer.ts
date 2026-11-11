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
  palabraImagen: string; // en inglés, para BUSCAR la foto en los bancos
  tagsImagen: string[]; // palabras EN INGLÉS que la foto debe mostrar, para ELEGIR la más relevante
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
  "PROHIBIDO INVENTAR (lo más importante): NUNCA inventes nombres de series, " +
  "películas, videojuegos, productos, personas, fechas, precios ni cifras que no " +
  "estén en el titular o el resumen. No digas que algo 'se estrenó esta semana', " +
  "'es nuevo' o 'acaba de salir' si no lo sabes con certeza por el titular. Tu " +
  "conocimiento tiene fecha de corte: NO conoces los estrenos recientes ni lo que " +
  "pasa ahora, así que no los menciones por nombre.\n" +
  "Entonces, según el tipo de tema:\n" +
  "- Si el titular pide una LISTA DE ACTUALIDAD que no conoces (ej. 'qué ver esta " +
  "semana', 'los mejores lanzamientos del mes', 'novedades'): NO inventes títulos. " +
  "Escribe sobre el TEMA en general —por qué es interesante, cómo elegir bien, qué " +
  "tomar en cuenta, el fenómeno— sin fabricar una lista. O ELIGE OTRO titular que " +
  "sí puedas desarrollar sin inventar.\n" +
  "- Si el tema es un truco o tutorial ATEMPORAL de conocimiento estable y público " +
  "(ej. códigos de categorías de Netflix, cómo funciona una tecnología), SÍ da " +
  "ejemplos concretos reales; pero no prometas un truco sin decir cuál es.\n" +
  "Cierra con una frase que invite a seguir explorando el sitio, sin vender nada.\n" +
  "Responde SOLO un JSON con estas claves: titulo, entradilla, cuerpo, " +
  "metaDescripcion, palabraImagen, tagsImagen, temaElegido. En cuerpo usa saltos " +
  "de linea dobles entre parrafos.\n" +
  "PARA LA FOTO (muy importante que sea congruente): palabraImagen son 2-3 " +
  "palabras EN INGLES para BUSCAR una foto concreta del tema. Usa objetos o " +
  "escenas claros y EVITA palabras que signifiquen otra cosa (ejemplo: NO uses " +
  "watching sola, porque trae bird watching; NO uses nacionalidades que traigan " +
  "comida). Mejor: television living room, game controller, rocket launch.\n" +
  "tagsImagen es un arreglo de 4 a 6 palabras EN INGLES, de UNA sola palabra cada " +
  "una, que describan lo que la buena foto DEBE mostrar; sirven para elegir la mas " +
  "relevante. Ejemplo para series de TV: [television, screen, sofa, streaming, " +
  "remote, living]. Ejemplo para un videojuego: [videogame, controller, console, " +
  "gaming, screen]. temaElegido es el titular que elegiste, tal cual.";

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
    tagsImagen: Array.isArray(d?.tagsImagen)
      ? d.tagsImagen.map((t: any) => String(t).toLowerCase().trim()).filter((t: string) => t.length > 1).slice(0, 8)
      : [],
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

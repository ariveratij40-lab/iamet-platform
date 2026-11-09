/**
 * blog/generate.ts — El trabajo diario: arma y publica un blog.
 *
 * Orquesta las piezas baratas: el código trae los titulares y la foto; la IA
 * solo elige y redacta (una llamada). Guarda el resultado como publicado. Nunca
 * lanza: ante cualquier fallo devuelve un motivo y no publica.
 *
 * Se dispara desde un endpoint de admin (a mano) o desde un cron diario.
 */
import { titularesDelDia, type Titular } from "./sources";
import { redactarBlog } from "./writer";
import { buscarImagen } from "./image";
import { crearPost, yaCubierto } from "./store";
import { blogAutoEncendido } from "./settings";
import { megaPendiente, limpiarMega } from "./megabomba";

export type ResultadoGeneracion =
  | { ok: true; id: number; slug: string; titulo: string; conImagen: boolean; mega: boolean }
  | { ok: false; motivo: string };

export async function generarBlogDelDia(opts: { signal?: AbortSignal } = {}): Promise<ResultadoGeneracion> {
  // 1) Código: traer titulares del tema del día (gratis, sin IA).
  const titulares = await titularesDelDia({ signal: opts.signal });

  // 1b) ¿Hubo una mega noticia durante el día? Entra como DESTACADA al principio
  //     de la lista, para que la IA la prefiera sobre el tema del día.
  const mega = await megaPendiente();
  const candidatos: Titular[] = [];
  if (mega) {
    candidatos.push({
      titulo: `[DESTACADO] ${mega.titulo}`,
      fuente: "tendencia del día",
      resumen: mega.contexto,
      enlace: "",
      tema: "mega noticia",
    });
  }
  candidatos.push(...titulares);
  if (candidatos.length === 0) return { ok: false, motivo: "No se pudieron traer titulares hoy." };

  // 2) IA: elegir y redactar (la única llamada).
  const blog = await redactarBlog(candidatos, { signal: opts.signal });
  if (!blog) return { ok: false, motivo: "La IA no devolvió un blog válido (o no hay clave configurada)." };

  // Anti-repetición: si ya cubrimos ese mismo titular hace poco, no repetir.
  if (await yaCubierto(blog.temaElegido)) {
    return { ok: false, motivo: `Ese tema ya se publicó hace poco: ${blog.temaElegido}` };
  }

  // 3) Código: foto gratis y legal (si se puede).
  const imagen = await buscarImagen(blog.palabraImagen, { signal: opts.signal });

  // 4) Guardar como publicado.
  const id = await crearPost({
    slug: blog.slug,
    title: blog.titulo,
    intro: blog.entradilla,
    body: blog.cuerpo,
    metaDescription: blog.metaDescripcion,
    imageUrl: imagen?.url ?? null,
    imageCredit: imagen?.credito ?? null,
    imageCreditUrl: imagen?.enlaceCredito ?? null,
    topic: blog.palabraImagen,
    sourceHeadline: blog.temaElegido,
    source: "ai",
    status: "published",
  });
  if (id == null) return { ok: false, motivo: "No hay base de datos para guardar el blog." };

  // Si publicamos, la mega guardada ya cumplió su función: se limpia.
  const usoMega = !!mega;
  if (usoMega) await limpiarMega();

  return { ok: true, id, slug: blog.slug, titulo: blog.titulo, conImagen: !!imagen, mega: usoMega };
}

/**
 * Entrypoint del CRON diario. Respeta el interruptor del admin: si la
 * publicación automática está APAGADA, no hace nada. El botón manual del panel
 * usa `generarBlogDelDia` directo y no pasa por aquí.
 */
export async function ejecutarBlogDiario(opts: { signal?: AbortSignal } = {}): Promise<ResultadoGeneracion> {
  if (!(await blogAutoEncendido())) {
    return { ok: false, motivo: "La publicación diaria automática está apagada." };
  }
  return generarBlogDelDia(opts);
}

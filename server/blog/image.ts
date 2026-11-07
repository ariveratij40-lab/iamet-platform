/**
 * blog/image.ts — Trae una foto gratis y legal para el blog.
 *
 * Código, sin IA: consulta Openverse (buscador de imágenes con licencia abierta,
 * público y sin llave) por la palabra que propuso el redactor. Devuelve la URL y
 * el crédito de atribución (las licencias Creative Commons piden dar crédito; lo
 * guardamos y lo mostramos bajo la foto). Si no encuentra nada, devuelve null y
 * el blog se publica sin imagen.
 */
const UA = "Mozilla/5.0 (compatible; IametBlogBot/1.0)";

export type ImagenBlog = {
  url: string;
  credito: string; // "Foto de <autor> en <fuente> (<licencia>)"
  enlaceCredito: string;
};

function creditoDe(r: any): string {
  const autor = (r?.creator ?? "").toString().trim() || "autor desconocido";
  const fuente = (r?.source ?? r?.provider ?? "").toString().trim();
  const lic = (r?.license ?? "").toString().toUpperCase();
  const ver = (r?.license_version ?? "").toString();
  const licTxt = lic ? `CC ${lic}${ver ? " " + ver : ""}` : "licencia abierta";
  return `Foto de ${autor}${fuente ? ` en ${fuente}` : ""} (${licTxt})`;
}

/**
 * Busca una imagen para `palabra`. Prefiere licencias permisivas y con URL de
 * tamaño razonable. Nunca lanza: ante cualquier fallo devuelve null.
 */
export async function buscarImagen(
  palabra: string,
  opts: { signal?: AbortSignal } = {}
): Promise<ImagenBlog | null> {
  const q = encodeURIComponent(palabra.trim() || "technology");
  // license_type=commercial,modification = seguro para un sitio de empresa.
  const url =
    `https://api.openverse.org/v1/images/?q=${q}` +
    `&page_size=8&mature=false&license_type=commercial,modification`;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: opts.signal ?? AbortSignal.timeout(15000),
    });
    if (!r.ok) return null;
    const data: any = await r.json();
    const results: any[] = Array.isArray(data?.results) ? data.results : [];
    // Nos quedamos con el primero que tenga una URL de imagen utilizable.
    for (const item of results) {
      const img = (item?.url ?? "").toString();
      if (img.startsWith("https://")) {
        return { url: img, credito: creditoDe(item), enlaceCredito: (item?.foreign_landing_url ?? img).toString() };
      }
    }
    return null;
  } catch {
    return null;
  }
}

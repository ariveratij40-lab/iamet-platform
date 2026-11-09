/**
 * blog/image.ts — Trae una foto gratis y legal para el blog.
 *
 * Código, sin IA. Intenta dos bancos de imágenes públicos y con licencia abierta,
 * para que casi siempre haya foto:
 *   1) Openverse — buscador de imágenes CC.
 *   2) Wikimedia Commons — respaldo muy estable (si Openverse está caído).
 * Devuelve la URL y el crédito de atribución (las licencias piden dar crédito; lo
 * guardamos y lo mostramos bajo la foto). Si ninguno responde, devuelve null y el
 * blog se publica sin imagen.
 */
const UA = "IametBlogBot/1.0 (contacto@iamet.mx)";

export type ImagenBlog = {
  url: string;
  credito: string;
  enlaceCredito: string;
};

const esFoto = (u: string) => /^https:\/\/.+\.(jpe?g|png)(\?|$)/i.test(u);
const sinHtml = (s: string) => s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

// ── Openverse ────────────────────────────────────────────────────────────────
function creditoOpenverse(r: any): string {
  const autor = (r?.creator ?? "").toString().trim() || "autor desconocido";
  const fuente = (r?.source ?? r?.provider ?? "").toString().trim();
  const lic = (r?.license ?? "").toString().toUpperCase();
  const ver = (r?.license_version ?? "").toString();
  const licTxt = lic ? `CC ${lic}${ver ? " " + ver : ""}` : "licencia abierta";
  return `Foto de ${autor}${fuente ? ` en ${fuente}` : ""} (${licTxt})`;
}

async function buscarEnOpenverse(palabra: string, signal?: AbortSignal): Promise<ImagenBlog | null> {
  const q = encodeURIComponent(palabra);
  const url = `https://api.openverse.org/v1/images/?q=${q}&page_size=8&mature=false&license_type=commercial,modification`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal });
    if (!r.ok) return null;
    const data: any = await r.json();
    for (const item of (Array.isArray(data?.results) ? data.results : [])) {
      const img = (item?.url ?? "").toString();
      if (esFoto(img)) {
        return { url: img, credito: creditoOpenverse(item), enlaceCredito: (item?.foreign_landing_url ?? img).toString() };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// ── Wikimedia Commons (respaldo) ─────────────────────────────────────────────
async function buscarEnWikimedia(palabra: string, signal?: AbortSignal): Promise<ImagenBlog | null> {
  const q = encodeURIComponent(palabra);
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${q}&gsrnamespace=6&gsrlimit=8&prop=imageinfo` +
    `&iiprop=url|extmetadata&format=json&origin=*`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal });
    if (!r.ok) return null;
    const data: any = await r.json();
    const paginas: any[] = Object.values(data?.query?.pages ?? {});
    for (const p of paginas) {
      const info = p?.imageinfo?.[0];
      const img = (info?.url ?? "").toString();
      if (!esFoto(img)) continue;
      const meta = info?.extmetadata ?? {};
      const autor = sinHtml((meta?.Artist?.value ?? "").toString()) || "autor desconocido";
      const lic = sinHtml((meta?.LicenseShortName?.value ?? "").toString()) || "licencia abierta";
      return {
        url: img.split("?")[0], // sin parámetros de rastreo
        credito: `Foto de ${autor} en Wikimedia Commons (${lic})`,
        enlaceCredito: (info?.descriptionurl ?? img).toString(),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Busca una imagen para `palabra`. Intenta Openverse y, si no da, Wikimedia.
 * Nunca lanza: ante cualquier fallo devuelve null.
 */
export async function buscarImagen(
  palabra: string,
  opts: { signal?: AbortSignal } = {}
): Promise<ImagenBlog | null> {
  const p = (palabra || "technology").trim();
  const signal = opts.signal ?? AbortSignal.timeout(15000);
  return (await buscarEnOpenverse(p, signal)) ?? (await buscarEnWikimedia(p, signal));
}

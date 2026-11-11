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

// Filtro de calidad: una buena foto de blog es GRANDE y HORIZONTAL. Descarta
// imágenes chicas (se ven pixeladas al ancho del blog) y verticales o panorámicas
// (quedan mal en la tarjeta). Cuando no sabemos el tamaño, no bloqueamos.
const ANCHO_MIN = 1000;
const ALTO_MIN = 600;
function calidadOk(ancho?: number, alto?: number): boolean {
  if (!ancho || !alto) return true; // sin datos: no descartamos
  if (ancho < ANCHO_MIN || alto < ALTO_MIN) return false;
  const r = ancho / alto;
  return r >= 1.2 && r <= 2.6; // horizontal, ni cuadrada ni panorámica extrema
}

// Nombres que delatan una gráfica, diagrama, mapa, logo o escaneo — NO son una
// foto editorial. Se descartan para que el blog no salga con una estadística.
const NO_FOTO =
  /chart|graph|diagram|plot|map\b|statistic|\bvs\b|versus|_rate|rates_|logo|icon|flag|seal|coat[_ ]of[_ ]arms|schematic|screenshot|infographic|svg|\.pdf/i;
// Una foto de verdad suele ser .jpg; las gráficas y logos suelen ser .png.
const esFotoReal = (u: string) => esFoto(u) && !NO_FOTO.test(u);
const esJpg = (u: string) => /\.jpe?g(\?|$)/i.test(u);

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
    const items: any[] = Array.isArray(data?.results) ? data.results : [];
    // Preferimos una foto real .jpg; luego cualquier foto que no sea gráfica/logo.
    const elegir = (fn: (u: string) => boolean) =>
      items.find(it => fn((it?.url ?? "").toString()));
    const item =
      elegir(u => esFotoReal(u) && esJpg(u)) ?? elegir(esFotoReal) ?? elegir(esFoto);
    if (!item) return null;
    const img = (item.url ?? "").toString();
    return { url: img, credito: creditoOpenverse(item), enlaceCredito: (item?.foreign_landing_url ?? img).toString() };
  } catch {
    return null;
  }
}

// ── Wikimedia Commons (respaldo) ─────────────────────────────────────────────
async function buscarEnWikimedia(palabra: string, signal?: AbortSignal): Promise<ImagenBlog | null> {
  const q = encodeURIComponent(palabra);
  // iiprop=size trae ancho/alto para el filtro de calidad; iiurlwidth=1280 da una
  // versión escalada a 1280px (no la original gigante, que carga lento).
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${q}&gsrnamespace=6&gsrlimit=10&prop=imageinfo` +
    `&iiprop=url|size|extmetadata&iiurlwidth=1280&format=json&origin=*`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal });
    if (!r.ok) return null;
    const data: any = await r.json();
    const paginas: any[] = Object.values(data?.query?.pages ?? {});
    const urlDe = (p: any) => (p?.imageinfo?.[0]?.url ?? "").toString();
    const bueno = (p: any) => {
      const info = p?.imageinfo?.[0];
      return esFotoReal(urlDe(p)) && calidadOk(Number(info?.width), Number(info?.height));
    };
    // Preferimos foto real .jpg que pase calidad; luego cualquier foto de calidad.
    const p = paginas.find(x => bueno(x) && esJpg(urlDe(x))) ?? paginas.find(bueno);
    if (!p) return null;
    const info = p.imageinfo[0];
    // thumburl = la versión de 1280px; si no, la original.
    const img = (info.thumburl ?? info.url ?? "").toString();
    const meta = info?.extmetadata ?? {};
    const autor = sinHtml((meta?.Artist?.value ?? "").toString()) || "autor desconocido";
    const lic = sinHtml((meta?.LicenseShortName?.value ?? "").toString()) || "licencia abierta";
    return {
      url: img.split("?")[0], // sin parámetros de rastreo
      credito: `Foto de ${autor} en Wikimedia Commons (${lic})`,
      enlaceCredito: (info?.descriptionurl ?? img).toString(),
    };
  } catch {
    return null;
  }
}

// Cuántas palabras-tag de la foto coinciden con lo que el artículo espera ver.
// Así elegimos la foto RELEVANTE, no solo la primera grande. (Un paisaje tendría
// 0 coincidencias con ["television","streaming"] y se descarta.)
function relevancia(tagsFoto: string, esperadas: string[]): number {
  if (esperadas.length === 0) return 0;
  const t = tagsFoto.toLowerCase();
  let n = 0;
  for (const w of esperadas) if (w.length > 2 && t.includes(w)) n++;
  return n;
}

// ── Pixabay (fuente principal — fotos profesionales y relevantes) ────────────
// Requiere PIXABAY_API_KEY (gratis). Si no está, se omite y se usan los otros.
async function buscarEnPixabay(palabra: string, tags: string[], signal?: AbortSignal): Promise<ImagenBlog | null> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  const q = encodeURIComponent(palabra);
  const url =
    `https://pixabay.com/api/?key=${key}&q=${q}&image_type=photo&safesearch=true` +
    `&orientation=horizontal&order=popular&min_width=1280&min_height=720&per_page=20&lang=es`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal });
    if (!r.ok) return null;
    const data: any = await r.json();
    const hits: any[] = (Array.isArray(data?.hits) ? data.hits : [])
      .filter((h: any) => calidadOk(Number(h?.imageWidth), Number(h?.imageHeight)));
    if (hits.length === 0) return null;
    // Palabras que la foto debe mostrar: los tags del artículo + las de la búsqueda.
    const esperadas = [...tags, ...palabra.toLowerCase().split(/\s+/)];
    // Elegimos la de MAYOR coincidencia de tags (la más relevante).
    let mejor = hits[0];
    let mejorPuntaje = relevancia(String(hits[0]?.tags ?? ""), esperadas);
    for (const h of hits.slice(1)) {
      const p = relevancia(String(h?.tags ?? ""), esperadas);
      if (p > mejorPuntaje) { mejor = h; mejorPuntaje = p; }
    }
    // Si NINGUNA foto coincide con el tema, mejor no poner una irrelevante:
    // devolvemos null y se intenta otra fuente (o se publica sin foto).
    if (mejorPuntaje === 0 && esperadas.length > 0) return null;
    const img = (mejor.largeImageURL ?? mejor.webformatURL ?? "").toString();
    if (!img.startsWith("https://")) return null;
    const autor = (mejor?.user ?? "").toString().trim() || "Pixabay";
    return {
      url: img,
      credito: `Foto de ${autor} en Pixabay`,
      enlaceCredito: (mejor?.pageURL ?? "https://pixabay.com").toString(),
    };
  } catch {
    return null;
  }
}

/**
 * Busca una imagen RELEVANTE para el artículo. `tags` son las palabras que la
 * foto debe mostrar (las elige la IA): con ellas descartamos fotos bonitas pero
 * fuera de tema. Orden: Pixabay → Openverse → Wikimedia, cada una con su reloj.
 * Nunca lanza: ante cualquier fallo, null.
 */
export async function buscarImagen(
  palabra: string,
  tags: string[] = [],
  opts: { signal?: AbortSignal } = {}
): Promise<ImagenBlog | null> {
  const p = (palabra || "technology").trim();
  const reloj = () => opts.signal ?? AbortSignal.timeout(12000);
  return (
    (await buscarEnPixabay(p, tags, reloj())) ??
    (await buscarEnOpenverse(p, reloj())) ??
    (await buscarEnWikimedia(p, reloj()))
  );
}

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
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${q}&gsrnamespace=6&gsrlimit=8&prop=imageinfo` +
    `&iiprop=url|extmetadata&format=json&origin=*`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal });
    if (!r.ok) return null;
    const data: any = await r.json();
    const paginas: any[] = Object.values(data?.query?.pages ?? {});
    const urlDe = (p: any) => (p?.imageinfo?.[0]?.url ?? "").toString();
    // Preferimos una foto real .jpg; luego cualquier foto que no sea gráfica/logo.
    const elige = (fn: (u: string) => boolean) => paginas.find(p => fn(urlDe(p)));
    const p = elige(u => esFotoReal(u) && esJpg(u)) ?? elige(esFotoReal);
    if (!p) return null;
    const info = p.imageinfo[0];
    const img = (info.url ?? "").toString();
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

// ── Pixabay (fuente principal — fotos profesionales y relevantes) ────────────
// Requiere PIXABAY_API_KEY (gratis). Si no está, se omite y se usan los otros.
async function buscarEnPixabay(palabra: string, signal?: AbortSignal): Promise<ImagenBlog | null> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return null;
  const q = encodeURIComponent(palabra);
  const url =
    `https://pixabay.com/api/?key=${key}&q=${q}&image_type=photo&safesearch=true` +
    `&orientation=horizontal&per_page=5&lang=es`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal });
    if (!r.ok) return null;
    const data: any = await r.json();
    const hit = (Array.isArray(data?.hits) ? data.hits : [])[0];
    const img = (hit?.webformatURL ?? hit?.largeImageURL ?? "").toString();
    if (!img.startsWith("https://")) return null;
    const autor = (hit?.user ?? "").toString().trim() || "Pixabay";
    return {
      url: img,
      credito: `Foto de ${autor} en Pixabay`,
      enlaceCredito: (hit?.pageURL ?? "https://pixabay.com").toString(),
    };
  } catch {
    return null;
  }
}

/**
 * Busca una imagen para `palabra`. Orden: Pixabay (fotos buenas y relevantes) →
 * Openverse → Wikimedia. Cada fuente con su propio cronómetro para que una lenta
 * no consuma el tiempo de la siguiente. Nunca lanza: ante cualquier fallo, null.
 */
export async function buscarImagen(
  palabra: string,
  opts: { signal?: AbortSignal } = {}
): Promise<ImagenBlog | null> {
  const p = (palabra || "technology").trim();
  const reloj = () => opts.signal ?? AbortSignal.timeout(12000);
  return (
    (await buscarEnPixabay(p, reloj())) ??
    (await buscarEnOpenverse(p, reloj())) ??
    (await buscarEnWikimedia(p, reloj()))
  );
}

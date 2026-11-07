import { useLanguage } from "@/contexts/LanguageContext";
const products = [
  {
    image: "angled-panel.jpg",
    es: "Panel angulado de alta densidad",
    en: "High-density angled panel",
    model: "CPPA48HDWBLY · 48 puertos / 1 RU",
  },
  {
    image: "patch-cord-28awg.jpg",
    es: "Patch cord delgado Cat 6A",
    en: "Slim Cat 6A patch cord",
    model: "UTP28X · 28 AWG",
  },
  {
    image: "r2p-rack.jpg",
    es: "Rack de dos postes",
    en: "Two-post rack",
    model: "R2P · 45 RU",
  },
  {
    image: "nmf4-manager.jpg",
    es: "Organización de cableado",
    en: "Cable management",
    model: "NetManager · NMF4",
  },
  {
    image: "fmt1-fiber-tray.jpg",
    es: "Charola de fibra óptica",
    en: "Fiber optic tray",
    model: "FMT1 · 1 RU",
  },
  {
    image: "fiber-adapter-panel.jpg",
    es: "Panel de adaptadores de fibra",
    en: "Fiber adapter panel",
    model: "Conectividad LC / LC connectivity",
  },
];
const CATALOG =
  "https://www.panduit.com/content/dam/panduit/en/website/support/catalogs/pdf/panduit-asean-preferred-part-catalogue-2024.pdf";
export default function PanduitProductsV2() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <aside
      aria-label={
        es ? "Productos originales Panduit" : "Original Panduit products"
      }
      className="relative mt-10 lg:absolute lg:right-12 lg:top-12 lg:mt-0 lg:w-[42%]"
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px w-7 bg-blue-400" />
        <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-blue-200">
          {es
            ? "Infraestructura Panduit · cobre y fibra"
            : "Panduit infrastructure · copper and fiber"}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {products.map(product => (
          <a
            key={product.image}
            href={CATALOG}
            target="_blank"
            rel="noreferrer"
            className="group overflow-hidden rounded-lg border border-white/15 bg-[#071a2c]/95 transition-colors hover:border-blue-400 focus-visible:outline-2 focus-visible:outline-blue-300"
          >
            <div
              className="flex h-[88px] items-center justify-center p-3 sm:h-[106px]"
              style={{ background: "#fff" }}
            >
              <img
                src={`/products/panduit/${product.image}`}
                alt={es ? product.es : product.en}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="px-3 py-2.5">
              <p className="text-[11px] font-semibold leading-4 text-white">
                {es ? product.es : product.en}
              </p>
              <p className="mt-1 text-[9px] leading-4 text-blue-200/70">
                {product.model.replace("puertos", es ? "puertos" : "ports")}
              </p>
            </div>
          </a>
        ))}
      </div>
      <a
        href={CATALOG}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex text-[10px] text-blue-200/75 underline underline-offset-4 hover:text-white"
      >
        {es
          ? "Fotografías originales · catálogo oficial Panduit ↗"
          : "Original photographs · official Panduit catalog ↗"}
      </a>
    </aside>
  );
}

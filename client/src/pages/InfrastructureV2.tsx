import InfrastructureVisualGuideV2 from "@/components/v2/InfrastructureVisualGuideV2";
import InfrastructureServicesV2 from "@/components/v2/InfrastructureServicesV2";
import InfrastructureStoryV2 from "@/components/v2/InfrastructureStoryV2";
import ServiceConversionV2, {
  useServiceMetadata,
} from "@/components/v2/ServiceConversionV2";
import { solutions } from "@/components/v2/solutionsData";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import ServiceHeroV2 from "@/components/v2/ServiceHeroV2";
import CorporateClosingV2 from "@/components/v2/CorporateClosingV2";

const catalog =
  "https://www.panduit.com/content/dam/panduit/en/website/support/catalogs/pdf/panduit-asean-preferred-part-catalogue-2024.pdf";
const products = [
  {
    image: "angled-panel.jpg",
    category: ["Cobre", "Copper"],
    title: ["Paneles angulados", "Angled patch panels"],
    model: "CPPA48HDWBLY",
    description: [
      "Conectividad de alta densidad para una distribución ordenada de los puntos de red.",
      "High-density connectivity for organized network distribution.",
    ],
  },
  {
    image: "patch-cord-28awg.jpg",
    category: ["Cobre", "Copper"],
    title: ["Patch cords de diámetro delgado", "Small-diameter patch cords"],
    model: "UTP28X · Cat 6A · 28 AWG",
    description: [
      "Conexiones de diámetro reducido para facilitar el manejo del cableado en el rack.",
      "Small-diameter connections for easier rack cable management.",
    ],
  },
  {
    image: "r2p-rack.jpg",
    category: ["Racks", "Racks"],
    title: ["Racks de dos postes", "Two-post racks"],
    model: "R2P",
    description: [
      "La estructura para integrar paneles, organizadores y equipos de comunicaciones.",
      "The structure for integrating panels, managers and communications equipment.",
    ],
  },
  {
    image: "nmf4-manager.jpg",
    category: ["Organización", "Management"],
    title: ["Organizadores de cableado", "Cable managers"],
    model: "NetManager · NMF4",
    description: [
      "Rutas de cableado accesibles que facilitan las intervenciones y el mantenimiento.",
      "Accessible cable routes for easier service and maintenance.",
    ],
  },
  {
    image: "fmt1-fiber-tray.jpg",
    category: ["Fibra óptica", "Fiber optics"],
    title: ["Charolas de fibra óptica", "Fiber optic trays"],
    model: "FMT1",
    description: [
      "Alojamiento y organización de las conexiones de fibra dentro del rack.",
      "Housing and organization for fiber connections inside the rack.",
    ],
  },
  {
    image: "fiber-adapter-panel.jpg",
    category: ["Fibra óptica", "Fiber optics"],
    title: ["Paneles de adaptadores", "Adapter panels"],
    model: "Conectividad LC",
    description: [
      "Distribución de conexiones ópticas para enlazar espacios y equipos.",
      "Optical connection distribution to link spaces and equipment.",
    ],
  },
];

export default function InfrastructureV2() {
  const { language } = useLanguage();
  const es = language === "es";
  const i = es ? 0 : 1;
  useServiceMetadata(
    es ? "Integrador certificado Panduit" : "Panduit technology infrastructure",
    es
      ? "Integrador certificado Panduit: instalación de cableado estructurado, fibra óptica, Data Center, ductería, escalerilla tipo malla, DCIM y pruebas con Fluke Networks."
      : solutions[0].descEn
  );
  return (
    <div className="iamet-reference-home bg-[#f4f7fb] text-slate-900">
      <ServiceHeroV2
        brandLabel="PANDUIT"
        eyebrow={
          es ? "Infraestructura tecnológica" : "Technology infrastructure"
        }
        title={
          es
            ? "Integrador certificado Panduit para su infraestructura."
            : "Certified Panduit integrator for your infrastructure."
        }
        description={
          es
            ? "Diseñamos, instalamos y certificamos cableado estructurado y fibra óptica Panduit. Integramos la infraestructura física de su Data Center, desde las canalizaciones hasta el rack."
            : "We design and integrate copper cabling, fiber optics and telecommunications spaces with Panduit solutions, from the network outlet to the rack."
        }
        image="/images/solutions/panduit-high-density-cinematic.png"
        contactHref="#solicitar"
        contactLabel={es ? "Cotizar mi proyecto" : "Discuss my project"}
        portfolioLabel={
          es ? "Explorar portafolio Panduit" : "Explore the Panduit portfolio"
        }
        breadcrumbLabel={es ? "Ruta de navegación" : "Breadcrumb"}
        homeLabel={es ? "Inicio" : "Home"}
        partner={{
          image: "/partners/panduit-one-silver-partner.png",
          label: es
            ? "Integramos soluciones Panduit para su infraestructura."
            : "We integrate Panduit solutions for your infrastructure.",
        }}
      />
      <InfrastructureVisualGuideV2 />
      <InfrastructureServicesV2 />
      <InfrastructureStoryV2 />
      <section
        id="portafolio"
        className="scroll-mt-24 px-5 py-16 sm:px-8 lg:px-12 lg:py-24"
      >
        <div className="mx-auto max-w-[1344px]">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[680px]">
              <p className="mb-3 text-xs font-bold uppercase tracking-[.22em] text-blue-600">
                {es ? "Portafolio de producto" : "Product portfolio"}
              </p>
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
                {es
                  ? "Cada conexión, parte de una solución."
                  : "Every connection, part of a solution."}
              </h2>
              <p className="mt-5 leading-7 text-slate-600">
                {es
                  ? "Una selección de componentes Panduit para construir una infraestructura ordenada, accesible y preparada para evolucionar."
                  : "A selection of Panduit components for organized, accessible infrastructure built to evolve."}
              </p>
            </div>
            <a
              href={catalog}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
            >
              {es ? "Consultar catálogo Panduit" : "View Panduit catalog"}
              <ExternalLink size={15} />
            </a>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(product => (
              <article
                key={product.image}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div
                  className="flex h-52 items-center justify-center border-b border-slate-100 p-8"
                  style={{ background: "#fff" }}
                >
                  <img
                    src={`/products/panduit/${product.image}`}
                    alt={`Panduit ${product.title[i]} ${product.model}`}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
                    {product.category[i]}
                  </p>
                  <h3 className="mt-3 text-xl font-bold">{product.title[i]}</h3>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {product.model}
                  </p>
                  <p className="mb-6 mt-4 text-sm leading-6 text-slate-600">
                    {product.description[i]}
                  </p>
                  <Link
                    href={`/contacto?solucion=infraestructura&producto=${encodeURIComponent(product.model)}`}
                    className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                  >
                    {es ? "Consultar para mi proyecto" : "Ask about my project"}
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-6 text-xs leading-6 text-slate-500">
            {es
              ? "Fotografías de producto del catálogo oficial Panduit. La selección de modelos se define según las necesidades de cada proyecto."
              : "Product photographs from the official Panduit catalog. Model selection depends on each project's requirements."}
          </p>
        </div>
      </section>
      <ServiceConversionV2
        slug="infraestructura"
        context="Marca de interés: Panduit. Solución: infraestructura física."
        name={es ? "Infraestructura" : "Infrastructure"}
        capabilities={
          es ? solutions[0].capabilitiesEs : solutions[0].capabilitiesEn
        }
      />
      <CorporateClosingV2 />
    </div>
  );
}

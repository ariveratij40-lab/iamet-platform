import { Expand } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
const scenes = [
  {
    image: "data-center",
    page: 12,
    title: ["Data Center y rutas de fibra", "Data center and fiber routes"],
    description: [
      "Gabinetes, charolas tipo malla y canalizaciones para organizar la infraestructura del centro de datos.",
      "Cabinets, wire mesh trays and routing systems organize data center infrastructure.",
    ],
  },
  {
    image: "telecom-room",
    page: 14,
    title: ["Cuarto de telecomunicaciones", "Telecommunications room"],
    description: [
      "Racks, paneles y organizadores conectados mediante rutas horizontales y verticales de cableado.",
      "Racks, panels and managers connected through horizontal and vertical cable routes.",
    ],
  },
  {
    image: "office-cabling",
    page: 16,
    title: ["Cableado para oficinas", "Office cabling"],
    description: [
      "Distribución del cableado desde las charolas hasta los puntos de conexión de los espacios de trabajo.",
      "Cabling distribution from overhead trays to connection points in workspaces.",
    ],
  },
];
export default function InfrastructureVisualGuideV2() {
  const { language } = useLanguage();
  const es = language === "es";
  const i = es ? 0 : 1;
  return (
    <section
      id="guia-visual"
      className="bg-[#061524] px-5 py-16 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-[1250px]">
        <div className="mb-8 max-w-[780px]">
          <p className="text-xs font-bold uppercase tracking-[.22em] text-blue-400">
            {es ? "Infraestructura en contexto" : "Infrastructure in context"}
          </p>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            {es
              ? "Así se conecta un edificio, de extremo a extremo."
              : "How a building connects, end to end."}
          </h2>
          <p className="mt-5 leading-8 text-slate-300">
            {es
              ? "Explore los espacios y recorridos que forman una infraestructura integrada: desde el Data Center y el cuarto de telecomunicaciones hasta el punto de red."
              : "Explore the spaces and routes in integrated infrastructure, from the data center and telecommunications room to the network outlet."}
          </p>
        </div>
        <figure className="overflow-hidden rounded-2xl border border-blue-300/20">
          <a
            href="/images/panduit-building/building-overview.webp"
            target="_blank"
            rel="noreferrer"
            className="group relative block bg-white"
            aria-label={
              es
                ? "Ampliar vista del edificio conectado (abre otra pestaña)"
                : "Enlarge connected building view (opens a new tab)"
            }
          >
            <img
              src="/images/panduit-building/building-overview.webp"
              alt={
                es
                  ? "Ilustración Panduit de un edificio con oficinas, recepción, racks y cableado por charolas"
                  : "Panduit illustration of a building with offices, lobby, racks and cable trays"
              }
              width="1920"
              height="988"
              loading="lazy"
              className="h-auto w-full"
            />
            <span className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-slate-950/85 px-4 py-2 text-xs text-white">
              <Expand size={14} />
              {es ? "Ampliar imagen" : "Enlarge image"}
            </span>
          </a>
          <figcaption className="bg-[#10283d] px-5 py-4 text-xs leading-6 text-slate-300">
            {es
              ? "Vista de conjunto · Ilustración Panduit · Guía Smart Building, pág. 10."
              : "Overview · Panduit illustration · Smart Building guide, p. 10."}
          </figcaption>
        </figure>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {scenes.map(scene => (
            <figure
              key={scene.image}
              className="overflow-hidden rounded-2xl border border-blue-300/20 bg-[#10283d]"
            >
              <a
                href={`/images/panduit-building/${scene.image}.webp`}
                target="_blank"
                rel="noreferrer"
                className="block"
                aria-label={`${es ? "Ampliar" : "Enlarge"}: ${scene.title[i]}`}
              >
                <img
                  src={`/images/panduit-building/${scene.image}.webp`}
                  alt={scene.title[i]}
                  width="1920"
                  height="995"
                  loading="lazy"
                  className="aspect-[1.93] w-full object-contain"
                />
              </a>
              <figcaption className="p-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">
                  PANDUIT · {es ? "PÁG." : "P."} {scene.page}
                </p>
                <h3 className="mt-3 text-lg font-bold text-white">
                  {scene.title[i]}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {scene.description[i]}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-5 text-xs leading-6 text-slate-400">
          {es
            ? "Ilustraciones de aplicación del documento Panduit CPEB12-WW-ENG. Representan soluciones de referencia; no son fotografías de proyectos ejecutados por IAMET."
            : "Application illustrations from Panduit CPEB12-WW-ENG. Reference solutions, not photographs of projects delivered by IAMET."}
        </p>
      </div>
    </section>
  );
}

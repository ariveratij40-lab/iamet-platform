import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
const services = [
  [
    "Integrador certificado Panduit",
    "Diseño e integración de soluciones Panduit para la infraestructura física de su empresa.",
    "Certified Panduit integrator",
    "Design and integration of Panduit solutions for your company's physical infrastructure.",
  ],
  [
    "Instalación de cableado estructurado",
    "Instalación de puntos de red, terminación de conexiones, identificación y organización de cableado de cobre.",
    "Structured cabling installation",
    "Network outlets, connection termination, identification and organization of copper cabling.",
  ],
  [
    "Diseño de Data Center",
    "Planeación de racks, conectividad, distribución de fibra y rutas de cableado para su centro de datos.",
    "Data center design",
    "Planning racks, connectivity, fiber distribution and cable routes for your data center.",
  ],
  [
    "Instalación de ductería y escalerilla tipo malla",
    "Diseño e instalación de canalizaciones y charolas tipo malla para organizar y conducir el cableado.",
    "Conduit and wire mesh tray installation",
    "Design and installation of conduits and wire mesh trays to organize and route cabling.",
  ],
  [
    "Certificación de cableado estructurado Panduit",
    "Revisión de la instalación, pruebas de los enlaces y documentación técnica del sistema de cableado Panduit.",
    "Panduit structured cabling certification",
    "Installation review, link testing and technical documentation for Panduit cabling systems.",
  ],
  [
    "Diseño e instalación de fibra óptica Panduit",
    "Diseño de enlaces, instalación y organización de fibra óptica, charolas y paneles de distribución Panduit.",
    "Panduit fiber optic design and installation",
    "Link design, fiber installation and organization with Panduit trays and distribution panels.",
  ],
  [
    "Software DCIM",
    "Integración de herramientas para documentar y administrar racks, activos y conexiones de la infraestructura del Data Center.",
    "DCIM software",
    "Tools to document and manage racks, assets and connections in your data center infrastructure.",
  ],
  [
    "Certificación de cableado con equipo Fluke Networks",
    "Pruebas de desempeño de los enlaces con equipo Fluke Networks y entrega de reportes de medición para documentar los resultados.",
    "Cabling certification with Fluke Networks equipment",
    "Link performance testing with Fluke Networks equipment and measurement reports documenting the results.",
  ],
];
export default function InfrastructureServicesV2() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <section
      id="servicios-infraestructura"
      className="scroll-mt-24 bg-[#081b2c] px-5 py-20 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-[1250px]">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-blue-400">
          {es ? "Servicios especializados" : "Specialist services"}
        </p>
        <h2 className="mt-4 max-w-[850px] text-3xl font-bold text-white sm:text-4xl">
          {es
            ? "Del diseño a la instalación y certificación de su infraestructura."
            : "From design to installation and certification."}
        </h2>
        <p className="mt-5 max-w-[760px] leading-8 text-slate-300">
          {es
            ? "Seleccione el servicio que necesita. Podemos revisar una instalación existente o definir el alcance de un proyecto nuevo."
            : "Choose the service you need. We can review an existing installation or define the scope of a new project."}
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {services.map(([title, description, titleEn, descriptionEn], i) => (
            <article
              key={title}
              className="flex flex-col rounded-2xl border border-blue-300/15 bg-[#10283d] p-7"
            >
              <p className="text-xs font-semibold text-blue-400">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-xl font-bold text-white">
                {es ? title : titleEn}
              </h3>
              <p className="mb-6 mt-4 text-sm leading-7 text-slate-300">
                {es ? description : descriptionEn}
              </p>
              <a
                href="#solicitar"
                className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:underline"
              >
                {es ? "Consultar este servicio" : "Ask about this service"}
                <ArrowRight size={15} />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

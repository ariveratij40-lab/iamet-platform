import { ArrowRight, Cable, Network, Layers } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function InfrastructureStoryV2() {
  const { language } = useLanguage();
  const es = language === "es";
  const benefits = es
    ? [
        [
          "Conectividad bien diseñada",
          "Cobre y fibra seleccionados según las distancias, los equipos y las necesidades de su operación.",
        ],
        [
          "Orden que facilita el mantenimiento",
          "Paneles, racks y organizadores que permiten identificar conexiones e intervenir con mayor claridad.",
        ],
        [
          "Una base para evolucionar",
          "Diseño del espacio y las rutas de cableado considerando las ampliaciones previstas de su proyecto.",
        ],
      ]
    : [
        [
          "Purposeful connectivity",
          "Copper and fiber selected for the distances, equipment and needs of your operation.",
        ],
        [
          "Organization for easier maintenance",
          "Panels, racks and managers that help identify connections and simplify service.",
        ],
        [
          "A foundation for growth",
          "Space and cable routes planned around the future expansion of your project.",
        ],
      ];
  const industries = es
    ? [
        {
          id: "corporativo",
          name: "Corporativos",
          title:
            "Conecte a su equipo, desde el puesto de trabajo hasta el rack.",
          description:
            "Integramos puntos de red, espacios de telecomunicaciones y enlaces entre áreas para acompañar la operación de sus oficinas.",
          items: [
            "Cableado estructurado para voz y datos",
            "Racks y distribución de conexiones",
            "Rutas organizadas para mantenimiento",
          ],
          image: "/images/solutions/smart-building-iamet.png",
        },
        {
          id: "industria",
          name: "Industria y logística",
          title: "Infraestructura que conecta los espacios de su operación.",
          description:
            "Definimos la conectividad entre oficinas, almacenes y áreas operativas considerando distancias, recorridos y condiciones de instalación.",
          items: [
            "Enlaces de fibra óptica entre áreas",
            "Distribución de cobre para puntos de red",
            "Organización de cuartos de telecomunicaciones",
          ],
          image: "/images/solutions/rfid-traceability-iamet.png",
        },
        {
          id: "data-center",
          name: "Data Center",
          title: "Alta densidad con acceso y organización.",
          description:
            "Integramos la conectividad física de su centro de datos con paneles angulados, patch cords delgados y distribución de fibra óptica.",
          items: [
            "Paneles y patch cords de alta densidad",
            "Charolas y paneles de fibra óptica",
            "Racks y organización de cableado",
          ],
          image: "/images/solutions/panduit-high-density-cinematic.png",
        },
      ]
    : [
        {
          id: "corporativo",
          name: "Corporate",
          title: "Connect your team, from the workspace to the rack.",
          description:
            "We integrate network outlets, telecommunications spaces and links between areas for office operations.",
          items: [
            "Structured cabling for voice and data",
            "Racks and connection distribution",
            "Organized routes for maintenance",
          ],
          image: "/images/solutions/smart-building-iamet.png",
        },
        {
          id: "industria",
          name: "Industry and logistics",
          title: "Infrastructure connecting your operation.",
          description:
            "Connectivity between offices, warehouses and operating areas, considering distances, routes and installation conditions.",
          items: [
            "Fiber links between areas",
            "Copper network distribution",
            "Organized telecommunications rooms",
          ],
          image: "/images/solutions/rfid-traceability-iamet.png",
        },
        {
          id: "data-center",
          name: "Data Center",
          title: "High density with access and organization.",
          description:
            "Physical data center connectivity with angled panels, slim patch cords and fiber distribution.",
          items: [
            "High-density panels and patch cords",
            "Fiber trays and adapter panels",
            "Racks and cable management",
          ],
          image: "/images/solutions/panduit-high-density-cinematic.png",
        },
      ];
  const icons = [Cable, Network, Layers];
  return (
    <>
      <section className="bg-[#061524] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1250px]">
          <div className="mx-auto max-w-[800px] text-center">
            <p className="text-xs font-bold uppercase tracking-[.22em] text-blue-400">
              {es
                ? "El valor de una infraestructura integrada"
                : "The value of integrated infrastructure"}
            </p>
            <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              {es
                ? "Más que conexiones. La base de su operación."
                : "More than connections. Your operational foundation."}
            </h2>
            <p className="mt-6 leading-8 text-slate-300">
              {es
                ? "Una solución de infraestructura empieza por entender lo que necesita conectar, cómo se administra y hacia dónde debe crecer."
                : "An infrastructure solution starts with what you need to connect, how it is managed and how it needs to grow."}
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {benefits.map(([title, description], i) => {
              const Icon = icons[i];
              return (
                <article
                  key={title}
                  className="rounded-2xl border border-blue-300/15 bg-[#10283d] p-8"
                >
                  <Icon className="mb-6 text-blue-400" size={30} />
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    {description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      <section className="bg-[#0b1c2c] px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1250px]">
          <h2 className="mx-auto max-w-[800px] text-center text-3xl font-bold text-white sm:text-4xl">
            {es
              ? "Una infraestructura para cada entorno."
              : "Infrastructure for every environment."}
          </h2>
          <nav
            aria-label={
              es ? "Aplicaciones por industria" : "Industry applications"
            }
            className="my-10 flex flex-wrap justify-center gap-3"
          >
            {industries.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="rounded-full border border-blue-400/40 px-6 py-3 text-sm font-semibold text-blue-200 transition hover:bg-blue-600 hover:text-white"
              >
                {item.name}
              </a>
            ))}
          </nav>
          <div className="space-y-12">
            {industries.map((item, i) => (
              <article
                id={item.id}
                key={item.id}
                className="grid scroll-mt-28 overflow-hidden rounded-2xl border border-blue-300/15 lg:grid-cols-2"
              >
                <div
                  className={`min-h-[260px] lg:min-h-[420px] ${i % 2 ? "lg:order-2" : ""}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full max-h-[480px] w-full object-cover object-right"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col justify-center bg-[#10283d] p-7 sm:p-10">
                  <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-400">
                    {item.name}
                  </p>
                  <h3 className="mt-4 text-2xl font-bold leading-tight text-white">
                    {item.title}
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-slate-300">
                    {item.description}
                  </p>
                  <ul className="my-6 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
                    {item.items.map(text => (
                      <li key={text}>{text}</li>
                    ))}
                  </ul>
                  <a
                    href="#solicitar"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:underline"
                  >
                    {es ? "Hablar sobre mi proyecto" : "Discuss my project"}
                    <ArrowRight size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

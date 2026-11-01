import { Link } from "wouter";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CablingHeroV2,
  CablingWhatsappV2,
  CablingPrivacyV2,
} from "@/components/v2/CablingCampaignV2";
import { useServiceMetadata } from "@/components/v2/ServiceConversionV2";

export default function StructuredCablingV2() {
  const { language } = useLanguage();
  const es = language === "es";
  const t = (spanish: string, english: string) => (es ? spanish : english);
  useServiceMetadata(
    t(
      "Instalación de cableado estructurado Panduit",
      "Panduit structured cabling installation"
    ),
    t(
      "Diseño, instalación y certificación de cableado estructurado y fibra óptica. Integrador certificado Panduit en Tijuana, Mexicali, Tecate y Ensenada.",
      "Structured cabling and fiber optic design, installation and testing. Certified Panduit integrator serving Tijuana, Mexicali, Tecate and Ensenada."
    )
  );
  const services = es
    ? [
        [
          "Cableado estructurado",
          "Diseño e instalación de enlaces de cobre Cat 6 y Cat 6A según los requerimientos de su red y sus aplicaciones.",
        ],
        [
          "Fibra óptica",
          "Diseño e instalación de enlaces ópticos para conectar edificios, cuartos de telecomunicaciones y equipos.",
        ],
        [
          "Canalizaciones y racks",
          "Ductería, escalerilla tipo malla, organización y distribución de conexiones para facilitar futuras intervenciones.",
        ],
        [
          "Certificación y diagnóstico",
          "Pruebas de cableado con equipo Fluke Networks, identificación de fallas y reportes según el alcance contratado.",
        ],
        [
          "Diseño de Data Center y DCIM",
          "Planeación de infraestructura física y evaluación de herramientas para documentar y administrar sus activos y conexiones.",
        ],
        [
          "Mantenimiento",
          "Revisión, ordenamiento y actualización de la infraestructura existente con un alcance definido para su operación.",
        ],
      ]
    : [
        [
          "Structured cabling",
          "Design and installation of Cat 6 and Cat 6A copper links based on network and application requirements.",
        ],
        [
          "Fiber optics",
          "Design and installation of fiber links connecting buildings, telecommunications rooms and equipment.",
        ],
        [
          "Pathways and racks",
          "Conduit, wire mesh trays and connection management that make future service easier.",
        ],
        [
          "Testing and diagnostics",
          "Cabling tests with Fluke Networks equipment, fault identification and reports within the agreed scope.",
        ],
        [
          "Data Center design and DCIM",
          "Physical infrastructure planning and evaluation of tools to document and manage assets and connections.",
        ],
        [
          "Maintenance",
          "Review, organization and updates to existing infrastructure with a scope tailored to your operation.",
        ],
      ];
  const faqs = es
    ? [
        [
          "¿Instalan redes nuevas o también corrigen instalaciones existentes?",
          "Podemos evaluar ambos casos: nuevas instalaciones, ampliaciones, reubicaciones y diagnóstico de enlaces existentes. La propuesta se define después de revisar su necesidad.",
        ],
        [
          "¿Qué necesitan para cotizar?",
          "La ciudad, tipo de instalación, cantidad aproximada de puntos o enlaces, planos disponibles y fecha requerida. Si aún no cuenta con estos datos, comenzamos con una revisión del proyecto.",
        ],
        [
          "¿Cuál es la diferencia entre pruebas Fluke y garantía Panduit?",
          "Las pruebas con equipo Fluke Networks verifican el desempeño de los enlaces bajo los parámetros definidos. La garantía de sistema Panduit es un proceso distinto, sujeto a elegibilidad, componentes, instalación y requisitos del programa. Su aplicación se confirma en la propuesta.",
        ],
        [
          "¿Entregan documentación?",
          "Definimos en la propuesta la identificación de puntos, planos, relación de enlaces y reportes de pruebas que recibirá. Así conocerá los entregables antes de contratar.",
        ],
        [
          "¿Cuánto cuesta y cuánto tarda?",
          "Depende del número de enlaces, distancias, categoría, canalizaciones, condiciones del inmueble y ventanas de trabajo. Presentamos alcance, costo y calendario después de evaluar estos factores.",
        ],
      ]
    : [
        [
          "Do you install new networks and repair existing ones?",
          "We can assess new installations, expansions, relocations and existing link diagnostics. The proposal follows a review of your needs.",
        ],
        [
          "What do you need for a quote?",
          "City, site type, approximate number of outlets or links, available plans and target date. If these details are not available, we start with a project review.",
        ],
        [
          "Are Fluke tests the same as a Panduit warranty?",
          "Fluke Networks equipment tests link performance against defined parameters. A Panduit system warranty is a separate process subject to eligibility, components, installation and program requirements. Applicability is confirmed in the proposal.",
        ],
        [
          "Do you provide documentation?",
          "The proposal specifies outlet identification, plans, link lists and test reports included in your project.",
        ],
        [
          "How much does it cost and how long does it take?",
          "This depends on link counts, distances, category, pathways, site conditions and work windows. Scope, cost and schedule follow an assessment.",
        ],
      ];
  return (
    <div className="iamet-reference-home bg-[#f4f7fb] text-slate-900">
      <CablingHeroV2 />
      <section
        aria-label={t("Respaldo técnico", "Technical credentials")}
        className="border-y border-white/10 bg-[#0b1b2b] px-5 py-7 sm:px-8"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <img
            src="/partners/panduit-one-silver-partner.png"
            width="140"
            height="76"
            alt="Panduit ONE Silver Partner 2025"
            className="w-[140px] rounded-lg p-3"
            style={{ background: "white" }}
          />
          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "Materiales, instalación y pruebas con un alcance claro",
                "Materials, installation and testing with a clear scope"
              )}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {t(
                "Componentes seleccionados para su aplicación y entregables acordados antes de iniciar.",
                "Components selected for your application, with deliverables agreed before work begins."
              )}
            </p>
          </div>
        </div>
      </section>
      <section id="servicios" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
          {t("Del diseño al mantenimiento", "From design to maintenance")}
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold sm:text-4xl">
          {t(
            "Instalación de cableado estructurado Panduit en Baja California",
            "Panduit structured cabling installation in Baja California"
          )}
        </h2>
        <p className="mt-5 max-w-3xl leading-7 text-slate-600">
          {t(
            "Cuando su red crece sin orden, diagnosticar una falla o agregar equipos se vuelve más difícil. Integramos conectividad, rutas e identificación de enlaces para que su infraestructura sea más fácil de administrar.",
            "When a network grows without organization, troubleshooting and adding equipment becomes harder. We integrate connectivity, pathways and link identification to make infrastructure easier to manage."
          )}
        </p>
        <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {services.map(([title, body]) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-6"
            >
              <CheckCircle2 className="text-blue-600" size={23} />
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-[#081627] px-5 py-16 text-white sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-300">
              {t(
                "Componentes seleccionados para su proyecto",
                "Components selected for your project"
              )}
            </p>
            <h2 className="mt-4 text-3xl font-bold">
              {t(
                "Conectividad Panduit, con un alcance claro.",
                "Panduit connectivity with a clear scope."
              )}
            </h2>
            <p className="mt-5 leading-7 text-slate-300">
              {t(
                "Seleccionamos cableado, conectores y organización según capacidad, espacio y crecimiento previsto. Antes de iniciar, acordamos materiales, actividades, pruebas y documentación.",
                "We select cabling, connectors and management based on capacity, space and planned growth. Materials, work, tests and documentation are agreed before installation."
              )}
            </p>
            <a
              href="#solicitar"
              className="mt-6 inline-flex items-center gap-2 font-semibold text-blue-300"
            >
              {t("Revisar mi proyecto", "Review my project")}
              <ArrowRight size={18} />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              [
                "angled-panel.jpg",
                t("Conectividad de cobre", "Copper connectivity"),
              ],
              [
                "fmt1-fiber-tray.jpg",
                t("Distribución de fibra óptica", "Fiber optic distribution"),
              ],
            ].map(([img, label]) => (
              <figure
                key={img}
                className="rounded-2xl bg-white p-4 text-slate-800"
              >
                <img
                  loading="lazy"
                  width="300"
                  height="220"
                  className="h-44 w-full object-contain"
                  src={`/products/panduit/${img}`}
                  alt={label}
                />
                <figcaption className="mt-3 text-sm font-semibold">
                  {label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <h2 className="text-3xl font-bold">
          {t("Así comienza su proyecto", "How your project begins")}
        </h2>
        <div className="mt-8 grid gap-7 md:grid-cols-3">
          {(es
            ? [
                [
                  "01 · Diagnóstico y levantamiento",
                  "Revisamos su necesidad y definimos si se requiere una visita técnica para conocer las condiciones de instalación.",
                ],
                [
                  "02 · Propuesta técnica y económica",
                  "Presentamos actividades, materiales, pruebas, entregables y condiciones para que decida con claridad.",
                ],
                [
                  "03 · Instalación y puesta en marcha",
                  "Con la propuesta aprobada, coordinamos los trabajos con su operación y validamos los enlaces según el alcance contratado.",
                ],
              ]
            : [
                [
                  "01 · Assessment and site review",
                  "We review your needs and determine whether a site visit is required to assess installation conditions.",
                ],
                [
                  "02 · Technical and commercial proposal",
                  "We present work, materials, tests, deliverables and conditions so you can make an informed decision.",
                ],
                [
                  "03 · Installation and commissioning",
                  "After proposal approval, we coordinate work with your operation and validate links within the agreed scope.",
                ],
              ]
          ).map(([title, body]) => (
            <div key={title} className="border-t-2 border-blue-600 pt-5">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{body}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <h2 className="mb-7 text-3xl font-bold">
          {t("Resolvemos sus dudas", "Your questions answered")}
        </h2>
        {faqs.map(([q, a]) => (
          <details key={q} className="border-b border-slate-200 py-5">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-4 text-sm leading-7 text-slate-600">{a}</p>
          </details>
        ))}
      </section>
      <section className="border-t border-white/10 bg-[#0b1b2b] px-5 py-14 text-center sm:px-8">
        <h2 className="text-3xl font-bold">
          {t(
            "Prepare la conectividad de su próximo proyecto",
            "Plan connectivity for your next project"
          )}
        </h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-300">
          {t(
            "Revisemos su red nueva, ampliación o renovación. Definimos el alcance antes de proponer una solución.",
            "Let us review your new network, expansion or upgrade and define the scope before proposing a solution."
          )}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-4 sm:flex-row">
          <a
            href="#solicitar"
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
          >
            {t("Solicitar asesoría para mi proyecto", "Request project advice")}
            <ArrowRight size={18} />
          </a>
          <CablingWhatsappV2 />
        </div>
      </section>
      <CablingPrivacyV2 />
      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-400">
        <p>IAMET · {t("Integración tecnológica", "Technology integration")}</p>
        <p className="mt-3">WhatsApp: +52 664 331 4515</p>
        <div className="mt-4 flex flex-wrap justify-center gap-6">
          <a
            href="#aviso-privacidad"
            onClick={() => {
              const notice = document.getElementById("aviso-privacidad");
              if (notice instanceof HTMLDetailsElement) notice.open = true;
            }}
          >
            {t("Aviso sobre sus datos", "Your contact data")}
          </a>
          <Link href="/nosotros">{t("Conocer IAMET", "About IAMET")}</Link>
        </div>
        <p className="mt-4 text-xs">
          © {new Date().getFullYear()} IAMET.{" "}
          {t("Todos los derechos reservados.", "All rights reserved.")}
        </p>
      </footer>
    </div>
  );
}

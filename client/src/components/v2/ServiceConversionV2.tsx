import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import LeadForm from "@/components/LeadForm";
import { useAttribution } from "@/hooks/useAttribution";
import { useLanguage } from "@/contexts/LanguageContext";

export function useServiceMetadata(name: string, description: string) {
  useAttribution();
  useEffect(() => {
    const previousTitle = document.title;
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const previousDescription = meta?.content;
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    document.title = `${name} | IAMET`;
    meta.content = description;
    return () => {
      document.title = previousTitle;
      if (created) meta?.remove();
      else if (meta) meta.content = previousDescription ?? "";
    };
  }, [name, description]);
}

export default function ServiceConversionV2({
  slug,
  name,
  capabilities,
  context,
}: {
  slug: string;
  name: string;
  capabilities: string[];
  context?: string;
}) {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <>
      <section
        id="alcance"
        className="mx-auto max-w-[1344px] px-5 py-16 sm:px-8"
      >
        <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-500">
          {es
            ? "Una solución para su operación"
            : "A solution for your operation"}
        </p>
        <h2 className="mt-4 text-3xl font-bold">
          {es
            ? `¿Qué integramos en ${name.toLowerCase()}?`
            : `What we integrate in ${name}`}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(item => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-xl border border-blue-400/20 p-5"
            >
              <CheckCircle2 className="shrink-0 text-blue-500" size={20} />
              <span>{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-8 border-t border-blue-400/20 pt-8 md:grid-cols-3">
          {(es
            ? [
                [
                  "01 · Entendemos su necesidad",
                  "Revisamos su operación, instalaciones y objetivos para definir el alcance.",
                ],
                [
                  "02 · Diseñamos e integramos",
                  "Seleccionamos los componentes e integramos la solución según su proyecto.",
                ],
                [
                  "03 · Acompañamos la puesta en marcha",
                  "Validamos el funcionamiento y definimos las necesidades de soporte y mantenimiento.",
                ],
              ]
            : [
                [
                  "01 · Understand your needs",
                  "We review your operation, facilities and goals to define the scope.",
                ],
                [
                  "02 · Design and integrate",
                  "We select components and integrate the solution for your project.",
                ],
                [
                  "03 · Support commissioning",
                  "We validate operation and define support and maintenance needs.",
                ],
              ]
          ).map(([title, desc]) => (
            <div key={title}>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section
        id="solicitar"
        className="scroll-mt-24 border-y border-blue-400/20 bg-[#071a2c] px-5 py-16 sm:px-8"
      >
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-blue-400">
              {name}
            </p>
            <h2 className="mt-4 text-3xl font-bold text-white">
              {es
                ? "Solicite una propuesta para su proyecto."
                : "Request a proposal for your project."}
            </h2>
            <p className="mt-5 leading-8 text-slate-300">
              {es
                ? "Comparta sus datos y lo que necesita resolver. Nuestro equipo revisará el requerimiento para definir el siguiente paso con usted."
                : "Share your details and requirements. Our team will review your request and define the next step with you."}
            </p>
            <p className="mt-6 text-sm text-slate-400">
              {es ? "Contacto directo:" : "Direct contact:"}{" "}
              <a
                className="text-blue-300 underline"
                href="mailto:contacto@iamet.mx"
              >
                contacto@iamet.mx
              </a>
            </p>
          </div>
          <LeadForm
            verticalSlug={slug}
            context={context}
            source="form"
            compact
          />
        </div>
      </section>
      <section className="mx-auto max-w-[1000px] px-5 py-16">
        <h2 className="mb-7 text-2xl font-bold">
          {es ? "Antes de comenzar" : "Before getting started"}
        </h2>
        {(es
          ? [
              [
                "¿Qué información necesitan para cotizar?",
                "El tipo de instalación, ubicación, alcance aproximado y la necesidad que desea resolver. Si todavía no tiene todos los datos, podemos empezar por revisar su caso.",
              ],
              [
                "¿Pueden integrar una instalación existente?",
                "Revisamos los equipos y las condiciones actuales para determinar compatibilidad, alcance y posibles etapas de implementación.",
              ],
              [
                "¿El proyecto puede realizarse por etapas?",
                "El alcance, los tiempos y las etapas se definen durante la revisión de su requerimiento.",
              ],
            ]
          : [
              [
                "What information is needed for a quote?",
                "Facility type, location, approximate scope and the need you want to address. We can start by reviewing your case.",
              ],
              [
                "Can you integrate an existing installation?",
                "We review current equipment and conditions to determine compatibility, scope and implementation stages.",
              ],
              [
                "Can the project be delivered in phases?",
                "Scope, schedule and phases are defined when reviewing your requirements.",
              ],
            ]
        ).map(([q, a]) => (
          <details key={q} className="border-b border-blue-400/20 py-5">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-4 text-sm leading-7 text-slate-400">{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}

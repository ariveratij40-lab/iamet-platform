import { CheckCircle2, ArrowRight, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import LeadForm from "@/components/LeadForm";
import { infrastructureBanner } from "@shared/banner-images";

export const cablingThanksPath = "/soluciones/cableado-estructurado/gracias";
export const cablingReceiptKey = "iamet-cabling-receipt";
export const cablingWhatsapp =
  "https://wa.me/526643314515?text=" +
  encodeURIComponent(
    "Hola, me interesa cotizar cableado estructurado Panduit y fibra óptica para mi empresa. Mi proyecto está en: "
  );

export function CablingWhatsappV2() {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  return (
    <a
      href={cablingWhatsapp}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackEvent("cta_clicked", {
          action: "click_whatsapp",
          vertical: "infraestructura",
          landing: "cableado-estructurado",
        })
      }
      className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-5 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-400/20"
    >
      <MessageCircle size={20} />
      {language === "es"
        ? "Hablar por WhatsApp con Ventas"
        : "Contact Sales on WhatsApp"}
    </a>
  );
}

export function CablingHeroV2() {
  const { language } = useLanguage();
  const es = language === "es";
  return (
    <section className="relative isolate overflow-hidden bg-[#061321] text-white">
      <img
        {...infrastructureBanner}
        sizes="100vw"
        alt=""
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-right"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#03101d]/95 via-[#03101d]/90 to-[#03101d]/75" />
      <div className="mx-auto grid max-w-[1344px] items-center gap-8 px-5 py-10 sm:px-8 sm:py-12 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-300">
            {es
              ? "CONECTIVIDAD PARA EMPRESAS E INDUSTRIA"
              : "CONNECTIVITY FOR BUSINESS AND INDUSTRY"}
          </p>
          <h1 className="mt-4 max-w-2xl text-[2rem] font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {es
              ? "Instalación de cableado estructurado Panduit"
              : "Panduit structured cabling installation"}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-200 sm:text-lg">
            {es
              ? "Diseño, instalación y pruebas de su red de cobre y fibra óptica. Una infraestructura ordenada, documentada y preparada para crecer."
              : "Copper and fiber network design, installation and testing. Organized, documented infrastructure built for growth."}
          </p>
          <p className="mt-4 text-sm font-semibold leading-6 text-blue-200">
            Tijuana · Mexicali · Tecate · Ensenada
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-200">
            {(es
              ? [
                  "Integradores certificados Panduit",
                  "Pruebas con equipo Fluke Networks",
                  "Alcance y entregables definidos en su propuesta",
                ]
              : [
                  "Certified Panduit integrators",
                  "Testing with Fluke Networks equipment",
                  "Scope and deliverables defined in your proposal",
                ]
            ).map(item => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 size={19} className="shrink-0 text-blue-400" />
                {item}
              </li>
            ))}
          </ul>
          <a
            href="#solicitar"
            className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-500 lg:hidden"
          >
            {es ? "Solicitar cotización" : "Request a quote"}
            <ArrowRight size={18} />
          </a>
        </div>
        <div
          id="solicitar"
          className="scroll-mt-24 rounded-2xl border border-blue-200/20 bg-[#0b2032]/95 p-5 shadow-2xl sm:p-7"
        >
          <h2 className="text-2xl font-bold">
            {es ? "Cotice su proyecto" : "Request your project quote"}
          </h2>
          <p className="mb-5 mt-2 text-sm leading-6 text-slate-300">
            {es
              ? "Cuéntenos qué necesita. Un especialista revisará su solicitud. No necesita crear una cuenta."
              : "Tell us what you need. A specialist will review your request. No account required."}
          </p>
          <LeadForm
            compact
            hideBusinessDetails
            verticalSlug="infraestructura"
            source="form"
            context="Servicio solicitado: cableado estructurado y fibra óptica Panduit. Landing: /soluciones/cableado-estructurado."
            submitLabel={es ? "Solicitar cotización" : "Request a quote"}
            problemLabel={es ? "Su proyecto" : "Your project"}
            problemPlaceholder={
              es
                ? "Ciudad, puntos aproximados y lo que necesita…"
                : "City, approximate outlets and requirements…"
            }
            errorContact="WhatsApp +52 664 331 4515"
            privacyHref="#aviso-privacidad"
            onSuccess={() => {
              try {
                sessionStorage.setItem(cablingReceiptKey, String(Date.now()));
              } catch {
                /* Receipt view remains optional if storage is unavailable. */
              }
              window.location.assign(cablingThanksPath);
            }}
          />
        </div>
      </div>
    </section>
  );
}

export function CablingPrivacyV2() {
  return (
    <details
      id="aviso-privacidad"
      className="mx-auto max-w-6xl scroll-mt-24 border-t border-slate-700 px-5 py-7 text-sm leading-7 text-slate-300 sm:px-8"
    >
      <summary className="cursor-pointer font-semibold text-white">
        Aviso sobre sus datos de contacto
      </summary>
      <p className="mt-4">
        IAMET utiliza los datos que usted proporciona —nombre, empresa, correo,
        teléfono y descripción del proyecto— para revisar su solicitud, preparar
        su cotización y darle seguimiento comercial en su CRM. Evite incluir
        contraseñas u otra información sensible en el requerimiento.
      </p>
      <p className="mt-3">
        Para consultar el tratamiento de sus datos o solicitar su corrección o
        eliminación, contacte a IAMET en el +52 664 331 4515. El envío de esta
        solicitud no implica una suscripción a comunicaciones promocionales.
      </p>
    </details>
  );
}

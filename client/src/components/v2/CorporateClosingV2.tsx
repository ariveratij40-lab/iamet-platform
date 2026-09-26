import { Link } from "wouter";
import {
  ArrowRight,
  Mail,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CorporateClosingV2() {
  const { language } = useLanguage();
  const es = language === "es";

  return (
    <section className="relative overflow-hidden bg-slate-950 px-5 py-16 text-white sm:py-20 lg:px-8 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 82% 24%, rgba(37,99,235,.28), transparent 30%), radial-gradient(circle at 18% 90%, rgba(14,165,233,.14), transparent 28%)",
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative mx-auto max-w-[1440px]">
        <div className="grid items-end gap-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-20">
          <div className="max-w-[820px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-400/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.17em] text-blue-300">
              <Sparkles className="h-3.5 w-3.5" />
              {es ? "Hablemos de su proyecto" : "Let's talk about your project"}
            </div>

            <h2 className="mt-6 max-w-[800px] text-[2.35rem] font-bold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl lg:text-6xl">
              {es ? (
                <>
                  La tecnología debe resolver su operación,{" "}
                  <span className="text-blue-400">no complicarla.</span>
                </>
              ) : (
                <>
                  Technology should solve your operation,{" "}
                  <span className="text-blue-400">not complicate it.</span>
                </>
              )}
            </h2>

            <p className="mt-6 max-w-[690px] text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              {es
                ? "Cuéntenos qué necesita lograr. Nuestro equipo puede ayudarle a definir el siguiente paso y la tecnología adecuada para su operación."
                : "Tell us what you need to accomplish. Our team can help define the next step and the right technology for your operation."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(37,99,235,.28)] transition-transform hover:-translate-y-0.5"
              >
                {es ? "Hablar con un especialista" : "Talk to a specialist"}
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/tech-advisor"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/[0.10]"
              >
                <MessageCircle className="h-4 w-4 text-blue-300" />
                {es ? "No sé por dónde empezar" : "I don't know where to start"}
              </Link>
            </div>
          </div>

          <div className="lg:flex lg:justify-end">
            <div className="w-full max-w-[420px] border-t border-white/10 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                {es ? "Contacto directo" : "Direct contact"}
              </p>

              <a
                href="mailto:contacto@iamet.mx"
                className="mt-4 inline-flex items-center gap-3 text-base font-semibold text-white transition-colors hover:text-blue-300"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] text-blue-300">
                  <Mail className="h-4 w-4" />
                </span>
                contacto@iamet.mx
              </a>

              <p className="mt-7 max-w-[360px] text-sm leading-6 text-slate-400">
                {es
                  ? "Si ya conoce el alcance de su proyecto, nuestro equipo puede revisar su necesidad y dirigirla con el especialista adecuado."
                  : "If you already know the scope of your project, our team can review your needs and connect you with the appropriate specialist."}
              </p>

              <div className="mt-8 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  IAMET · Evolución tecnológica
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

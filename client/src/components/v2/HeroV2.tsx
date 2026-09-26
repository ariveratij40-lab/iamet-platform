import { Link } from "wouter";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";
import TechnologyFabricV2 from "./TechnologyFabricV2";

export default function HeroV2() {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const es = language === "es";

  return (
    <section className="iamet-v2-canvas relative overflow-hidden">
      <div className="iamet-v2-dot-grid pointer-events-none absolute inset-0 opacity-[0.30]" />

      <div className="relative mx-auto grid min-h-[690px] max-w-[1440px] items-center gap-10 px-5 py-12 md:py-16 lg:grid-cols-[1.12fr_.88fr] lg:gap-14 lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-[720px]"
        >
          <div
            className="iamet-v2-eyebrow mb-5 inline-flex lg:mb-7 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <>
              <span className="sm:hidden">
                {es ? "Integrador tecnológico" : "Technology integrator"}
              </span>
              <span className="hidden sm:inline">
                {es
                  ? "Empresa integradora de soluciones tecnológicas"
                  : "Technology solutions integrator"}
              </span>
            </>
          </div>

          <h1
            className="iamet-v2-display max-w-[790px] text-[clamp(2.25rem,10vw,4.2rem)] font-bold leading-[0.94] tracking-[-0.045em] sm:text-[clamp(2.55rem,9vw,4.2rem)] lg:text-[clamp(3rem,5.35vw,5.25rem)] lg:leading-[0.95]"
            style={{ color: "#101828" }}
          >
            {es ? (
              <>
                Integramos{" "}
                <span style={{ color: "#1264d8" }}>tecnología</span>
                <br />
                para que su empresa opere mejor.
              </>
            ) : (
              <>
                We integrate{" "}
                <span style={{ color: "#1264d8" }}>technology</span>
                <br />
                for your business.
              </>
            )}
          </h1>

          <p
            className="iamet-v2-copy mt-5 max-w-[650px] text-[15px] leading-6 sm:mt-6 sm:text-lg sm:leading-8 lg:mt-8 lg:text-xl"
          >
            {es
              ? "Infraestructura de red, seguridad CCTV, control de acceso, RFID, energía, desarrollo de aplicaciones e inteligencia artificial. Desde el diseño y suministro hasta la instalación, puesta en marcha, mantenimiento y soporte."
              : "Network infrastructure, CCTV security, access control, RFID, power, application development and artificial intelligence — from design and supply through installation, commissioning, maintenance and support."}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:mt-9">
            <a
              href="#soluciones-v2"
              onClick={() =>
                trackEvent("cta_clicked", {
                  location: "hero_v2",
                  action: "explore_solutions",
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
              style={{
                background: "#1264d8",
                color: "#fff",
                boxShadow: "0 14px 32px rgba(18,100,216,.20)",
              }}
            >
              {es ? "Explorar soluciones" : "Explore solutions"}
              <ArrowRight className="h-4 w-4" />
            </a>


          </div>

          <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2.5 lg:mt-11 lg:gap-x-7 lg:gap-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              {es ? "Tecnologías líderes" : "Leading technologies"}
            </span>
            {["Panduit", "Avigilon", "Genetec", "Zebra", "APC"].map(brand => (
              <span
                key={brand}
                className="text-sm font-semibold tracking-tight"
                style={{ color: "#667085" }}
              >
                {brand}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97, x: 18 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.72, delay: 0.08 }}
          className="relative mx-auto w-full max-w-[650px]"
        >
          <TechnologyFabricV2 />
        </motion.div>
      </div>
    </section>
  );
}

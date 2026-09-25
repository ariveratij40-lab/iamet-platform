import { Link } from "wouter";
import { ArrowRight, MessageCircle, RadioTower, Server, ShieldCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function HeroV2() {
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const es = language === "es";

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #ffffff 0%, #f7faff 48%, #edf5ff 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(37,99,235,.18) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative mx-auto grid min-h-[690px] max-w-[1440px] items-center gap-14 px-5 py-20 lg:grid-cols-[1.03fr_.97fr] lg:px-8 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-[720px]"
        >
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{
              color: "#2563eb",
              borderColor: "rgba(37,99,235,.16)",
              background: "rgba(37,99,235,.055)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {es
              ? "Empresa integradora de soluciones tecnológicas"
              : "Technology solutions integrator"}
          </div>

          <h1
            className="max-w-[760px] text-[clamp(3rem,6vw,5.9rem)] font-bold leading-[0.96] tracking-[-0.055em]"
            style={{ color: "#101828" }}
          >
            {es ? (
              <>
                Integramos{" "}
                <span style={{ color: "#1264d8" }}>tecnología</span>
                <br />
                para su empresa.
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
            className="mt-8 max-w-[650px] text-lg leading-8 lg:text-xl"
            style={{ color: "#526071" }}
          >
            {es
              ? "Infraestructura de red, seguridad CCTV, control de acceso, RFID, energía, desarrollo de aplicaciones e inteligencia artificial. Desde el diseño y suministro hasta la instalación, puesta en marcha, mantenimiento y soporte."
              : "Network infrastructure, CCTV security, access control, RFID, power, application development and artificial intelligence — from design and supply through installation, commissioning, maintenance and support."}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
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

            <Link
              href="/tech-advisor"
              onClick={() =>
                trackEvent("cta_clicked", {
                  location: "hero_v2",
                  action: "open_aria",
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-6 py-3.5 text-sm font-semibold"
              style={{
                borderColor: "#d4deea",
                background: "rgba(255,255,255,.82)",
                color: "#172033",
              }}
            >
              <MessageCircle className="h-4 w-4 text-[#1264d8]" />
              {es ? "Consultar con ARIA" : "Ask ARIA"}
            </Link>
          </div>

          <div className="mt-11 flex flex-wrap items-center gap-x-7 gap-y-3">
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
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="relative mx-auto w-full max-w-[650px]"
        >
          <div
            className="relative aspect-[1.05/1] overflow-hidden rounded-[32px] border"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,.98), rgba(238,246,255,.96))",
              borderColor: "rgba(45,108,223,.14)",
              boxShadow: "0 35px 90px rgba(38,83,145,.15)",
            }}
          >
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(18,100,216,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(18,100,216,.06) 1px, transparent 1px)",
                backgroundSize: "42px 42px",
              }}
            />

            <div className="absolute left-8 top-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                {es ? "ECOSISTEMA TECNOLÓGICO IAMET" : "IAMET TECHNOLOGY ECOSYSTEM"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {es
                  ? "Soluciones conectadas para una operación inteligente"
                  : "Connected solutions for intelligent operations"}
              </p>
            </div>

            <div className="absolute inset-x-8 bottom-8 top-28">
              <div className="absolute left-[42%] top-[38%] h-32 w-32 rounded-full border border-blue-200 bg-white shadow-xl">
                <div className="flex h-full flex-col items-center justify-center">
                  <Sparkles className="h-7 w-7 text-blue-600" />
                  <span className="mt-2 text-xs font-bold text-slate-800">ARIA / AI</span>
                </div>
              </div>

              {[
                { label: "INFRA", icon: Server, x: "5%", y: "9%" },
                { label: "CCTV", icon: ShieldCheck, x: "69%", y: "5%" },
                { label: es ? "ACCESO" : "ACCESS", icon: ShieldCheck, x: "3%", y: "70%" },
                { label: "RFID", icon: RadioTower, x: "71%", y: "72%" },
              ].map((node, i) => {
                const Icon = node.icon;
                return (
                  <motion.div
                    key={node.label}
                    animate={{ y: [0, -7, 0] }}
                    transition={{
                      duration: 4 + i * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="absolute flex h-24 w-24 flex-col items-center justify-center rounded-2xl border bg-white/90 shadow-lg"
                    style={{
                      left: node.x,
                      top: node.y,
                      borderColor: "rgba(18,100,216,.14)",
                    }}
                  >
                    <Icon className="h-6 w-6 text-blue-600" />
                    <span className="mt-2 text-[10px] font-bold tracking-wider text-slate-500">
                      {node.label}
                    </span>
                  </motion.div>
                );
              })}

              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 600 420"
                preserveAspectRatio="none"
              >
                <g
                  fill="none"
                  stroke="rgba(18,100,216,.25)"
                  strokeWidth="1.5"
                  strokeDasharray="5 7"
                >
                  <path d="M110 90 C210 110, 245 170, 300 205" />
                  <path d="M500 90 C410 110, 360 160, 320 205" />
                  <path d="M110 335 C200 300, 240 250, 300 220" />
                  <path d="M500 335 C410 300, 365 250, 320 220" />
                </g>
              </svg>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

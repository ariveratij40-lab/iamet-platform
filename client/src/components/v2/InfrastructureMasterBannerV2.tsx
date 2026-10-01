import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Network, Server, Cable, PanelsTopLeft } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const capabilities = [
  {
    es: "Data Center",
    en: "Data Center",
    icon: Server,
  },
  {
    es: "Cableado estructurado",
    en: "Structured cabling",
    icon: Network,
  },
  {
    es: "Fibra óptica",
    en: "Fiber optics",
    icon: Cable,
  },
  {
    es: "MDF / IDF",
    en: "MDF / IDF",
    icon: PanelsTopLeft,
  },
];

export default function InfrastructureMasterBannerV2() {
  const { language } = useLanguage();
  const es = language === "es";
  const reduceMotion = useReducedMotion();

  return (
    <article
      className="group relative isolate overflow-hidden rounded-[28px] bg-[#031426] text-white lg:rounded-[34px]"
      aria-label={es ? "Infraestructura física" : "Physical infrastructure"}
    >
      {/* Immersive cinematic video layer */}
      <div className="absolute inset-0">
        {reduceMotion ? (
          <img
            src="/images/solutions/infrastructure-master.png"
            alt=""
            className="h-full w-full object-cover object-[72%_center] sm:object-[68%_center] lg:object-[62%_center]"
          />
        ) : (
          <video
            className="h-full w-full object-cover object-[72%_center] sm:object-[68%_center] lg:object-[62%_center]"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/solutions/infrastructure-master.png"
            aria-hidden="true"
          >
            <source
              src="/videos/infrastructure-master.mp4"
              type="video/mp4"
            />
          </video>
        )}
      </div>

      {/* Contrast architecture */}
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,17,34,.86)_0%,rgba(3,25,49,.72)_35%,rgba(2,17,34,.88)_100%)] lg:bg-none"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(2,17,34,.94) 0%, rgba(3,25,49,.86) 25%, rgba(3,30,59,.58) 41%, rgba(3,26,51,.14) 62%, rgba(2,15,30,.04) 100%)",
        }}
      />

      <div
        className="absolute inset-y-0 left-[32%] hidden w-[25%] -skew-x-[17deg] border-x border-blue-400/20 bg-gradient-to-r from-blue-600/10 via-blue-400/5 to-transparent lg:block"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-[620px] flex-col justify-between px-5 py-6 sm:min-h-[700px] sm:px-8 sm:py-9 lg:min-h-[700px] lg:w-[49%] lg:px-12 lg:py-12 xl:px-14">
        <div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className="h-px w-8 bg-blue-400" />
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-300 sm:text-xs">
              {es ? "Infraestructura física" : "Physical infrastructure"}
            </span>
          </motion.div>

          <motion.h3
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.65, delay: 0.08 }}
            className="mt-4 max-w-[330px] text-[2rem] font-bold leading-[1.02] tracking-[-0.04em] text-white sm:mt-6 sm:max-w-[610px] sm:text-5xl lg:text-[3.65rem]"
          >
            {es ? (
              <>
                La base{" "}
                <span className="text-blue-400">tecnológica</span>
                <br />
                de su operación.
              </>
            ) : (
              <>
                The{" "}
                <span className="text-blue-400">technology foundation</span>
                <br />
                of your operation.
              </>
            )}
          </motion.h3>

          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mt-3 max-w-[325px] text-[13px] leading-[1.55rem] text-white/90 sm:mt-6 sm:max-w-[520px] sm:text-base sm:leading-7 sm:text-white/85"
          >
            {es
              ? "Diseñamos e integramos infraestructura crítica que conecta, protege y prepara su operación para crecer."
              : "We design and integrate critical infrastructure that connects, protects and prepares your operation to grow."}
          </motion.p>
        </div>

        <div>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.45 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4 sm:gap-x-4 sm:gap-y-5 lg:grid-cols-2 xl:grid-cols-4"
          >
            {capabilities.map(item => {
              const Icon = item.icon;

              return (
                <div
                  key={item.es}
                  className="min-w-0 border-l border-white/20 pl-3 first:border-blue-400/80"
                >
                  <Icon className="h-5 w-5 text-blue-400" />
                  <p className="mt-1.5 max-w-[110px] text-[11px] font-semibold leading-4 text-white/90 sm:mt-2 sm:max-w-none sm:text-xs">
                    {es ? item.es : item.en}
                  </p>
                </div>
              );
            })}
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 sm:mt-8"
          >
            <Link
              href="/soluciones/infraestructura"
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(37,99,235,.28)] transition hover:-translate-y-0.5 hover:bg-blue-500 sm:inline-flex sm:w-auto"
            >
              {es ? "Explorar infraestructura" : "Explore infrastructure"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Future carousel contract */}
          <div className="mt-5 flex items-center gap-3 sm:mt-10" aria-label="1 de 6">
            <span className="text-[11px] font-semibold text-white/60">01</span>

            <div className="flex flex-1 gap-2">
              <span className="h-1 flex-[1.8] rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,.8)]" />
              {[2, 3, 4, 5, 6].map(item => (
                <span
                  key={item}
                  className="h-1 flex-1 rounded-full bg-white/18"
                />
              ))}
            </div>

            <span className="text-[11px] font-semibold text-white/40">06</span>
          </div>
        </div>
      </div>
    </article>
  );
}

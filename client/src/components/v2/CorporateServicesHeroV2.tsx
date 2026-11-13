import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Pause, Play, SkipForward,
  Network, Cctv, ShieldCheck, ScanLine,
  Zap, BrainCircuit, Wrench, Monitor
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { solutionDestinations } from "./solutionsData";

type Props = {
  active: boolean;
  onComplete?: () => void;
};

const SCENE_DURATION = 2000;

const scenes = [
  {
    id: "infrastructure",
    image: "/images/solutions/panduit-high-density-cinematic-1672.webp",
    es: "Infraestructura, redes y fibra óptica",
    en: "Infrastructure, networks and fiber optics",
  },
  {
    id: "security",
    image: "/images/solutions/cctv-installation-devops.png",
    es: "Videoseguridad y control de acceso",
    en: "Video security and access control",
  },
  {
    id: "operations",
    image: "/images/solutions/rfid-traceability-devops.png",
    es: "RFID, identificación y energía crítica",
    en: "RFID, identification and critical power",
  },
  {
    id: "computing",
    image: "/images/solutions/computo-licenciamiento.png",
    es: "Cómputo y Licenciamiento",
    en: "Computing & Licensing",
  },
  {
    id: "intelligence",
    image: "/images/solutions/software-dashboards-devops.png",
    es: "Software e inteligencia artificial",
    en: "Software and artificial intelligence",
  },
  {
    id: "integration",
    image: "/images/solutions/smart-building-devops.png",
    es: "Una sola empresa. Todas sus soluciones tecnológicas.",
    en: "One company. All your technology solutions.",
  },
] as const;

const serviceCategories = [
  { icon: Monitor, destination: solutionDestinations["computo-licenciamiento"], es: "Cómputo y Licenciamiento", en: "Computing & Licensing" },
  { icon: Network, destination: solutionDestinations["infraestructura"], es: "Infraestructura y redes", en: "Infrastructure & networks" },
  { icon: Cctv, destination: solutionDestinations["seguridad-cctv"], es: "Videoseguridad CCTV", en: "CCTV security" },
  { icon: ShieldCheck, destination: solutionDestinations["control-acceso"], es: "Control de acceso", en: "Access control" },
  { icon: ScanLine, destination: solutionDestinations["rfid"], es: "RFID e identificación", en: "RFID & identification" },
  { icon: Zap, destination: solutionDestinations["energia"], es: "Energía crítica", en: "Critical power" },
  { icon: BrainCircuit, destination: solutionDestinations["desarrollo-ia"], es: "Software e IA", en: "Software & AI" },
  { icon: Wrench, destination: solutionDestinations["polizas-servicios"], es: "Pólizas y servicios", en: "Managed services" },
] as const;

export default function CorporateServicesHeroV2({
  active,
  onComplete,
}: Props) {
  const { language } = useLanguage();
  const es = language === "es";
  const reduceMotion = useReducedMotion();

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const completionNotified = useRef(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inViewport, setInViewport] = useState(false);

  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || !document.hidden
  );

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        setInViewport(
          entries[0]?.intersectionRatio >= 0.35
        );
      },
      { threshold: [0, 0.35, 1] }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const finish = useCallback(() => {
    if (completionNotified.current) return;
    completionNotified.current = true;
    setCompleted(true);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    const updateVisibility = () => {
      setPageVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (!active || !pageVisible || !inViewport || paused || completed) return;

    if (reduceMotion) {
      setIndex(scenes.length - 1);
      finish();
      return;
    }

    const timer = window.setTimeout(() => {
      if (index === scenes.length - 1) {
        finish();
      } else {
        setIndex(current => current + 1);
      }
    }, SCENE_DURATION);

    return () => window.clearTimeout(timer);
  }, [
    active,
    pageVisible,
    inViewport,
    paused,
    completed,
    index,
    reduceMotion,
    finish,
  ]);

  const skip = () => {
    setIndex(scenes.length - 1);
    finish();
  };

  const scene = scenes[index];

  return (
    <section
      ref={sectionRef}
      aria-label={
        es
          ? "Presentación de servicios IAMET"
          : "IAMET services presentation"
      }
      className="relative isolate flex min-h-[75svh] items-center overflow-hidden bg-[#031426] text-white lg:min-h-[85svh]"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <AnimatePresence mode="wait">
          <motion.img
            key={scene.id}
            src={scene.image}
            alt=""
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.8 }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-[#031426]/95 via-[#031426]/75 to-[#031426]/30" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 py-20 sm:px-10 lg:px-16">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
          IAMET · Ingeniería · Integración · Inteligencia
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            className="max-w-3xl"
          >
            <h2 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {es ? scene.es : scene.en}
            </h2>
          </motion.div>
        </AnimatePresence>

        <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
          {es
            ? "Diseñamos, integramos y mantenemos tecnología para empresas e industria."
            : "We design, integrate and maintain technology for business and industry."}
        </p>

        {completed && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            className="mt-8 grid max-w-4xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
            aria-label={es ? "Especialidades IAMET" : "IAMET specialties"}
          >
            {serviceCategories.map((service, position) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.en}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.35,
                    delay: reduceMotion ? 0 : position * 0.07,
                  }}
                  className="flex min-h-16 items-center gap-3 rounded-xl border border-cyan-300/25 bg-[#071b30]/80 px-3 py-3 shadow-lg shadow-black/20 backdrop-blur-md transition-colors hover:border-cyan-300/60 hover:bg-[#103451]/90"
                >
                  <Link
                    href={service.destination}
                    aria-label={`${es ? "Ver solución" : "View solution"}: ${es ? service.es : service.en}`}
                    className="flex w-full items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                  >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10">
                    <Icon
                      size={19}
                      strokeWidth={1.7}
                      className="text-cyan-300"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="text-xs font-semibold leading-snug text-white sm:text-sm">
                    {es ? service.es : service.en}
                  </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/soluciones"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-500"
          >
            {es ? "Explorar soluciones" : "Explore solutions"}
            <ArrowRight size={18} />
          </Link>

          <Link
            href="/tech-advisor"
            className="inline-flex items-center rounded-lg border border-white/40 px-6 py-3 font-semibold text-white hover:bg-white/10"
          >
            {es ? "Hablar con un ingeniero" : "Talk to an engineer"}
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <div className="flex gap-2" aria-label={es ? "Progreso de la presentación" : "Presentation progress"}>
            {scenes.map((item, position) => (
              <span
                key={item.id}
                className={`h-1 rounded-full transition-all ${
                  position <= index
                    ? "w-9 bg-cyan-400"
                    : "w-5 bg-white/30"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPaused(value => !value)}
            disabled={completed || Boolean(reduceMotion)}
            aria-label={paused ? (es ? "Reanudar" : "Resume") : (es ? "Pausar" : "Pause")}
            className="rounded-lg border border-white/30 p-3 disabled:opacity-40"
          >
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>

          <button
            type="button"
            onClick={skip}
            disabled={completed}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-3 text-sm disabled:opacity-40"
          >
            <SkipForward size={16} />
            {es ? "Omitir" : "Skip"}
          </button>
        </div>
      </div>
    </section>
  );
}

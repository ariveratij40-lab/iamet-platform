import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Pause,
  Play,
  ArrowRight,
  Cable,
  Network,
  PanelsTopLeft,
  Server,
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { solutions, solutionDestinations } from "./solutionsData";

const infrastructureIcons = [Server, Network, Cable, PanelsTopLeft];

export default function InfrastructureMasterBannerV2() {
  const { language } = useLanguage();
  const es = language === "es";
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [autoplayPaused, setAutoplayPaused] = useState(Boolean(reduceMotion));

  useEffect(() => {
    if (hovered || focused || autoplayPaused) return;
    const timer = window.setInterval(() => {
      setIndex(current => (current + 1) % solutions.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [hovered, focused, autoplayPaused]);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const active = solutions[index];
  const infra = index === 0;
  const title = es ? active.titleEs : active.titleEn;
  const label = infra
    ? es
      ? "Infraestructura física"
      : "Physical infrastructure"
    : es
      ? active.es
      : active.en;
  const capabilities = infra
    ? es
      ? ["Data Center", "Cableado estructurado", "Fibra óptica", "MDF / IDF"]
      : ["Data Center", "Structured cabling", "Fiber optics", "MDF / IDF"]
    : (es ? active.capabilitiesEs : active.capabilitiesEn).slice(0, 4);
  const select = (nextIndex: number) => {
    setAutoplayPaused(true);
    setIndex(nextIndex);
  };
  const move = (direction: number) => {
    setAutoplayPaused(true);
    setIndex(
      current => (current + direction + solutions.length) % solutions.length
    );
  };

  return (
    <section
      aria-roledescription={es ? "carrusel" : "carousel"}
      aria-label={
        es ? "Soluciones tecnológicas IAMET" : "IAMET technology solutions"
      }
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false);
        }
      }}
      onKeyDown={event => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      onTouchStart={event => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={event => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
          move(dx < 0 ? 1 : -1);
      }}
      onTouchCancel={() => {
        touchStart.current = null;
      }}
      className="relative isolate overflow-hidden rounded-[28px] bg-[#031426] text-white outline-offset-4 focus-visible:outline-2 focus-visible:outline-blue-500 lg:rounded-[34px]"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <AnimatePresence initial={false}>
          <motion.div
            key={active.id}
            className="absolute inset-0"
            initial={{ opacity: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.35 }}
          >
            {infra && !reduceMotion ? (
              <video
                className="h-full w-full object-cover object-[72%_center] lg:object-[62%_center]"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                poster="/images/solutions/infrastructure-master.png"
              >
                <source
                  src="/videos/infrastructure-master.mp4"
                  type="video/mp4"
                />
              </video>
            ) : (
              <img
                src={
                  infra
                    ? "/images/solutions/infrastructure-master.png"
                    : active.image
                }
                alt=""
                className={`h-full w-full object-cover object-[72%_center] lg:object-[62%_center] ${["seguridad-cctv", "control-acceso"].includes(active.id) && !reduceMotion ? "iamet-cctv-cinematic" : ""}`}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,17,34,.94),rgba(3,25,49,.78),rgba(2,17,34,.94))] lg:bg-[linear-gradient(90deg,rgba(2,17,34,.96)_0%,rgba(3,25,49,.90)_27%,rgba(3,30,59,.65)_45%,rgba(3,26,51,.16)_70%,rgba(2,15,30,.08)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-[32%] hidden w-[25%] -skew-x-[17deg] border-x border-blue-400/20 bg-gradient-to-r from-blue-600/10 via-blue-400/5 to-transparent lg:block"
      />

      <div className="relative z-10 flex min-h-[660px] flex-col justify-between px-5 py-6 sm:min-h-[740px] sm:px-8 sm:py-9 lg:min-h-[760px] lg:px-12 lg:py-12 xl:px-14">
        <div
          role="group"
          aria-roledescription={es ? "diapositiva" : "slide"}
          aria-label={`${index + 1} ${es ? "de" : "of"} ${solutions.length}: ${label}`}
          aria-live={autoplayPaused || hovered || focused ? "polite" : "off"}
          aria-atomic="true"
          className="lg:w-[52%]"
        >
          <motion.div
            key={active.id}
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-8 shrink-0 bg-blue-400" />
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-blue-300 sm:text-xs">
                {label}
              </p>
            </div>
            <h2 className="mt-4 max-w-[610px] text-[2rem] font-bold leading-[1.02] tracking-[-0.04em] text-white sm:mt-6 sm:text-5xl lg:text-[3.4rem]">
              {infra ? (
                es ? (
                  <>
                    La base <span className="text-blue-400">tecnológica</span>
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
                )
              ) : (
                title
              )}
            </h2>
            <p className="mt-4 max-w-[520px] text-sm leading-7 text-white/90 sm:mt-6 sm:text-base">
              {infra
                ? es
                  ? "Diseñamos e integramos infraestructura crítica que conecta, protege y prepara su operación para crecer."
                  : "We design and integrate critical infrastructure that connects, protects and prepares your operation to grow."
                : es
                  ? active.descEs
                  : active.descEn}
            </p>
          </motion.div>
        </div>

        <div className="mt-10">
          <div className="grid max-w-[560px] grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
            {capabilities.map((capability, i) => {
              const Icon = infra ? infrastructureIcons[i] : active.icon;
              return (
                <div
                  key={capability}
                  className="min-w-0 border-l border-white/20 pl-3 first:border-blue-400/80"
                >
                  <Icon className="h-5 w-5 text-blue-400" />
                  <p className="mt-2 text-xs font-semibold leading-5 text-white/90">
                    {capability}
                  </p>
                </div>
              );
            })}
          </div>
          <Link
            href={solutionDestinations[active.id]}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(37,99,235,.28)] transition hover:bg-blue-500 sm:w-auto"
          >
            {infra
              ? es
                ? "Explorar infraestructura"
                : "Explore infrastructure"
              : active.id === "energia"
                ? es
                  ? "Consultar soluciones de energía"
                  : "Ask about power solutions"
                : es
                  ? `Explorar ${active.es.toLowerCase()}`
                  : `Explore ${active.en.toLowerCase()}`}
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>

          <div className="mt-7 flex items-center gap-3 sm:mt-10">
            <span className="text-xs font-semibold tabular-nums text-white/70">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-1 gap-1 sm:gap-2">
              {solutions.map((solution, i) => (
                <button
                  key={solution.id}
                  type="button"
                  aria-label={`${es ? "Ver" : "View"} ${es ? solution.es : solution.en}`}
                  aria-current={index === i ? "true" : undefined}
                  onClick={() => select(i)}
                  className="group flex h-11 min-w-0 flex-1 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-blue-300"
                >
                  <span
                    className={`h-1 w-full rounded-full transition-colors ${index === i ? "bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,.8)]" : "bg-white/25 group-hover:bg-white/60"}`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-semibold text-white/50">
              {String(solutions.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={event => {
                setAutoplayPaused(paused => !paused);
                event.currentTarget.blur();
              }}
              aria-label={
                autoplayPaused
                  ? es
                    ? "Reanudar avance automático"
                    : "Resume autoplay"
                  : es
                    ? "Pausar avance automático"
                    : "Pause autoplay"
              }
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-white/25 bg-slate-950/50 px-3 text-xs font-semibold text-white transition hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-blue-300"
            >
              {autoplayPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              <span>
                {autoplayPaused
                  ? es
                    ? "Reanudar"
                    : "Resume"
                  : es
                    ? "Pausar"
                    : "Pause"}
              </span>
            </button>
            <div className="ml-1 flex gap-2 sm:ml-4">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label={es ? "Solución anterior" : "Previous solution"}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-slate-950/50 transition hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-blue-300"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label={es ? "Solución siguiente" : "Next solution"}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-slate-950/50 transition hover:bg-blue-600 focus-visible:outline-2 focus-visible:outline-blue-300"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

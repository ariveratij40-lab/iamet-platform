import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import IametTechLogoV2 from "./IametTechLogoV2";

const SESSION_KEY = "iamet-brand-intro-v5";
export default function BrandIntroV2() {
  const { language } = useLanguage();
  const es = language === "es";
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return true;
    }
  });
  const [progress, setProgress] = useState(0);
  const skip = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setActive(false);
    try {
      sessionStorage.setItem(SESSION_KEY, "seen");
    } catch {
      /* Storage is optional. */
    }
  }, []);
  useEffect(() => {
    if (!active) return;
    if (reduceMotion) {
      close();
      return;
    }
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    skip.current?.focus();
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const value = Math.min(100, Math.round((now - start) / 48));
      setProgress(value);
      if (value < 100) frame = requestAnimationFrame(tick);
      else close();
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [active, reduceMotion, close]);
  return (
    <>
      {createPortal(
        <AnimatePresence>
          {active && (
            <motion.div
              key="brand-intro"
              role="dialog"
              aria-modal="true"
              aria-label={es ? "Introducción IAMET" : "IAMET introduction"}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="iamet-brand-intro text-white fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#030c16] px-6"
              onKeyDown={event => {
                if (event.key === "Escape") close();
                if (event.key === "Tab") {
                  event.preventDefault();
                  skip.current?.focus();
                }
              }}
            >
              <div
                className="iamet-intro-atmosphere pointer-events-none absolute inset-0"
                aria-hidden="true"
              >
                <div className="iamet-intro-aura" />
                <div className="iamet-intro-floor" />
                <div className="iamet-intro-orbit iamet-intro-orbit-outer">
                  <i />
                </div>
                <div className="iamet-intro-orbit iamet-intro-orbit-inner">
                  <i />
                </div>
                <svg
                  className="iamet-intro-circuits"
                  viewBox="0 0 1440 900"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <g fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M0 220H270L420 370H560M0 700H240L430 510H560M1440 170H1180L990 360H900M1440 710H1150L970 530H900M370 0V170L580 380M1090 900V720L900 530" />
                  </g>
                  <g
                    className="iamet-intro-flow"
                    fill="none"
                    stroke="#77c7ff"
                    strokeWidth="2"
                  >
                    <path d="M0 220H270L420 370H560M0 700H240L430 510H560M1440 170H1180L990 360H900M1440 710H1150L970 530H900" />
                  </g>
                </svg>
                <div className="iamet-intro-light-sweep" />
                <span className="iamet-intro-corner iamet-intro-corner-tl" />
                <span className="iamet-intro-corner iamet-intro-corner-tr" />
                <span className="iamet-intro-corner iamet-intro-corner-bl" />
                <span className="iamet-intro-corner iamet-intro-corner-br" />
              </div>
              <div
                className="iamet-intro-grid pointer-events-none absolute inset-0"
                aria-hidden="true"
              />
              <div className="iamet-intro-content relative w-full max-w-[600px]">
                <p className="mb-10 text-center text-[9px] font-semibold leading-6 tracking-[.22em] text-blue-200/75 sm:text-[10px] sm:tracking-[.35em]">
                  {es
                    ? "INGENIERÍA · INTEGRACIÓN · INTELIGENCIA ARTIFICIAL"
                    : "ENGINEERING · INTEGRATION · ARTIFICIAL INTELLIGENCE"}
                </p>
                <div className="iamet-intro-logo px-3 sm:px-6">
                  <IametTechLogoV2 />
                </div>
                <div className="mx-auto mt-12 max-w-[320px]" aria-hidden="true">
                  <div className="mb-3 flex justify-between font-mono text-[10px] tracking-[.18em] text-cyan-200/60">
                    <span>
                      {es
                        ? "CONECTANDO POSIBILIDADES"
                        : "CONNECTING POSSIBILITIES"}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-px bg-cyan-900/50">
                    <div
                      className="h-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
              <button
                ref={skip}
                type="button"
                onClick={close}
                className="absolute bottom-8 right-8 rounded border border-cyan-800/50 px-4 py-2 font-mono text-xs text-cyan-100/70 hover:border-cyan-400 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                {es ? "Omitir introducción" : "Skip introduction"} →
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
      <div className="bg-[#050c16] px-5 pb-6 text-center">
        <button
          type="button"
          onClick={() => {
            setProgress(0);
            setActive(true);
          }}
          className="inline-flex items-center gap-2 rounded px-3 py-2 text-xs text-slate-400 hover:text-cyan-300 focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <RotateCcw className="h-3 w-3" />
          {es ? "Ver introducción IAMET" : "Replay IAMET introduction"}
        </button>
      </div>
    </>
  );
}

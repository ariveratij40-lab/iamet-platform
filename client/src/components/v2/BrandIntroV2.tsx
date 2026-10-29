import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import IametTechLogoV2 from "./IametTechLogoV2";

const SESSION_KEY = "iamet-brand-intro-v3";
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
      const value = Math.min(100, Math.round((now - start) / 58));
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
              className="iamet-brand-intro text-white fixed inset-0 z-[100] flex items-center justify-center bg-[#030c16] px-8"
              onKeyDown={event => {
                if (event.key === "Escape") close();
                if (event.key === "Tab") {
                  event.preventDefault();
                  skip.current?.focus();
                }
              }}
            >
              <div
                className="iamet-intro-grid pointer-events-none absolute inset-0"
                aria-hidden="true"
              />
              <div className="relative w-full max-w-[520px]">
                <p className="mb-10 text-center font-mono text-[10px] tracking-[.4em] text-cyan-500/70">
                  INGENIERÍA · INTEGRACIÓN · TECNOLOGÍA
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

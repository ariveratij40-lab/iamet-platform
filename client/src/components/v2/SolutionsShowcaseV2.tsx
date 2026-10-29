import { useState } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Bot,
  Cable,
  Fingerprint,
  MessageCircle,
  RadioTower,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAnalytics } from "@/hooks/useAnalytics";

import { solutions } from "./solutionsData";

export default function SolutionsShowcaseV2() {
  const [activeId, setActiveId] = useState(solutions[0].id);
  const { language } = useLanguage();
  const { trackEvent } = useAnalytics();
  const es = language === "es";

  const active =
    solutions.find(solution => solution.id === activeId) ?? solutions[0];

  const ActiveIcon = active.icon;

  const selectSolution = (id: string) => {
    setActiveId(id);
    trackEvent("vertical_viewed", {
      vertical: id,
      location: "solutions_showcase_v2",
    });
  };

  return (
    <section
      id="soluciones-v2"
      className="px-5 py-14 sm:py-16 lg:px-8 lg:py-28"
      style={{ background: "#ffffff" }}
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-[760px]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            {es ? "Soluciones IAMET" : "IAMET Solutions"}
          </p>

          <h2
            className="mt-3 text-[2.15rem] font-bold leading-[1.03] tracking-[-0.04em] sm:mt-4 sm:text-4xl md:text-5xl"
            style={{ color: "#101828" }}
          >
            {es
              ? "Tecnología integrada alrededor de su operación."
              : "Integrated technology around your operation."}
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-500 sm:mt-5 sm:text-lg sm:leading-8">
            {es
              ? "Explore nuestras principales áreas de especialización y descubra cómo se integran dentro de una misma estrategia tecnológica."
              : "Explore our core areas of expertise and see how they work together within one technology strategy."}
          </p>
        </div>

        <div className="-mx-5 mt-7 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-12 sm:px-0">
          {solutions.map(solution => {
            const Icon = solution.icon;
            const selected = solution.id === active.id;

            return (
              <button
                key={solution.id}
                type="button"
                onClick={() => selectSolution(solution.id)}
                className="flex shrink-0 snap-start items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all sm:px-4 sm:py-2.5 sm:text-sm"
                style={{
                  color: selected ? "#ffffff" : "#475467",
                  background: selected ? "#1264d8" : "#ffffff",
                  borderColor: selected ? "#1264d8" : "#dce3ec",
                  boxShadow: selected
                    ? "0 10px 24px rgba(18,100,216,.16)"
                    : "none",
                }}
              >
                <Icon className="h-4 w-4" />
                {es ? solution.es : solution.en}
              </button>
            );
          })}
        </div>

        <div
          className="mt-4 overflow-hidden rounded-[24px] border sm:mt-5 sm:rounded-[30px]"
          style={{
            borderColor: "#dfe7f0",
            background: "#f8fbff",
            boxShadow: "0 24px 70px rgba(33,66,111,.08)",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
              className="grid lg:grid-cols-[.9fr_1.1fr]"
            >
              <div className="order-2 flex flex-col justify-center p-5 sm:p-8 md:p-12 lg:order-1 lg:p-14">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ActiveIcon className="h-6 w-6" />
                </div>

                <p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                  {es ? active.es : active.en}
                </p>

                <h3
                  className="mt-2 text-[1.7rem] font-bold leading-[1.08] tracking-[-0.035em] sm:mt-3 sm:text-3xl md:text-4xl"
                  style={{ color: "#101828" }}
                >
                  {es ? active.titleEs : active.titleEn}
                </h3>

                <p className="mt-4 max-w-[620px] text-[15px] leading-6 text-slate-500 sm:mt-5 sm:text-base sm:leading-7">
                  {es ? active.descEs : active.descEn}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 sm:mt-7 sm:gap-3">
                  {(es ? active.capabilitiesEs : active.capabilitiesEn).map(
                    capability => (
                      <div
                        key={capability}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        {capability}
                      </div>
                    )
                  )}
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:mt-9 sm:flex-row">
                  <Link
                    href="/soluciones"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        location: "solutions_showcase_v2",
                        vertical: active.id,
                        action: "explore_solution",
                      })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    {es ? "Explorar solución" : "Explore solution"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    href="/tech-advisor"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        location: "solutions_showcase_v2",
                        vertical: active.id,
                        action: "open_aria",
                      })
                    }
                    className="hidden items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 sm:inline-flex"
                  >
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    {es ? "Consultar con ARIA" : "Ask ARIA"}
                  </Link>
                </div>
              </div>

              <div className="relative order-1 min-h-[230px] overflow-hidden sm:min-h-[320px] lg:order-2 lg:min-h-[590px]">
                <img
                  src={active.image}
                  alt={es ? active.es : active.en}
                  className="absolute inset-0 h-full w-full object-cover"
                />

                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(248,251,255,.24), rgba(8,30,62,.10))",
                  }}
                />

                <div className="absolute bottom-5 left-5 hidden rounded-xl border border-white/50 bg-white/88 px-4 py-3 shadow-lg backdrop-blur-xl sm:block">
                  <div className="flex items-center gap-3">
                    <ActiveIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                        {es ? active.es : active.en}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-700">
                        {es
                          ? "Ingeniería · Integración · Inteligencia"
                          : "Engineering · Integration · Intelligence"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

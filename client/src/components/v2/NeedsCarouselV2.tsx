import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { needs } from "./needsData";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function NeedsCarouselV2() {
  const [index, setIndex] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const { trackEvent } = useAnalytics();

  const active = needs[index];
  const ActiveIcon = active.icon;

  useEffect(() => {
    if (interacted) return;

    const timer = window.setInterval(() => {
      setIndex(current => (current + 1) % needs.length);
    }, 7000);

    return () => window.clearInterval(timer);
  }, [interacted]);

  const select = (nextIndex: number) => {
    setInteracted(true);
    setIndex(nextIndex);

    trackEvent("vertical_viewed", {
      vertical: needs[nextIndex].id,
      location: "needs_carousel_v2",
    });
  };

  const move = (direction: number) => {
    const next =
      (index + direction + needs.length) % needs.length;

    select(next);
  };

  return (
    <section className="bg-white px-5 py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="max-w-[820px]">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Podemos orientarle
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-slate-950 md:text-5xl">
            ¿Qué necesita resolver?
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-500">
            No necesita conocer el nombre técnico de la solución.
            Comience por el problema o proyecto que necesita resolver.
          </p>
        </div>

        <div className="mt-10 flex gap-2 overflow-x-auto pb-3">
          {needs.map((need, i) => {
            const Icon = need.icon;
            const selected = i === index;

            return (
              <button
                key={need.id}
                type="button"
                onClick={() => select(i)}
                className="flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all"
                style={{
                  color: selected ? "#fff" : "#475467",
                  background: selected ? "#1264d8" : "#fff",
                  borderColor: selected
                    ? "#1264d8"
                    : "#dce3ec",
                }}
              >
                <Icon className="h-4 w-4" />
                {need.label}
              </button>
            );
          })}
        </div>

        <div
          className="relative mt-5 overflow-hidden rounded-[30px] border px-7 py-10 md:px-12 md:py-14 lg:px-16"
          style={{
            background:
              "linear-gradient(120deg,#f6faff 0%,#fff 52%,#eef6ff 100%)",
            borderColor: "#dfe7f0",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.24 }}
              className="grid items-center gap-10 lg:grid-cols-[1.15fr_.85fr]"
            >
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
                  <ActiveIcon className="h-6 w-6" />
                </div>

                <h3 className="mt-7 max-w-[780px] text-3xl font-bold leading-tight tracking-[-0.035em] text-slate-950 md:text-4xl">
                  {active.question}
                </h3>

                <p className="mt-5 max-w-[720px] text-base leading-7 text-slate-600 md:text-lg">
                  {active.answer}
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {active.services.map(service => (
                    <span
                      key={service}
                      className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      {service}
                    </span>
                  ))}
                </div>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#soluciones-v2"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        location: "needs_carousel_v2",
                        vertical: active.id,
                        action: "view_solution",
                      })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Ver cómo podemos ayudar
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <Link
                    href="/tech-advisor"
                    onClick={() =>
                      trackEvent("cta_clicked", {
                        location: "needs_carousel_v2",
                        vertical: active.id,
                        action: "explain_to_aria",
                      })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
                  >
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    Explicar mi proyecto a ARIA
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-blue-100 bg-white/70 shadow-xl md:h-72 md:w-72">
                  <div className="absolute inset-5 rounded-full border border-dashed border-blue-200" />
                  <div className="absolute inset-12 rounded-full bg-blue-50" />
                  <ActiveIcon className="relative h-20 w-20 text-blue-600" />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="relative mt-10 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {index + 1} / {needs.length}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Anterior"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Siguiente"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white"
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

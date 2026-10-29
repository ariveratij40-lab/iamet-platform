import { motion } from "framer-motion";
import {
  Factory,
  Stethoscope,
  GraduationCap,
  Landmark,
  ShoppingBag,
  Hotel,
  Building2,
  Globe,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";

import { INDUSTRIES } from "@/data/industries";
import { useEffect } from "react";

export default function Industrias() {
  useEffect(() => {
    const scrollToIndustry = () => {
      const id = window.location.hash.slice(1);
      if (id)
        requestAnimationFrame(() =>
          document.getElementById(id)?.scrollIntoView({ block: "start" })
        );
    };
    scrollToIndustry();
    window.addEventListener("hashchange", scrollToIndustry);
    return () => window.removeEventListener("hashchange", scrollToIndustry);
  }, []);
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-iamet-bg)" }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden" style={{}}>
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-3xl opacity-5 pointer-events-none"
          style={{ background: "var(--color-iamet-accent)" }}
        />
        <div
          style={{ maxWidth: "1100px", margin: "0 auto" }}
          className="relative z-10"
        >
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-2 text-xs mb-8"
            style={{ color: "var(--color-iamet-text-subtle)" }}
          >
            <Link
              href="/"
              className="hover:text-[var(--color-iamet-text-muted)] transition-colors"
            >
              Inicio
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: "var(--color-iamet-accent)" }}>
              Industrias
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <span
                className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
                style={{
                  color: "var(--color-iamet-accent)",
                  background: "var(--color-iamet-accent-muted)",
                }}
              >
                Sectores
              </span>
            </div>
            <h1
              className="font-display text-4xl lg:text-5xl font-bold mb-4"
              style={{ color: "var(--color-iamet-text)" }}
            >
              Industrias que Atendemos
            </h1>
            <p
              className="text-lg"
              style={{ color: "var(--color-iamet-text-muted)" }}
            >
              Experiencia comprobada en los sectores más exigentes de México y
              Latinoamérica. Soluciones diseñadas para los retos específicos de
              cada industria.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Grid de industrias ────────────────────────────────────────────── */}
      <section className="py-12 px-4" style={{}}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="space-y-6">
            {INDUSTRIES.map(
              (
                { id, name, icon: Icon, color, tagline, solutions, cases },
                i
              ) => (
                <motion.div
                  key={id}
                  id={id}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  className="scroll-mt-24 rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--color-iamet-surface)",
                    border: "1px solid var(--color-iamet-border-subtle)",
                  }}
                >
                  {/* Header */}
                  <div
                    className="flex items-center gap-4 px-6 py-5"
                    style={{
                      borderBottom:
                        "1px solid var(--color-iamet-border-subtle)",
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: color + "20" }}
                    >
                      <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2
                        className="text-lg font-semibold"
                        style={{ color: "var(--color-iamet-text)" }}
                      >
                        {name}
                      </h2>
                      <p
                        className="text-sm"
                        style={{ color: "var(--color-iamet-text-muted)" }}
                      >
                        {tagline}
                      </p>
                    </div>
                    <Link href={`/contacto?industria=${id}`}>
                      <button
                        className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-150 btn-press flex-shrink-0"
                        style={{
                          background: color + "18",
                          color,
                          border: `1px solid ${color}44`,
                        }}
                      >
                        Consultar
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>

                  {/* Body */}
                  <div className="grid sm:grid-cols-2 gap-6 p-6">
                    {/* Soluciones */}
                    <div>
                      <h3
                        className="text-xs font-semibold uppercase tracking-wider mb-3"
                        style={{ color: "var(--color-iamet-text-subtle)" }}
                      >
                        Soluciones aplicables
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {solutions.map(sol => (
                          <span
                            key={sol}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full"
                            style={{
                              background: color + "12",
                              color,
                              border: `1px solid ${color}30`,
                            }}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {sol}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Casos */}
                    <div>
                      <h3
                        className="text-xs font-semibold uppercase tracking-wider mb-3"
                        style={{ color: "var(--color-iamet-text-subtle)" }}
                      >
                        Casos de referencia
                      </h3>
                      <div className="space-y-3">
                        {cases.map(({ title, desc }) => (
                          <div key={title} className="flex gap-3">
                            <div
                              className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                              style={{ background: color }}
                            />
                            <div>
                              <div
                                className="text-xs font-semibold"
                                style={{ color: "var(--color-iamet-text)" }}
                              >
                                {title}
                              </div>
                              <div
                                className="text-xs leading-relaxed"
                                style={{
                                  color: "var(--color-iamet-text-subtle)",
                                }}
                              >
                                {desc}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section
        className="py-20 px-4"
        style={{ background: "var(--color-iamet-bg-secondary)" }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2
              className="text-2xl sm:text-3xl font-bold mb-4"
              style={{ color: "var(--color-iamet-text)" }}
            >
              ¿Tu industria no aparece aquí?
            </h2>
            <p
              className="text-base mb-8"
              style={{ color: "var(--color-iamet-text-muted)" }}
            >
              Nuestros especialistas tienen experiencia en decenas de sectores.
              Cuéntanos tu caso y diseñaremos la solución adecuada.
            </p>
            <Link href="/contacto">
              <button
                className="px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-150 btn-press"
                style={{
                  background: "var(--color-iamet-accent)",
                  color: "#fff",
                }}
              >
                Hablar con un especialista
              </button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

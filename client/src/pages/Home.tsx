import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Server, Shield, Cpu, Brain, Headphones, GraduationCap, FileCheck,
  ArrowRight, ChevronRight, CheckCircle2, Zap, Globe, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentChat from "@/components/AgentChat";
import LeadForm from "@/components/LeadForm";
import { trpc } from "@/lib/trpc";

// ─── Vertical Icon Map ────────────────────────────────────────────────────────
const VERTICAL_ICONS: Record<string, React.ElementType> = {
  Server, Shield, Cpu, Brain, Headphones, GraduationCap, FileCheck,
};

const VERTICAL_COLORS: Record<string, string> = {
  infraestructura: "var(--color-v-infra)",
  seguridad: "var(--color-v-security)",
  rfid: "var(--color-v-rfid)",
  "software-ia": "var(--color-v-software)",
  "servicios-administrados": "var(--color-v-managed)",
  educacion: "var(--color-v-edu)",
  compliance: "var(--color-v-comply)",
};

const STATS = [
  { value: "200+", label: "Proyectos entregados" },
  { value: "15+", label: "Años de experiencia" },
  { value: "99.9%", label: "Uptime garantizado" },
  { value: "24/7", label: "Soporte activo" },
];

const TRUSTED_BY = [
  "Manufactura", "Retail", "Salud", "Gobierno", "Logística", "Educación",
];

export default function Home() {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const { data: verticals = [] } = trpc.verticals.list.useQuery();

  return (
    <div className="min-h-screen bg-[var(--color-iamet-bg)]">
      {/* ── Hero Section ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[var(--color-iamet-accent)] opacity-5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[var(--color-iamet-cyan)] opacity-5 blur-3xl" />

        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-4rem)] py-16">
            {/* Left: Headline */}
            <div className="space-y-8">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              >
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-iamet-accent-muted)] bg-[var(--color-iamet-accent-muted)] text-xs font-semibold text-[var(--color-iamet-accent)] uppercase tracking-widest">
                  <Zap className="w-3 h-3" />
                  Asesor Tecnológico Digital
                </span>
              </motion.div>

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-3"
              >
                <h1 className="font-display text-5xl lg:text-6xl xl:text-7xl font-900 leading-[1.05] tracking-tight">
                  <span className="text-[var(--color-iamet-text)]">Tecnología que</span>
                  <br />
                  <span className="gradient-text text-glow">transforma</span>
                  <br />
                  <span className="text-[var(--color-iamet-text)]">tu empresa</span>
                </h1>
              </motion.div>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="text-lg text-[var(--color-iamet-text-muted)] leading-relaxed max-w-lg"
              >
                IAMET integra infraestructura, seguridad, automatización e inteligencia artificial
                en una plataforma unificada. Desde el diagnóstico hasta la operación continua.
              </motion.p>

              {/* Value props */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col gap-2"
              >
                {[
                  "Diagnóstico tecnológico gratuito con IA",
                  "Pólizas de mantenimiento con SLA garantizado",
                  "Implementación en menos de 30 días",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[var(--color-iamet-accent)] flex-shrink-0" />
                    <span className="text-sm text-[var(--color-iamet-text-muted)]">{item}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-wrap gap-3"
              >
                <Link href="/tech-advisor">
                  <Button
                    size="lg"
                    className="bg-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-hover)] text-white font-semibold px-6 btn-press glow-accent"
                  >
                    Iniciar Diagnóstico Gratis
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowLeadForm(true)}
                  className="border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] hover:border-[var(--color-iamet-accent)] hover:text-[var(--color-iamet-accent)] bg-transparent btn-press"
                >
                  Hablar con un Experto
                </Button>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                className="grid grid-cols-4 gap-4 pt-4 border-t border-[var(--color-iamet-border-subtle)]"
              >
                {STATS.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-display text-xl font-800 gradient-text">{stat.value}</p>
                    <p className="text-xs text-[var(--color-iamet-text-subtle)] mt-0.5 leading-tight">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: Agent Chat */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="relative"
            >
              {/* Glow behind chat */}
              <div className="absolute -inset-4 bg-[var(--color-iamet-accent)] opacity-5 rounded-3xl blur-2xl" />
              <AgentChat />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trusted By ───────────────────────────────────────────────────────── */}
      <section className="py-8 border-y border-[var(--color-iamet-border-subtle)]">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            <span className="text-xs text-[var(--color-iamet-text-subtle)] uppercase tracking-widest">
              Sectores que confían en IAMET
            </span>
            {TRUSTED_BY.map((sector) => (
              <span
                key={sector}
                className="flex items-center gap-1.5 text-sm text-[var(--color-iamet-text-muted)]"
              >
                <Globe className="w-3.5 h-3.5 text-[var(--color-iamet-accent)]" />
                {sector}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 Verticales de Negocio ───────────────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="container relative z-10">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-16 space-y-4"
          >
            <span className="inline-block px-3 py-1 rounded-full border border-[var(--color-iamet-border)] text-xs font-semibold text-[var(--color-iamet-text-muted)] uppercase tracking-widest">
              Nuestras Soluciones
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-800 text-[var(--color-iamet-text)]">
              7 verticales de{" "}
              <span className="gradient-text">especialización</span>
            </h2>
            <p className="text-[var(--color-iamet-text-muted)] max-w-xl mx-auto">
              Cubrimos el ecosistema tecnológico completo de tu empresa, desde la infraestructura
              hasta la inteligencia artificial.
            </p>
          </motion.div>

          {/* Verticals Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(verticals.length > 0
              ? verticals
              : FALLBACK_VERTICALS
            ).map((v, i) => {
              const Icon = VERTICAL_ICONS[v.icon ?? "Server"] ?? Server;
              const color = VERTICAL_COLORS[v.slug] ?? "var(--color-iamet-accent)";
              const solutions = Array.isArray(v.solutions) ? v.solutions as string[] : [];

              return (
                <motion.div
                  key={v.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.23, 1, 0.32, 1] }}
                >
                  <Link href={`/soluciones/${v.slug}`}>
                    <div className="group neumorphic neumorphic-hover rounded-2xl p-5 h-full flex flex-col gap-4 cursor-pointer">
                      {/* Icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>

                      {/* Name */}
                      <div>
                        <h3 className="font-display font-700 text-[var(--color-iamet-text)] text-base leading-tight mb-1.5">
                          {v.name}
                        </h3>
                        <p className="text-xs text-[var(--color-iamet-text-subtle)] leading-relaxed line-clamp-2">
                          {v.description}
                        </p>
                      </div>

                      {/* Solutions preview */}
                      {solutions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {solutions.slice(0, 3).map((sol) => (
                            <span
                              key={sol}
                              className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${color}15`, color }}
                            >
                              {sol}
                            </span>
                          ))}
                          {solutions.length > 3 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full text-[var(--color-iamet-text-subtle)] bg-[var(--color-iamet-surface-2)]">
                              +{solutions.length - 3} más
                            </span>
                          )}
                        </div>
                      )}

                      {/* Arrow */}
                      <div className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color }}>
                        Ver soluciones <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link href="/tech-advisor">
              <Button
                size="lg"
                className="bg-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-hover)] text-white font-semibold btn-press glow-accent-sm"
              >
                Descubrir qué necesita mi empresa
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Why IAMET ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[var(--color-iamet-bg-secondary)]">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="space-y-6"
            >
              <span className="inline-block px-3 py-1 rounded-full border border-[var(--color-iamet-border)] text-xs font-semibold text-[var(--color-iamet-text-muted)] uppercase tracking-widest">
                Por qué IAMET
              </span>
              <h2 className="font-display text-4xl font-800 text-[var(--color-iamet-text)] leading-tight">
                No somos un proveedor.<br />
                <span className="gradient-text">Somos tu socio tecnológico.</span>
              </h2>
              <p className="text-[var(--color-iamet-text-muted)] leading-relaxed">
                A diferencia de los integradores tradicionales, IAMET combina consultoría estratégica,
                implementación técnica y operación continua bajo un modelo de ingresos recurrentes
                que garantiza la continuidad operativa de tu empresa.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Zap, title: "Diagnóstico con IA", desc: "El Agente Virtual IAMET identifica tus necesidades y recomienda soluciones en minutos." },
                  { icon: Shield, title: "SLA Garantizado", desc: "Pólizas de servicio con tiempos de respuesta definidos y penalizaciones por incumplimiento." },
                  { icon: Award, title: "Certificaciones Internacionales", desc: "Equipo certificado en Cisco, Microsoft, Genetec, Axis, Zebra y más fabricantes líderes." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-iamet-accent-muted)] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[var(--color-iamet-accent)]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--color-iamet-text)] text-sm mb-0.5">{title}</h4>
                      <p className="text-xs text-[var(--color-iamet-text-muted)] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Lead Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <LeadForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Academy CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--color-iamet-accent)] opacity-5 blur-3xl rounded-full" />
        <div className="container relative z-10 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-v-edu)] bg-[oklch(0.75_0.18_75_/_0.1)] text-xs font-semibold text-[var(--color-v-edu)] uppercase tracking-widest">
              <GraduationCap className="w-3.5 h-3.5" />
              IAMET Academy
            </span>
            <h2 className="font-display text-4xl lg:text-5xl font-800 text-[var(--color-iamet-text)]">
              Capacita a tu equipo con los{" "}
              <span className="gradient-text">expertos</span>
            </h2>
            <p className="text-[var(--color-iamet-text-muted)] max-w-xl mx-auto">
              Cursos especializados, certificaciones internacionales y talleres prácticos
              en infraestructura, seguridad, IA y más.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Link href="/academy">
              <Button
                size="lg"
                className="bg-[var(--color-v-edu)] hover:opacity-90 text-white font-semibold btn-press"
                style={{ backgroundColor: "var(--color-v-edu)" }}
              >
                Explorar Cursos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/tech-advisor">
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] hover:border-[var(--color-iamet-accent)] hover:text-[var(--color-iamet-accent)] bg-transparent btn-press"
              >
                Diagnóstico Tecnológico
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Lead Form Modal ───────────────────────────────────────────────────── */}
      {showLeadForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "oklch(0 0 0 / 0.7)" }}
          onClick={() => setShowLeadForm(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg">
            <LeadForm onSuccess={() => setShowLeadForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Fallback while loading
const FALLBACK_VERTICALS = [
  { slug: "infraestructura", name: "Infraestructura Tecnológica", description: "Redes, servidores y centros de datos.", icon: "Server", solutions: ["Redes LAN/WAN", "Cableado Estructurado", "Cloud Híbrida"] },
  { slug: "seguridad", name: "Seguridad Electrónica", description: "CCTV, control de acceso y alarmas.", icon: "Shield", solutions: ["CCTV", "Control de Acceso", "Monitoreo 24/7"] },
  { slug: "rfid", name: "RFID y Automatización", description: "Control de inventarios y activos.", icon: "Cpu", solutions: ["Control RFID", "Rastreo de Activos", "IoT"] },
  { slug: "software-ia", name: "Software e IA", description: "Desarrollo a medida e inteligencia artificial.", icon: "Brain", solutions: ["Desarrollo a Medida", "Agentes IA", "RPA"] },
  { slug: "servicios-administrados", name: "Servicios Administrados", description: "NOC 24/7 y pólizas de mantenimiento.", icon: "Headphones", solutions: ["NOC 24/7", "Soporte Técnico", "SLA"] },
  { slug: "educacion", name: "Educación Tecnológica", description: "Cursos y certificaciones especializadas.", icon: "GraduationCap", solutions: ["Cursos", "Certificaciones", "IAMET Academy"] },
  { slug: "compliance", name: "Compliance y Auditoría", description: "ISO 27001, NIST y gestión de riesgos.", icon: "FileCheck", solutions: ["ISO 27001", "NIST", "Auditoría"] },
];

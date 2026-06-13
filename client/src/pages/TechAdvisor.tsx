import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  Building2, Users, AlertTriangle, Lightbulb, ChevronRight,
  Server, Shield, Cpu, Headphones, GraduationCap, FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

// ─── Step Definitions ─────────────────────────────────────────────────────────
const SECTORS = [
  { value: "manufactura", label: "Manufactura", icon: "🏭" },
  { value: "retail", label: "Retail / Comercio", icon: "🛒" },
  { value: "salud", label: "Salud", icon: "🏥" },
  { value: "gobierno", label: "Gobierno", icon: "🏛️" },
  { value: "logistica", label: "Logística", icon: "🚛" },
  { value: "educacion", label: "Educación", icon: "🎓" },
  { value: "financiero", label: "Financiero", icon: "🏦" },
  { value: "hoteleria", label: "Hotelería", icon: "🏨" },
  { value: "otro", label: "Otro", icon: "🏢" },
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 empleados", desc: "Microempresa" },
  { value: "11-50", label: "11–50 empleados", desc: "Pequeña empresa" },
  { value: "51-200", label: "51–200 empleados", desc: "Mediana empresa" },
  { value: "201-500", label: "201–500 empleados", desc: "Empresa grande" },
  { value: "500+", label: "Más de 500", desc: "Corporativo" },
];

const CHALLENGES = [
  { value: "infraestructura", label: "Red lenta o inestable", icon: Server, color: "oklch(0.65 0.20 240)" },
  { value: "seguridad", label: "Falta de seguridad física", icon: Shield, color: "oklch(0.62 0.22 25)" },
  { value: "rfid", label: "Control de inventarios deficiente", icon: Cpu, color: "oklch(0.68 0.18 160)" },
  { value: "software-ia", label: "Procesos manuales que se pueden automatizar", icon: Brain, color: "oklch(0.70 0.22 280)" },
  { value: "servicios-administrados", label: "Sin soporte técnico especializado", icon: Headphones, color: "oklch(0.68 0.18 160)" },
  { value: "educacion", label: "Equipo sin capacitación tecnológica", icon: GraduationCap, color: "oklch(0.75 0.18 75)" },
  { value: "compliance", label: "Riesgos de cumplimiento normativo", icon: FileCheck, color: "oklch(0.62 0.22 25)" },
];

const BUDGET_RANGES = [
  { value: "less-50k", label: "Menos de $50,000 MXN" },
  { value: "50k-200k", label: "$50,000 – $200,000 MXN" },
  { value: "200k-500k", label: "$200,000 – $500,000 MXN" },
  { value: "500k-1m", label: "$500,000 – $1,000,000 MXN" },
  { value: "more-1m", label: "Más de $1,000,000 MXN" },
  { value: "unknown", label: "No lo sé aún" },
];

const URGENCY_LEVELS = [
  { value: "immediate", label: "Inmediata (este mes)", color: "oklch(0.62 0.22 25)" },
  { value: "short", label: "Corto plazo (1–3 meses)", color: "oklch(0.70 0.22 280)" },
  { value: "medium", label: "Mediano plazo (3–6 meses)", color: "oklch(0.65 0.20 240)" },
  { value: "planning", label: "Planeación (más de 6 meses)", color: "oklch(0.68 0.18 160)" },
];

interface DiagnosisResult {
  summary: string;
  recommendations: { vertical: string; solution: string; priority: "alta" | "media" | "baja"; reason: string }[];
  nextStep: string;
}

const STEPS = ["Sector", "Tamaño", "Retos", "Presupuesto", "Urgencia", "Resultados"];

export default function TechAdvisor() {
  const [step, setStep] = useState(0);
  const [sector, setSector] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [challenges, setChallenges] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [urgency, setUrgency] = useState("");
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const createLead = trpc.leads.create.useMutation();

  const generateRecs = trpc.advisor.generateRecommendations.useMutation({
    onSuccess: (data: DiagnosisResult) => {
      setDiagnosis(data);
      setStep(5);
      // Capture lead automatically from advisor completion
      if (contactName && email && company) {
        const topVertical = (data.recommendations?.[0] as { vertical?: string })?.vertical;
        createLead.mutate({
          company,
          contactName,
          email,
          industry: sector,
          companySize: companySize as "1-10" | "11-50" | "51-200" | "201-500" | "500+",
          problemDescription: challenges.join(", "),
          verticalSlug: topVertical,
          source: "advisor",
        });
      }
    },
  });

  const toggleChallenge = (val: string) => {
    setChallenges((prev) =>
      prev.includes(val) ? prev.filter((c) => c !== val) : [...prev, val]
    );
  };

  const handleNext = () => {
    if (step === 4) {
      // First create a lead, then generate recommendations
      generateRecs.mutate({ sessionId: `advisor-${Date.now()}`, sector, companySize, currentProblems: challenges });
    } else {
      setStep((s) => s + 1);
    }
  };

  const canNext = () => {
    if (step === 0) return !!sector;
    if (step === 1) return !!companySize;
    if (step === 2) return challenges.length > 0;
    if (step === 3) return !!budget;
    if (step === 4) return !!urgency && !!contactName && !!email && !!company;
    return false;
  };

  const priorityColor: Record<string, string> = { alta: "oklch(0.62 0.22 25)", media: "oklch(0.70 0.22 280)", baja: "oklch(0.65 0.20 240)" };
  const priorityLabel: Record<string, string> = { alta: "Alta prioridad", media: "Prioridad media", baja: "Baja prioridad" };

  return (
    <div className="min-h-screen bg-[var(--color-iamet-bg)] pt-16">
      <div className="container py-16 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-iamet-accent-muted)] flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8 text-[var(--color-iamet-accent)]" />
          </div>
          <h1 className="font-display text-4xl font-800 text-[var(--color-iamet-text)]">
            IAMET Tech Advisor
          </h1>
          <p className="text-[var(--color-iamet-text-muted)] max-w-lg mx-auto">
            Responde 5 preguntas y recibe un diagnóstico personalizado con las soluciones
            tecnológicas más adecuadas para tu empresa.
          </p>
        </motion.div>

        {/* Progress Bar */}
        {step < 5 && (
          <div className="mb-10">
            <div className="flex justify-between mb-2">
              {STEPS.slice(0, 5).map((s, i) => (
                <span
                  key={s}
                  className={`text-xs font-medium transition-colors ${i <= step ? "text-[var(--color-iamet-accent)]" : "text-[var(--color-iamet-text-subtle)]"}`}
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="h-1.5 bg-[var(--color-iamet-bg-tertiary)] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[var(--color-iamet-accent)] to-[var(--color-iamet-cyan)]"
                animate={{ width: `${((step + 1) / 5) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
          </div>
        )}

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* Step 0: Sector */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="neumorphic rounded-2xl p-8 space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-700 text-[var(--color-iamet-text)] mb-1">
                    ¿En qué sector opera tu empresa?
                  </h2>
                  <p className="text-sm text-[var(--color-iamet-text-muted)]">Selecciona el que mejor describe tu industria.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {SECTORS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSector(s.value)}
                      className={`neumorphic rounded-xl p-4 text-center transition-all duration-150 btn-press ${sector === s.value ? "ring-2 ring-[var(--color-iamet-accent)]" : ""}`}
                    >
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-xs font-medium text-[var(--color-iamet-text-muted)]">{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Company Size */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="neumorphic rounded-2xl p-8 space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-700 text-[var(--color-iamet-text)] mb-1">
                    ¿Cuántos empleados tiene tu empresa?
                  </h2>
                  <p className="text-sm text-[var(--color-iamet-text-muted)]">Esto nos ayuda a dimensionar la solución correcta.</p>
                </div>
                <div className="space-y-3">
                  {COMPANY_SIZES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setCompanySize(s.value)}
                      className={`w-full neumorphic rounded-xl px-5 py-4 flex items-center justify-between transition-all duration-150 btn-press ${companySize === s.value ? "ring-2 ring-[var(--color-iamet-accent)]" : ""}`}
                    >
                      <div className="text-left">
                        <p className="font-medium text-[var(--color-iamet-text)] text-sm">{s.label}</p>
                        <p className="text-xs text-[var(--color-iamet-text-subtle)]">{s.desc}</p>
                      </div>
                      {companySize === s.value && <CheckCircle2 className="w-5 h-5 text-[var(--color-iamet-accent)]" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Challenges */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="neumorphic rounded-2xl p-8 space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-700 text-[var(--color-iamet-text)] mb-1">
                    ¿Cuáles son tus principales retos tecnológicos?
                  </h2>
                  <p className="text-sm text-[var(--color-iamet-text-muted)]">Puedes seleccionar varios.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CHALLENGES.map(({ value, label, icon: Icon, color }) => {
                    const selected = challenges.includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => toggleChallenge(value)}
                        className={`neumorphic rounded-xl p-4 flex items-center gap-3 text-left transition-all duration-150 btn-press ${selected ? "ring-2" : ""}`}
                        style={selected ? { outline: `2px solid ${color}` } : {}}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
                          <Icon className="w-4.5 h-4.5" style={{ color }} />
                        </div>
                        <span className="text-sm font-medium text-[var(--color-iamet-text-muted)]">{label}</span>
                        {selected && <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" style={{ color }} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="neumorphic rounded-2xl p-8 space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-700 text-[var(--color-iamet-text)] mb-1">
                    ¿Cuál es tu presupuesto aproximado?
                  </h2>
                  <p className="text-sm text-[var(--color-iamet-text-muted)]">Nos ayuda a recomendarte soluciones dentro de tu alcance.</p>
                </div>
                <div className="space-y-3">
                  {BUDGET_RANGES.map((b) => (
                    <button
                      key={b.value}
                      onClick={() => setBudget(b.value)}
                      className={`w-full neumorphic rounded-xl px-5 py-4 flex items-center justify-between transition-all duration-150 btn-press ${budget === b.value ? "ring-2 ring-[var(--color-iamet-accent)]" : ""}`}
                    >
                      <span className="text-sm font-medium text-[var(--color-iamet-text-muted)]">{b.label}</span>
                      {budget === b.value && <CheckCircle2 className="w-5 h-5 text-[var(--color-iamet-accent)]" />}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Urgency + Contact */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="neumorphic rounded-2xl p-8 space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-700 text-[var(--color-iamet-text)] mb-1">
                    ¿Con qué urgencia necesitas la solución?
                  </h2>
                  <p className="text-sm text-[var(--color-iamet-text-muted)]">Y déjanos tus datos para enviarte el diagnóstico completo.</p>
                </div>

                {/* Urgency */}
                <div className="grid grid-cols-2 gap-3">
                  {URGENCY_LEVELS.map((u) => (
                    <button
                      key={u.value}
                      onClick={() => setUrgency(u.value)}
                      className={`neumorphic rounded-xl p-4 text-left transition-all duration-150 btn-press ${urgency === u.value ? "ring-2" : ""}`}
                      style={urgency === u.value ? { outline: `2px solid ${u.color}` } : {}}
                    >
                      <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: u.color }} />
                      <span className="text-sm font-medium text-[var(--color-iamet-text-muted)]">{u.label}</span>
                    </button>
                  ))}
                </div>

                {/* Contact */}
                <div className="space-y-3 pt-2 border-t border-[var(--color-iamet-border-subtle)]">
                  <p className="text-sm font-medium text-[var(--color-iamet-text-muted)]">Datos de contacto</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Tu nombre"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="neumorphic-inset rounded-xl px-4 py-2.5 text-sm text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] outline-none focus:ring-1 focus:ring-[var(--color-iamet-accent)] bg-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Empresa"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="neumorphic-inset rounded-xl px-4 py-2.5 text-sm text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] outline-none focus:ring-1 focus:ring-[var(--color-iamet-accent)] bg-transparent"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="correo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full neumorphic-inset rounded-xl px-4 py-2.5 text-sm text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] outline-none focus:ring-1 focus:ring-[var(--color-iamet-accent)] bg-transparent"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Results */}
          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
              {generateRecs.isPending ? (
                <div className="neumorphic rounded-2xl p-16 text-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-[var(--color-iamet-accent)] mx-auto" />
                  <p className="text-[var(--color-iamet-text-muted)]">Analizando tu perfil tecnológico...</p>
                </div>
              ) : diagnosis !== null ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="neumorphic rounded-2xl p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-iamet-accent-muted)] flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-[var(--color-iamet-accent)]" />
                      </div>
                      <h2 className="font-display text-xl font-700 text-[var(--color-iamet-text)]">
                        Diagnóstico IAMET
                      </h2>
                    </div>
                    <p className="text-sm text-[var(--color-iamet-text-muted)] leading-relaxed">{diagnosis.summary}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-3">
                    <h3 className="font-display text-lg font-700 text-[var(--color-iamet-text)]">
                      Soluciones recomendadas
                    </h3>
                    {diagnosis.recommendations.map((rec, i) => {
                      const pColor = priorityColor[rec.priority];
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="neumorphic rounded-xl p-5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-[var(--color-iamet-text)] text-sm">{rec.solution}</span>
                            <span
                              className="text-xs px-2.5 py-1 rounded-full font-medium"
                              style={{ backgroundColor: `${pColor}15`, color: pColor }}
                            >
                              {priorityLabel[rec.priority]}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-iamet-text-muted)]">{rec.reason}</p>
                          <Link href={`/soluciones/${rec.vertical}`}>
                            <button className="text-xs font-medium flex items-center gap-1 mt-1" style={{ color: pColor }}>
                              Ver detalles <ChevronRight className="w-3 h-3" />
                            </button>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Next Step */}
                  <div className="neumorphic rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[var(--color-iamet-accent)] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-[var(--color-iamet-text)] text-sm mb-1">Próximo paso recomendado</h4>
                        <p className="text-xs text-[var(--color-iamet-text-muted)]">{diagnosis.nextStep}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/#contacto" className="flex-1">
                        <Button className="w-full bg-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-hover)] text-white btn-press">
                          Hablar con un experto
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => { setStep(0); setSector(""); setCompanySize(""); setChallenges([]); setBudget(""); setUrgency(""); setDiagnosis(null); }}
                        className="border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] bg-transparent btn-press"
                      >
                        Nuevo diagnóstico
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        {step < 5 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] bg-transparent btn-press disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canNext() || generateRecs.isPending}
              className="bg-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-hover)] text-white font-semibold btn-press disabled:opacity-40"
            >
              {generateRecs.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analizando...</>
              ) : step === 4 ? (
                <>Obtener Diagnóstico <Brain className="w-4 h-4 ml-2" /></>
              ) : (
                <>Siguiente <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

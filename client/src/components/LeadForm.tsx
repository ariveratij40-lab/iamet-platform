import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Send, Loader2, Building2, User, Mail, Phone, Factory, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";

interface LeadFormProps {
  onSuccess?: () => void;
  verticalSlug?: string;
  source?: "form" | "agent" | "advisor" | "academy";
  compact?: boolean;
}

const INDUSTRIES = [
  "Manufactura", "Retail / Comercio", "Salud", "Gobierno", "Logística y Transporte",
  "Educación", "Financiero / Banca", "Hotelería y Turismo", "Construcción", "Otro",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 empleados" },
  { value: "11-50", label: "11–50 empleados" },
  { value: "51-200", label: "51–200 empleados" },
  { value: "201-500", label: "201–500 empleados" },
  { value: "500+", label: "Más de 500 empleados" },
];

export default function LeadForm({ onSuccess, verticalSlug, source = "form", compact = false }: LeadFormProps) {
  const [form, setForm] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    industry: "",
    companySize: "" as "1-10" | "11-50" | "51-200" | "201-500" | "500+" | "",
    problemDescription: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company || !form.contactName || !form.email) return;
    createLead.mutate({
      ...form,
      companySize: form.companySize || undefined,
      verticalSlug,
      source,
    });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="neumorphic rounded-2xl p-8 text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-[var(--color-iamet-accent-muted)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-[var(--color-iamet-accent)]" />
        </div>
        <div>
          <h3 className="font-display text-xl font-700 text-[var(--color-iamet-text)] mb-2">
            ¡Mensaje recibido!
          </h3>
          <p className="text-sm text-[var(--color-iamet-text-muted)]">
            Un especialista de IAMET se pondrá en contacto contigo en menos de 24 horas.
          </p>
        </div>
        {score !== null && (
          <div className="neumorphic-inset rounded-xl p-4">
            <p className="text-xs text-[var(--color-iamet-text-subtle)] mb-1">Perfil de prioridad</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-[var(--color-iamet-bg-tertiary)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-iamet-accent)] to-[var(--color-iamet-cyan)]"
                />
              </div>
              <span className="text-sm font-700 gradient-text">{score}/100</span>
            </div>
            <p className="text-xs text-[var(--color-iamet-text-subtle)] mt-1">
              {score >= 70 ? "Alta prioridad — respuesta en menos de 4 horas" :
               score >= 40 ? "Prioridad media — respuesta en menos de 24 horas" :
               "Respuesta en menos de 48 horas"}
            </p>
          </div>
        )}
      </motion.div>
    );
  }

  const inputClass = "w-full neumorphic-inset rounded-xl px-4 py-2.5 text-sm text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] outline-none focus:ring-1 focus:ring-[var(--color-iamet-accent)] transition-all duration-150 bg-transparent";
  const labelClass = "flex items-center gap-1.5 text-xs font-medium text-[var(--color-iamet-text-muted)] mb-1.5";

  return (
    <div className="neumorphic rounded-2xl p-6 space-y-5">
      {!compact && (
        <div className="space-y-1">
          <h3 className="font-display text-xl font-700 text-[var(--color-iamet-text)]">
            Habla con un experto IAMET
          </h3>
          <p className="text-sm text-[var(--color-iamet-text-muted)]">
            Cuéntanos sobre tu empresa y te contactaremos en menos de 24 horas.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Company */}
          <div>
            <label className={labelClass}>
              <Building2 className="w-3.5 h-3.5" /> Empresa *
            </label>
            <input
              type="text"
              placeholder="Nombre de tu empresa"
              value={form.company}
              onChange={set("company")}
              required
              className={inputClass}
            />
          </div>

          {/* Contact Name */}
          <div>
            <label className={labelClass}>
              <User className="w-3.5 h-3.5" /> Nombre *
            </label>
            <input
              type="text"
              placeholder="Tu nombre completo"
              value={form.contactName}
              onChange={set("contactName")}
              required
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>
              <Mail className="w-3.5 h-3.5" /> Email *
            </label>
            <input
              type="email"
              placeholder="correo@empresa.com"
              value={form.email}
              onChange={set("email")}
              required
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>
              <Phone className="w-3.5 h-3.5" /> Teléfono
            </label>
            <input
              type="tel"
              placeholder="+52 55 0000 0000"
              value={form.phone}
              onChange={set("phone")}
              className={inputClass}
            />
          </div>

          {/* Industry */}
          <div>
            <label className={labelClass}>
              <Factory className="w-3.5 h-3.5" /> Industria
            </label>
            <select value={form.industry} onChange={set("industry")} className={inputClass}>
              <option value="">Seleccionar industria</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Company Size */}
          <div>
            <label className={labelClass}>
              <Users className="w-3.5 h-3.5" /> Tamaño de empresa
            </label>
            <select value={form.companySize} onChange={set("companySize")} className={inputClass}>
              <option value="">Seleccionar tamaño</option>
              {COMPANY_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Problem Description */}
        <div>
          <label className={labelClass}>
            <MessageSquare className="w-3.5 h-3.5" /> ¿Cuál es tu principal reto tecnológico?
          </label>
          <textarea
            placeholder="Describe brevemente el problema o necesidad que tienes..."
            value={form.problemDescription}
            onChange={set("problemDescription")}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        <Button
          type="submit"
          disabled={createLead.isPending || !form.company || !form.contactName || !form.email}
          className="w-full bg-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-hover)] text-white font-semibold btn-press glow-accent-sm disabled:opacity-50"
        >
          {createLead.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Solicitar Asesoría Gratuita
            </>
          )}
        </Button>

        <p className="text-xs text-center text-[var(--color-iamet-text-subtle)]">
          Al enviar, aceptas que IAMET te contacte para brindarte asesoría tecnológica.
        </p>
      </form>
    </div>
  );
}

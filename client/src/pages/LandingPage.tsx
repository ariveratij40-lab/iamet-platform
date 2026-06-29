/**
 * Landing Factory — Componente reutilizable para las 14 verticales de IAMET
 * Recibe un LandingConfig y renderiza la landing page completa.
 * Ruta: /soluciones/:vertical
 */
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cable, Server, Shield, Zap, FileText, Wrench, Camera, Monitor, Bell, HardDrive,
  Globe, Fingerprint, CreditCard, Smartphone, Users, Link, AlertTriangle, Tag,
  MapPin, Package, Truck, BarChart, Wind, Activity, Settings, Cpu, Brain,
  MessageSquare, Eye, Database, Cloud, Headphones, Volume2, Music, Mic, Video,
  Calendar, Wifi, Network, Award, ChevronDown, ChevronRight, ArrowRight, CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLanding, type LandingConfig } from "@/data/landings";
import { trpc } from "@/lib/trpc";
import { CalendarPicker } from "@/components/CalendarPicker";
import { useAnalytics } from "@/hooks/useAnalytics";

// ─── Icon resolver ────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Cable, Server, Shield, Zap, FileText, Wrench, Camera, Monitor, Bell, HardDrive,
  Globe, Fingerprint, CreditCard, Smartphone, Users, Link, AlertTriangle, Tag,
  MapPin, Package, Truck, BarChart, Wind, Activity, Settings, Cpu, Brain,
  MessageSquare, Eye, Database, Cloud, Headphones, Volume2, Music, Mic, Video,
  Calendar, Wifi, Network, Award,
};

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = ICON_MAP[name] ?? Shield;
  return <Comp className={className} />;
}

// ─── Accent color map ─────────────────────────────────────────────────────────
const ACCENT: Record<string, { bg: string; text: string; border: string; glow: string; badge: string }> = {
  blue:    { bg: "bg-blue-600",    text: "text-blue-400",    border: "border-blue-500/30",  glow: "shadow-blue-500/20",   badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  cyan:    { bg: "bg-cyan-600",    text: "text-cyan-400",    border: "border-cyan-500/30",  glow: "shadow-cyan-500/20",   badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" },
  indigo:  { bg: "bg-indigo-600",  text: "text-indigo-400",  border: "border-indigo-500/30",glow: "shadow-indigo-500/20", badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" },
  emerald: { bg: "bg-emerald-600", text: "text-emerald-400", border: "border-emerald-500/30",glow:"shadow-emerald-500/20",badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  slate:   { bg: "bg-slate-600",   text: "text-slate-300",   border: "border-slate-500/30", glow: "shadow-slate-500/20",  badge: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  amber:   { bg: "bg-amber-600",   text: "text-amber-400",   border: "border-amber-500/30", glow: "shadow-amber-500/20",  badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  violet:  { bg: "bg-violet-600",  text: "text-violet-400",  border: "border-violet-500/30",glow: "shadow-violet-500/20", badge: "bg-violet-500/20 text-violet-300 border-violet-500/30" },
  teal:    { bg: "bg-teal-600",    text: "text-teal-400",    border: "border-teal-500/30",  glow: "shadow-teal-500/20",   badge: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  orange:  { bg: "bg-orange-600",  text: "text-orange-400",  border: "border-orange-500/30",glow: "shadow-orange-500/20", badge: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  rose:    { bg: "bg-rose-600",    text: "text-rose-400",    border: "border-rose-500/30",  glow: "shadow-rose-500/20",   badge: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  sky:     { bg: "bg-sky-600",     text: "text-sky-400",     border: "border-sky-500/30",   glow: "shadow-sky-500/20",    badge: "bg-sky-500/20 text-sky-300 border-sky-500/30" },
  yellow:  { bg: "bg-yellow-600",  text: "text-yellow-400",  border: "border-yellow-500/30",glow: "shadow-yellow-500/20", badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  gray:    { bg: "bg-gray-600",    text: "text-gray-300",    border: "border-gray-500/30",  glow: "shadow-gray-500/20",   badge: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
};

// ─── Chat flotante del especialista ──────────────────────────────────────────
function SpecialistChat({ config }: { config: LandingConfig }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessage = trpc.agent.sendMessage.useMutation();
  const { trackEvent } = useAnalytics();
  const accent = ACCENT[config.accentColor] ?? ACCENT.blue;

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = `¡Hola! Soy ${config.specialistName}, ${config.specialistRole} en IAMET. Estoy aquí para ayudarle con todo lo relacionado a ${config.title.toLowerCase()}. ¿En qué proyecto está trabajando?`;
      setMessages([{ role: "assistant", content: greeting }]);
      trackEvent("chat_started", { vertical: config.vertical });
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      // sendMessage requires a sessionId — use a stable per-specialist session
      const sessionKey = `landing_${config.vertical}_session`;
      let sessionId = sessionStorage.getItem(sessionKey);
      if (!sessionId) {
        sessionId = `landing_${config.vertical}_${Date.now()}`;
        sessionStorage.setItem(sessionKey, sessionId);
      }
      const result = await sendMessage.mutateAsync({
        sessionId,
        message: userMsg,
        specialistId: config.specialistId,
      });
      setMessages(prev => [...prev, { role: "assistant", content: result.reply }]);
      if (result.action === "schedule_meeting") {
        setShowCalendar(true);
        trackEvent("meeting_intent", { vertical: config.vertical });
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, hubo un error. Por favor intente de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full text-white font-medium shadow-lg ${accent.bg} ${accent.glow} shadow-xl`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        animate={open ? { opacity: 0, pointerEvents: "none" } : { opacity: 1, pointerEvents: "auto" }}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm">Hablar con {config.specialistName.split(" ")[1]}</span>
      </motion.button>

      {/* Panel de chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[600px] flex flex-col bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className={`flex items-center gap-3 px-4 py-3 ${accent.bg}`}>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                {config.specialistName.split(" ").slice(-1)[0][0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{config.specialistName}</p>
                <p className="text-white/70 text-xs truncate">{config.specialistRole}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-lg leading-none">×</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? `${accent.bg} text-white`
                      : "bg-white/10 text-slate-200"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 px-3 py-2 rounded-xl">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i} className={`w-1.5 h-1.5 rounded-full ${accent.bg}`}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {showCalendar && (
                <div className="mt-2">
                  <CalendarPicker
                    specialistId={config.specialistId}
                    onClose={() => setShowCalendar(false)}
                    onBooked={() => {
                      setShowCalendar(false);
                      trackEvent("meeting_booked", { vertical: config.vertical });
                      setMessages(prev => [...prev, {
                        role: "assistant",
                        content: "¡Perfecto! Su reunión ha sido agendada. Recibirá un correo de confirmación en breve. ¿Hay algo más en lo que pueda ayudarle?"
                      }]);
                    }}
                  />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Escriba su pregunta..."
                  className="flex-1 bg-white/10 text-white placeholder-white/40 text-sm px-3 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className={`${accent.bg} text-white px-3 py-2 rounded-lg disabled:opacity-40 transition-opacity`}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-white hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-sm">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-3" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="px-5 pb-4 text-slate-400 text-sm leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const { vertical } = useParams<{ vertical: string }>();
  const [, navigate] = useLocation();
  const { trackEvent } = useAnalytics();
  const config = getLanding(vertical ?? "");

  useEffect(() => {
    if (config) {
      document.title = config.metaTitle;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", config.metaDescription);
      trackEvent("vertical_viewed", { vertical: config.vertical });
    }
  }, [config]);

  if (!config) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Solución no encontrada</h1>
          <p className="text-slate-400 mb-6">La vertical solicitada no existe.</p>
          <Button onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const accent = ACCENT[config.accentColor] ?? ACCENT.blue;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={config.heroImage}
            alt={config.title}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            <Badge className={`mb-4 ${accent.badge} border text-xs font-medium`}>
              Solución Especializada
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 max-w-3xl">
              {config.title}
            </h1>
            <p className="text-slate-300 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">
              {config.subtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className={`${accent.bg} hover:opacity-90 text-white font-semibold px-8`}
                onClick={() => {
                  document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" });
                  trackEvent("cta_clicked", { vertical: config.vertical, position: "hero" });
                }}
              >
                {config.ctaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver solución completa
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-white/10 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {config.stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className={`text-3xl font-bold ${accent.text} mb-1`}>{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4">¿Qué incluye la solución?</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Cada proyecto es diseñado a la medida de sus requerimientos con los más altos estándares de calidad.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {config.features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={`p-6 rounded-2xl bg-slate-900 border ${accent.border} hover:border-opacity-60 transition-all`}
            >
              <div className={`w-10 h-10 rounded-xl ${accent.bg} bg-opacity-20 flex items-center justify-center mb-4`}>
                <Icon name={feature.icon} className={`w-5 h-5 ${accent.text}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Use Cases ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Casos de Éxito</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Proyectos reales en empresas como la suya.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config.useCases.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900 border border-white/10"
              >
                <Badge className={`mb-3 ${accent.badge} border text-xs`}>{uc.sector}</Badge>
                <h3 className="font-semibold text-white mb-2">{uc.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{uc.description}</p>
                <div className="flex items-center gap-1 mt-4 text-xs text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Proyecto completado</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Specialist CTA ───────────────────────────────────────────────── */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`rounded-3xl p-8 md:p-12 border ${accent.border} bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col md:flex-row items-center gap-8`}
        >
          <div className="flex-1">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${accent.badge} border text-xs font-medium mb-4`}>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Especialista disponible ahora
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Hable con {config.specialistName}
            </h2>
            <p className="text-slate-400 mb-2">{config.specialistRole}</p>
            <p className="text-slate-300 text-sm leading-relaxed">
              Más de 15 años de experiencia en {config.title.toLowerCase()}. Puede responder sus preguntas técnicas, evaluar su proyecto y agendar una visita sin compromiso.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Button
              size="lg"
              className={`${accent.bg} hover:opacity-90 text-white font-semibold px-8`}
              onClick={() => {
                document.querySelector<HTMLButtonElement>("[data-specialist-chat]")?.click();
                trackEvent("specialist_chat_opened", { vertical: config.vertical });
              }}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Iniciar conversación
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => {
                document.getElementById("cta-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Agendar reunión
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Preguntas Frecuentes</h2>
          </motion.div>
          <div className="space-y-3">
            {config.faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <FAQItem question={faq.question} answer={faq.answer} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section id="cta-section" className="py-24 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{config.ctaText}</h2>
          <p className="text-slate-400 mb-8 text-lg">{config.ctaSubtext}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              size="lg"
              className={`${accent.bg} hover:opacity-90 text-white font-semibold px-10 py-6 text-base`}
              onClick={() => {
                // Abrir el chat del especialista
                const chatBtn = document.querySelector<HTMLButtonElement>("[data-specialist-chat-open]");
                if (chatBtn) chatBtn.click();
                trackEvent("cta_clicked", { vertical: config.vertical, position: "bottom" });
              }}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Hablar con un especialista
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-10 py-6 text-base"
              onClick={() => navigate("/")}
            >
              Explorar todas las soluciones
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Floating Specialist Chat ──────────────────────────────────────── */}
      <SpecialistChat config={config} />
    </div>
  );
}

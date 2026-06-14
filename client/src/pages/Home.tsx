import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server, Shield, Cpu, Brain, Headphones, GraduationCap, FileCheck,
  ArrowRight, ChevronRight, Send, Loader2, Sparkles, Zap, Globe, Award, ShieldCheck, Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadForm from "@/components/LeadForm";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";

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

const QUICK_SUGGESTIONS = [
  "¿Cómo mejorar la seguridad de mi empresa?",
  "Necesito monitorear mi infraestructura 24/7",
  "¿Qué soluciones de RFID existen?",
  "Quiero automatizar procesos con IA",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id: string;
}

// ─── Inline Chat Component (Gemini-style) ────────────────────────────────────
function GeminiChat() {
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem("iamet_session_home");
    if (stored) return stored;
    const id = nanoid(16);
    sessionStorage.setItem("iamet_session_home", id);
    return id;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isInfraMode, setIsInfraMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startSession = trpc.agent.startSession.useMutation();
  const sendMessage = trpc.agent.sendMessage.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ensureSession = async () => {
    if (!sessionStarted) {
      await startSession.mutateAsync({ visitorId: sessionId });
      setSessionStarted(true);
    }
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    setChatOpen(true);
    setInput("");
    setIsLoading(true);

    const userMsg: ChatMessage = { id: nanoid(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    try {
      await ensureSession();
      const res = await sendMessage.mutateAsync({ sessionId, message: content });
      const assistantMsg: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: res.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (res.isInfraMode !== undefined) {
        setIsInfraMode(res.isInfraMode);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nanoid(), role: "assistant", content: "Lo siento, hubo un error. Por favor intenta de nuevo." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Chat messages — only shown after first message */}
      <AnimatePresence>
        {chatOpen && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="mb-4 max-h-72 overflow-y-auto space-y-4 px-1"
          >
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-[var(--color-iamet-accent-muted)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--color-iamet-accent)]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--color-iamet-accent)] text-white rounded-tr-sm"
                      : "bg-[var(--color-iamet-surface)] text-[var(--color-iamet-text-muted)] rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Streamdown>{msg.content}</Streamdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-full bg-[var(--color-iamet-accent-muted)] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-iamet-accent)]" />
                </div>
                <div className="bg-[var(--color-iamet-surface)] rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--color-iamet-accent)]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input bar — Gemini style */}
      <div
        className="relative flex items-center gap-3 rounded-2xl px-5 py-4 transition-all duration-200"
        style={{
          background: "var(--color-iamet-surface)",
          border: "1px solid var(--color-iamet-border)",
          boxShadow: "0 0 0 0 transparent",
        }}
        onFocus={() => {}}
      >
        {/* Plus icon */}
        <button
          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-iamet-text-subtle)] hover:text-[var(--color-iamet-accent)] transition-colors duration-150 flex-shrink-0"
          onClick={() => inputRef.current?.focus()}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isInfraMode ? "Pregunta sobre cableado, Panduit, certificación TIA..." : "Pregúntale al Agente Virtual IAMET..."}
          className="flex-1 bg-transparent text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] text-sm outline-none"
        />

        {/* Right side: model badge + send */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <AnimatePresence mode="wait">
            {isInfraMode ? (
              <motion.span
                key="panduit"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--color-iamet-accent)] border border-[var(--color-iamet-accent)]/50 rounded-full px-2.5 py-1 bg-[var(--color-iamet-accent-muted)]"
              >
                <ShieldCheck className="w-3 h-3" />
                Panduit Certified
              </motion.span>
            ) : (
              <motion.span
                key="iamet"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--color-iamet-text-subtle)] border border-[var(--color-iamet-border-subtle)] rounded-full px-2.5 py-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-iamet-accent)]" />
                IAMET AI
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-30 btn-press"
            style={{
              background: input.trim() ? "var(--color-iamet-accent)" : "var(--color-iamet-bg-tertiary)",
            }}
            type="button"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Quick suggestions — hidden once chat opens */}
      <AnimatePresence>
        {!chatOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mt-4"
          >
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3.5 py-2 rounded-full border border-[var(--color-iamet-border)] text-[var(--color-iamet-text-subtle)] hover:border-[var(--color-iamet-accent)] hover:text-[var(--color-iamet-accent)] transition-all duration-150 btn-press"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Home Component ──────────────────────────────────────────────────────
export default function Home() {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const { data: verticals = [] } = trpc.verticals.list.useQuery();

  return (
    <div className="min-h-screen bg-[var(--color-iamet-bg)]">

      {/* ── HERO — Gemini-style with cinematic logo reveal ──────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Stage 1: Deep dark base */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "var(--color-iamet-bg)" }} />

        {/* Stage 2: Animated radial burst — expands from center on load */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: [0.23, 1, 0.32, 1] }}
          style={{
            background: "radial-gradient(ellipse 70% 55% at 50% 48%, oklch(0.28 0.12 240 / 0.75) 0%, oklch(0.20 0.08 240 / 0.35) 40%, transparent 72%)",
          }}
        />

        {/* Stage 3: Secondary warm glow ring */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2.4, delay: 0.4, ease: "easeOut" }}
          style={{
            background: "radial-gradient(ellipse 45% 35% at 50% 46%, oklch(0.45 0.18 220 / 0.18) 0%, transparent 65%)",
          }}
        />

        {/* Stage 4: Subtle animated pulse ring behind logo */}
        <motion.div
          className="absolute pointer-events-none"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, height: 480 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.15, 0.08], scale: [0.5, 1.1, 1.3] }}
          transition={{ duration: 3, delay: 0.2, ease: "easeOut" }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              background: "radial-gradient(circle, oklch(0.55 0.22 240 / 0.6) 0%, transparent 65%)",
              filter: "blur(32px)",
            }}
          />
        </motion.div>

        {/* Very subtle grid */}
        <motion.div
          className="absolute inset-0 bg-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 2, delay: 0.6 }}
        />

        <div className="relative z-10 w-full flex flex-col items-center px-4 gap-10">
          {/* IAMET logo — cinematic reveal: scale + fade + glow burst */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <div className="relative">
              {/* Persistent soft glow halo */}
              <motion.div
                className="absolute pointer-events-none"
                style={{ inset: "-40px", borderRadius: "50%" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.3] }}
                transition={{ duration: 1.6, delay: 0.4, ease: "easeOut" }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    background: "radial-gradient(circle, oklch(0.6 0.22 230 / 0.55) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />
              </motion.div>

              {/* Burst flash on entry — fades quickly */}
              <motion.div
                className="absolute pointer-events-none"
                style={{ inset: "-80px" }}
                initial={{ opacity: 0.7, scale: 0.8 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 1.0, delay: 0.2, ease: "easeOut" }}
              >
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: "radial-gradient(circle, oklch(0.65 0.25 225 / 0.5) 0%, transparent 60%)",
                    filter: "blur(16px)",
                  }}
                />
              </motion.div>

              {/* The logo itself */}
              <img
                src="/manus-storage/logo-iamet-v2-hero_138c8f54.png"
                alt="IAMET Evolución Tecnológica"
                className="relative w-[320px] sm:w-[380px] lg:w-[440px] h-auto object-contain"
                style={{
                  filter: "brightness(1.15) saturate(1.2) drop-shadow(0 0 28px oklch(0.55 0.22 240 / 0.7)) drop-shadow(0 0 12px oklch(0.65 0.25 225 / 0.4))",
                }}
              />
            </div>
          </motion.div>

          {/* Headline — large, centered, minimal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="text-center space-y-3"
          >
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-800 text-[var(--color-iamet-text)] tracking-tight leading-[1.1]">
              ¿En qué podemos ayudarte?
            </h1>
            <p className="text-[var(--color-iamet-text-subtle)] text-base sm:text-lg max-w-md mx-auto">
              El Agente Virtual IAMET diagnostica tus necesidades y recomienda soluciones tecnológicas en minutos.
            </p>
          </motion.div>

          {/* Chat input — the hero element */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-2xl"
          >
            <GeminiChat />
          </motion.div>

          {/* Secondary CTAs — small, below chat */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-wrap justify-center gap-3"
          >
            <Link href="/tech-advisor">
              <Button
                size="sm"
                className="bg-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-hover)] text-white font-medium px-5 btn-press glow-accent-sm"
              >
                <Zap className="w-3.5 h-3.5 mr-1.5" />
                Diagnóstico Gratuito
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowLeadForm(true)}
              className="border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] hover:border-[var(--color-iamet-accent)] hover:text-[var(--color-iamet-accent)] bg-transparent btn-press"
            >
              Hablar con un Experto
            </Button>
          </motion.div>

          {/* Stats strip — minimal */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 pt-2"
          >
            {[
              { value: "200+", label: "Proyectos" },
              { value: "15+", label: "Años de experiencia" },
              { value: "99.9%", label: "Uptime" },
              { value: "24/7", label: "Soporte" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-lg font-800 gradient-text">{stat.value}</p>
                <p className="text-xs text-[var(--color-iamet-text-subtle)]">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Trusted By ───────────────────────────────────────────────────────── */}
      <section className="py-6 border-y border-[var(--color-iamet-border-subtle)]">
        <div className="container">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            <span className="text-xs text-[var(--color-iamet-text-subtle)] uppercase tracking-widest">
              Sectores que confían en IAMET
            </span>
            {["Manufactura", "Retail", "Salud", "Gobierno", "Logística", "Educación"].map((sector) => (
              <span key={sector} className="flex items-center gap-1.5 text-sm text-[var(--color-iamet-text-muted)]">
                <Globe className="w-3 h-3 text-[var(--color-iamet-accent)]" />
                {sector}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 Verticales ─────────────────────────────────────────────────────── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="container relative z-10">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {(verticals.length > 0 ? verticals : FALLBACK_VERTICALS).map((v, i) => {
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
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                        style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div>
                        <h3 className="font-display font-700 text-[var(--color-iamet-text)] text-base leading-tight mb-1.5">
                          {v.name}
                        </h3>
                        <p className="text-xs text-[var(--color-iamet-text-subtle)] leading-relaxed line-clamp-2">
                          {v.description}
                        </p>
                      </div>
                      {solutions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-auto">
                          {solutions.slice(0, 3).map((sol) => (
                            <span key={sol} className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
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
                      <div className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ color }}>
                        Ver soluciones <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-12"
          >
            <Link href="/tech-advisor">
              <Button size="lg" className="bg-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-hover)] text-white font-semibold btn-press glow-accent-sm">
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
              <Button size="lg" className="text-white font-semibold btn-press" style={{ backgroundColor: "var(--color-v-edu)" }}>
                Explorar Cursos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/tech-advisor">
              <Button size="lg" variant="outline" className="border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] hover:border-[var(--color-iamet-accent)] hover:text-[var(--color-iamet-accent)] bg-transparent btn-press">
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

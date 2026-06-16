import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id: string;
}

const QUICK_SUGGESTIONS = [
  "¿Cómo mejorar la seguridad de mi empresa?",
  "Necesito cableado estructurado Cat6A",
  "¿Qué soluciones de RFID existen?",
  "Quiero automatizar procesos con IA",
];

// ─── WhatsApp Floating Button ─────────────────────────────────────────────────
function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/5215512345678?text=Hola%2C%20me%20interesa%20conocer%20las%20soluciones%20de%20IAMET"
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full px-4 py-3 shadow-lg"
      style={{
        background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
        boxShadow: "0 4px 24px rgba(37, 211, 102, 0.45)",
      }}
      aria-label="Contactar por WhatsApp"
    >
      {/* WhatsApp SVG icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="w-5 h-5 flex-shrink-0"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span className="text-white text-sm font-semibold hidden sm:block">WhatsApp</span>
    </motion.a>
  );
}

// ─── Main Chat Component ──────────────────────────────────────────────────────
function AgentPrompt() {
  const [visitorId] = useState(() => {
    const stored = sessionStorage.getItem("iamet_visitor_home");
    if (stored) return stored;
    const id = nanoid(16);
    sessionStorage.setItem("iamet_visitor_home", id);
    return id;
  });
  const [conversationSessionId, setConversationSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isInfraMode, setIsInfraMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startSession = trpc.agent.startSession.useMutation();
  const sendMessage = trpc.agent.sendMessage.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ensureSession = async (): Promise<string> => {
    if (conversationSessionId) return conversationSessionId;
    const result = await startSession.mutateAsync({ visitorId });
    setConversationSessionId(result.sessionId);
    return result.sessionId;
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
      const activeSessionId = await ensureSession();
      const res = await sendMessage.mutateAsync({ sessionId: activeSessionId, message: content });
      setMessages((prev) => [
        ...prev,
        { id: nanoid(), role: "assistant", content: res.reply },
      ]);
      if (res.isInfraMode !== undefined) setIsInfraMode(res.isInfraMode);
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
    <div className="w-full max-w-2xl mx-auto flex flex-col">
      {/* Messages area */}
      <AnimatePresence>
        {chatOpen && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="mb-5 max-h-[55vh] overflow-y-auto space-y-4 px-1 scrollbar-thin"
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
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
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

      {/* Input bar */}
      <div
        className="relative flex items-center gap-3 rounded-2xl px-5 py-4 transition-all duration-200"
        style={{
          background: "var(--color-iamet-surface)",
          border: "1px solid var(--color-iamet-border)",
        }}
      >
        <button
          className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-iamet-text-subtle)] hover:text-[var(--color-iamet-accent)] transition-colors duration-150 flex-shrink-0"
          onClick={() => inputRef.current?.focus()}
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isInfraMode
              ? "Pregunta sobre cableado, Panduit, certificación TIA..."
              : "Pregúntale al Agente Virtual IAMET..."
          }
          className="flex-1 bg-transparent text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] text-sm outline-none"
        />

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

// ─── Services Fan ───────────────────────────────────────────────────────────
const SERVICES = [
  { label: "Análisis de Redes",        icon: "🖥️",  color: "#C0392B", angle: -90 },
  { label: "Pólizas de Mantenimiento", icon: "🔧",  color: "#8E1A2E", angle: -63 },
  { label: "Proyectos Ejecutivos",     icon: "💼",  color: "#E67E22", angle: -36 },
  { label: "Soluciones de Energía",    icon: "⚡",  color: "#2980B9", angle: -9  },
  { label: "Redes Wi-Fi",              icon: "📶",  color: "#E74C3C", angle:  18 },
  { label: "Computadoras y Tecnología",icon: "🖱️",  color: "#2471A3", angle:  45 },
  { label: "Seguridad",                icon: "📷",  color: "#27AE60", angle:  72 },
  { label: "Soluciones de Audio/Video",icon: "▶️",  color: "#17A589", angle:  99 },
  { label: "Cableado Voz, Datos y Video",icon: "🔌", color: "#1E8449", angle: 126 },
];

// Abanico: los nodos se distribuyen en arco semicircular superior
// El origen del abanico está en la parte inferior central
const FAN_RADIUS = 210; // px desde el origen
const FAN_ORIGIN_Y = 20; // px desde el borde inferior del contenedor

function ServiceFan() {
  const [hovered, setHovered] = useState<number | null>(null);

  // Ángulos: semicirculo superior estricto de -160° a -20° (9 nodos)
  // Todos negativos = mitad superior del círculo
  const angles = [
    -160, -140, -120, -100, -90, -80, -60, -40, -20,
  ];

  // Altura del contenedor = radio + margen superior para los nodos
  const containerH = FAN_RADIUS + FAN_ORIGIN_Y + 60; // 60 = radio del nodo + label

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto select-none"
      style={{ height: containerH }}
      initial="hidden"
      animate="visible"
    >
      {/* Líneas del abanico */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 640 ${containerH}`}
        preserveAspectRatio="xMidYMax meet"
      >
        {SERVICES.map((svc, i) => {
          const rad = (angles[i] * Math.PI) / 180;
          const cx = 320;
          const cy = containerH - FAN_ORIGIN_Y;
          const nx = cx + FAN_RADIUS * Math.cos(rad);
          const ny = cy + FAN_RADIUS * Math.sin(rad);
          return (
            <motion.line
              key={i}
              x1={cx} y1={cy}
              x2={nx} y2={ny}
              stroke={svc.color}
              strokeWidth={hovered === i ? 2.5 : 1.5}
              strokeOpacity={hovered === i ? 0.9 : 0.35}
              strokeDasharray="5 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.07, ease: [0.23, 1, 0.32, 1] }}
            />
          );
        })}
        {/* Punto origen */}
        <motion.circle
          cx={320} cy={containerH - FAN_ORIGIN_Y}
          r={6}
          fill="oklch(0.55 0.22 255)"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        />
      </svg>

      {/* Nodos de servicios */}
      {SERVICES.map((svc, i) => {
        const rad = (angles[i] * Math.PI) / 180;
        const cx = 50; // % — usamos posición absoluta calculada
        const originX = 50; // % del contenedor
        const originY = containerH - FAN_ORIGIN_Y;
        // Posición en px desde el centro del contenedor (asumimos 640px de ancho lógico)
        const nx = 320 + FAN_RADIUS * Math.cos(rad);
        const ny = originY + FAN_RADIUS * Math.sin(rad);
        // Convertir a % del contenedor
        const leftPct = (nx / 640) * 100;
        const topPx = ny;

        return (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center gap-1 cursor-pointer"
            style={{
              left: `${leftPct}%`,
              top: topPx - 28, // centrar el nodo (radio 28px)
              transform: "translateX(-50%)",
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.2 + i * 0.08,
              ease: [0.23, 1, 0.32, 1],
            }}
            onHoverStart={() => setHovered(i)}
            onHoverEnd={() => setHovered(null)}
            whileHover={{ scale: 1.18, y: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Círculo del nodo */}
            <motion.div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${svc.color}ee, ${svc.color}99)`,
                boxShadow:
                  hovered === i
                    ? `0 0 0 3px ${svc.color}55, 0 8px 28px ${svc.color}66`
                    : `0 4px 16px ${svc.color}44`,
                transition: "box-shadow 200ms ease",
              }}
            >
              <span role="img" aria-label={svc.label}>{svc.icon}</span>
            </motion.div>

            {/* Label — aparece en hover */}
            <AnimatePresence>
              {hovered === i && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                  className="absolute -bottom-8 whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-full text-white shadow-md"
                  style={{ background: svc.color, zIndex: 10 }}
                >
                  {svc.label}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-iamet-bg)] flex flex-col">
      {/* Full-screen hero: centered agent prompt — pr-14 para no solapar el sidebar colapsado */}
      <section className="flex-1 flex flex-col items-center justify-center relative overflow-hidden px-4 pr-[72px] py-20">
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: [0.23, 1, 0.32, 1] }}
          style={{
            background:
              "radial-gradient(ellipse 65% 50% at 50% 42%, oklch(0.75 0.12 255 / 0.12) 0%, oklch(0.85 0.06 255 / 0.06) 50%, transparent 75%)",
          }}
        />
        <motion.div
          className="absolute inset-0 bg-grid pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.06 }}
          transition={{ duration: 2, delay: 0.4 }}
        />

        <div className="relative z-10 w-full flex flex-col items-center gap-8">
          {/* Abanico de Servicios */}
          <ServiceFan />

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="text-center space-y-2"
          >
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-800 text-[var(--color-iamet-text)] tracking-tight leading-[1.1]">
              ¿En qué podemos ayudarte?
            </h1>
            <p className="text-[var(--color-iamet-text-subtle)] text-sm sm:text-base max-w-sm mx-auto">
              El Agente Virtual IAMET diagnostica tus necesidades tecnológicas en minutos.
            </p>
          </motion.div>

          {/* Chat prompt — the hero element */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-2xl"
          >
            <AgentPrompt />
          </motion.div>
        </div>
      </section>

      {/* WhatsApp floating button */}
      <WhatsAppButton />
    </div>
  );
}

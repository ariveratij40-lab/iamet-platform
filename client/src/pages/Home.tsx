import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Sparkles, ShieldCheck,
  Wrench, FolderKanban, Zap,
  Wifi, Monitor, ShieldCheck as ShieldIcon, Tv2, Cable,
  X, ChevronRight, ChevronLeft, Layers, MessageSquare, Phone,
  type LucideIcon,
} from "lucide-react";
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
interface Service {
  label: string;
  Icon: LucideIcon;
  color: string;
  angle: number;
}

// Ángulos: semicírculo SUPERIOR simétrico
// 8 nodos distribuidos simétricamente: -154, -132, -110, -88, -66, -44, -22, 0° → todos sin() < 0
// Rango: -154° a -26°, paso = 18.3°, centrado en -90°
const SERVICES: Service[] = [
  { label: "Pólizas de Mantenimiento",   Icon: Wrench,        color: "#7C3AED", angle: -154 },
  { label: "Proyectos Ejecutivos",       Icon: FolderKanban,  color: "#0EA5E9", angle: -128 },
  { label: "Soluciones de Energía",      Icon: Zap,           color: "#F59E0B", angle: -103 },
  { label: "Redes Wi-Fi",                Icon: Wifi,          color: "#EF4444", angle:  -77 },
  { label: "Computadoras y Tecnología",  Icon: Monitor,       color: "#3B82F6", angle:  -52 },
  { label: "Seguridad",                  Icon: ShieldIcon,    color: "#10B981", angle:  -26 },
  { label: "Soluciones de Audio/Video",  Icon: Tv2,           color: "#06B6D4", angle:   -1 },
  { label: "Cableado Voz, Datos y Video",Icon: Cable,         color: "#22C55E", angle:   25 },
];

// ─── Constantes del abanico SVG ──────────────────────────────────────────────
// Usamos un SVG puro para control total de posicionamiento
// ViewBox: 900 x 480. Origen del abanico: (450, 460) — parte inferior central
const VB_W = 900;
const VB_H = 480;
const OX = 450; // origen X (centro)
const OY = 460; // origen Y (parte inferior)
const R_ICON = 310; // radio al centro del icono
const R_LABEL = 390; // radio al centro del label (más afuera)
const ICON_R = 36; // radio del círculo del icono (72px diámetro)
const LINE_R_START = R_ICON + ICON_R + 6; // inicio de la línea (borde del icono)
const LINE_R_END = R_LABEL - 28; // fin de la línea (antes del label)

function ServiceFan() {
  const [hovered, setHovered] = useState<number | null>(null);

  // 8 nodos centrados en -90° (cima), spread ±70°
  const N = SERVICES.length;
  const CENTER_DEG = -90;
  const SPREAD_DEG = 140;
  const angles = Array.from({ length: N }, (_, i) =>
    CENTER_DEG - SPREAD_DEG / 2 + (i / (N - 1)) * SPREAD_DEG
  );

  return (
    <div className="w-full select-none" style={{ maxWidth: 900 }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        style={{ overflow: "visible", display: "block" }}
        aria-label="Nuestros servicios"
      >
        {/* Definiciones de filtros */}
        <defs>
          <filter id="shadow-node" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0,0,0,0.09)" />
          </filter>
          <filter id="shadow-hover" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="rgba(0,0,0,0.16)" />
          </filter>
        </defs>

        {/* Badge "NUESTROS SERVICIOS" centrado en OX */}
        <motion.g
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformOrigin: `${OX}px ${OY}px` }}
        >
          <rect
            x={OX - 90} y={OY - 18}
            width={180} height={36}
            rx={18}
            fill="rgba(0,113,227,0.08)"
            stroke="rgba(0,113,227,0.28)"
            strokeWidth={1.2}
          />
          <text
            x={OX} y={OY + 5.5}
            textAnchor="middle"
            fontSize={10}
            fontWeight={300}
            letterSpacing={2.5}
            fill="#0071E3"
            style={{ fontFamily: "inherit", textTransform: "uppercase" }}
          >
            NUESTROS SERVICIOS
          </text>
        </motion.g>

        {/* Nodos */}
        {SERVICES.map((svc, i) => {
          const rad = (angles[i] * Math.PI) / 180;
          const ix = OX + R_ICON * Math.cos(rad);
          const iy = OY + R_ICON * Math.sin(rad);
          const lx = OX + R_LABEL * Math.cos(rad);
          const ly = OY + R_LABEL * Math.sin(rad);
          const ls1x = OX + LINE_R_START * Math.cos(rad);
          const ls1y = OY + LINE_R_START * Math.sin(rad);
          const ls2x = OX + LINE_R_END * Math.cos(rad);
          const ls2y = OY + LINE_R_END * Math.sin(rad);
          const isHov = hovered === i;

          // Alineación del texto según posición horizontal
          const textAnchor = ix < OX - 20 ? "end" : ix > OX + 20 ? "start" : "middle";

          return (
            <motion.g
              key={i}
              style={{ cursor: "pointer" }}
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.23, 1, 0.32, 1] }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
            >
              {/* Línea conectora icono → label — color del servicio permanente */}
              <line
                x1={ls1x} y1={ls1y}
                x2={ls2x} y2={ls2y}
                stroke={svc.color}
                strokeWidth={isHov ? 2 : 1.2}
                strokeDasharray={isHov ? "none" : "5 3"}
                opacity={isHov ? 0.9 : 0.45}
                style={{ transition: "stroke-width 200ms, opacity 200ms" }}
              />

              {/* Círculo del icono — color de fondo permanente con baja opacidad */}
              <circle
                cx={ix} cy={iy} r={ICON_R}
                fill={isHov ? `${svc.color}30` : `${svc.color}14`}
                stroke={isHov ? svc.color : `${svc.color}55`}
                strokeWidth={isHov ? 1.8 : 1.2}
                filter={isHov ? "url(#shadow-hover)" : "url(#shadow-node)"}
                style={{ transition: "fill 200ms, stroke 200ms" }}
              />

              {/* Icono SVG Lucide renderizado como foreignObject */}
              <foreignObject
                x={ix - 18} y={iy - 18}
                width={36} height={36}
                style={{ overflow: "visible", pointerEvents: "none" }}
              >
                <div
                  style={{
                    width: 36, height: 36,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svc.Icon
                    size={22}
                    color={isHov ? svc.color : "#374151"}
                    strokeWidth={1.5}
                  />
                </div>
              </foreignObject>

              {/* Label externo — texto en 2 líneas si es largo */}
              <text
                x={lx} y={ly - 6}
                textAnchor={textAnchor}
                fontSize={11}
                fontWeight={300}
                letterSpacing={0.3}
                fill={isHov ? svc.color : "#374151"}
                style={{ fontFamily: "inherit", transition: "fill 200ms", lineHeight: 1.4 }}
              >
                {/* Dividir en 2 líneas si tiene espacio */}
                {svc.label.split(" ").length <= 2 ? (
                  <tspan>{svc.label}</tspan>
                ) : (
                  (() => {
                    const words = svc.label.split(" ");
                    const mid = Math.ceil(words.length / 2);
                    const line1 = words.slice(0, mid).join(" ");
                    const line2 = words.slice(mid).join(" ");
                    return (
                      <>
                        <tspan x={lx} dy={0}>{line1}</tspan>
                        <tspan x={lx} dy={15}>{line2}</tspan>
                      </>
                    );
                  })()
                )}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
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

      {/* Asistente de onboarding */}
      <OnboardingAssistant />
    </div>
  );
}

// ─── Onboarding Assistant ───────────────────────────────────────────────────
const ONBOARDING_STEPS = [
  {
    icon: Layers,
    title: "Bienvenido a IAMET",
    body: "Somos especialistas en soluciones tecnológicas para empresas: infraestructura de red, seguridad, audio/video, cómputo y más. El abanico superior muestra nuestras áreas de servicio.",
    color: "#0071E3",
  },
  {
    icon: MessageSquare,
    title: "Agente Virtual IAMET",
    body: "El campo de texto central es nuestro Agente Virtual con IA. Escribe tu necesidad o pregunta — por ejemplo \"Necesito cámaras de seguridad\" — y el agente te dará una recomendación personalizada en segundos.",
    color: "#7C3AED",
  },
  {
    icon: Layers,
    title: "Sugerencias rápidas",
    body: "Debajo del chat encontrarás preguntas frecuentes. Haz clic en cualquiera para iniciar la conversación al instante. El agente detecta automáticamente el tipo de solución que necesitas.",
    color: "#10B981",
  },
  {
    icon: Phone,
    title: "Habla con un experto",
    body: "Si prefieres atención directa, usa el botón de WhatsApp en la esquina inferior derecha. Un asesor IAMET te contactará de inmediato para darte una cotización sin compromiso.",
    color: "#25D366",
  },
];

function OnboardingAssistant() {
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem("iamet_onboarding_done");
    } catch {
      return true;
    }
  });
  const [step, setStep] = useState(0);
  const total = ONBOARDING_STEPS.length;
  const current = ONBOARDING_STEPS[step];

  const dismiss = () => {
    try { localStorage.setItem("iamet_onboarding_done", "1"); } catch {}
    setVisible(false);
  };

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Overlay semitransparente */}
          <motion.div
            className="fixed inset-0 z-[90] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ background: "rgba(0,0,0,0.18)", backdropFilter: "blur(2px)" }}
          />

          {/* Panel del asistente — esquina inferior izquierda */}
          <motion.div
            className="fixed bottom-6 left-6 z-[100] w-80 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.94 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            style={{
              background: "rgba(255,255,255,0.97)",
              border: "1px solid rgba(0,0,0,0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
            }}
          >
            {/* Barra de color superior */}
            <motion.div
              className="h-1 w-full"
              style={{ background: current.color }}
              key={step}
              initial={{ scaleX: 0, transformOrigin: "left" }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${current.color}18`, border: `1.5px solid ${current.color}33` }}
                  >
                    <current.icon size={18} color={current.color} strokeWidth={1.8} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: current.color }}>
                      Paso {step + 1} de {total}
                    </p>
                    <h3 className="text-sm font-semibold text-gray-800 leading-tight">
                      {current.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
                  aria-label="Cerrar tour"
                >
                  <X size={14} color="#9CA3AF" />
                </button>
              </div>

              {/* Cuerpo */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={step}
                  className="text-xs text-gray-500 leading-relaxed mb-4"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  {current.body}
                </motion.p>
              </AnimatePresence>

              {/* Indicadores de paso */}
              <div className="flex items-center gap-1.5 mb-4">
                {ONBOARDING_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStep(idx)}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: idx === step ? 20 : 6,
                      background: idx === step ? current.color : "#E5E7EB",
                    }}
                    aria-label={`Ir al paso ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Botones de navegación */}
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={prev}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft size={14} />
                    Anterior
                  </button>
                )}
                <button
                  onClick={next}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-[0.97]"
                  style={{
                    background: current.color,
                    boxShadow: `0 4px 14px ${current.color}44`,
                  }}
                >
                  {step < total - 1 ? (
                    <>
                      Siguiente
                      <ChevronRight size={14} />
                    </>
                  ) : (
                    "Entendido — ¡Empezar!"
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Sparkles, ShieldCheck,
  Wrench, FolderKanban, Zap,
  Monitor, ShieldCheck as ShieldIcon, Tv2, Network, Server, Code2,
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

// ─── Main Chat Component ──────────────────────────────────────────────────────
interface AgentPromptHandle {
  triggerSend: (text: string) => void;
}

const AgentPrompt = forwardRef<AgentPromptHandle>(function AgentPrompt(_, ref) {
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

  const inputRef2 = useRef(input);
  useEffect(() => { inputRef2.current = input; }, [input]);

  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? inputRef2.current).trim();
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
  }, [conversationSessionId, isLoading]);

  useImperativeHandle(ref, () => ({
    triggerSend: (text: string) => handleSend(text),
  }), [handleSend]);

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
});

// ─── Services Fan ───────────────────────────────────────────────────────────
interface Service {
  label: string;
  Icon: LucideIcon;
  color: string;
  angle: number;
  description: string;
  query: string; // Pregunta pre-cargada al hacer clic
}

const SERVICES: Service[] = [
  {
    label: "Pólizas de Mantenimiento",
    Icon: Wrench,
    color: "#7C3AED",
    angle: -154,
    description: "Contratos preventivos y correctivos para toda tu infraestructura tecnológica. Garantizamos continuidad operativa con SLA definidos, visitas programadas y soporte prioritario 24/7.",
    query: "Quiero información sobre pólizas de mantenimiento para mi infraestructura tecnológica",
  },
  {
    label: "Proyectos Ejecutivos",
    Icon: FolderKanban,
    color: "#0EA5E9",
    angle: -128,
    description: "Diseño, gestión e implementación de proyectos tecnológicos llave en mano. Desde el levantamiento de requerimientos hasta la entrega con documentación técnica completa y certificación.",
    query: "Necesito asesoría para un proyecto ejecutivo de tecnología en mi empresa",
  },
  {
    label: "Soluciones de Energía",
    Icon: Zap,
    color: "#F59E0B",
    angle: -103,
    description: "UPS, plantas de emergencia, PDUs inteligentes y sistemas de energía ininterrumpida para proteger tus equipos críticos ante cortes o variaciones de voltaje.",
    query: "¿Qué soluciones de energía y UPS ofrecen para proteger equipos críticos?",
  },
  {
    label: "Desarrollo de Software",
    Icon: Code2,
    color: "#EF4444",
    angle: -77,
    description: "Desarrollo de aplicaciones web, móviles y sistemas a medida. Integramos IA, automatización de procesos y APIs para digitalizar y optimizar las operaciones de tu empresa.",
    query: "Me interesa desarrollar software a medida o una aplicación para mi empresa",
  },
  {
    label: "Computadoras y Tecnología",
    Icon: Monitor,
    color: "#3B82F6",
    angle: -52,
    description: "Suministro, configuración y soporte de equipos de cómputo, servidores, periféricos y licencias de software. Soluciones para usuarios finales y centros de datos.",
    query: "Necesito equipos de cómputo, servidores o tecnología para mi empresa",
  },
  {
    label: "Seguridad",
    Icon: ShieldIcon,
    color: "#10B981",
    angle: -26,
    description: "Sistemas de CCTV, control de acceso, voceo y detección de intrusos. Protegemos tus instalaciones con tecnología IP de última generación y monitoreo remoto.",
    query: "¿Cómo puedo mejorar la seguridad electrónica de mis instalaciones con CCTV y control de acceso?",
  },
  {
    label: "Soluciones de Audio/Video",
    Icon: Tv2,
    color: "#06B6D4",
    angle: -1,
    description: "Salas de videoconferencia, señalización digital, sistemas de sonido profesional y AV integrado. Creamos experiencias de comunicación inmersivas para empresas y espacios públicos.",
    query: "Quiero implementar soluciones de audio y video profesional o una sala de videoconferencia",
  },
  {
    label: "Cableado Estructurado y Data Center",
    Icon: Network,
    color: "#22C55E",
    angle: 25,
    description: "Infraestructura de red certificada Cat6A/Fibra Óptica con garantía Panduit de hasta 25 años. Diseño y construcción de Data Centers con estándares TIA-942 y certificación Fluke.",
    query: "Necesito cableado estructurado certificado Cat6A o diseño de Data Center con estándares TIA-942",
  },
];

// ─── Constantes del abanico SVG ──────────────────────────────────────────────
// Usamos un SVG puro para control total de posicionamiento
// ViewBox: 900 x 480. Origen del abanico: (450, 480) — parte inferior central
const VB_W = 900;
const VB_H = 480;
const OX = 450; // origen X (centro)
const OY = 480; // origen Y (fuera del viewBox para que el badge quede centrado visualmente)
const R_ICON = 300; // radio al centro del icono
const R_LABEL = 385; // radio al centro del label
const ICON_R = 36; // radio del círculo del icono (72px diámetro)
const LINE_R_START = R_ICON + ICON_R + 6; // inicio de la línea (borde del icono)
const LINE_R_END = R_LABEL - 28; // fin de la línea (antes del label)

function ServiceFan({ onServiceClick }: { onServiceClick: (query: string) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 8 nodos centrados en -90° (cima), spread ±70°
  const N = SERVICES.length;
  const CENTER_DEG = -90;
  const SPREAD_DEG = 140;
  const angles = Array.from({ length: N }, (_, i) =>
    CENTER_DEG - SPREAD_DEG / 2 + (i / (N - 1)) * SPREAD_DEG
  );

  // Convierte coordenadas SVG a posición relativa al contenedor
  const svgToContainer = (svgX: number, svgY: number) => {
    const el = containerRef.current?.querySelector("svg") as SVGSVGElement | null;
    if (!el) return { x: 0, y: 0 };
    const pt = el.createSVGPoint();
    pt.x = svgX;
    pt.y = svgY;
    const screen = pt.matrixTransform(el.getScreenCTM()!);
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: screen.x - rect.left, y: screen.y - rect.top };
  };

  const handleHoverStart = (i: number, ix: number, iy: number) => {
    setHovered(i);
    const pos = svgToContainer(ix, iy);
    setTooltipPos(pos);
  };

  const handleHoverEnd = () => {
    setHovered(null);
    setTooltipPos(null);
  };

  const hoveredService = hovered !== null ? SERVICES[hovered] : null;

  return (
    <div ref={containerRef} className="w-full select-none relative" style={{ maxWidth: 900 }}>
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

        {/* Badge "NUESTROS SERVICIOS" — centrado en el centro geométrico del abanico */}
        {(() => {
          const N2 = SERVICES.length;
          const CENTER_DEG2 = -90;
          const SPREAD_DEG2 = 140;
          const ys = Array.from({ length: N2 }, (_, i) => {
            const deg = CENTER_DEG2 - SPREAD_DEG2 / 2 + (i / (N2 - 1)) * SPREAD_DEG2;
            return OY + R_ICON * Math.sin((deg * Math.PI) / 180);
          });
          const minY = Math.min(...ys);
          const maxY = Math.max(...ys);
          const badgeY = (minY + maxY) / 2;
          return (
            <motion.g
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformOrigin: `${OX}px ${badgeY}px` }}
            >
              <rect
                x={OX - 90} y={badgeY - 18}
                width={180} height={36}
                rx={18}
                fill="rgba(0,113,227,0.08)"
                stroke="rgba(0,113,227,0.28)"
                strokeWidth={1.2}
              />
              <text
                x={OX} y={badgeY + 5.5}
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
          );
        })()}

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
              onHoverStart={() => handleHoverStart(i, ix, iy)}
              onHoverEnd={handleHoverEnd}
              onClick={() => onServiceClick(svc.query)}
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

              {/* Círculo del icono */}
              <circle
                cx={ix} cy={iy} r={ICON_R}
                fill={isHov ? `${svc.color}30` : `${svc.color}14`}
                stroke={isHov ? svc.color : `${svc.color}55`}
                strokeWidth={isHov ? 1.8 : 1.2}
                filter={isHov ? "url(#shadow-hover)" : "url(#shadow-node)"}
                style={{ transition: "fill 200ms, stroke 200ms" }}
              />

              {/* Icono Lucide */}
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

              {/* Label externo */}
              <text
                x={lx} y={ly - 6}
                textAnchor={textAnchor}
                fontSize={11}
                fontWeight={300}
                letterSpacing={0.3}
                fill={isHov ? svc.color : "#374151"}
                style={{ fontFamily: "inherit", transition: "fill 200ms", lineHeight: 1.4 }}
              >
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

      {/* Tooltip de semblanza — panel HTML flotante posicionado sobre el icono */}
      <AnimatePresence>
        {hoveredService && tooltipPos && (
          <motion.div
            key={hovered}
            initial={{ opacity: 0, scale: 0.88, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y - 8,
              transform: "translate(-50%, -100%)",
              width: 240,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.97)",
                border: `1.5px solid ${hoveredService.color}40`,
                borderRadius: 16,
                boxShadow: `0 12px 40px rgba(0,0,0,0.13), 0 2px 8px ${hoveredService.color}22`,
                padding: "14px 16px",
              }}
            >
              {/* Header del tooltip */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  style={{
                    width: 28, height: 28,
                    borderRadius: 8,
                    background: `${hoveredService.color}18`,
                    border: `1.5px solid ${hoveredService.color}40`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <hoveredService.Icon size={15} color={hoveredService.color} strokeWidth={1.8} />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: hoveredService.color,
                    lineHeight: 1.3,
                  }}
                >
                  {hoveredService.label}
                </span>
              </div>
              {/* Descripción */}
              <p
                style={{
                  fontSize: 11,
                  color: "#4B5563",
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 300,
                }}
              >
                {hoveredService.description}
              </p>
              {/* Flecha inferior */}
              <div
                style={{
                  position: "absolute",
                  bottom: -7,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 12,
                  height: 7,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: 12, height: 12,
                    background: "rgba(255,255,255,0.97)",
                    border: `1.5px solid ${hoveredService.color}40`,
                    transform: "rotate(45deg) translate(-1px, -7px)",
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const agentRef = useRef<{ triggerSend: (text: string) => void }>(null);
  const [chatActive, setChatActive] = useState(false);
  const [chatMessages, setChatMessages] = useState(0);
  const [currentSection, setCurrentSection] = useState("hero");

  // Tracking de presencia
  const { logEvent } = useVisitorTracking({
    currentPage: "/",
    currentSection,
    chatActive,
    chatMessages,
  });

  const handleServiceClick = useCallback((query: string) => {
    agentRef.current?.triggerSend(query);
    // Scroll suave hacia el chat
    setTimeout(() => {
      const chatEl = document.getElementById("agent-chat-section");
      chatEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

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
          <ServiceFan onServiceClick={handleServiceClick} />

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
            <div id="agent-chat-section"><AgentPrompt ref={agentRef} /></div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

// ─── (Onboarding Assistant removed) ─────────────────────────────────────────


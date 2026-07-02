import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import LiveChatWidget from "@/components/LiveChatWidget";
import { CalendarPicker } from "@/components/CalendarPicker";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Sparkles, Mic, Paperclip, ChevronRight,
  Server, Shield, Cpu, Code2, Network, Zap, Brain, Database,
  Factory, KeyRound, Camera, Volume2, Monitor, Laptop, ClipboardList,
  Building2, Stethoscope, GraduationCap, Hotel, ShoppingBag, Landmark,
  Award, BookOpen, ArrowRight, CheckCircle2, Globe, AlertCircle, RefreshCw,
  CalendarDays,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Link } from "wouter";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface ToolUsed {
  name: string;
  success: boolean;
  summary: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id: string;
  isError?: boolean;
  retryText?: string;
  toolsUsed?: ToolUsed[];
  proposalData?: any;
  meetingData?: any;
}

interface AgentPromptHandle {
  triggerSend: (text: string, specialistId?: string) => void;
  getSessionId: () => string | null;
}

interface AgentPromptProps {
  onSessionStart?: (sessionId: string) => void;
  selectedSpecialist?: string | null;
}

// ─── Especialistas IA ─────────────────────────────────────────────────────────
const SPECIALISTS = [
  { id: "infraestructura", name: "Infraestructura", icon: Server, color: "#0EA5E9", desc: "Cableado, Data Centers, TIA" },
  { id: "cctv", name: "CCTV", icon: Camera, color: "#8B5CF6", desc: "Videovigilancia IP, analítica" },
  { id: "control-acceso", name: "Control de Acceso", icon: KeyRound, color: "#F59E0B", desc: "Biométrico, torniquetes, HID" },
  { id: "rfid", name: "RFID", icon: Cpu, color: "#10B981", desc: "Trazabilidad, inventarios, IoT" },
  { id: "redes", name: "Redes", icon: Network, color: "#06B6D4", desc: "Cisco, Fortinet, WiFi 6" },
  { id: "energia", name: "Energía", icon: Zap, color: "#F97316", desc: "UPS, plantas, PDUs" },
  { id: "software", name: "Software", icon: Code2, color: "#EF4444", desc: "Apps, RPA, automatización" },
  { id: "ia", name: "IA", icon: Brain, color: "#A855F7", desc: "Agentes, ML, visión" },
  { id: "data-centers", name: "Data Centers", icon: Database, color: "#3B82F6", desc: "Diseño, cooling, TIA-942" },
  { id: "industria4", name: "Industria 4.0", icon: Factory, color: "#22C55E", desc: "SCADA, IoT industrial, OT/IT" },
] as const;

// ─── Soluciones (9 verticales) ────────────────────────────────────────────────
const SOLUTIONS = [
  { slug: "infraestructura", name: "Infraestructura Tecnológica", icon: Server, color: "#0EA5E9", desc: "Cableado estructurado, Data Centers, fibra óptica y certificación Panduit" },
  { slug: "control-acceso", name: "Control de Acceso", icon: KeyRound, color: "#F59E0B", desc: "Lectores biométricos, torniquetes, gestión de identidades y HID Global" },
  { slug: "cctv", name: "CCTV y Videovigilancia", icon: Camera, color: "#8B5CF6", desc: "Cámaras IP, analítica de video, NVR/DVR y videovigilancia perimetral" },
  { slug: "audio-voceo", name: "Audio y Voceo", icon: Volume2, color: "#EC4899", desc: "Sistemas de voceo, intercomunicación y audio distribuido profesional" },
  { slug: "salas-juntas", name: "Salas de Juntas", icon: Monitor, color: "#14B8A6", desc: "Videoconferencia, colaboración híbrida y AV profesional" },
  { slug: "rfid", name: "RFID y Automatización", icon: Cpu, color: "#10B981", desc: "Trazabilidad, inventarios, activos fijos e IoT industrial" },
  { slug: "software-ia", name: "Desarrollo de Software e IA", icon: Brain, color: "#A855F7", desc: "Aplicaciones a medida, agentes IA, RPA y automatización inteligente" },
  { slug: "computo-licenciamiento", name: "Cómputo y Licenciamiento", icon: Laptop, color: "#6366F1", desc: "Equipos empresariales, servidores y Microsoft 365" },
  { slug: "polizas-servicios", name: "Pólizas y Servicios Administrados", icon: ClipboardList, color: "#F97316", desc: "NOC 24/7, mantenimiento preventivo y correctivo con SLA" },
];

// ─── Industrias ───────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { name: "Manufactura", icon: Factory, color: "#0EA5E9" },
  { name: "Salud", icon: Stethoscope, color: "#10B981" },
  { name: "Educación", icon: GraduationCap, color: "#F59E0B" },
  { name: "Gobierno", icon: Landmark, color: "#8B5CF6" },
  { name: "Retail", icon: ShoppingBag, color: "#EF4444" },
  { name: "Hotelería", icon: Hotel, color: "#F97316" },
  { name: "Corporativo", icon: Building2, color: "#06B6D4" },
  { name: "Educación Superior", icon: Globe, color: "#22C55E" },
];

// ─── Partners ─────────────────────────────────────────────────────────────────
const PARTNERS = [
  "Panduit", "Cisco", "Hikvision", "Dahua", "HID Global",
  "Zebra", "Fortinet", "Microsoft", "Eaton", "Axis",
  "Bosch", "Honeywell", "Aruba", "Meraki", "Schneider",
];

// ─── Prompt sugerido ──────────────────────────────────────────────────────────
const EXAMPLE_CHIPS: { label: string; specialistId: string | null }[] = [
  { label: "Necesito diseñar un Data Center",                       specialistId: "data-centers" },
  { label: "Necesito Servicio de Nodos de Red",                      specialistId: "redes" },
  { label: "Asesoría y Servicio de Control de Acceso",              specialistId: "control-acceso" },
  { label: "Necesito una Solución RFID y Equipos Zebra",            specialistId: "rfid" },
  { label: "Soporte y Servicio CCTV",                               specialistId: "cctv" },
  { label: "Software y Desarrollo de Aplicativos",                  specialistId: "software" },
  { label: "Cotización de Equipos, Licenciamiento y Periféricos",   specialistId: null },
];

// ─── Componente del Prompt Central ───────────────────────────────────────────
const AgentPrompt = forwardRef<AgentPromptHandle, AgentPromptProps>(
  function AgentPrompt({ onSessionStart, selectedSpecialist }, ref) {
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
    const [lastFailedText, setLastFailedText] = useState<string | null>(null);
    const [lastFailedSpecialist, setLastFailedSpecialist] = useState<string | undefined>(undefined);
    const [showCalendar, setShowCalendar] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const startSession = trpc.agent.startSession.useMutation();
    const sendMessage = trpc.agent.sendMessage.useMutation();

    useEffect(() => {
      // Scroll dentro del contenedor del chat, sin mover la página
      const container = messagesContainerRef.current;
      if (container) {
        requestAnimationFrame(() => {
          container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        });
      }
    }, [messages]);

    const ensureSession = async (): Promise<string> => {
      if (conversationSessionId) return conversationSessionId;
      const result = await startSession.mutateAsync({ visitorId });
      setConversationSessionId(result.sessionId);
      onSessionStart?.(result.sessionId);
      return result.sessionId;
    };

    const inputRef2 = useRef(input);
    useEffect(() => { inputRef2.current = input; }, [input]);

    const handleSend = useCallback(async (text?: string, specialistId?: string) => {
      const content = (text ?? inputRef2.current).trim();
      if (!content || isLoading) return;

      setChatOpen(true);
      setInput("");
      setIsLoading(true);

      const userMsg: ChatMessage = { id: nanoid(), role: "user", content };
      setMessages((prev) => [...prev, userMsg]);

      const activeSpecialistId = specialistId ?? selectedSpecialist ?? undefined;
      try {
        const activeSessionId = await ensureSession();
        const res = await sendMessage.mutateAsync({
          sessionId: activeSessionId,
          message: content,
          specialistId: activeSpecialistId,
        });
        setLastFailedText(null);
        setLastFailedSpecialist(undefined);
        setMessages((prev) => [
          ...prev,
          {
            id: nanoid(),
            role: "assistant",
            content: res.reply,
            toolsUsed: (res as any).toolsUsed ?? [],
            proposalData: (res as any).proposalData,
            meetingData: (res as any).meetingData,
          },
        ]);
        // If agent offers scheduling or booked a meeting, show CalendarPicker
        if ((res as any).action === 'schedule_meeting') {
          if ((res as any).meetingData) {
            // Meeting already booked by agent — no need for calendar picker
          } else {
            setTimeout(() => setShowCalendar(true), 600);
          }
        }
      } catch (err: unknown) {
        // Log del error real para debugging
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[IAMET Agent Error]', errorMsg, err);
        // Guardar contexto para reintentar
        setLastFailedText(content);
        setLastFailedSpecialist(activeSpecialistId);
        // Mostrar toast con opción de reintentar
        toast.error('El asistente no pudo responder', {
          description: errorMsg.length < 120 ? errorMsg : 'Error de conexión. Por favor intenta de nuevo.',
          action: {
            label: 'Reintentar',
            onClick: () => handleSend(content, activeSpecialistId),
          },
          duration: 8000,
        });
        setMessages((prev) => [
          ...prev,
          { id: nanoid(), role: "assistant", content: "No pude procesar tu solicitud en este momento.", isError: true, retryText: content },
        ]);
      } finally {
        setIsLoading(false);
      }
    }, [conversationSessionId, isLoading, selectedSpecialist]);

    useImperativeHandle(ref, () => ({
      triggerSend: (text: string, specialistId?: string) => handleSend(text, specialistId),
      getSessionId: () => conversationSessionId,
    }), [handleSend, conversationSessionId]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    return (
      <div className="w-full flex flex-col">
        {/* Messages */}
        <AnimatePresence>
          {chatOpen && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              ref={messagesContainerRef}
              className="mb-4 max-h-[50vh] overflow-y-auto space-y-3 px-1"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "var(--color-iamet-accent-muted)" }}
                    >
                      <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--color-iamet-accent)" }} />
                    </div>
                  )}
                  <div
                    className="max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: "var(--color-iamet-accent)", color: "#fff", borderTopRightRadius: "4px" }
                        : msg.isError
                        ? { background: "oklch(0.25 0.03 20)", color: "oklch(0.75 0.12 20)", borderTopLeftRadius: "4px", border: "1px solid oklch(0.4 0.1 20)" }
                        : { background: "var(--color-iamet-surface)", color: "var(--color-iamet-text-muted)", borderTopLeftRadius: "4px", border: "1px solid var(--color-iamet-border-subtle)" }
                    }
                  >
                    {/* Tool action chips */}
                  {msg.role === "assistant" && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {msg.toolsUsed.map((tool, i) => {
                        const toolIcons: Record<string, string> = {
                          searchKnowledge: "🔍",
                          searchProducts: "📦",
                          recommendSolutions: "🏗️",
                          createLead: "👤",
                          updateLead: "✏️",
                          calculateLeadScore: "📊",
                          assignSalesperson: "🤝",
                          assignEngineer: "⚙️",
                          bookMeeting: "📅",
                          sendEmail: "📧",
                          sendBrochure: "📄",
                          generateProposal: "💰",
                          reactivateLead: "🔄",
                          createTask: "✅",
                          notifyOwner: "🔔",
                        };
                        const icon = toolIcons[tool.name] ?? "⚡";
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: tool.success ? "oklch(0.25 0.08 160 / 0.4)" : "oklch(0.25 0.08 20 / 0.4)",
                              color: tool.success ? "oklch(0.75 0.15 160)" : "oklch(0.75 0.12 20)",
                              border: `1px solid ${tool.success ? "oklch(0.4 0.12 160 / 0.3)" : "oklch(0.4 0.1 20 / 0.3)"}`,
                            }}
                            title={tool.summary}
                          >
                            {icon} {tool.name.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {/* Proposal card */}
                  {msg.role === "assistant" && msg.proposalData && (
                    <div
                      className="mt-2 rounded-xl p-3 text-xs"
                      style={{ background: "oklch(0.18 0.04 250 / 0.5)", border: "1px solid oklch(0.35 0.1 250 / 0.4)" }}
                    >
                      <div className="font-semibold mb-1.5" style={{ color: "oklch(0.8 0.15 250)" }}>💰 Estimación Preliminar</div>
                      <div className="space-y-1">
                        {msg.proposalData.items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between gap-2" style={{ color: "oklch(0.7 0.05 250)" }}>
                            <span>{item.description} ×{item.quantity}</span>
                            <span className="font-mono">${(item.quantity * item.unitPrice).toLocaleString("es-MX")} MXN</span>
                          </div>
                        ))}
                        <div className="border-t pt-1 mt-1 flex justify-between font-semibold" style={{ borderColor: "oklch(0.35 0.1 250 / 0.3)", color: "oklch(0.85 0.15 250)" }}>
                          <span>Total con IVA</span>
                          <span className="font-mono">${msg.proposalData.total?.toLocaleString("es-MX")} MXN</span>
                        </div>
                      </div>
                      <div className="mt-1.5 text-xs" style={{ color: "oklch(0.55 0.05 250)" }}>{msg.proposalData.disclaimer}</div>
                    </div>
                  )}
                  {/* Meeting confirmation card */}
                  {msg.role === "assistant" && msg.meetingData && (
                    <div
                      className="mt-2 rounded-xl p-3 text-xs"
                      style={{ background: "oklch(0.18 0.04 160 / 0.5)", border: "1px solid oklch(0.35 0.12 160 / 0.4)" }}
                    >
                      <div className="font-semibold mb-1.5" style={{ color: "oklch(0.8 0.15 160)" }}>📅 Reunión Agendada</div>
                      <div className="space-y-0.5" style={{ color: "oklch(0.7 0.05 160)" }}>
                        <div>📆 <strong>Fecha:</strong> {msg.meetingData.date}</div>
                        <div>🕐 <strong>Hora:</strong> {msg.meetingData.startTime} — {msg.meetingData.endTime}</div>
                        <div>👤 <strong>Ingeniero:</strong> {msg.meetingData.engineerName}</div>
                      </div>
                    </div>
                  )}
                  {msg.role === "assistant" && msg.isError ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "oklch(0.65 0.15 20)" }} />
                          <span>{msg.content}</span>
                        </div>
                        {msg.retryText && (
                          <button
                            onClick={() => handleSend(msg.retryText!, lastFailedSpecialist)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-150 btn-press w-fit"
                            style={{ background: "oklch(0.35 0.05 20)", color: "oklch(0.8 0.08 20)" }}
                          >
                            <RefreshCw className="w-3 h-3" />
                            Reintentar
                          </button>
                        )}
                      </div>
                    ) : msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-iamet-accent-muted)" }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--color-iamet-accent)" }} />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3" style={{ background: "var(--color-iamet-surface)", border: "1px solid var(--color-iamet-border-subtle)" }}>
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--color-iamet-accent)" }} />
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart Calendar — aparece cuando el agente ofrece agendar */}
        <AnimatePresence>
          {showCalendar && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="mb-4"
            >
              <CalendarPicker
                sessionId={conversationSessionId ?? undefined}
                specialistId={selectedSpecialist ?? undefined}
                onClose={() => setShowCalendar(false)}
                onBooked={(cancelToken) => {
                  setMessages((prev) => [
                    ...prev,
                    { id: nanoid(), role: "assistant", content: `✅ ¡Tu reunión ha sido agendada exitosamente! Revisa tu correo para los detalles y el enlace de cancelación si lo necesitas.` },
                  ]);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <div
          className="relative flex flex-col rounded-2xl transition-all duration-200"
          style={{
            background: "var(--color-iamet-surface)",
            border: "1.5px solid var(--color-iamet-border)",
            boxShadow: "0 4px 24px oklch(0 0 0 / 0.08)",
          }}
        >
          <div className="flex items-center gap-3 px-5 py-4">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedSpecialist === "data-centers" ? "Ej: Necesito diseñar un Data Center Tier III para 50 servidores..." :
                selectedSpecialist === "redes" ? "Ej: Necesito red WiFi 6 para 3 sucursales en Monterrey..." :
                selectedSpecialist === "control-acceso" ? "Ej: Control de acceso biométrico para 200 empleados..." :
                selectedSpecialist === "rfid" ? "Ej: Trazabilidad RFID para inventario de 5,000 activos..." :
                selectedSpecialist === "cctv" ? "Ej: CCTV IP para bodega de 2,000 m² con analítica..." :
                selectedSpecialist === "software" ? "Ej: App de gestión de mantenimiento con módil..." :
                selectedSpecialist === "infraestructura" ? "Ej: Cableado estructurado Cat6A para 3 pisos..." :
                selectedSpecialist === "redes" ? "Ej: Red Cisco para 150 usuarios con segmentación VLAN..." :
                selectedSpecialist === "energia" ? "Ej: UPS para sala de servidores de 10 kVA..." :
                selectedSpecialist === "ia" ? "Ej: Agente IA para automatizar cotizaciones..." :
                selectedSpecialist === "industria4" ? "Ej: SCADA para planta maquiladora con 20 PLCs..." :
                "Describe tu proyecto o necesidad tecnológica..."
              }
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: "var(--color-iamet-text)" }}
            />

            {/* Botón voz */}
            <button
              onClick={() => toast.info("Entrada de voz próximamente disponible")}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 btn-press flex-shrink-0"
              style={{ background: "var(--color-iamet-bg-tertiary)" }}
              type="button"
              title="Entrada de voz"
            >
              <Mic className="w-3.5 h-3.5" style={{ color: "var(--color-iamet-text-subtle)" }} />
            </button>

            {/* Botón adjuntar */}
            <button
              onClick={() => toast.info("Adjuntar documentos próximamente disponible")}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 btn-press flex-shrink-0"
              style={{ background: "var(--color-iamet-bg-tertiary)" }}
              type="button"
              title="Adjuntar documento"
            >
              <Paperclip className="w-3.5 h-3.5" style={{ color: "var(--color-iamet-text-subtle)" }} />
            </button>

            {/* Botón enviar */}
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-30 btn-press flex-shrink-0"
              style={{ background: input.trim() ? "var(--color-iamet-accent)" : "var(--color-iamet-bg-tertiary)" }}
              type="button"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </div>
    );
  }
);

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const agentRef = useRef<AgentPromptHandle>(null);
  const [chatActive, setChatActive] = useState(false);
  const [chatMessages] = useState(0);
  const [currentSection, setCurrentSection] = useState("hero");
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showDirectCalendar, setShowDirectCalendar] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(null);

  const { visitorId: trackingVisitorId } = useVisitorTracking({
    currentPage: "/",
    currentSection,
    chatActive,
    chatMessages,
  });

  const handleSpecialistSelect = useCallback((specialistId: string) => {
    setSelectedSpecialist(prev => prev === specialistId ? null : specialistId);
    const specialist = SPECIALISTS.find(s => s.id === specialistId);
    if (specialist) {
      toast.success(`Conectado con ${specialist.name}`, {
        description: specialist.desc,
        duration: 2500,
      });
    }
  }, []);

  const handleExampleClick = useCallback((prompt: string, chipSpecialistId?: string | null) => {
    // Si el chip tiene un especialista mapeado, activarlo primero
    if (chipSpecialistId && chipSpecialistId !== selectedSpecialist) {
      setSelectedSpecialist(chipSpecialistId);
      const specialist = SPECIALISTS.find(s => s.id === chipSpecialistId);
      if (specialist) {
        toast.success(`Conectado con ${specialist.name}`, {
          description: specialist.desc,
          duration: 2000,
        });
      }
    }
    setShowSuggestions(false);
    agentRef.current?.triggerSend(prompt, chipSpecialistId ?? selectedSpecialist ?? undefined);
    setTimeout(() => {
      document.getElementById("agent-chat-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [selectedSpecialist]);

  const selectedSpecialistData = SPECIALISTS.find(s => s.id === selectedSpecialist);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-iamet-bg)" }}>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HERO — Asistente de Ingeniería Inteligente                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <main
        className="flex-1 flex flex-col items-center justify-start relative overflow-hidden"
        style={{ minHeight: "100vh" }}
      >
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            background: selectedSpecialistData
              ? `radial-gradient(ellipse 70% 55% at 50% 45%, ${selectedSpecialistData.color}18 0%, transparent 70%)`
              : "radial-gradient(ellipse 70% 55% at 50% 45%, var(--color-iamet-accent-glow) 0%, transparent 70%)",
          }}
        />
        <motion.div
          className="absolute inset-0 bg-dots pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2.5, delay: 0.3 }}
        />

        <div
          className="relative z-10 w-full flex flex-col items-center px-4 pt-20 pb-12 sm:pt-24 sm:pb-16"
          style={{ maxWidth: "760px", margin: "0 auto" }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-8"
          >
            <img
              src="https://pub-a53f56c4762c4171a999b79e28d1d8a4.r2.dev/logos/logo-iamet-v2-final.png"
              alt="IAMET"
              className="h-14 w-auto object-contain"
              style={{ filter: "drop-shadow(0 2px 8px var(--color-iamet-accent-glow))" }}
            />
          </motion.div>

          {/* Título poderoso */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-3 space-y-2"
          >
            <h1
              className="font-display text-3xl sm:text-4xl lg:text-[2.8rem] font-bold tracking-tight leading-[1.1]"
              style={{ color: "var(--color-iamet-text)" }}
            >
              Empresa Integradora de<br />
              <span style={{ color: "var(--color-iamet-accent)" }}>Soluciones y Servicios Tecnológicos</span>
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--color-iamet-text-subtle)" }}
            >
              Describe tu proyecto y nuestros agentes de IA te darán un previo de tu proyecto o agenda directamente una cita.
            </p>
          </motion.div>

          {/* Badge de especialista activo */}
          <AnimatePresence>
            {selectedSpecialistData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                style={{
                  background: selectedSpecialistData.color + "18",
                  border: `1px solid ${selectedSpecialistData.color}44`,
                  color: selectedSpecialistData.color,
                }}
              >
                <selectedSpecialistData.icon className="w-4 h-4" />
                Especialista en {selectedSpecialistData.name} activo
                <button
                  onClick={() => setSelectedSpecialist(null)}
                  className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
                  style={{ fontSize: "16px", lineHeight: 1 }}
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Prompt central */}
          <motion.div
            id="agent-chat-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="w-full mb-4"
          >
            <AgentPrompt
              ref={agentRef}
              selectedSpecialist={selectedSpecialist}
              onSessionStart={(sid) => {
                setLiveSessionId(sid);
                setChatActive(true);
              }}
            />
          </motion.div>

          {/* Chips de servicio + agendar cita */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full flex flex-wrap justify-center gap-2 mb-8"
              >
                {EXAMPLE_CHIPS.map((chip, i) => (
                  <motion.button
                    key={chip.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25, delay: 0.3 + i * 0.05 }}
                    onClick={() => handleExampleClick(chip.label, chip.specialistId)}
                    className="text-xs px-3.5 py-2 rounded-full transition-all duration-150 btn-press"
                    style={{
                      border: "1px solid var(--color-iamet-border)",
                      color: "var(--color-iamet-text-subtle)",
                      background: "transparent",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-accent)";
                      (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-accent)";
                      (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-accent-muted)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-border)";
                      (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-subtle)";
                      (e.currentTarget as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {chip.label}
                  </motion.button>
                ))}

                {/* Chip especial: Agendar cita directa */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.3 + EXAMPLE_CHIPS.length * 0.05 }}
                  onClick={() => setShowDirectCalendar(true)}
                  className="text-xs px-3.5 py-2 rounded-full transition-all duration-150 btn-press flex items-center gap-1.5"
                  style={{
                    border: "1px solid var(--color-iamet-accent)",
                    color: "var(--color-iamet-accent)",
                    background: "var(--color-iamet-accent-muted)",
                    fontWeight: 600,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-accent)";
                    (e.currentTarget as HTMLElement).style.color = "#fff";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-accent-muted)";
                    (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-accent)";
                  }}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  Agendar cita directa
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CalendarPicker directo — sin pasar por el agente */}
          <AnimatePresence>
            {showDirectCalendar && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="w-full mb-4"
              >
                <CalendarPicker
                  specialistId={selectedSpecialist ?? undefined}
                  onClose={() => setShowDirectCalendar(false)}
                  onBooked={() => {
                    setShowDirectCalendar(false);
                    toast.success("¡Cita agendada exitosamente!", {
                      description: "Revisa tu correo para los detalles de la reunión.",
                      duration: 5000,
                    });
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Especialistas IA ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: "var(--color-iamet-border-subtle)" }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-iamet-text-subtle)" }}>
                Especialistas IA
              </span>
              <div className="h-px flex-1" style={{ background: "var(--color-iamet-border-subtle)" }} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SPECIALISTS.map(({ id, name, icon: Icon, color, desc }, i) => {
                const isSelected = selectedSpecialist === id;
                return (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.55 + i * 0.03, ease: [0.23, 1, 0.32, 1] }}
                    onClick={() => handleSpecialistSelect(id)}
                    className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-all duration-200 btn-press"
                    style={{
                      background: isSelected ? color + "18" : "var(--color-iamet-surface)",
                      border: isSelected ? `1.5px solid ${color}66` : "1px solid var(--color-iamet-border-subtle)",
                      boxShadow: isSelected ? `0 4px 16px ${color}22` : "none",
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.borderColor = color + "55";
                        (e.currentTarget as HTMLElement).style.background = color + "10";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-border-subtle)";
                        (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-surface)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      }
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-xs font-medium leading-tight" style={{ color: isSelected ? color : "var(--color-iamet-text-muted)" }}>
                      {name}
                    </span>
                    <span className="text-[10px] leading-tight hidden sm:block" style={{ color: "var(--color-iamet-text-subtle)" }}>
                      {desc}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          <span className="text-xs" style={{ color: "var(--color-iamet-text-subtle)" }}>Descubre más</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronRight className="w-4 h-4 rotate-90" style={{ color: "var(--color-iamet-text-subtle)" }} />
          </motion.div>
        </motion.div>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: Soluciones                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="soluciones"
        className="py-20 px-4"
        style={{ background: "var(--color-iamet-bg-secondary)" }}
        onMouseEnter={() => setCurrentSection("soluciones")}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ color: "var(--color-iamet-accent)", background: "var(--color-iamet-accent-muted)" }}>
                Portafolio
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-iamet-text)" }}>
              9 Verticales de Especialización
            </h2>
            <p className="text-base" style={{ color: "var(--color-iamet-text-muted)" }}>
              Soluciones tecnológicas integrales diseñadas para empresas que exigen excelencia.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SOLUTIONS.map(({ slug, name, icon: Icon, color, desc }, i) => (
              <motion.div
                key={slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link href={`/soluciones/${slug}`}>
                  <div
                    className="group flex flex-col gap-3 p-5 rounded-2xl cursor-pointer transition-all duration-200"
                    style={{
                      background: "var(--color-iamet-surface)",
                      border: "1px solid var(--color-iamet-border-subtle)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = color + "55";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}18`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-border-subtle)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLElement).style.boxShadow = "none";
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + "20" }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--color-iamet-text)" }}>{name}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: "var(--color-iamet-text-subtle)" }}>{desc}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: Industrias                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="industrias"
        className="py-20 px-4"
        style={{ background: "var(--color-iamet-bg)" }}
        onMouseEnter={() => setCurrentSection("industrias")}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ color: "#10B981", background: "#10B98118" }}>
                Sectores
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-iamet-text)" }}>
              Industrias que Atendemos
            </h2>
            <p className="text-base" style={{ color: "var(--color-iamet-text-muted)" }}>
              Experiencia comprobada en los sectores más exigentes de México y Latinoamérica.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {INDUSTRIES.map(({ name, icon: Icon, color }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl text-center transition-all duration-200 cursor-pointer"
                style={{
                  background: "var(--color-iamet-surface)",
                  border: "1px solid var(--color-iamet-border-subtle)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = color + "55";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${color}18`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-border-subtle)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: color + "20" }}>
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--color-iamet-text-muted)" }}>{name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: Partners                                                    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="partners"
        className="py-16 px-4"
        style={{ background: "var(--color-iamet-bg-secondary)" }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: "var(--color-iamet-border-subtle)" }} />
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "var(--color-iamet-text-subtle)" }}>
                Fabricantes y Partners Tecnológicos
              </span>
              <div className="h-px flex-1" style={{ background: "var(--color-iamet-border-subtle)" }} />
            </div>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-3">
            {PARTNERS.map((partner, i) => (
              <motion.div
                key={partner}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: "var(--color-iamet-surface)",
                  border: "1px solid var(--color-iamet-border-subtle)",
                  color: "var(--color-iamet-text-muted)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-accent)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-accent)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-border-subtle)";
                  (e.currentTarget as HTMLElement).style.color = "var(--color-iamet-text-muted)";
                }}
              >
                {partner}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: Normativas                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="normativas"
        className="py-16 px-4"
        style={{ background: "var(--color-iamet-bg)" }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ color: "#F59E0B", background: "#F59E0B18" }}>
                Certificaciones
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-iamet-text)" }}>
              Normativas y Estándares
            </h2>
            <p className="text-base" style={{ color: "var(--color-iamet-text-muted)" }}>
              Diseñamos e instalamos bajo los estándares internacionales más exigentes.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { name: "TIA-568", desc: "Cableado estructurado" },
              { name: "TIA-942", desc: "Data Centers" },
              { name: "ISO 27001", desc: "Seguridad de la información" },
              { name: "NFPA 72", desc: "Sistemas de alarma" },
              { name: "IEC 62443", desc: "Ciberseguridad industrial" },
              { name: "ANSI/BICSI", desc: "Instalaciones de telecomunicaciones" },
              { name: "NOM-001-SEDE", desc: "Instalaciones eléctricas" },
              { name: "Uptime Tier", desc: "Disponibilidad Data Centers" },
            ].map(({ name, desc }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{
                  background: "var(--color-iamet-surface)",
                  border: "1px solid var(--color-iamet-border-subtle)",
                }}
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#F59E0B" }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: "var(--color-iamet-text)" }}>{name}</div>
                  <div className="text-xs" style={{ color: "var(--color-iamet-text-subtle)" }}>{desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: Centro de Conocimiento                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="conocimiento"
        className="py-20 px-4"
        style={{ background: "var(--color-iamet-bg-secondary)" }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full" style={{ color: "#A855F7", background: "#A855F718" }}>
                Recursos
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--color-iamet-text)" }}>
              Centro de Conocimiento
            </h2>
            <p className="text-base" style={{ color: "var(--color-iamet-text-muted)" }}>
              Guías técnicas, casos de éxito y recursos especializados para profesionales de TI.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { icon: BookOpen, color: "#0EA5E9", title: "Guías Técnicas", desc: "Documentación detallada sobre diseño e implementación de soluciones tecnológicas.", tag: "Próximamente" },
              { icon: Award, color: "#10B981", title: "Casos de Éxito", desc: "Proyectos reales implementados en manufactura, salud, gobierno y corporativos.", tag: "Próximamente" },
              { icon: GraduationCap, color: "#F59E0B", title: "IAMET Academy", desc: "Cursos y certificaciones técnicas para profesionales de infraestructura y seguridad.", tag: "Ver cursos", href: "/academy" },
            ].map(({ icon: Icon, color, title, desc, tag, href }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                {href ? (
                  <Link href={href}>
                    <div
                      className="group flex flex-col gap-4 p-6 rounded-2xl cursor-pointer transition-all duration-200 h-full"
                      style={{
                        background: "var(--color-iamet-surface)",
                        border: "1px solid var(--color-iamet-border-subtle)",
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = color + "55";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}18`;
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-border-subtle)";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLElement).style.boxShadow = "none";
                      }}
                    >
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: color + "20" }}>
                        <Icon className="w-6 h-6" style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--color-iamet-text)" }}>{title}</h3>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--color-iamet-text-subtle)" }}>{desc}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
                        {tag} <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div
                    className="flex flex-col gap-4 p-6 rounded-2xl h-full"
                    style={{
                      background: "var(--color-iamet-surface)",
                      border: "1px solid var(--color-iamet-border-subtle)",
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: color + "20" }}>
                      <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-semibold mb-1" style={{ color: "var(--color-iamet-text)" }}>{title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-iamet-text-subtle)" }}>{desc}</p>
                    </div>
                    <div className="text-xs font-medium px-3 py-1 rounded-full w-fit" style={{ background: "var(--color-iamet-bg-tertiary)", color: "var(--color-iamet-text-subtle)" }}>
                      {tag}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN: Contacto CTA                                                */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <section
        id="contacto"
        className="py-20 px-4"
        style={{ background: "var(--color-iamet-bg)" }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ background: "var(--color-iamet-accent-muted)", color: "var(--color-iamet-accent)", border: "1px solid var(--color-iamet-accent)" }}
            >
              <Sparkles className="w-4 h-4" />
              Ingeniería de clase mundial
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4" style={{ color: "var(--color-iamet-text)" }}>
              ¿Listo para transformar<br />tu infraestructura tecnológica?
            </h2>
            <p className="text-base mb-8" style={{ color: "var(--color-iamet-text-muted)" }}>
              Habla con un especialista IAMET hoy mismo. Sin compromisos, con soluciones reales.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/contacto">
                <button
                  className="px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-150 btn-press"
                  style={{ background: "var(--color-iamet-accent)", color: "#fff" }}
                >
                  Hablar con un especialista
                </button>
              </Link>
              <button
                onClick={() => {
                  document.getElementById("agent-chat-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-150 btn-press"
                style={{
                  background: "transparent",
                  color: "var(--color-iamet-text-muted)",
                  border: "1px solid var(--color-iamet-border)",
                }}
              >
                Consultar al Agente IA
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <LiveChatWidget sessionId={liveSessionId} visitorId={trackingVisitorId} />
    </div>
  );
}

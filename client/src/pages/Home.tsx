import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from "react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import LiveChatWidget from "@/components/LiveChatWidget";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Sparkles, ShieldCheck,
  Wrench, FolderKanban, Zap, Monitor, Shield, Tv2, Network, Code2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id: string;
}

// ─── Tipos del handle del prompt ─────────────────────────────────────────────
interface AgentPromptHandle {
  triggerSend: (text: string) => void;
  getSessionId: () => string | null;
}

interface AgentPromptProps {
  onSessionStart?: (sessionId: string) => void;
}

// ─── Componente del Prompt Central ───────────────────────────────────────────
const AgentPrompt = forwardRef<AgentPromptHandle, AgentPromptProps>(function AgentPrompt({ onSessionStart }, ref) {
  const { t } = useLanguage();

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
    onSessionStart?.(result.sessionId);
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
      {/* Messages area — aparece cuando hay mensajes */}
      <AnimatePresence>
        {chatOpen && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
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
                      ? {
                          background: "var(--color-iamet-accent)",
                          color: "#fff",
                          borderTopRightRadius: "4px",
                        }
                      : {
                          background: "var(--color-iamet-surface)",
                          color: "var(--color-iamet-text-muted)",
                          borderTopLeftRadius: "4px",
                          border: "1px solid var(--color-iamet-border-subtle)",
                        }
                  }
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
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--color-iamet-accent-muted)" }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--color-iamet-accent)" }} />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-3"
                  style={{ background: "var(--color-iamet-surface)", border: "1px solid var(--color-iamet-border-subtle)" }}
                >
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--color-iamet-accent)" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar — estilo Copilot */}
      <div
        className="relative flex flex-col rounded-2xl transition-all duration-200"
        style={{
          background: "var(--color-iamet-surface)",
          border: "1.5px solid var(--color-iamet-border)",
          boxShadow: "0 4px 24px oklch(0 0 0 / 0.08)",
        }}
      >
        {/* Fila del input */}
        <div className="flex items-center gap-3 px-5 py-4">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInfraMode ? t.home.placeholderInfra : t.home.placeholder}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{
              color: "var(--color-iamet-text)",
            }}
          />

          {/* Badge de modo */}
          <AnimatePresence mode="wait">
            {isInfraMode ? (
              <motion.span
                key="panduit"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 flex-shrink-0"
                style={{
                  color: "var(--color-iamet-accent)",
                  border: "1px solid var(--color-iamet-accent)",
                  background: "var(--color-iamet-accent-muted)",
                }}
              >
                <ShieldCheck className="w-3 h-3" />
                {t.home.panduitCertified}
              </motion.span>
            ) : (
              <motion.span
                key="iamet"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 flex-shrink-0"
                style={{
                  color: "var(--color-iamet-text-subtle)",
                  border: "1px solid var(--color-iamet-border-subtle)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--color-iamet-accent)" }}
                />
                {t.home.iametAI}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Botón enviar */}
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 disabled:opacity-30 btn-press flex-shrink-0"
            style={{
              background: input.trim() ? "var(--color-iamet-accent)" : "var(--color-iamet-bg-tertiary)",
            }}
            type="button"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── Definición de servicios para los chips ───────────────────────────────────
const SERVICE_KEYS = [
  { key: "maintenance", Icon: Wrench, color: "#7C3AED" },
  { key: "projects", Icon: FolderKanban, color: "#0EA5E9" },
  { key: "energy", Icon: Zap, color: "#F59E0B" },
  { key: "software", Icon: Code2, color: "#EF4444" },
  { key: "computing", Icon: Monitor, color: "#3B82F6" },
  { key: "security", Icon: Shield, color: "#10B981" },
  { key: "av", Icon: Tv2, color: "#06B6D4" },
  { key: "cabling", Icon: Network, color: "#22C55E" },
] as const;

type ServiceKey = typeof SERVICE_KEYS[number]["key"];

// ─── Chips de servicios debajo del prompt ─────────────────────────────────────
function ServiceChips({ onServiceClick }: { onServiceClick: (query: string) => void }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="w-full"
    >
      {/* Título de sección */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-px flex-1"
          style={{ background: "var(--color-iamet-border-subtle)" }}
        />
        <span
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--color-iamet-text-subtle)" }}
        >
          {t.home.servicesTitle}
        </span>
        <div
          className="h-px flex-1"
          style={{ background: "var(--color-iamet-border-subtle)" }}
        />
      </div>

      {/* Grid de chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SERVICE_KEYS.map(({ key, Icon, color }, i) => {
          const svc = t.services[key as ServiceKey];
          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.55 + i * 0.04, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => onServiceClick(svc.query)}
              className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left transition-all duration-200 btn-press group"
              style={{
                background: "var(--color-iamet-surface)",
                border: "1px solid var(--color-iamet-border-subtle)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = color + "66";
                (e.currentTarget as HTMLElement).style.background = color + "12";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${color}22`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-iamet-border-subtle)";
                (e.currentTarget as HTMLElement).style.background = "var(--color-iamet-surface)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: color + "20" }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <span
                className="text-xs font-medium leading-tight"
                style={{ color: "var(--color-iamet-text-muted)" }}
              >
                {svc.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Sugerencias rápidas ──────────────────────────────────────────────────────
function QuickSuggestions({ onSend }: { onSend: (text: string) => void }) {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="flex flex-wrap justify-center gap-2 mt-3"
    >
      {t.home.suggestions.map((s, i) => (
        <motion.button
          key={s}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 0.4 + i * 0.05 }}
          onClick={() => onSend(s)}
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
          {s}
        </motion.button>
      ))}
    </motion.div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const { t } = useLanguage();
  const agentRef = useRef<AgentPromptHandle>(null);
  const [chatActive, setChatActive] = useState(false);
  const [chatMessages, setChatMessages] = useState(0);
  const [currentSection, setCurrentSection] = useState("hero");
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Tracking de presencia
  const { visitorId: trackingVisitorId } = useVisitorTracking({
    currentPage: "/",
    currentSection,
    chatActive,
    chatMessages,
  });

  const handleServiceClick = useCallback((query: string) => {
    setShowSuggestions(false);
    agentRef.current?.triggerSend(query);
    setTimeout(() => {
      const chatEl = document.getElementById("agent-chat-section");
      chatEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, []);

  const handleSuggestionSend = useCallback((text: string) => {
    setShowSuggestions(false);
    agentRef.current?.triggerSend(text);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-iamet-bg)" }}
    >
      {/* ── Contenido principal — con padding-left para el sidebar izquierdo ── */}
      <main
        className="flex-1 flex flex-col items-center justify-center relative overflow-hidden"
        style={{ paddingLeft: "72px" }} /* 56px sidebar + 16px margen */
      >
        {/* Background glow sutil */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 45%, var(--color-iamet-accent-glow) 0%, transparent 70%)",
          }}
        />

        {/* Grid de puntos de fondo */}
        <motion.div
          className="absolute inset-0 bg-dots pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2.5, delay: 0.3 }}
        />

        {/* ── Contenido centrado ─────────────────────────────────────────── */}
        <div
          className="relative z-10 w-full flex flex-col items-center px-4 py-12 sm:py-16"
          style={{ maxWidth: "720px", margin: "0 auto" }}
        >
          {/* Logo IAMET */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mb-8"
          >
            <img
              src="/manus-storage/logo-iamet-v2-final_a0aa3f89.png"
              alt="IAMET"
              className="h-14 w-auto object-contain"
              style={{ filter: "drop-shadow(0 2px 8px var(--color-iamet-accent-glow))" }}
            />
          </motion.div>

          {/* Saludo principal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-8 space-y-2"
          >
            <h1
              className="font-display text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight leading-[1.15]"
              style={{ color: "var(--color-iamet-text)" }}
            >
              {t.home.greeting}
            </h1>
            <p
              className="text-base sm:text-lg font-medium"
              style={{ color: "var(--color-iamet-text-muted)" }}
            >
              {t.home.subtitle}
            </p>
            <p
              className="text-sm sm:text-base"
              style={{ color: "var(--color-iamet-text-subtle)" }}
            >
              {t.home.question}
            </p>
          </motion.div>

          {/* Prompt central — el elemento hero */}
          <motion.div
            id="agent-chat-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="w-full mb-4"
          >
            <AgentPrompt
              ref={agentRef}
              onSessionStart={(sid) => {
                setLiveSessionId(sid);
                setChatActive(true);
              }}
            />
          </motion.div>

          {/* Sugerencias rápidas — se ocultan cuando el usuario empieza a chatear */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                <QuickSuggestions onSend={handleSuggestionSend} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Separador */}
          <div className="w-full my-8">
            <div
              className="h-px w-full"
              style={{ background: "var(--color-iamet-border-subtle)" }}
            />
          </div>

          {/* Chips de servicios */}
          <div className="w-full">
            <ServiceChips onServiceClick={handleServiceClick} />
          </div>
        </div>
      </main>

      {/* LiveChatWidget — siempre en bottom-6 left-6 con z-[60] */}
      <LiveChatWidget sessionId={liveSessionId} visitorId={trackingVisitorId} />
    </div>
  );
}

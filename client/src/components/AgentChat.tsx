import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Zap, Sparkles, ShieldCheck, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { nanoid } from "nanoid";

const QUICK_SUGGESTIONS = [
  "¿Cómo puedo mejorar la seguridad de mi empresa?",
  "Necesito monitorear mi infraestructura 24/7",
  "Quiero implementar control de acceso biométrico",
  "¿Qué es RFID y cómo me puede ayudar?",
  "Busco capacitación en ciberseguridad",
];

const INFRA_SUGGESTIONS = [
  "¿Qué garantías ofrece IAMET en cableado estructurado?",
  "Necesito certificar mi red con normativa TIA",
  "¿Cuál es la diferencia entre Cat6 y Cat6A?",
  "Quiero una póliza de mantenimiento de cableado",
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id: string;
}

export default function AgentChat({ compact = false }: { compact?: boolean }) {
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem("iamet_session");
    if (stored) return stored;
    const id = nanoid(16);
    sessionStorage.setItem("iamet_session", id);
    return id;
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hola, soy el **Agente Virtual IAMET**. Estoy aquí para ayudarte a identificar las soluciones tecnológicas que tu empresa necesita.\n\n¿Cuál es el principal reto tecnológico que enfrentas hoy?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
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

    setInput("");
    setIsLoading(true);

    const userMsg: ChatMessage = { id: nanoid(), role: "user", content };
    setMessages((prev) => [...prev, userMsg]);

    try {
      await ensureSession();
      const result = await sendMessage.mutateAsync({ sessionId, message: content });
      const assistantMsg: ChatMessage = {
        id: nanoid(),
        role: "assistant",
        content: result.reply,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      // Update infra mode indicator based on backend detection
      if (result.isInfraMode !== undefined) {
        setIsInfraMode(result.isInfraMode);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: "Lo siento, hubo un problema al procesar tu mensaje. Por favor intenta de nuevo.",
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentSuggestions = isInfraMode ? INFRA_SUGGESTIONS : QUICK_SUGGESTIONS;

  return (
    <div
      className={`flex flex-col neumorphic rounded-2xl overflow-hidden ${
        compact ? "h-[420px]" : "h-[520px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-iamet-border-subtle)] bg-[var(--color-iamet-bg-secondary)]">
        <div className="w-8 h-8 rounded-full bg-[var(--color-iamet-accent)] flex items-center justify-center animate-pulse-glow">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-iamet-text)] font-display">
            Agente Virtual IAMET
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-[var(--color-iamet-text-subtle)]">En línea · Respuesta inmediata</span>
          </div>
        </div>

        {/* Panduit Specialist Badge — visible when infra topic detected */}
        <AnimatePresence>
          {isInfraMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 10 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-iamet-accent-muted)] border border-[var(--color-iamet-accent)] text-[var(--color-iamet-accent)]"
              title="Modo especialista: Infraestructura Física Panduit activado"
            >
              <ShieldCheck className="w-3 h-3 flex-shrink-0" />
              <span className="text-[10px] font-semibold leading-none whitespace-nowrap">
                Panduit Certified
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {!isInfraMode && (
          <div className="ml-auto">
            <Sparkles className="w-4 h-4 text-[var(--color-iamet-accent)]" />
          </div>
        )}
      </div>

      {/* Infra Mode Banner */}
      <AnimatePresence>
        {isInfraMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-iamet-accent-muted)] border-b border-[var(--color-iamet-accent)]/30">
              <Network className="w-3.5 h-3.5 text-[var(--color-iamet-accent)] flex-shrink-0" />
              <p className="text-[11px] text-[var(--color-iamet-accent)] leading-tight">
                <span className="font-semibold">Especialista en Infraestructura Física activado</span>
                {" "}— Panduit Certified · Garantía 15/25 años · Certificación Fluke
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--color-iamet-bg)]">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                  msg.role === "assistant"
                    ? "bg-[var(--color-iamet-accent)]"
                    : "bg-[var(--color-iamet-surface-2)]"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-3.5 h-3.5 text-white" />
                ) : (
                  <User className="w-3.5 h-3.5 text-[var(--color-iamet-text-muted)]" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "neumorphic text-[var(--color-iamet-text)] rounded-tl-sm"
                    : "bg-[var(--color-iamet-accent)] text-white rounded-tr-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <Streamdown className="prose prose-invert prose-sm max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:text-[var(--color-iamet-accent)] [&_ul]:mt-1 [&_li]:text-[var(--color-iamet-text-muted)]">
                    {msg.content}
                  </Streamdown>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-2.5"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-iamet-accent)] flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="neumorphic rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-[var(--color-iamet-accent)] animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions (only when no user messages yet) */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-[var(--color-iamet-border-subtle)] bg-[var(--color-iamet-bg-secondary)]">
          <div className="flex flex-wrap gap-1.5">
            {currentSuggestions.slice(0, compact ? 2 : 3).map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-iamet-border)] text-[var(--color-iamet-text-muted)] hover:border-[var(--color-iamet-accent)] hover:text-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-muted)] transition-all duration-150 btn-press"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Infra quick suggestions when in infra mode and has messages */}
      {isInfraMode && messages.length > 1 && (
        <div className="px-4 py-2 border-t border-[var(--color-iamet-accent)]/20 bg-[var(--color-iamet-bg-secondary)]">
          <p className="text-[10px] text-[var(--color-iamet-text-subtle)] mb-1.5 font-medium">Preguntas frecuentes sobre infraestructura:</p>
          <div className="flex flex-wrap gap-1.5">
            {INFRA_SUGGESTIONS.slice(0, compact ? 1 : 2).map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-iamet-accent)]/40 text-[var(--color-iamet-accent)] hover:border-[var(--color-iamet-accent)] hover:bg-[var(--color-iamet-accent-muted)] transition-all duration-150 btn-press"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--color-iamet-border-subtle)] bg-[var(--color-iamet-bg-secondary)]">
        <div className="flex items-center gap-2 neumorphic-inset rounded-xl px-3 py-2">
          <Zap className="w-4 h-4 text-[var(--color-iamet-accent)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isInfraMode ? "Pregunta sobre cableado, Panduit, certificación..." : "Escribe tu pregunta..."}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-[var(--color-iamet-text)] placeholder:text-[var(--color-iamet-text-subtle)] outline-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-7 h-7 rounded-lg bg-[var(--color-iamet-accent)] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-iamet-accent-hover)] transition-colors btn-press"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * LiveChatWidget — Widget flotante de chat en vivo para el visitante.
 * Aparece en la esquina inferior izquierda cuando un agente humano de IAMET
 * toma el control de la sesión y envía el primer mensaje.
 *
 * Flujo:
 * 1. El componente hace polling cada 3s a liveChat.pollMessages con el sessionId.
 * 2. Cuando humanTookOver=true y llega un mensaje de role="human", el widget aparece.
 * 3. El visitante puede responder; los mensajes van a liveChat.visitorReply.
 * 4. El admin ve las respuestas en la consola de monitoreo en tiempo real.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Send, X, Minimize2, Headphones, ChevronDown } from "lucide-react";

interface LiveChatWidgetProps {
  sessionId: string | null;
}

export default function LiveChatWidget({ sessionId }: LiveChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [input, setInput] = useState("");
  const [lastSince, setLastSince] = useState<string | undefined>(undefined);
  const [localMessages, setLocalMessages] = useState<Array<{
    id: number | string;
    role: "user" | "human";
    content: string;
    agentName?: string | null;
    createdAt: Date | string;
  }>>([]);
  const [agentName, setAgentName] = useState<string>("Soporte IAMET");
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Polling: verificar mensajes nuevos cada 3s
  const pollQuery = trpc.liveChat.pollMessages.useQuery(
    { sessionId: sessionId ?? "", since: lastSince },
    {
      enabled: !!sessionId,
      refetchInterval: 3000,
      refetchIntervalInBackground: true,
    }
  );

  const replyMutation = trpc.liveChat.visitorReply.useMutation();

  // Procesar mensajes nuevos del polling
  useEffect(() => {
    if (!pollQuery.data) return;
    const { messages: newMsgs, humanTookOver, humanAgentName } = pollQuery.data;

    if (humanTookOver && humanAgentName) {
      setAgentName(humanAgentName);
    }

    if (newMsgs.length > 0) {
      // Actualizar el "since" para el próximo poll
      const latest = newMsgs[newMsgs.length - 1];
      setLastSince(new Date(latest.createdAt).toISOString());

      // Agregar mensajes nuevos al estado local
      setLocalMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const toAdd = newMsgs.filter((m) => !existingIds.has(m.id));
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });

      // Mostrar el widget si llega un mensaje humano
      const hasHumanMsg = newMsgs.some((m) => m.role === "human");
      if (hasHumanMsg && humanTookOver) {
        setIsVisible(true);
        if (!isOpen) {
          setUnreadCount((c) => c + newMsgs.filter((m) => m.role === "human").length);
        }
      }
    }
  }, [pollQuery.data, isOpen]);

  // Scroll al último mensaje
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [localMessages, isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !sessionId) return;
    const content = input.trim();
    setInput("");
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setLocalMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content, createdAt: new Date() },
    ]);
    await replyMutation.mutateAsync({ sessionId, content });
  }, [input, sessionId, replyMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isVisible || !sessionId) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="w-80 rounded-2xl overflow-hidden"
            style={{
              boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)",
              background: "rgba(255,255,255,0.97)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(0,113,227,0.15)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: "linear-gradient(135deg, #0071E3 0%, #0051A8 100%)" }}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">{agentName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-white/80 text-xs">En línea · Soporte IAMET</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <Minimize2 className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
              {localMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-gray-400 text-center">
                    Un especialista de IAMET se ha conectado contigo
                  </p>
                </div>
              ) : (
                localMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {msg.role === "human" && (
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Headphones className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm max-w-[78%] ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white rounded-tr-sm"
                          : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
                      }`}
                    >
                      {msg.role === "human" && (
                        <p className="text-[10px] font-semibold text-blue-500 mb-0.5">
                          {msg.agentName ?? agentName}
                        </p>
                      )}
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-3 py-3 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu respuesta…"
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || replyMutation.isPending}
                  className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-1.5">
                Soporte en tiempo real · IAMET Evolución Tecnológica
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble button */}
      <motion.button
        onClick={() => {
          setIsOpen((o) => !o);
          if (!isOpen) {
            setUnreadCount(0);
            setTimeout(() => inputRef.current?.focus(), 200);
          }
        }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
        style={{
          background: "linear-gradient(135deg, #0071E3 0%, #0051A8 100%)",
          boxShadow: "0 8px 24px rgba(0,113,227,0.4), 0 2px 8px rgba(0,0,0,0.15)",
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <ChevronDown className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Headphones className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && !isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center"
            >
              <span className="text-white text-[10px] font-bold">{unreadCount}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
      </motion.button>
    </div>
  );
}

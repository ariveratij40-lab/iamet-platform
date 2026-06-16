/**
 * LiveChatPanel — Panel de intervención humana en la Consola de Monitoreo.
 *
 * Flujo del admin:
 * 1. El admin ve la lista de conversaciones activas (polling cada 5s).
 * 2. Selecciona una sesión → hace clic en "Tomar control".
 * 3. Escribe mensajes que se envían al visitante en tiempo real.
 * 4. El visitante los recibe en su LiveChatWidget (esquina inferior izquierda).
 * 5. El admin puede "Liberar" la sesión para devolvérsela al agente IA.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import {
  Headphones, Send, RefreshCw, UserCheck, UserX,
  MessageSquare, ChevronRight, Sparkles, User,
  AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function timeSince(date: Date | string | null): string {
  if (!date) return "—";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 5) return "ahora";
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  return `hace ${Math.floor(diff / 3600)}h`;
}

// ─── Session Card ─────────────────────────────────────────────────────────────
interface SessionCardProps {
  session: {
    sessionId: string;
    lastMessage: any;
    unreadCount: number;
    conversation: any;
  };
  isSelected: boolean;
  onSelect: () => void;
}

function SessionCard({ session, isSelected, onSelect }: SessionCardProps) {
  const conv = session.conversation;
  const isActive = conv?.status === "active";
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl p-3 transition-all border ${
        isSelected
          ? "bg-blue-50 border-blue-200 shadow-sm"
          : "bg-white/70 border-white/60 hover:bg-white hover:border-blue-100"
      }`}
      style={!isSelected ? { boxShadow: "2px 2px 6px rgba(0,0,0,0.05), -1px -1px 4px rgba(255,255,255,0.8)" } : {}}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isActive ? "bg-green-100" : "bg-gray-100"
        }`}>
          <MessageSquare className={`w-4 h-4 ${isActive ? "text-green-600" : "text-gray-400"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-mono text-gray-500 truncate">
              {session.sessionId.slice(0, 12)}…
            </span>
            {session.unreadCount > 0 && (
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {session.unreadCount}
              </span>
            )}
          </div>
          {session.lastMessage ? (
            <p className="text-xs text-gray-600 truncate mt-0.5">
              <span className={`font-medium ${session.lastMessage.role === "human" ? "text-blue-600" : "text-gray-700"}`}>
                {session.lastMessage.role === "human" ? "Tú" : "Visitante"}:
              </span>{" "}
              {session.lastMessage.content}
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5 italic">Sin mensajes aún</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {conv?.detectedIntent && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {conv.detectedIntent}
              </Badge>
            )}
            <span className="text-[10px] text-gray-400">
              {timeSince(session.lastMessage?.createdAt ?? conv?.updatedAt)}
            </span>
          </div>
        </div>
        <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 mt-1 transition-transform ${isSelected ? "rotate-90 text-blue-500" : "text-gray-300"}`} />
      </div>
    </button>
  );
}

// ─── Chat Window ──────────────────────────────────────────────────────────────
interface ChatWindowProps {
  sessionId: string;
  agentName: string;
  onRelease: () => void;
}

function ChatWindow({ sessionId, agentName, onRelease }: ChatWindowProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messagesQuery = trpc.liveChat.getMessages.useQuery(
    { sessionId },
    { refetchInterval: 3000 }
  );

  const sendMutation = trpc.liveChat.sendMessage.useMutation({
    onSuccess: () => messagesQuery.refetch(),
  });

  const releaseMutation = trpc.liveChat.release.useMutation({
    onSuccess: onRelease,
  });

  const messages = messagesQuery.data ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    await sendMutation.mutateAsync({ sessionId, content, agentName });
  }, [input, sessionId, agentName, sendMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">
            Sesión activa
          </span>
          <span className="text-xs font-mono text-gray-400">
            {sessionId.slice(0, 10)}…
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
          onClick={() => releaseMutation.mutate({ sessionId })}
          disabled={releaseMutation.isPending}
        >
          <UserX className="w-3.5 h-3.5" />
          Liberar sesión
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageSquare className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">Envía el primer mensaje al visitante</p>
            <p className="text-xs text-gray-300 mt-1">
              Aparecerá en su pantalla como soporte en tiempo real
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "human" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === "human" ? "bg-blue-500" : "bg-gray-200"
              }`}>
                {msg.role === "human" ? (
                  <Headphones className="w-3 h-3 text-white" />
                ) : (
                  <User className="w-3 h-3 text-gray-500" />
                )}
              </div>
              <div className={`rounded-2xl px-3 py-2 text-sm max-w-[78%] ${
                msg.role === "human"
                  ? "bg-blue-500 text-white rounded-tr-sm"
                  : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
              }`}>
                {msg.role === "human" && (
                  <p className="text-[10px] text-blue-200 font-medium mb-0.5">
                    {msg.agentName ?? agentName}
                  </p>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-[10px] mt-1 ${msg.role === "human" ? "text-blue-200" : "text-gray-400"}`}>
                  {timeSince(msg.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Responder como ${agentName}…`}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition-all active:scale-95"
          >
            {sendMutation.isPending ? (
              <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1.5">
          Enter para enviar · El visitante lo recibe en tiempo real
        </p>
      </div>
    </div>
  );
}

// ─── Live Chat Panel (main) ───────────────────────────────────────────────────
interface LiveChatPanelProps {
  agentName?: string;
}

export default function LiveChatPanel({ agentName = "Soporte IAMET" }: LiveChatPanelProps) {
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const sessionsQuery = trpc.liveChat.getActiveSessions.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const takeOverMutation = trpc.liveChat.takeOver.useMutation({
    onSuccess: () => {
      utils.liveChat.getActiveSessions.invalidate();
    },
  });

  // Procedimiento para tomar control de una sesión desde el historial de conversaciones
  const handleTakeOver = useCallback(async (sessionId: string) => {
    await takeOverMutation.mutateAsync({ sessionId, agentName });
    setSelectedSession(sessionId);
  }, [agentName, takeOverMutation]);

  const sessions = sessionsQuery.data ?? [];
  const selectedSessionData = sessions.find((s) => s.sessionId === selectedSession);

  return (
    <div
      className="rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm border border-white/60"
      style={{ boxShadow: "6px 6px 14px rgba(0,0,0,0.07), -4px -4px 10px rgba(255,255,255,0.9)" }}
    >
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Intervención en Vivo</h2>
            <p className="text-xs text-gray-400">
              {sessions.length > 0
                ? `${sessions.length} sesión${sessions.length > 1 ? "es" : ""} activa${sessions.length > 1 ? "s" : ""}`
                : "Sin sesiones activas"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sessionsQuery.isFetching && (
            <RefreshCw className="w-3.5 h-3.5 text-gray-300 animate-spin" />
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Actualizando cada 5s
          </div>
        </div>
      </div>

      <div className="flex" style={{ minHeight: "420px" }}>
        {/* Sessions list */}
        <div className="w-64 flex-shrink-0 border-r border-gray-100 p-3 space-y-2 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                <Headphones className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Sin sesiones activas</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Cuando tomes control de una conversación aparecerá aquí
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.sessionId}
                session={session}
                isSelected={selectedSession === session.sessionId}
                onSelect={() => setSelectedSession(session.sessionId)}
              />
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedSession && selectedSessionData ? (
            <ChatWindow
              sessionId={selectedSession}
              agentName={agentName}
              onRelease={() => {
                setSelectedSession(null);
                utils.liveChat.getActiveSessions.invalidate();
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <UserCheck className="w-7 h-7 text-blue-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Selecciona una sesión
              </h3>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Elige una conversación de la lista para ver los mensajes e intervenir directamente con el visitante.
              </p>
              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-left max-w-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">¿Cómo tomar control?</p>
                    <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
                      Ve al historial de conversaciones, haz clic en{" "}
                      <strong>"Tomar control"</strong> en cualquier sesión activa, y aparecerá aquí.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TakeOver Button (para usar en ConversationRow) ───────────────────────────
interface TakeOverButtonProps {
  sessionId: string;
  humanTookOver: boolean;
  agentName?: string;
  onTookOver?: () => void;
}

export function TakeOverButton({ sessionId, humanTookOver, agentName = "Soporte IAMET", onTookOver }: TakeOverButtonProps) {
  const utils = trpc.useUtils();

  const takeOverMutation = trpc.liveChat.takeOver.useMutation({
    onSuccess: () => {
      utils.liveChat.getActiveSessions.invalidate();
      onTookOver?.();
    },
  });

  const releaseMutation = trpc.liveChat.release.useMutation({
    onSuccess: () => {
      utils.liveChat.getActiveSessions.invalidate();
    },
  });

  if (humanTookOver) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Intervenida
        </div>
        <button
          onClick={() => releaseMutation.mutate({ sessionId })}
          disabled={releaseMutation.isPending}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
        >
          Liberar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => takeOverMutation.mutate({ sessionId, agentName })}
      disabled={takeOverMutation.isPending}
      className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-all font-medium border border-blue-100 hover:border-blue-200 active:scale-95"
    >
      {takeOverMutation.isPending ? (
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <UserCheck className="w-3.5 h-3.5" />
      )}
      Tomar control
    </button>
  );
}

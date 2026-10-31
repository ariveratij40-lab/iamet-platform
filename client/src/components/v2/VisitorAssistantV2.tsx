import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageCircle, Send, X, RotateCcw, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAttribution } from "@/hooks/useAttribution";
import {
  assistantWelcome,
  assistantSuggestions,
  visitorGuidance,
  type VisitorAction,
} from "@shared/visitor-assistant";
type Message = { role: "assistant" | "user"; content: string };
export default function VisitorAssistantV2() {
  const [path] = useLocation();
  const visible =
    /^\/$|^\/(nosotros|soluciones|marcas|blog|cotizacion|contacto)(\/|$)/.test(
      path
    );
  return visible ? <VisitorAssistantContent path={path} /> : null;
}
function VisitorAssistantContent({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: assistantWelcome },
  ]);
  const [actions, setActions] = useState<VisitorAction[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [mode, setMode] = useState<"ai" | "guide" | null>(null);
  const feed = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const request = trpc.visitorAssistant.chat.useMutation();
  useAttribution();
  useEffect(() => {
    if (open) field.current?.focus();
  }, [open]);
  useEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [messages, busy]);
  function close() {
    setOpen(false);
    launcher.current?.focus();
  }
  async function send(content: string) {
    content = content.trim();
    if (!content || busyRef.current || content.length > 2000) return;
    busyRef.current = true;
    setBusy(true);
    setText("");
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next);
    try {
      const result = await request.mutateAsync({
        messages: next.slice(-8),
        contextPath: path,
      });
      setMessages([...next, { role: "assistant", content: result.reply }]);
      setActions(result.actions);
      setMode(result.mode);
    } catch {
      const result = visitorGuidance(content, path);
      setMessages([...next, { role: "assistant", content: result.reply }]);
      setActions(result.actions);
      setMode("guide");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <div
      className="fixed bottom-5 right-4 z-[70] text-white sm:right-6"
      onKeyDown={e => {
        if (e.key === "Escape") close();
      }}
    >
      {open && (
        <section
          role="dialog"
          aria-label="Asistente virtual IAMET"
          aria-modal="false"
          className="mb-3 flex h-[min(620px,calc(100dvh-115px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-blue-300/25 bg-[#0b1c2c] shadow-[0_20px_80px_rgba(0,0,0,.5)]"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-blue-300/15 bg-[#10283d] p-4">
            <div>
              <p className="font-bold">Asistente virtual IAMET</p>
              <p className="mt-1 text-xs text-blue-200">
                {mode === "guide"
                  ? "Modo guía · servicios de IAMET"
                  : mode === "ai"
                    ? "Orientación con inteligencia artificial"
                    : "Conozca nuestras soluciones"}
              </p>
            </div>
            <div className="flex gap-1">
              <button
                disabled={busy}
                aria-label="Nueva conversación"
                onClick={() => {
                  setMessages([
                    { role: "assistant", content: assistantWelcome },
                  ]);
                  setActions([]);
                  setMode(null);
                  setText("");
                  field.current?.focus();
                }}
                className="rounded p-2 hover:bg-white/10 disabled:opacity-40"
              >
                <RotateCcw size={16} />
              </button>
              <button
                aria-label="Cerrar asistente"
                onClick={close}
                className="rounded p-2 hover:bg-white/10"
              >
                <X size={19} />
              </button>
            </div>
          </header>
          <div
            ref={feed}
            role="log"
            aria-label="Conversación con IAMET"
            aria-live="polite"
            aria-relevant="additions"
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-xl p-3 text-sm leading-6 ${m.role === "user" ? "ml-7 bg-blue-600" : "mr-3 border border-blue-300/10 bg-[#10283d]"}`}
              >
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-blue-100/70">
                  {m.role === "user" ? "Usted" : "IAMET"}
                </span>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            ))}
            {busy && (
              <p
                role="status"
                className="flex items-center gap-2 text-xs text-blue-200"
              >
                <Loader2 className="animate-spin" size={14} />
                Preparando respuesta…
              </p>
            )}
            {!busy && actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {actions.map(action => (
                  <Link
                    href={
                      action.href.startsWith("/cotizacion")
                        ? `${action.href}${action.href.includes("?") ? "&" : "?"}origen=asistente`
                        : action.href
                    }
                    key={action.href}
                    onClick={close}
                    className="rounded-full border border-blue-300/30 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-600"
                  >
                    {action.label} →
                  </Link>
                ))}
              </div>
            )}
            {messages.length === 1 && (
              <div className="space-y-2">
                {assistantSuggestions.map(q => (
                  <button
                    disabled={busy}
                    key={q}
                    onClick={() => send(q)}
                    className="block w-full rounded-xl border border-blue-300/20 px-3 py-2 text-left text-xs leading-5 text-blue-200 hover:bg-blue-600/30"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form
            className="flex shrink-0 gap-2 border-t border-blue-300/15 p-3"
            onSubmit={e => {
              e.preventDefault();
              send(text);
            }}
          >
            <label htmlFor="iamet-visitor-message" className="sr-only">
              Su consulta para IAMET
            </label>
            <input
              ref={field}
              id="iamet-visitor-message"
              value={text}
              onChange={e => setText(e.target.value)}
              maxLength={2000}
              placeholder="¿En qué podemos ayudarle?"
              className="min-w-0 flex-1 rounded-xl border border-blue-300/25 bg-[#061524] px-3 py-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              disabled={busy || !text.trim()}
              aria-label="Enviar consulta al asistente"
              className="rounded-xl bg-blue-600 px-3 disabled:opacity-40"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
      <div className="flex justify-end">
        <button
          ref={launcher}
          aria-label={open ? "Cerrar asistente IAMET" : "Abrir asistente IAMET"}
          aria-expanded={open}
          onClick={() => (open ? close() : setOpen(true))}
          className="flex h-12 items-center gap-2 rounded-full border border-blue-300/20 bg-blue-600 px-4 text-sm font-semibold shadow-xl transition hover:bg-blue-500"
        >
          <MessageCircle size={20} />
          <span>{open ? "Cerrar" : "¿Le orientamos?"}</span>
        </button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { nanoid } from "nanoid";

// Genera o recupera un visitorId persistente en localStorage
function getVisitorId(): string {
  const key = "iamet_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = nanoid(16);
    localStorage.setItem(key, id);
  }
  return id;
}

interface TrackingOptions {
  currentPage?: string;
  currentSection?: string;
  chatActive?: boolean;
  chatDuration?: number;
  chatMessages?: number;
}

export function useVisitorTracking(options: TrackingOptions = {}) {
  const visitorId = useRef(getVisitorId());
  const chatStartTime = useRef<number | null>(null);
  const heartbeatMutation = trpc.tracking.heartbeat.useMutation();
  const logEventMutation = trpc.tracking.logEvent.useMutation();

  // Actualizar el tiempo de chat cuando chatActive cambia
  useEffect(() => {
    if (options.chatActive && !chatStartTime.current) {
      chatStartTime.current = Date.now();
    } else if (!options.chatActive) {
      chatStartTime.current = null;
    }
  }, [options.chatActive]);

  // Heartbeat cada 30 segundos
  useEffect(() => {
    const sendHeartbeat = () => {
      const chatDuration = chatStartTime.current
        ? Math.floor((Date.now() - chatStartTime.current) / 1000)
        : options.chatDuration ?? 0;

      heartbeatMutation.mutate({
        visitorId: visitorId.current,
        currentPage: options.currentPage ?? window.location.pathname,
        currentSection: options.currentSection,
        chatActive: options.chatActive ?? false,
        chatDuration,
        chatMessages: options.chatMessages ?? 0,
        referrer: document.referrer || undefined,
      });
    };

    // Enviar inmediatamente al montar
    sendHeartbeat();

    // Luego cada 30 segundos
    const interval = setInterval(sendHeartbeat, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    options.currentPage,
    options.currentSection,
    options.chatActive,
    options.chatMessages,
  ]);

  // Función para registrar eventos específicos
  const logEvent = useCallback(
    (
      event: "page_view" | "section_change" | "chat_open" | "chat_message" | "service_click" | "heartbeat",
      extra?: { page?: string; section?: string; metadata?: Record<string, unknown> }
    ) => {
      logEventMutation.mutate({
        visitorId: visitorId.current,
        event,
        page: extra?.page ?? window.location.pathname,
        section: extra?.section ?? options.currentSection,
        metadata: extra?.metadata,
      });
    },
    [options.currentSection, logEventMutation]
  );

  return {
    visitorId: visitorId.current,
    logEvent,
  };
}

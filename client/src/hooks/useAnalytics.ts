/**
 * useAnalytics — Hook para tracking de eventos de conversión
 * Envía eventos a GA4 via dataLayer (GTM) y al backend para el Dashboard Comercial.
 */
import { useCallback } from "react";
import { trpc } from "@/lib/trpc";

declare global {
  interface Window {
    dataLayer?: object[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  | "vertical_viewed"
  | "chat_started"
  | "lead_captured"
  | "meeting_intent"
  | "meeting_booked"
  | "quote_requested"
  | "cta_clicked"
  | "specialist_chat_opened"
  | "page_view";

export function useAnalytics() {
  const trackEventMutation = trpc.analytics.trackEvent.useMutation();

  const trackEvent = useCallback(
    (event: AnalyticsEvent, params?: Record<string, string | number | boolean>) => {
      // Push to GTM dataLayer
      if (typeof window !== "undefined") {
        window.dataLayer = window.dataLayer ?? [];
        window.dataLayer.push({
          event,
          ...params,
          timestamp: Date.now(),
        });

        // Also push to gtag if available
        if (typeof window.gtag === "function") {
          window.gtag("event", event, params);
        }
      }

      // Log in development
      if (import.meta.env.DEV) {
        console.log(`[Analytics] ${event}`, params);
      }

      // Persist to backend (non-blocking, fire-and-forget)
      const vertical = params?.vertical as string | undefined;
      const sessionId = params?.sessionId as string | undefined;
      const utmSource = params?.utm_source as string | undefined;
      const utmMedium = params?.utm_medium as string | undefined;
      const utmCampaign = params?.utm_campaign as string | undefined;
      trackEventMutation.mutate({
        event,
        vertical,
        sessionId,
        utmSource,
        utmMedium,
        utmCampaign,
        metadata: params as Record<string, unknown> | undefined,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const trackConversion = useCallback(
    (type: "lead" | "meeting" | "quote", value?: number) => {
      trackEvent("lead_captured", { conversion_type: type, value: value ?? 0 });
    },
    [trackEvent]
  );

  return { trackEvent, trackConversion };
}

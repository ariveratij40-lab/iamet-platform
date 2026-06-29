/**
 * useAttribution — Captura completa de attribution para IAMET
 *
 * Persiste en sessionStorage al primer load:
 *   - utm_source, utm_medium, utm_campaign, utm_term, utm_content
 *   - gclid (Google Ads), fbclid (Meta Ads), msclkid (Microsoft Ads)
 *   - referrer (document.referrer)
 *   - landing_url (primera URL de entrada)
 *   - first_page (pathname de la primera página)
 *   - session_id (UUID generado por sesión)
 *
 * Uso: const attr = useAttribution();
 *      // pasar attr a cualquier mutación de lead/meeting/quote
 */

import { useMemo } from "react";

export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  fbclid?: string;
  msclkid?: string;
  referrer?: string;
  landingUrl?: string;
  firstPage?: string;
  sessionId?: string;
}

const STORAGE_KEY = "iamet_attribution";

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const now = window.location.href;

  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmTerm: params.get("utm_term") || undefined,
    utmContent: params.get("utm_content") || undefined,
    gclid: params.get("gclid") || undefined,
    fbclid: params.get("fbclid") || undefined,
    msclkid: params.get("msclkid") || undefined,
    referrer: document.referrer || undefined,
    landingUrl: now,
    firstPage: window.location.pathname,
    sessionId: generateSessionId(),
  };
}

function loadOrInitAttribution(): Attribution {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as Attribution;
    }
  } catch {
    // sessionStorage no disponible (modo privado extremo)
  }

  // Primera visita: capturar y persistir
  const attr = captureAttribution();
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attr));
  } catch {
    // silenciar
  }
  return attr;
}

// Inicializar en el momento que el módulo se carga (antes del primer render)
let _cached: Attribution | null = null;
function getAttribution(): Attribution {
  if (!_cached) {
    _cached = loadOrInitAttribution();
  }
  return _cached;
}

/**
 * Hook que retorna el objeto de attribution de la sesión actual.
 * Estable entre renders (no cambia durante la sesión).
 */
export function useAttribution(): Attribution {
  return useMemo(() => getAttribution(), []);
}

/**
 * Función utilitaria para obtener attribution fuera de un componente React.
 * Útil en callbacks de mutación o funciones helper.
 */
export function getSessionAttribution(): Attribution {
  return getAttribution();
}

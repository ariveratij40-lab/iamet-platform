/**
 * IAMET AI Recommendations Engine
 * Genera recomendaciones de vendedor, especialista, productos y cross-sell
 * basadas en el historial de conversación del lead
 */
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { sql } from "drizzle-orm";

export interface AIRecommendation {
  id?: number;
  leadId: number;
  conversationId?: number;
  vendorSuggestion: string;
  specialistSuggestion: string;
  products: string[];
  services: string[];
  crossSell: string[];
  reasoning: string;
  createdAt: number;
}

const IAMET_PRODUCTS_CATALOG = `
PRODUCTOS Y SERVICIOS IAMET:
- Cableado Estructurado: Panduit Cat6A, fibra óptica, patch panels, bandejas, organizadores
- CCTV: Cámaras IP Axis/Hanwha, NVR, analítica de video, reconocimiento facial
- Control de Acceso: Lectores biométricos, torniquetes, barreras vehiculares, software HOROS
- RFID: Lectores fijos/portátiles, tags, antenas, software de inventario en tiempo real
- Data Center: Racks APC, PDU, UPS, DCIM SKIA, enfriamiento, monitoreo ambiental
- Redes: Switches Cisco/Panduit, routers, firewalls, SD-WAN
- Wi-Fi Industrial: Access points Cisco/Ruckus, controladores, diseño de cobertura
- IA Empresarial: Chatbots, análisis predictivo, visión artificial, automatización RPA
- Software a Medida: ERP, CRM, portales web, apps móviles, integraciones API
- Servicios Administrados: NOC 24/7, helpdesk, monitoreo, mantenimiento preventivo
- Audio y Voceo: Sistemas de voceo IP, parlantes, amplificadores, integración con CCTV
- Salas de Juntas: Videoconferencia Cisco/Poly, pantallas interactivas, control AV
- Automatización: PLCs, SCADA, sensores industriales, integración con ERP
- Fabricantes Aliados: Panduit, Cisco, Axis, APC, Hanwha, Ruckus, Zebra, Honeywell

VENDEDORES IAMET:
- Álvaro Rivera (alvaro.rivera@iamet.mx): Director Comercial — Enterprise, grandes cuentas
- Marco Reyes: Especialista Infraestructura y Data Center
- Luis Hernández: Especialista CCTV y Control de Acceso
- Diego Castillo: Especialista RFID y Automatización
- Sofía Morales: Especialista IA y Software
`;

export async function generateRecommendations(
  leadId: number,
  conversationId?: number
): Promise<AIRecommendation> {
  const db = await getDb();
  const now = Date.now();

  // Obtener datos del lead
  let leadData = "";
  let conversationHistory = "";

  if (db) {
    try {
      const leadRows = await db.execute(sql.raw(
        `SELECT * FROM leads WHERE id = ${leadId} LIMIT 1`
      )) as any;
      const leadArr = Array.isArray(leadRows) ? leadRows : (leadRows?.rows ?? []);
      if (leadArr.length > 0) {
        const l = leadArr[0];
        leadData = `Empresa: ${l.company || "N/A"}, Industria: ${l.industry || "N/A"}, Vertical: ${l.vertical || l.interest || "N/A"}, Cargo: ${l.position || "N/A"}, Tamaño: ${l.company_size || "N/A"}`;
      }

      if (conversationId) {
        const msgRows = await db.execute(sql.raw(
          `SELECT role, content FROM messages WHERE conversation_id = ${conversationId} ORDER BY created_at ASC LIMIT 20`
        )) as any;
        const msgArr = Array.isArray(msgRows) ? msgRows : (msgRows?.rows ?? []);
        conversationHistory = msgArr
          .map((m: any) => `${m.role === "user" ? "Cliente" : "IAMET"}: ${(m.content || "").substring(0, 200)}`)
          .join("\n");
      }
    } catch (e) {
      console.warn("[Recommendations] Error fetching lead data:", e);
    }
  }

  const prompt = `Eres el sistema de inteligencia comercial de IAMET. Analiza el siguiente lead y genera recomendaciones precisas.

DATOS DEL LEAD:
${leadData || "Sin datos adicionales"}

HISTORIAL DE CONVERSACIÓN:
${conversationHistory || "Sin conversación registrada"}

${IAMET_PRODUCTS_CATALOG}

Genera recomendaciones en formato JSON con esta estructura exacta:
{
  "vendorSuggestion": "Nombre del vendedor más adecuado y por qué (1-2 oraciones)",
  "specialistSuggestion": "Nombre del especialista técnico más adecuado y por qué (1-2 oraciones)",
  "products": ["Producto 1", "Producto 2", "Producto 3"],
  "services": ["Servicio 1", "Servicio 2"],
  "crossSell": ["Oportunidad cross-sell 1", "Oportunidad cross-sell 2"],
  "reasoning": "Razonamiento completo de por qué estas recomendaciones (3-5 oraciones)"
}

Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

  let recommendation: AIRecommendation = {
    leadId,
    conversationId,
    vendorSuggestion: "Álvaro Rivera — Director Comercial para evaluación inicial",
    specialistSuggestion: "Marco Reyes — Especialista en Infraestructura",
    products: ["Cableado Estructurado Panduit", "Switches Cisco"],
    services: ["Diagnóstico de infraestructura", "Propuesta técnica"],
    crossSell: ["Servicios Administrados NOC", "Monitoreo 24/7"],
    reasoning: "Recomendación inicial basada en el perfil del lead. Se requiere más información para personalizar.",
    createdAt: now,
  };

  try {
    const response = await invokeLLM({
      messages: [{ role: "user" as const, content: prompt as string }],
      response_format: { type: "json_object" } as any,
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : null;
    if (content) {
      const parsed = JSON.parse(content);
      recommendation = {
        leadId,
        conversationId,
        vendorSuggestion: parsed.vendorSuggestion || recommendation.vendorSuggestion,
        specialistSuggestion: parsed.specialistSuggestion || recommendation.specialistSuggestion,
        products: Array.isArray(parsed.products) ? parsed.products : recommendation.products,
        services: Array.isArray(parsed.services) ? parsed.services : recommendation.services,
        crossSell: Array.isArray(parsed.crossSell) ? parsed.crossSell : recommendation.crossSell,
        reasoning: parsed.reasoning || recommendation.reasoning,
        createdAt: now,
      };
    }
  } catch (e) {
    console.warn("[Recommendations] LLM error, using defaults:", e);
  }

  // Guardar en BD
  if (db) {
    try {
      const escape = (s: string) => s.replace(/'/g, "''");
      await db.execute(sql.raw(
        `INSERT INTO ai_recommendations (lead_id, conversation_id, vendor_suggestion, specialist_suggestion, products, services, cross_sell, reasoning, created_at)
         VALUES (${leadId}, ${conversationId || "NULL"}, '${escape(recommendation.vendorSuggestion)}', '${escape(recommendation.specialistSuggestion)}',
           '${escape(JSON.stringify(recommendation.products))}', '${escape(JSON.stringify(recommendation.services))}',
           '${escape(JSON.stringify(recommendation.crossSell))}', '${escape(recommendation.reasoning)}', ${now})`
      ));
    } catch (e) {
      console.warn("[Recommendations] Error saving:", e);
    }
  }

  return recommendation;
}

export async function getLatestRecommendation(leadId: number): Promise<AIRecommendation | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const rows = await db.execute(sql.raw(
      `SELECT * FROM ai_recommendations WHERE lead_id = ${leadId} ORDER BY created_at DESC LIMIT 1`
    )) as any;
    const arr = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    if (arr.length === 0) return null;

    const r = arr[0];
    const parse = (v: any) => {
      if (Array.isArray(v)) return v;
      if (typeof v === "string") { try { return JSON.parse(v); } catch { return []; } }
      return [];
    };

    return {
      id: r.id,
      leadId: r.lead_id,
      conversationId: r.conversation_id,
      vendorSuggestion: r.vendor_suggestion || "",
      specialistSuggestion: r.specialist_suggestion || "",
      products: parse(r.products),
      services: parse(r.services),
      crossSell: parse(r.cross_sell),
      reasoning: r.reasoning || "",
      createdAt: parseInt(r.created_at) || 0,
    };
  } catch (e) {
    console.warn("[Recommendations] Error fetching:", e);
    return null;
  }
}

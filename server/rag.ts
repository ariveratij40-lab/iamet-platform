/**
 * rag.ts — Motor de Búsqueda Híbrida Enterprise RAG
 *
 * Combina búsqueda por keywords (BM25-like) + re-ranking via LLM
 * para encontrar los chunks más relevantes de la base de conocimiento.
 * Cuando no hay documentos, cae en la base de conocimiento estática de IAMET.
 */

import { searchChunks } from "./knowledge";
import { invokeLLM } from "./_core/llm";

export interface RAGResult {
  content: string;
  docTitle: string;
  docId: number;
  score: number;
  source: "knowledge_base" | "static";
}

// ─── Base de conocimiento estática (fallback cuando RAG no tiene documentos) ──

const IAMET_STATIC_KNOWLEDGE = `
IAMET — Integración Avanzada en Metrología y Electrónica Tecnológica

MISIÓN: Diseñar, integrar y dar soporte a soluciones tecnológicas de seguridad, conectividad e infraestructura para empresas en México.

VERTICALES Y SOLUCIONES:

1. CCTV y Videovigilancia
   - Cámaras IP Hikvision, Dahua, Axis, Hanwha
   - NVR/DVR con almacenamiento en nube y local
   - Analítica de video: detección de personas, vehículos, comportamiento
   - Integración con control de acceso y alarmas
   - Proyectos desde 4 hasta 500+ cámaras
   - Precio referencia: $8,000-$15,000 MXN por punto de cámara instalado

2. Control de Acceso
   - Sistemas Mercury Security, HID Global, Genetec
   - Lectores biométricos, tarjetas RFID, PIN
   - Control de torniquetes, barreras vehiculares, puertas
   - Integración con nómina y RH
   - Precio referencia: $12,000-$25,000 MXN por punto de acceso

3. Cableado Estructurado
   - Certificado Panduit NetKey, Commscope, Belden
   - Cat6, Cat6A, Fibra óptica monomodo y multimodo
   - Certificación con Fluke DTX-1800
   - Cuartos de telecomunicaciones (TR) y centros de datos
   - Precio referencia: $800-$1,500 MXN por punto de red instalado

4. Voceo y Comunicación
   - Sistemas IP Bosch, TOA, Bogen
   - Voceo de emergencia NFPA 72
   - Integración con sistemas de incendio
   - Precio referencia: $3,500-$8,000 MXN por zona

5. Automatización e IoT
   - Control de iluminación DALI, KNX
   - Sensores ambientales, medición de energía
   - Integración con BMS (Building Management Systems)
   - Precio referencia: $15,000-$50,000 MXN por zona automatizada

6. Redes y Conectividad
   - Switches Cisco, HP/Aruba, Meraki
   - Access Points WiFi 6 y 6E
   - SD-WAN y conectividad redundante
   - Precio referencia: $5,000-$20,000 MXN por punto de red activo

INDUSTRIAS ATENDIDAS:
- Manufactura e industria (plantas, almacenes, naves)
- Retail y centros comerciales
- Hospitales y clínicas
- Hoteles y hospitalidad
- Gobierno y sector público
- Educación (universidades, colegios)
- Corporativos y oficinas
- Logística y transporte

DIFERENCIADORES:
- Único integrador Panduit Certified en la región
- Ingenieros certificados: BICSI, TIA-568, Cisco CCNA, HID
- Garantía de 5 años en cableado estructurado
- Soporte 24/7 con tiempo de respuesta < 4 horas
- Financiamiento disponible para proyectos > $500K MXN

PROCESO COMERCIAL:
1. Consulta inicial (30 min) → identificar necesidades
2. Visita técnica (gratuita) → levantamiento de sitio
3. Propuesta técnica + económica (5-7 días hábiles)
4. Negociación y ajustes
5. Firma de contrato + anticipo 30%
6. Implementación (2-12 semanas según proyecto)
7. Entrega y capacitación
8. Soporte y mantenimiento

PREGUNTAS FRECUENTES:
- ¿Cuánto tiempo tarda un proyecto? Proyectos pequeños 2-3 semanas, medianos 4-8 semanas, grandes 3-6 meses
- ¿Tienen financiamiento? Sí, para proyectos > $500K MXN con 12-36 meses
- ¿Dan mantenimiento? Sí, contratos anuales de mantenimiento preventivo y correctivo
- ¿Son certificados? Sí, Panduit Certified Installer, Cisco Partner, HID Certified
`;

// ─── Motor RAG principal ───────────────────────────────────────────────────────

export async function ragSearch(query: string, topK = 5): Promise<RAGResult[]> {
  // 1. Buscar en la base de conocimiento real (documentos subidos)
  const dbResults = await searchChunks(query, topK);

  if (dbResults.length >= 3) {
    // Tenemos suficientes resultados de la BD → re-rank con LLM
    const reranked = await rerankWithLLM(query, dbResults);
    return reranked.map(r => ({ ...r, source: "knowledge_base" as const }));
  }

  // 2. Fallback: buscar en la base estática
  const staticResults = searchStaticKnowledge(query, topK);

  // 3. Combinar resultados de BD + estáticos
  const combined: RAGResult[] = [
    ...dbResults.map(r => ({ ...r, source: "knowledge_base" as const })),
    ...staticResults.map(r => ({ ...r, source: "static" as const })),
  ];

  return combined.slice(0, topK);
}

// ─── Re-ranking via LLM ───────────────────────────────────────────────────────

async function rerankWithLLM(
  query: string,
  chunks: Array<{ content: string; docTitle: string; docId: number; score: number }>
): Promise<Array<{ content: string; docTitle: string; docId: number; score: number }>> {
  if (chunks.length <= 2) return chunks;

  try {
    const chunkList = chunks.map((c, i) => `[${i}] ${c.docTitle}: ${c.content.slice(0, 300)}`).join("\n\n");
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Eres un sistema de re-ranking de documentos técnicos. Responde SOLO con JSON." },
        { role: "user", content: `Consulta del usuario: "${query}"\n\nChunks disponibles:\n${chunkList}\n\nOrdena los índices de más a menos relevante para la consulta. Responde: {"ranking": [0, 2, 1, ...]}` },
      ],
    });
    const raw = response?.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw : "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    const ranking: number[] = parsed.ranking ?? [];
    if (ranking.length > 0) {
      return ranking.map(i => chunks[i]).filter(Boolean);
    }
  } catch {
    // Fallback: return as-is
  }
  return chunks;
}

// ─── Búsqueda en base estática ────────────────────────────────────────────────

function searchStaticKnowledge(query: string, topK: number): Array<{ content: string; docTitle: string; docId: number; score: number }> {
  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const paragraphs = IAMET_STATIC_KNOWLEDGE.split("\n\n").filter(p => p.trim().length > 30);

  const scored = paragraphs.map((p, i) => {
    const lower = p.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      const matches = (lower.match(new RegExp(kw, "g")) ?? []).length;
      score += matches;
    }
    return { content: p.trim(), docTitle: "Base de Conocimiento IAMET", docId: 0, score };
  });

  return scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// ─── Contexto para el agente ─────────────────────────────────────────────────

export async function buildRAGContext(query: string, topK = 4): Promise<string> {
  const results = await ragSearch(query, topK);
  if (results.length === 0) return "";

  const parts = results.map(r => {
    const source = r.source === "knowledge_base" ? `📄 ${r.docTitle}` : "📚 Base IAMET";
    return `${source}:\n${r.content}`;
  });

  return `\n\n--- CONTEXTO DE BASE DE CONOCIMIENTO ---\n${parts.join("\n\n")}\n--- FIN DEL CONTEXTO ---`;
}

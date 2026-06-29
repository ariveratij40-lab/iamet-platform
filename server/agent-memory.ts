/**
 * agent-memory.ts — Memoria Comercial Acumulativa del Agente IAMET
 *
 * Almacena el contexto de cada sesión de conversación para que el agente
 * recuerde información clave entre turnos: industria, tamaño, presupuesto,
 * necesidades, sistemas actuales, decisores, competidores, etc.
 *
 * La memoria se persiste en la tabla `conversations` usando el campo `metadata`
 * (JSON) para no requerir una nueva tabla. Esto mantiene la compatibilidad
 * con el esquema existente.
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CommercialMemory {
  // Datos de la empresa
  industry?: string;
  companySize?: string;
  branches?: string;
  location?: string;

  // Datos del proyecto
  needs?: string[];
  currentSystems?: string[];
  competitors?: string[];
  budget?: string;
  urgency?: string;
  timeline?: string;

  // Datos del contacto
  decisionMaker?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  company?: string;

  // Estado del proceso
  leadId?: number;
  qualificationScore?: number;
  proposalGenerated?: boolean;
  meetingScheduled?: boolean;
  salespersonAssigned?: string;
  engineerAssigned?: string;

  // Historial de interacciones
  topicsDiscussed?: string[];
  lastActionAt?: string;
}

// ─── Obtener memoria de sesión ────────────────────────────────────────────────

export async function getMemory(sessionId: string): Promise<CommercialMemory> {
  try {
    const db = await getDb();
    if (!db) return {};
    const rows = await db.execute(sql.raw(
      `SELECT metadata FROM conversations WHERE session_id = '${sessionId.replace(/'/g, "''")}' LIMIT 1`
    )) as any;
    const convRows = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    if (convRows.length === 0) return {};
    const raw = convRows[0]?.metadata;
    if (!raw) return {};
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return (parsed?.agentMemory as CommercialMemory) ?? {};
  } catch {
    return {};
  }
}

// ─── Actualizar campo de memoria ──────────────────────────────────────────────

export async function updateMemory(
  sessionId: string,
  updates: Partial<CommercialMemory>
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    // Get current metadata
    const rows = await db.execute(sql.raw(
      `SELECT metadata FROM conversations WHERE session_id = '${sessionId.replace(/'/g, "''")}' LIMIT 1`
    )) as any;
    const convRows = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    let currentMeta: Record<string, unknown> = {};
    if (convRows.length > 0 && convRows[0]?.metadata) {
      const raw = convRows[0].metadata;
      currentMeta = typeof raw === "string" ? JSON.parse(raw) : raw;
    }
    // Merge memory
    const currentMemory = (currentMeta.agentMemory as CommercialMemory) ?? {};
    const newMemory: CommercialMemory = {
      ...currentMemory,
      ...updates,
      // Merge arrays instead of replacing
      needs: mergeArrays(currentMemory.needs, updates.needs),
      currentSystems: mergeArrays(currentMemory.currentSystems, updates.currentSystems),
      competitors: mergeArrays(currentMemory.competitors, updates.competitors),
      topicsDiscussed: mergeArrays(currentMemory.topicsDiscussed, updates.topicsDiscussed),
      lastActionAt: new Date().toISOString(),
    };
    const updatedMeta = { ...currentMeta, agentMemory: newMemory };
    const metaJson = JSON.stringify(updatedMeta).replace(/'/g, "''");
    await db.execute(sql.raw(
      `UPDATE conversations SET metadata = '${metaJson}', updated_at = NOW() WHERE session_id = '${sessionId.replace(/'/g, "''")}' LIMIT 1`
    ));
  } catch (e) {
    console.error("[AgentMemory] updateMemory error:", e);
  }
}

function mergeArrays(existing?: string[], incoming?: string[]): string[] | undefined {
  if (!existing && !incoming) return undefined;
  const merged = [...(existing ?? [])];
  for (const item of incoming ?? []) {
    if (!merged.includes(item)) merged.push(item);
  }
  return merged.length > 0 ? merged : undefined;
}

// ─── Construir contexto de memoria para el system prompt ─────────────────────

export async function getMemoryContext(sessionId: string): Promise<string> {
  const memory = await getMemory(sessionId);
  if (Object.keys(memory).length === 0) return "";

  const lines: string[] = [];

  if (memory.company) lines.push(`Empresa: ${memory.company}`);
  if (memory.industry) lines.push(`Industria: ${memory.industry}`);
  if (memory.companySize) lines.push(`Tamaño: ${memory.companySize}`);
  if (memory.branches) lines.push(`Sucursales: ${memory.branches}`);
  if (memory.location) lines.push(`Ubicación: ${memory.location}`);

  if (memory.contactName) lines.push(`Contacto: ${memory.contactName}`);
  if (memory.contactEmail) lines.push(`Email: ${memory.contactEmail}`);
  if (memory.contactPhone) lines.push(`Teléfono: ${memory.contactPhone}`);
  if (memory.decisionMaker) lines.push(`Tomador de decisión: ${memory.decisionMaker}`);

  if (memory.needs?.length) lines.push(`Necesidades detectadas: ${memory.needs.join(", ")}`);
  if (memory.currentSystems?.length) lines.push(`Sistemas actuales: ${memory.currentSystems.join(", ")}`);
  if (memory.competitors?.length) lines.push(`Competidores mencionados: ${memory.competitors.join(", ")}`);
  if (memory.budget) lines.push(`Presupuesto: ${memory.budget}`);
  if (memory.urgency) lines.push(`Urgencia: ${memory.urgency}`);
  if (memory.timeline) lines.push(`Timeline: ${memory.timeline}`);

  if (memory.leadId) lines.push(`Lead ID en CRM: ${memory.leadId}`);
  if (memory.qualificationScore) lines.push(`Score de calificación: ${memory.qualificationScore}/100`);
  if (memory.salespersonAssigned) lines.push(`Vendedor asignado: ${memory.salespersonAssigned}`);
  if (memory.engineerAssigned) lines.push(`Ingeniero asignado: ${memory.engineerAssigned}`);
  if (memory.proposalGenerated) lines.push(`Propuesta preliminar: ya generada`);
  if (memory.meetingScheduled) lines.push(`Reunión: ya agendada`);

  if (memory.topicsDiscussed?.length) lines.push(`Temas discutidos: ${memory.topicsDiscussed.join(", ")}`);

  return lines.join("\n");
}

// ─── Actualizar memoria desde conversación (post-turno) ──────────────────────

export async function updateMemoryFromConversation(
  sessionId: string,
  userMessage: string,
  agentReply: string,
  toolsUsed: Array<{ name: string; success: boolean; summary: string }>
): Promise<void> {
  try {
    // Use LLM to extract structured information from the conversation turn
    const extractionPrompt = `Analiza este intercambio de conversación y extrae información comercial estructurada.
Responde SOLO con un JSON válido (sin markdown). Si no hay información para un campo, omítelo.

Intercambio:
Usuario: ${userMessage}
Agente: ${agentReply}
Herramientas ejecutadas: ${toolsUsed.map((t) => t.name).join(", ")}

Extrae:
{
  "industry": "industria detectada",
  "companySize": "tamaño de empresa",
  "branches": "número de sucursales",
  "location": "ciudad/estado",
  "contactName": "nombre del contacto",
  "contactEmail": "email del contacto",
  "contactPhone": "teléfono",
  "company": "nombre de la empresa",
  "decisionMaker": "nombre del tomador de decisión",
  "needs": ["necesidad1", "necesidad2"],
  "currentSystems": ["sistema1", "sistema2"],
  "competitors": ["competidor1"],
  "budget": "presupuesto mencionado",
  "urgency": "alta/media/baja",
  "timeline": "fecha o plazo mencionado",
  "topicsDiscussed": ["tema1", "tema2"]
}`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Eres un extractor de información comercial. Responde SOLO con JSON válido." },
        { role: "user", content: extractionPrompt },
      ],
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    const rawText = typeof rawContent === "string" ? rawContent : "{}";
    const extracted = JSON.parse(rawText.replace(/```json|```/g, "").trim()) as Partial<CommercialMemory>;

    // Build updates from tool results
    const toolUpdates: Partial<CommercialMemory> = {};
    for (const tool of toolsUsed) {
      if (tool.name === "bookMeeting" && tool.success) {
        toolUpdates.meetingScheduled = true;
      }
      if (tool.name === "generateProposal" && tool.success) {
        toolUpdates.proposalGenerated = true;
      }
      if (tool.name === "assignSalesperson" && tool.success) {
        toolUpdates.salespersonAssigned = tool.summary;
      }
      if (tool.name === "assignEngineer" && tool.success) {
        toolUpdates.engineerAssigned = tool.summary;
      }
    }

    // Merge extracted info with tool updates
    const updates: Partial<CommercialMemory> = {};
    for (const [key, value] of Object.entries(extracted)) {
      if (value !== undefined && value !== null && value !== "") {
        (updates as any)[key] = value;
      }
    }
    Object.assign(updates, toolUpdates);

    if (Object.keys(updates).length > 0) {
      await updateMemory(sessionId, updates);
    }
  } catch (e) {
    // Memory update is non-critical
    console.error("[AgentMemory] updateMemoryFromConversation error:", e);
  }
}

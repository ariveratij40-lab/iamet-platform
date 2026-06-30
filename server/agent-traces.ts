/**
 * agent-traces.ts — Observabilidad del Agente SDR
 *
 * Guarda y consulta trazas de tool calls del agente para
 * el panel de observabilidad en /admin/agent.
 */

import { sql } from "drizzle-orm";
import { getDb } from "./db";

export interface TraceInput {
  conversationId?: number;
  sessionId?: string;
  iterationNum?: number;
  toolName: string;
  params?: unknown;
  result?: unknown;
  durationMs?: number;
  success?: boolean;
  error?: string;
  promptTokens?: number;
  completionTokens?: number;
}

export async function saveTrace(trace: TraceInput): Promise<void> {
  const db = await getDb();
  if (!db) return;
  try {
    const paramsJson = JSON.stringify(trace.params ?? {}).replace(/'/g, "''").slice(0, 5000);
    const resultJson = JSON.stringify(trace.result ?? {}).replace(/'/g, "''").slice(0, 5000);
    const errorStr = (trace.error ?? "").replace(/'/g, "''").slice(0, 500);
    await db.execute(sql.raw(`
      INSERT INTO agent_traces (
        conversationId, sessionId, iterationNum, toolName,
        params, result, durationMs, success, error,
        promptTokens, completionTokens
      ) VALUES (
        ${trace.conversationId ?? "NULL"},
        ${trace.sessionId ? `'${trace.sessionId.replace(/'/g, "''")}'` : "NULL"},
        ${trace.iterationNum ?? 1},
        '${trace.toolName.replace(/'/g, "''")}',
        '${paramsJson}',
        '${resultJson}',
        ${trace.durationMs ?? "NULL"},
        ${trace.success !== false ? 1 : 0},
        ${errorStr ? `'${errorStr}'` : "NULL"},
        ${trace.promptTokens ?? "NULL"},
        ${trace.completionTokens ?? "NULL"}
      )
    `));
  } catch {
    // Silent — traces are non-critical
  }
}

export async function getTracesByConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.execute(sql.raw(
    `SELECT * FROM agent_traces WHERE conversationId = ${conversationId} ORDER BY createdAt ASC`
  )) as unknown;
  return (Array.isArray(rows) ? rows : (rows as { rows?: unknown[] })?.rows ?? []) as Record<string, unknown>[];
}

export async function getTraceStats(days = 30) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.execute(sql.raw(`
    SELECT
      COUNT(DISTINCT conversationId) as totalConversations,
      COUNT(*) as totalToolCalls,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successfulCalls,
      AVG(durationMs) as avgDurationMs,
      SUM(promptTokens) as totalPromptTokens,
      SUM(completionTokens) as totalCompletionTokens
    FROM agent_traces
    WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ${days} DAY)
  `)) as unknown;
  const arr = Array.isArray(rows) ? rows : (rows as { rows?: unknown[] })?.rows ?? [];
  return (arr as Record<string, unknown>[])[0] ?? null;
}

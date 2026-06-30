/**
 * Health Monitor — Sprint 7
 * Checks the health of all system services and stores results.
 * Used by the /admin/health dashboard and the health heartbeat.
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

export type HealthStatus = "ok" | "warn" | "error";

export interface ServiceHealth {
  service: string;
  status: HealthStatus;
  latencyMs: number;
  message: string;
  checkedAt: number;
}

export interface SystemHealthReport {
  overall: HealthStatus;
  services: ServiceHealth[];
  checkedAt: number;
  summary: string;
}

/**
 * Check database connectivity and response time.
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not initialized");
    await db.execute(sql.raw("SELECT 1"));
    const latencyMs = Date.now() - start;
    return {
      service: "database",
      status: latencyMs > 2000 ? "warn" : "ok",
      latencyMs,
      message: latencyMs > 2000 ? `Latencia alta: ${latencyMs}ms` : "Conectado y respondiendo",
      checkedAt: Date.now(),
    };
  } catch (err: any) {
    return {
      service: "database",
      status: "error",
      latencyMs: Date.now() - start,
      message: err?.message || "Error de conexión",
      checkedAt: Date.now(),
    };
  }
}

/**
 * Check LLM API availability.
 */
async function checkLLM(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const response = await invokeLLM({
      messages: [{ role: "user", content: "ping" }],
    });
    const latencyMs = Date.now() - start;
    if (!response?.choices?.[0]) throw new Error("No response from LLM");
    return {
      service: "llm",
      status: latencyMs > 10000 ? "warn" : "ok",
      latencyMs,
      message: latencyMs > 10000 ? `Respuesta lenta: ${latencyMs}ms` : "LLM respondiendo correctamente",
      checkedAt: Date.now(),
    };
  } catch (err: any) {
    return {
      service: "llm",
      status: "error",
      latencyMs: Date.now() - start,
      message: err?.message || "LLM no disponible",
      checkedAt: Date.now(),
    };
  }
}

/**
 * Check RAG knowledge base.
 */
async function checkRAG(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not available");
    const result = await db.execute(sql.raw("SELECT COUNT(*) as cnt FROM knowledge_documents")) as any;
    const arr = Array.isArray(result) ? result : (result?.rows ?? []);
    const count = Number(arr[0]?.cnt ?? 0);
    const latencyMs = Date.now() - start;
    return {
      service: "rag",
      status: "ok",
      latencyMs,
      message: `${count} documentos indexados en la base de conocimiento`,
      checkedAt: Date.now(),
    };
  } catch (err: any) {
    return {
      service: "rag",
      status: "warn",
      latencyMs: Date.now() - start,
      message: "Base de conocimiento vacía o no disponible",
      checkedAt: Date.now(),
    };
  }
}

/**
 * Check email service (Resend).
 */
async function checkEmail(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY no configurada");

    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const latencyMs = Date.now() - start;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return {
      service: "email",
      status: latencyMs > 3000 ? "warn" : "ok",
      latencyMs,
      message: "Resend API disponible y autenticada",
      checkedAt: Date.now(),
    };
  } catch (err: any) {
    return {
      service: "email",
      status: "error",
      latencyMs: Date.now() - start,
      message: err?.message || "Email service no disponible",
      checkedAt: Date.now(),
    };
  }
}

/**
 * Check storage (R2/S3).
 */
async function checkStorage(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const r2Endpoint = process.env.R2_ENDPOINT;
    if (!r2Endpoint) {
      return {
        service: "storage",
        status: "warn",
        latencyMs: 0,
        message: "R2_ENDPOINT no configurado — usando storage local",
        checkedAt: Date.now(),
      };
    }

    // Just verify env vars are present
    const hasCredentials = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET;
    const latencyMs = Date.now() - start;
    return {
      service: "storage",
      status: hasCredentials ? "ok" : "warn",
      latencyMs,
      message: hasCredentials ? "R2 Storage configurado correctamente" : "Credenciales de storage incompletas",
      checkedAt: Date.now(),
    };
  } catch (err: any) {
    return {
      service: "storage",
      status: "error",
      latencyMs: Date.now() - start,
      message: err?.message || "Storage no disponible",
      checkedAt: Date.now(),
    };
  }
}

/**
 * Check scheduled heartbeats.
 */
async function checkHeartbeats(): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) throw new Error("DB not available");

    // Check if daily briefing ran in the last 25 hours
    const cutoff = Date.now() - 25 * 60 * 60 * 1000;
    const result = await db.execute(sql.raw(`
      SELECT COUNT(*) as cnt FROM daily_briefings WHERE generatedAt > ${cutoff}
    `)) as any;
    const arr = Array.isArray(result) ? result : (result?.rows ?? []);
    const recentBriefings = Number(arr[0]?.cnt ?? 0);

    const latencyMs = Date.now() - start;
    return {
      service: "heartbeats",
      status: recentBriefings > 0 ? "ok" : "warn",
      latencyMs,
      message: recentBriefings > 0
        ? "Briefing diario ejecutado correctamente"
        : "Briefing diario no ejecutado en las últimas 25h",
      checkedAt: Date.now(),
    };
  } catch (err: any) {
    return {
      service: "heartbeats",
      status: "warn",
      latencyMs: Date.now() - start,
      message: "No se pudo verificar estado de heartbeats",
      checkedAt: Date.now(),
    };
  }
}

/**
 * Run all health checks in parallel.
 */
export async function runHealthCheck(): Promise<SystemHealthReport> {
  const [db, llm, rag, email, storage, heartbeats] = await Promise.allSettled([
    checkDatabase(),
    checkLLM(),
    checkRAG(),
    checkEmail(),
    checkStorage(),
    checkHeartbeats(),
  ]);

  const services: ServiceHealth[] = [
    db.status === "fulfilled" ? db.value : { service: "database", status: "error" as HealthStatus, latencyMs: 0, message: "Check failed", checkedAt: Date.now() },
    llm.status === "fulfilled" ? llm.value : { service: "llm", status: "error" as HealthStatus, latencyMs: 0, message: "Check failed", checkedAt: Date.now() },
    rag.status === "fulfilled" ? rag.value : { service: "rag", status: "warn" as HealthStatus, latencyMs: 0, message: "Check failed", checkedAt: Date.now() },
    email.status === "fulfilled" ? email.value : { service: "email", status: "error" as HealthStatus, latencyMs: 0, message: "Check failed", checkedAt: Date.now() },
    storage.status === "fulfilled" ? storage.value : { service: "storage", status: "warn" as HealthStatus, latencyMs: 0, message: "Check failed", checkedAt: Date.now() },
    heartbeats.status === "fulfilled" ? heartbeats.value : { service: "heartbeats", status: "warn" as HealthStatus, latencyMs: 0, message: "Check failed", checkedAt: Date.now() },
  ];

  const hasError = services.some(s => s.status === "error");
  const hasWarn = services.some(s => s.status === "warn");
  const overall: HealthStatus = hasError ? "error" : hasWarn ? "warn" : "ok";

  const okCount = services.filter(s => s.status === "ok").length;
  const summary = `${okCount}/${services.length} servicios operativos`;

  // Save to DB
  await saveHealthLog(services);

  // Alert owner if critical services are down
  if (hasError) {
    const errorServices = services.filter(s => s.status === "error").map(s => s.service).join(", ");
    try {
      await notifyOwner({
        title: `⚠️ Alerta de Sistema — Servicios con error`,
        content: `Los siguientes servicios tienen errores: ${errorServices}. Revisar en /admin/health`,
      });
    } catch {
      // Notification failure should not break health check
    }
  }

  return { overall, services, checkedAt: Date.now(), summary };
}

/**
 * Save health check results to the database.
 */
async function saveHealthLog(services: ServiceHealth[]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  for (const s of services) {
    try {
      await db.execute(sql.raw(`
        INSERT INTO system_health_logs (service, status, latencyMs, message, checkedAt)
        VALUES (
          ${JSON.stringify(s.service)},
          ${JSON.stringify(s.status)},
          ${s.latencyMs},
          ${JSON.stringify(s.message.substring(0, 500))},
          ${s.checkedAt}
        )
      `));
    } catch {
      // Gracefully ignore if table doesn't exist yet
    }
  }
}

/**
 * Get health history from the database.
 */
export async function getHealthHistory(service?: string, limit = 50): Promise<ServiceHealth[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const whereClause = service ? `WHERE service = ${JSON.stringify(service)}` : "";
    const rows = await db.execute(sql.raw(`
      SELECT * FROM system_health_logs ${whereClause} ORDER BY checkedAt DESC LIMIT ${limit}
    `)) as any;
    const arr = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return arr.map((r: any) => ({
      service: r.service,
      status: r.status as HealthStatus,
      latencyMs: Number(r.latencyMs ?? 0),
      message: r.message,
      checkedAt: Number(r.checkedAt ?? 0),
    }));
  } catch {
    return [];
  }
}

/**
 * Get error summary for the last 24 hours.
 */
export async function getErrorSummary(): Promise<Array<{ service: string; errorCount: number; lastError: string; lastErrorAt: number }>> {
  const db = await getDb();
  if (!db) return [];

  try {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const rows = await db.execute(sql.raw(`
      SELECT service, COUNT(*) as errorCount, MAX(message) as lastError, MAX(checkedAt) as lastErrorAt
      FROM system_health_logs
      WHERE status = 'error' AND checkedAt > ${cutoff}
      GROUP BY service
      ORDER BY errorCount DESC
    `)) as any;
    const arr = Array.isArray(rows) ? rows : (rows?.rows ?? []);
    return arr.map((r: any) => ({
      service: r.service,
      errorCount: Number(r.errorCount ?? 0),
      lastError: r.lastError ?? "",
      lastErrorAt: Number(r.lastErrorAt ?? 0),
    }));
  } catch {
    return [];
  }
}

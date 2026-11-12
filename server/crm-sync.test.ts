import { describe, it, expect, vi, beforeEach } from "vitest";

// Sin CRM_SYNC_URL/TOKEN, la sincronización no hace nada (no rompe).
vi.mock("./db", () => ({ getDb: vi.fn().mockResolvedValue(null) }));

import { syncLeadToCRM, reintentarLeadsPendientes } from "./crm-sync";

describe("sincronización de leads al CRM", () => {
  beforeEach(() => { delete process.env.CRM_SYNC_URL; delete process.env.CRM_SYNC_TOKEN; });

  it("sin configuración, syncLeadToCRM no rompe y devuelve false", async () => {
    expect(await syncLeadToCRM(1)).toBe(false);
  });

  it("sin configuración, el reintento reporta no configurado", async () => {
    const r = await reintentarLeadsPendientes();
    expect(r.configured).toBe(false);
    expect(r.synced).toBe(0);
  });
});

// Híbrido (2026-11-12): el envío automático al CRM ya NO está bloqueado por
// diseño. Lo dispara el filtro de IA SOLO para los leads "proyecto" (eso se
// prueba en lead-routing.test.ts). Aquí, sin base de datos mockeada,
// syncLeadToCRM corta antes del envío y devuelve false.
it('con credenciales ya no está bloqueado por diseño (sin BD, corta antes del envío)', async () => {
  process.env.CRM_SYNC_URL = 'https://crm.example.invalid/api/leads';
  process.env.CRM_SYNC_TOKEN = 'test-only';
  try {
    expect(await syncLeadToCRM(1)).toBe(false); // getDb mockeado a null -> false
  } finally {
    delete process.env.CRM_SYNC_URL;
    delete process.env.CRM_SYNC_TOKEN;
  }
});

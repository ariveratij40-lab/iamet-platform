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

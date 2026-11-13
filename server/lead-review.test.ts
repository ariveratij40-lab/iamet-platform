import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { getDb } from "./db";
import { leadReviewRouter } from "./routers/leadReview";
import { emptyReview } from "../shared/lead-review";
import { syncLeadToCRM } from "./crm-sync";
vi.mock("./db", () => ({ getDb: vi.fn() }));
// El pase al CRM se simula: aquí probamos que calificar/transferir LO DISPARAN.
vi.mock("./crm-sync", () => ({ syncLeadToCRM: vi.fn().mockResolvedValue(true) }));
const pg = new PGlite();
const caller = (role = "admin") =>
  leadReviewRouter.createCaller({
    req: {} as any,
    res: {} as any,
    user: { id: 1, name: "Revisor", role } as any,
  });
const fields = {
  ...emptyReview,
  contactVerified: true,
  needConfirmed: true,
  serviceFit: true,
  areaFit: true,
};
beforeAll(async () => {
  await pg.exec(
    await readFile(
      new URL("../deployment/vps-v2/schema.sql", import.meta.url),
      "utf8"
    )
  );
  const migration = await readFile(
    new URL("../deployment/vps-v2/lead-reviews.sql", import.meta.url),
    "utf8"
  );
  await pg.exec(migration);
  await pg.exec(migration);
  await pg.exec(
    `INSERT INTO leads(company,"contactName",email,status,notes,"createdAt") VALUES ('Empresa','Contacto','test@example.invalid','proposal','Nota anterior',now()-interval '100 days');`
  );
  vi.mocked(getDb).mockResolvedValue(drizzle(pg));
});
afterAll(() => pg.close());
describe("Manual lead review", () => {
  it("keeps historical commercial status, includes old leads by default", async () => {
    const d = await caller().detail({ id: 1 });
    expect(d.status).toBe("proposal");
    expect(d.notes).toBe("Nota anterior");
    expect(d.review.status).toBe("new");
    expect((await caller().list({})).total).toBe(1);
    expect((await caller().list({ days: 30 })).total).toBe(0);
  });
  it("requires criteria, reasons and qualification before transfer", async () => {
    for (const request of [
      { status: "qualified", fields: emptyReview },
      { status: "needs_info", fields },
      { status: "discarded", fields },
      { status: "transferred", fields: { ...fields, reference: "CRM-1" } },
    ])
      await expect(
        caller().update({ id: 1, version: 0, ...request } as any)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect((await caller().detail({ id: 1 })).history).toHaveLength(0);
  });
  it("records needs-info then qualifies, blocks stale edits", async () => {
    await caller().update({
      id: 1,
      version: 0,
      status: "needs_info",
      fields: { ...emptyReview, reason: "Falta confirmar ubicación" },
    });
    await expect(
      caller().update({ id: 1, version: 0, status: "qualified", fields })
    ).rejects.toMatchObject({ code: "CONFLICT" });
    vi.mocked(syncLeadToCRM).mockClear();
    await caller().update({ id: 1, version: 1, status: "qualified", fields });
    expect((await caller().list({ status: "qualified" })).total).toBe(1);
    expect((await caller().overview({})).stages).toEqual([
      { status: "qualified", count: 1 },
    ]);
    // Calificar empuja SOLO al CRM corporativo (híbrido).
    expect(syncLeadToCRM).toHaveBeenCalledWith(1);
  });
  it("transfiere sin referencia manual, empuja al CRM y registra el handoff", async () => {
    vi.mocked(syncLeadToCRM).mockClear();
    // Transferir (ya calificado) ya NO exige referencia: se auto-rellena y se
    // empuja al CRM. Dos concurrentes → exactamente una gana (control de versión).
    const request = { id: 1, version: 2, status: "transferred" as const, fields };
    const results = await Promise.allSettled([
      caller().update(request),
      caller().update(request),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(syncLeadToCRM).toHaveBeenCalledWith(1); // empujó al CRM
    const d = await caller().detail({ id: 1 });
    expect(d.review.status).toBe("transferred");
    expect(d.review.transferredAt).toBeInstanceOf(Date);
    expect(d.review.reviewerName).toBe("Revisor");
    expect(d.review.fields.reference).toMatch(/autom|CRM/i); // referencia auto-rellenada
    expect(d.history).toHaveLength(3);
    expect(d.status).toBe("proposal");
    expect(d.notes).toBe("Nota anterior");
    // Ya transferido / versión vieja → bloquea reintentos.
    await expect(
      caller().update({ ...request, version: 3 })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it("rejects nonadmins and nonexistent records", async () => {
    await expect(caller("user").detail({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      caller("user").update({ id: 1, version: 3, status: "new", fields })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      caller().update({ id: 999, version: 0, status: "new", fields })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

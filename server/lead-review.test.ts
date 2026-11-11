import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { getDb } from "./db";
import { leadReviewRouter } from "./routers/leadReview";
import { emptyReview } from "../shared/lead-review";
vi.mock("./db", () => ({ getDb: vi.fn() }));
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
    await caller().update({ id: 1, version: 1, status: "qualified", fields });
    expect((await caller().list({ status: "qualified" })).total).toBe(1);
    expect((await caller().overview({})).stages).toEqual([
      { status: "qualified", count: 1 },
    ]);
  });
  it("requires a reference and records one manual handoff with identity and time", async () => {
    await expect(
      caller().update({ id: 1, version: 2, status: "transferred", fields })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const request = {
      id: 1,
      version: 2,
      status: "transferred" as const,
      fields: { ...fields, reference: "CRM-123" },
    };
    const results = await Promise.allSettled([
      caller().update(request),
      caller().update(request),
    ]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    const d = await caller().detail({ id: 1 });
    expect(d.review.transferredAt).toBeInstanceOf(Date);
    expect(d.review.reviewerName).toBe("Revisor");
    expect(d.review.fields.reference).toBe("CRM-123");
    expect(d.history).toHaveLength(3);
    expect(d.status).toBe("proposal");
    expect(d.notes).toBe("Nota anterior");
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

import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import { getDb } from "./db";
import { crmV2Router, captureCrmV2Lead } from "./routers/crmV2";
vi.mock("./db", () => ({ getDb: vi.fn() }));
const pg = new PGlite();
const caller = (role = "admin") =>
  crmV2Router.createCaller({
    req: {} as any,
    res: {} as any,
    user: { id: 1, role } as any,
  });
beforeAll(async () => {
  await pg.exec(
    await readFile(
      new URL("../deployment/vps-v2/schema.sql", import.meta.url),
      "utf8"
    )
  );
  vi.mocked(getDb).mockResolvedValue(drizzle(pg));
});
afterAll(() => pg.close());
describe("New IAMET CRM", () => {
  it("starts empty without fabricated leads or statistics", async () => {
    expect((await caller().overview({ days: 30 })).stages).toEqual([]);
    expect((await caller().list({ days: 30 })).total).toBe(0);
  });
  it("lists real stored leads and persists stage and follow-up notes", async () => {
    expect(
      await captureCrmV2Lead({
        company: "Fixture IAMET",
        contactName: "Contacto de prueba",
        email: "fixture@example.invalid",
        source: "agent",
      })
    ).toBe(1);
    const list = await caller().list({ days: 30, search: "Fixture" });
    expect(list.total).toBe(1);
    expect(list.items[0].source).toBe("agent");
    const initial = await caller().detail({ id: 1 });
    expect(initial.status).toBe("new");
    expect(initial.score).toBe(0);
    await caller().update({
      id: 1,
      status: "proposal",
      notes: "Revisar alcance técnico",
    });
    const lead = await caller().detail({ id: 1 });
    expect(lead.status).toBe("proposal");
    expect(lead.notes).toBe("Revisar alcance técnico");
    const summary = await caller().overview({ days: 30 });
    expect(summary.stages).toEqual([{ status: "proposal", count: 1 }]);
    expect(summary.sources).toEqual([{ source: "agent", count: 1 }]);
  });
  it("supports status filters, pagination, and date windows", async () => {
    await pg.exec(
      `INSERT INTO leads (company,"contactName",email) SELECT 'Empresa ' || n,'Contacto','contacto@example.invalid' FROM generate_series(1,21) n`
    );
    await pg.exec(
      `INSERT INTO leads (company,"contactName",email,"createdAt") VALUES ('Antiguo','Contacto','old@example.invalid',now()-interval '40 days')`
    );
    expect((await caller().list({ days: 30 })).total).toBe(22);
    expect((await caller().list({ days: 30, page: 0 })).items).toHaveLength(20);
    expect((await caller().list({ days: 30, page: 1 })).items).toHaveLength(2);
    expect((await caller().list({ days: 30, status: "proposal" })).total).toBe(
      1
    );
    expect((await caller().list({ days: 90 })).total).toBe(23);
    expect(
      (await caller().list({ days: 30, search: "' OR 1=1 --" })).total
    ).toBe(0);
  });
  it("rejects missing records and invalid stage changes", async () => {
    await expect(caller().detail({ id: 999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      caller().update({ id: 999, status: "closed_won", notes: "" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      caller().update({ id: 1, status: "invented" as any, notes: "" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
  it.each(["user", "manager", "viewer"])(
    "blocks %s from reading or editing commercial records",
    async role => {
      await expect(caller(role).overview({ days: 30 })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller(role).list({ days: 30 })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(caller(role).detail({ id: 1 })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        caller(role).update({ id: 1, status: "closed_won", notes: "" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
  );
});

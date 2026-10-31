import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { readFile } from "node:fs/promises";
import jwt from "jsonwebtoken";
import { getDb } from "./db";
import { createContext } from "./_core/context";
import { signJWT, verifyJWT, SESSION_COOKIE } from "./local-auth";
import { visitorAssistantRouter } from "./routers/visitorAssistant";
vi.mock("./db", () => ({ getDb: vi.fn(), isMysqlDb: () => false }));
vi.mock("./_core/env", () => ({
  ENV: { cookieSecret: "isolated-vps-test-secret", llmApiKey: "" },
}));
vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateRequest: vi.fn().mockRejectedValue(new Error("No OAuth")),
  },
}));
const pg = new PGlite();
const options = (token: string) =>
  ({
    req: { headers: { cookie: `${SESSION_COOKIE}=${token}` } },
    res: {},
  }) as any;
beforeAll(async () => {
  await pg.exec(
    await readFile(
      new URL("../deployment/vps-v2/schema.sql", import.meta.url),
      "utf8"
    )
  );
  await pg.exec(
    `INSERT INTO users ("openId",email,role,status) VALUES ('local:test','test@example.invalid','admin','active')`
  );
  vi.mocked(getDb).mockResolvedValue(drizzle(pg));
});
afterAll(() => pg.close());
describe("Fresh VPS schema and local CRM authentication", () => {
  it("contains all business, portal and transcript tables plus local authentication fields", async () => {
    const result = await pg.query<{ count: number }>(
      `SELECT count(*)::int AS count FROM pg_tables WHERE schemaname='public'`
    );
    expect(result.rows[0].count).toBe(38);
    await pg.query(`SELECT "passwordHash",status,"lastLoginAt" FROM users`);
    await pg.query(`SELECT * FROM warranty_tickets`);
    await pg.query(`SELECT * FROM assistant_turns`);
  });
  it("authenticates a local cookie and allows access to protected CRM", async () => {
    const token = signJWT({
      sub: "1",
      email: "test@example.invalid",
      role: "admin",
    });
    const ctx = await createContext(options(token));
    expect(ctx.user?.role).toBe("admin");
    const result = await visitorAssistantRouter
      .createCaller(ctx)
      .dashboard({ days: 30 });
    expect(result.totals.exchanges).toBe(0);
  });
  it("does not accept a customer/store JWT as an administrative session", async () => {
    const customer = jwt.sign(
      { sub: "1", role: "admin" },
      "isolated-vps-test-secret"
    );
    expect(verifyJWT(customer)).toBeNull();
    expect((await createContext(options(customer))).user).toBeNull();
  });
  it("reads current roles and disabled status from the database instead of trusting token claims", async () => {
    const token = signJWT({
      sub: "1",
      email: "test@example.invalid",
      role: "admin",
    });
    await pg.exec(`UPDATE users SET role='user' WHERE id=1`);
    const ctx = await createContext(options(token));
    expect(ctx.user?.role).toBe("user");
    await expect(
      visitorAssistantRouter.createCaller(ctx).dashboard({ days: 30 })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await pg.exec(`UPDATE users SET status='disabled' WHERE id=1`);
    expect((await createContext(options(token))).user).toBeNull();
  });
});

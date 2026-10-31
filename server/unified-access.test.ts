import {
  beforeAll,
  beforeEach,
  afterAll,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { readFile } from "node:fs/promises";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import { authenticateAccount } from "./account-access";
import { verifyJWT } from "./local-auth";
vi.mock("./db", () => ({ getDb: vi.fn(), isMysqlDb: () => false }));
vi.mock("./_core/env", () => ({
  ENV: { cookieSecret: "unified-access-fixture-secret" },
}));
const pg = new PGlite();
const secret = "unified-access-fixture-secret";
const password = "Synthetic-fixture-password";
beforeAll(async () => {
  await pg.exec(
    await readFile(
      new URL("../deployment/vps-v2/schema.sql", import.meta.url),
      "utf8"
    )
  );
  const hash = await bcrypt.hash(password, 4);
  for (const [email, role, status] of [
    ["admin@example.invalid", "admin", "active"],
    ["disabled@example.invalid", "admin", "disabled"],
    ["user@example.invalid", "user", "active"],
    ["shared@example.invalid", "admin", "active"],
  ]) {
    await pg.query(
      `INSERT INTO users ("openId",email,role,status,"passwordHash") VALUES ($1,$2,$3,$4,$5)`,
      ["local:" + email, email, role, status, hash]
    );
  }
  for (const [email, verified] of [
    ["client@example.invalid", true],
    ["unverified@example.invalid", false],
    ["client@iamet.mx", true],
    ["shared@example.invalid", true],
  ] as const) {
    await pg.query(
      `INSERT INTO store_users (name,email,"passwordHash","emailVerified") VALUES ('Cliente de prueba',$1,$2,$3)`,
      [email, hash, verified]
    );
  }
});
beforeEach(() => {
  vi.mocked(getDb).mockResolvedValue(drizzle(pg));
  (ENV as any).cookieSecret = secret;
});
afterAll(() => pg.close());
describe("Single account sign-in", () => {
  it("identifies an active administrator from database permissions", async () => {
    const result = await authenticateAccount(
      " ADMIN@example.invalid ",
      password
    );
    expect(result.kind).toBe("admin");
    expect(verifyJWT(result.token)?.role).toBe("admin");
    const login = await pg.query<{ lastLoginAt: Date }>(
      `SELECT "lastLoginAt" FROM users WHERE id=1`
    );
    expect(login.rows[0].lastLoginAt).toBeTruthy();
  });
  it("identifies a verified customer and issues a customer-only token", async () => {
    const result = await authenticateAccount(
      "client@example.invalid",
      password
    );
    expect(result.kind).toBe("customer");
    const decoded = await jwtVerify(
      result.token,
      new TextEncoder().encode(secret + "_store")
    );
    expect(decoded.payload.sub).toBe("1");
    expect(verifyJWT(result.token)).toBeNull();
  });
  it("never grants administrative access based on the email domain", async () => {
    expect((await authenticateAccount("client@iamet.mx", password)).kind).toBe(
      "customer"
    );
  });
  it("requires a verified customer email after validating the password", async () => {
    await expect(
      authenticateAccount("unverified@example.invalid", password)
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      authenticateAccount("unverified@example.invalid", "wrong")
    ).rejects.toMatchObject({
      status: 401,
      message: "Correo o contraseña incorrectos.",
    });
  });
  it.each([
    "admin@example.invalid",
    "missing@example.invalid",
    "disabled@example.invalid",
    "user@example.invalid",
  ])(
    "does not reveal account type or elevate invalid credentials: %s",
    async email => {
      const candidate =
        email.startsWith("disabled") || email.startsWith("user")
          ? password
          : "wrong";
      await expect(authenticateAccount(email, candidate)).rejects.toMatchObject(
        { status: 401, message: "Correo o contraseña incorrectos." }
      );
    }
  );
  it("gives an authenticated administrator precedence if both accounts share credentials", async () => {
    expect(
      (await authenticateAccount("shared@example.invalid", password)).kind
    ).toBe("admin");
  });
  it("fails closed when the database or signing secret is missing", async () => {
    vi.mocked(getDb).mockResolvedValue(null);
    await expect(
      authenticateAccount("admin@example.invalid", password)
    ).rejects.toMatchObject({ status: 503 });
    vi.mocked(getDb).mockResolvedValue(drizzle(pg));
    (ENV as any).cookieSecret = "";
    await expect(
      authenticateAccount("admin@example.invalid", password)
    ).rejects.toMatchObject({ status: 503 });
  });
});

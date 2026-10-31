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
import { readFile } from "node:fs/promises";
import { getDb } from "./db";
import { storeAuthRouter } from "./routers/storeAuth";
import { sendVerificationEmail } from "./email";
vi.mock("./db", () => ({ getDb: vi.fn() }));
vi.mock("./email", () => ({
  sendVerificationEmail: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));
vi.mock("./_core/env", () => ({
  ENV: {
    cookieSecret: "verification-fixture-secret",
    appUrl: "https://staging.iamet.mx",
  },
}));
const pg = new PGlite();
const caller = () =>
  storeAuthRouter.createCaller({ req: {} as any, res: {} as any, user: null });
const password = "Synthetic-password-fixture";
beforeAll(async () => {
  await pg.exec(
    await readFile(
      new URL("../deployment/vps-v2/schema.sql", import.meta.url),
      "utf8"
    )
  );
  vi.mocked(getDb).mockResolvedValue(drizzle(pg));
});
beforeEach(() => {
  vi.mocked(sendVerificationEmail).mockReset();
  vi.mocked(sendVerificationEmail).mockResolvedValue({ ok: true });
});
afterAll(() => pg.close());
describe("Customer verification delivery", () => {
  it("does not claim an email was sent when the provider rejects it", async () => {
    vi.mocked(sendVerificationEmail).mockResolvedValue({
      ok: false,
      error: "private provider detail",
    });
    const result = await caller().register({
      name: "Cliente de prueba",
      email: "failed@example.invalid",
      password,
      origin: "https://untrusted.example",
    });
    expect(result.emailSent).toBe(false);
    expect(result.message).toContain("no pudimos enviar");
    expect(JSON.stringify(result)).not.toContain("private provider detail");
    const stored = await pg.query<{
      emailVerified: boolean;
      verificationToken: string;
    }>(
      `SELECT "emailVerified","verificationToken" FROM store_users WHERE email='failed@example.invalid'`
    );
    expect(stored.rows[0].emailVerified).toBe(false);
    expect(stored.rows[0].verificationToken).toHaveLength(64);
    expect(JSON.stringify(result)).not.toContain(
      stored.rows[0].verificationToken
    );
    expect(vi.mocked(sendVerificationEmail).mock.calls[0][0].verifyUrl).toMatch(
      /^https:\/\/staging\.iamet\.mx\//
    );
  });
  it("reports provider acceptance without claiming inbox delivery", async () => {
    const result = await caller().register({
      name: "Cliente de prueba",
      email: "accepted@example.invalid",
      password,
      origin: "https://staging.iamet.mx",
      returnTo: "/garantias",
    });
    expect(result.emailSent).toBe(true);
    expect(
      vi.mocked(sendVerificationEmail).mock.calls[0][0].verifyUrl
    ).toContain("returnTo=%2Fgarantias");
  });
  it("keeps the account pending if sending throws", async () => {
    vi.mocked(sendVerificationEmail).mockRejectedValue(
      new Error("provider unavailable")
    );
    expect(
      (
        await caller().register({
          name: "Cliente de prueba",
          email: "exception@example.invalid",
          password,
          origin: "https://staging.iamet.mx",
        })
      ).emailSent
    ).toBe(false);
  });
  it("resends to an existing unverified account without invalidating its valid link", async () => {
    await pg.exec(
      `UPDATE store_users SET "updatedAt"=now()-interval '2 minutes' WHERE email='failed@example.invalid'`
    );
    const before = await pg.query<{ verificationToken: string }>(
      `SELECT "verificationToken" FROM store_users WHERE email='failed@example.invalid'`
    );
    const result = await caller().resendVerification({
      email: "failed@example.invalid",
      password,
      returnTo: "/garantias",
    });
    expect(result.emailSent).toBe(true);
    expect(
      vi.mocked(sendVerificationEmail).mock.calls[0][0].verifyUrl
    ).toContain(before.rows[0].verificationToken);
    await expect(
      caller().resendVerification({ email: "failed@example.invalid", password })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(sendVerificationEmail).toHaveBeenCalledTimes(1);
  });
  it("does not send messages for incorrect credentials or disclose whether an account exists", async () => {
    for (const email of ["failed@example.invalid", "missing@example.invalid"])
      await expect(
        caller().resendVerification({ email, password: "wrong-password" })
      ).rejects.toMatchObject({ message: "Correo o contraseña incorrectos." });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
  it("reports a resend rejection and keeps verification required", async () => {
    await pg.exec(
      `UPDATE store_users SET "updatedAt"=now()-interval '2 minutes' WHERE email='failed@example.invalid'`
    );
    vi.mocked(sendVerificationEmail).mockResolvedValue({ ok: false });
    expect(
      (
        await caller().resendVerification({
          email: "failed@example.invalid",
          password,
        })
      ).emailSent
    ).toBe(false);
    await expect(
      caller().login({ email: "failed@example.invalid", password })
    ).rejects.toThrow("verificar");
  });
  it("does not resend after verification", async () => {
    await pg.exec(
      `UPDATE store_users SET "emailVerified"=true WHERE email='accepted@example.invalid'`
    );
    expect(
      (
        await caller().resendVerification({
          email: "accepted@example.invalid",
          password,
        })
      ).alreadyVerified
    ).toBe(true);
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
});

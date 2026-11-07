import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { SignJWT } from "jose";
import { readFile } from "node:fs/promises";
import { getDb } from "./db";
import { getAccountProfile } from "./account-profile";
import { signJWT } from "./local-auth";
vi.mock("./db", () => ({ getDb: vi.fn(), isMysqlDb: () => false }));
vi.mock("./_core/env", () => ({
  ENV: { cookieSecret: "profile-fixture-secret" },
}));
const pg = new PGlite();
const customerToken = (sub: string, expiry = "1h") =>
  new SignJWT({
    sub,
    name: "Forged name",
    email: "forged@example.invalid",
    role: "admin",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiry)
    .sign(new TextEncoder().encode("profile-fixture-secret_store"));
beforeAll(async () => {
  await pg.exec(
    await readFile(
      new URL("../deployment/vps-v2/schema.sql", import.meta.url),
      "utf8"
    )
  );
  await pg.exec(
    `INSERT INTO users ("openId",name,email,role,status) VALUES ('local:admin','Administrador de prueba','admin@example.invalid','admin','active'),('local:disabled','Cuenta desactivada','disabled@example.invalid','admin','disabled'); INSERT INTO store_users (name,email,"passwordHash",company,phone,"emailVerified") VALUES ('Cliente de prueba','client@example.invalid','private-hash','Empresa de prueba','6640000000',true),('Otra persona','other@example.invalid','private-hash','Otra empresa','6860000000',true),('Sin confirmar','pending@example.invalid','private-hash',null,null,false);`
  );
  vi.mocked(getDb).mockResolvedValue(drizzle(pg));
});
afterAll(() => pg.close());
describe("Verified profile for quotation forms", () => {
  it("returns the current customer contact fields from the database, not JWT claims", async () => {
    expect(
      await getAccountProfile({ customerToken: await customerToken("1") })
    ).toEqual({
      id: 1,
      kind: "customer",
      name: "Cliente de prueba",
      email: "client@example.invalid",
      company: "Empresa de prueba",
      phone: "6640000000",
    });
  });
  it("does not expose secrets or another customer profile", async () => {
    const profile = await getAccountProfile({
      customerToken: await customerToken("2"),
    });
    expect(profile?.name).toBe("Otra persona");
    expect(Object.keys(profile!).sort()).toEqual([
      "company",
      "email",
      "id",
      "kind",
      "name",
      "phone",
    ]);
    expect(JSON.stringify(profile)).not.toContain("private-hash");
  });
  it("returns only actual available fields for an administrator", async () => {
    expect(
      await getAccountProfile({
        staffToken: signJWT({
          sub: "1",
          email: "admin@example.invalid",
          role: "admin",
        }),
      })
    ).toEqual({
      id: 1,
      kind: "admin",
      name: "Administrador de prueba",
      email: "admin@example.invalid",
      company: null,
      phone: null,
    });
  });
  it("leaves anonymous, expired, invalid and unverified sessions without profile data", async () => {
    for (const tokens of [
      {},
      { customerToken: "invalid" },
      { customerToken: await customerToken("1", "-1s") },
      { customerToken: await customerToken("3") },
      { customerToken: await customerToken("999") },
    ])
      expect(await getAccountProfile(tokens)).toBeNull();
  });
  it("does not treat customer tokens as staff sessions or trust stale role claims", async () => {
    expect(
      await getAccountProfile({ staffToken: await customerToken("1") })
    ).toBeNull();
    expect(
      await getAccountProfile({
        staffToken: signJWT({
          sub: "2",
          email: "disabled@example.invalid",
          role: "admin",
        }),
      })
    ).toBeNull();
    await pg.exec(`UPDATE users SET role='user' WHERE id=1`);
    expect(
      await getAccountProfile({
        staffToken: signJWT({
          sub: "1",
          email: "admin@example.invalid",
          role: "admin",
        }),
      })
    ).toBeNull();
  });
});

/**
 * Tests unitarios para autenticación local IAMET
 * Cubre: hashPassword, verifyPassword, signJWT, verifyJWT, cookieOptions
 */
import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signJWT,
  verifyJWT,
  cookieOptions,
  SESSION_COOKIE,
  type JWTPayload,
} from "./local-auth";

// ─── Tests de contraseña ──────────────────────────────────────────────────────

describe("hashPassword", () => {
  it("genera un hash bcrypt válido", async () => {
    const hash = await hashPassword("contraseña123");
    expect(hash).toBeTruthy();
    expect(hash.startsWith("$2")).toBe(true); // bcrypt hash prefix
    expect(hash.length).toBeGreaterThan(50);
  });

  it("rechaza contraseñas menores a 8 caracteres", async () => {
    await expect(hashPassword("corta")).rejects.toThrow(
      "La contraseña debe tener al menos 8 caracteres"
    );
  });

  it("acepta contraseñas de exactamente 8 caracteres", async () => {
    const hash = await hashPassword("12345678");
    expect(hash).toBeTruthy();
  });

  it("genera hashes diferentes para la misma contraseña (salt)", async () => {
    const hash1 = await hashPassword("mismaPass123");
    const hash2 = await hashPassword("mismaPass123");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyPassword", () => {
  it("verifica correctamente una contraseña válida", async () => {
    const password = "miContraseña2024";
    const hash = await hashPassword(password);
    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("rechaza una contraseña incorrecta", async () => {
    const hash = await hashPassword("contraseñaCorrecta");
    const result = await verifyPassword("contraseñaIncorrecta", hash);
    expect(result).toBe(false);
  });

  it("rechaza un hash inválido sin lanzar excepción", async () => {
    const result = await verifyPassword("cualquierCosa", "hash-invalido");
    expect(result).toBe(false);
  });
});

// ─── Tests de JWT ─────────────────────────────────────────────────────────────

describe("signJWT / verifyJWT", () => {
  const payload: Omit<JWTPayload, "iat" | "exp"> = {
    sub: "42",
    email: "admin@iamet.mx",
    role: "admin",
  };

  it("genera un token JWT válido", () => {
    const token = signJWT(payload);
    expect(token).toBeTruthy();
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
  });

  it("verifica un token válido y retorna el payload", () => {
    const token = signJWT(payload);
    const decoded = verifyJWT(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.sub).toBe("42");
    expect(decoded?.email).toBe("admin@iamet.mx");
    expect(decoded?.role).toBe("admin");
  });

  it("retorna null para un token inválido", () => {
    const result = verifyJWT("token.invalido.aqui");
    expect(result).toBeNull();
  });

  it("retorna null para un token vacío", () => {
    const result = verifyJWT("");
    expect(result).toBeNull();
  });

  it("retorna null para un token manipulado", () => {
    const token = signJWT(payload);
    const tampered = token.slice(0, -5) + "XXXXX";
    const result = verifyJWT(tampered);
    expect(result).toBeNull();
  });

  it("el token contiene iat y exp", () => {
    const token = signJWT(payload);
    const decoded = verifyJWT(token);
    expect(decoded?.iat).toBeDefined();
    expect(decoded?.exp).toBeDefined();
    expect(decoded!.exp! > decoded!.iat!).toBe(true);
  });
});

// ─── Tests de cookie options ──────────────────────────────────────────────────

describe("cookieOptions", () => {
  it("en producción: secure=true, httpOnly=true, sameSite=lax", () => {
    const opts = cookieOptions(true);
    expect(opts.httpOnly).toBe(true);
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
  });

  it("en desarrollo: secure=false, httpOnly=true, sameSite=lax", () => {
    const opts = cookieOptions(false);
    expect(opts.httpOnly).toBe(true);
    expect(opts.secure).toBe(false);
    expect(opts.sameSite).toBe("lax");
  });

  it("la expiración es de 7 días en ms", () => {
    const opts = cookieOptions(false);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(opts.maxAge).toBe(sevenDaysMs);
  });
});

// ─── Tests de SESSION_COOKIE ──────────────────────────────────────────────────

describe("SESSION_COOKIE", () => {
  it("tiene un nombre definido y no vacío", () => {
    expect(SESSION_COOKIE).toBeTruthy();
    expect(typeof SESSION_COOKIE).toBe("string");
    expect(SESSION_COOKIE.length).toBeGreaterThan(0);
  });
});

// ─── Tests de seguridad ───────────────────────────────────────────────────────

describe("Seguridad", () => {
  it("dos hashes del mismo password son diferentes (bcrypt salt)", async () => {
    const p = "password12345";
    const h1 = await hashPassword(p);
    const h2 = await hashPassword(p);
    expect(h1).not.toBe(h2);
    // Pero ambos verifican correctamente
    expect(await verifyPassword(p, h1)).toBe(true);
    expect(await verifyPassword(p, h2)).toBe(true);
  });

  it("un hash de una contraseña no verifica otra contraseña", async () => {
    const h = await hashPassword("contraseñaA");
    expect(await verifyPassword("contraseñaB", h)).toBe(false);
  });

  it("el token JWT no expone el passwordHash", () => {
    const token = signJWT({ sub: "1", email: "test@test.com", role: "admin" });
    // Decodificar payload sin verificar (base64)
    const payloadB64 = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    expect(decoded.passwordHash).toBeUndefined();
    expect(decoded.password).toBeUndefined();
  });
});

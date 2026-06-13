import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ── Helpers ──────────────────────────────────────────────────────────────────
function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-openid",
      email: "admin@iamet.mx",
      name: "Admin IAMET",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

// ── Lead Scoring ──────────────────────────────────────────────────────────────
describe("leads.scorePreview", () => {
  it("devuelve score numérico entre 0 y 100", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.leads.scorePreview({
      companySize: "51-200",
      industry: "manufactura",
      problemDescription: "Necesitamos mejorar la seguridad de nuestras instalaciones",
      verticalSlug: "seguridad",
      source: "form",
    });
    expect(result).toHaveProperty("score");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("empresa grande con descripción detallada tiene score mayor", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const high = await caller.leads.scorePreview({
      companySize: "500+",
      industry: "manufactura",
      problemDescription: "Requerimos implementar un sistema de control de acceso RFID para 5 plantas con 2000 empleados y monitoreo 24/7",
      verticalSlug: "rfid",
      source: "advisor",
    });
    const low = await caller.leads.scorePreview({
      companySize: "1-10",
      source: "form",
    });
    expect(high.score).toBeGreaterThan(low.score);
  });
});

// ── Verticales ────────────────────────────────────────────────────────────────
describe("verticals.list", () => {
  it("retorna exactamente 7 verticales", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.verticals.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(7);
  });

  it("cada vertical tiene slug, name, description e icon", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.verticals.list();
    for (const v of result) {
      expect(v).toHaveProperty("slug");
      expect(v).toHaveProperty("name");
      expect(v).toHaveProperty("description");
      expect(v).toHaveProperty("icon");
      expect(typeof v.slug).toBe("string");
      expect(v.slug.length).toBeGreaterThan(0);
    }
  });

  it("incluye las 7 verticales esperadas", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.verticals.list();
    const slugs = result.map((v) => v.slug);
    const expected = [
      "infraestructura",
      "seguridad",
      "rfid",
      "software-ia",
      "servicios-administrados",
      "educacion",
      "compliance",
    ];
    for (const slug of expected) {
      expect(slugs).toContain(slug);
    }
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────
describe("auth.me", () => {
  it("retorna null para usuario no autenticado", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("retorna el usuario para sesión autenticada", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("admin");
    expect(result?.email).toBe("admin@iamet.mx");
  });
});

// ── Academy ───────────────────────────────────────────────────────────────────
describe("academy.listCourses", () => {
  it("retorna un arreglo de cursos", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.academy.listCourses();
    expect(Array.isArray(result)).toBe(true);
  });

  it("cada curso tiene title, level y verticalSlug", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.academy.listCourses();
    for (const course of result) {
      expect(course).toHaveProperty("title");
      expect(course).toHaveProperty("level");
      expect(["basico", "intermedio", "avanzado"]).toContain(course.level);
    }
  });
});

// ── Agente Virtual ────────────────────────────────────────────────────────────
describe("agent.startSession", () => {
  it("crea una sesión y retorna sessionId", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.agent.startSession({ visitorId: "test-visitor-123" });
    expect(result).toHaveProperty("sessionId");
    expect(typeof result.sessionId).toBe("string");
    expect(result.sessionId.length).toBeGreaterThan(0);
  });
});

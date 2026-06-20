import { describe, it, expect } from "vitest";
import { Resend } from "resend";

describe("Resend API Key", () => {
  it("should have RESEND_API_KEY configured", () => {
    const key = process.env.RESEND_API_KEY;
    expect(key).toBeTruthy();
    expect(key?.startsWith("re_")).toBe(true);
  });

  it("should be able to list domains with the API key", async () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("RESEND_API_KEY not set — skipping live test");
      return;
    }

    const resend = new Resend(key);
    const { data, error } = await resend.domains.list();

    // Si la key es válida, no debe haber error de autenticación
    if (error) {
      // Errores de autenticación tienen código 401
      expect(error.message).not.toContain("API key");
      expect(error.message).not.toContain("Unauthorized");
    } else {
      // Si no hay error, la key es válida
      expect(data).toBeDefined();
    }
  }, 15_000);
});

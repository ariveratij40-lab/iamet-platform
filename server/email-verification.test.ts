import { beforeEach, describe, it, expect, vi } from "vitest";
import { ENV } from "./_core/env";
import { sendVerificationEmail } from "./email";
const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: mocks.send };
  },
}));
vi.mock("./_core/env", () => ({
  ENV: { resendApiKey: "synthetic-key", emailFrom: "IAMET <noreply@iamet.mx>" },
}));
const params = {
  to: "client@example.invalid",
  name: "Cliente de prueba",
  verifyUrl:
    "https://staging.iamet.mx/tienda/verificar-email?token=private-fixture-token",
};
beforeEach(() => {
  mocks.send.mockReset();
  (ENV as any).resendApiKey = "synthetic-key";
});
describe("Verification email provider result", () => {
  it("requires an accepted message identifier", async () => {
    mocks.send.mockResolvedValue({
      data: { id: "synthetic-message-id" },
      error: null,
    });
    expect((await sendVerificationEmail(params)).ok).toBe(true);
    expect(mocks.send.mock.calls[0][0].from).toBe("IAMET <noreply@iamet.mx>");
    mocks.send.mockResolvedValue({ data: null, error: null });
    expect((await sendVerificationEmail(params)).ok).toBe(false);
  });
  it("does not turn provider rejection or exceptions into success", async () => {
    mocks.send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "Domain not verified" },
    });
    expect((await sendVerificationEmail(params)).ok).toBe(false);
    mocks.send.mockRejectedValue(new Error("Provider timeout"));
    expect((await sendVerificationEmail(params)).ok).toBe(false);
  });
  it("does not print a verification link when the key is missing", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    (ENV as any).resendApiKey = "";
    expect((await sendVerificationEmail(params)).ok).toBe(false);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(
      JSON.stringify([...info.mock.calls, ...warn.mock.calls])
    ).not.toContain("private-fixture-token");
    info.mockRestore();
    warn.mockRestore();
  });
});

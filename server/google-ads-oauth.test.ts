import { describe, it, vi, expect, afterEach } from "vitest";
import { createContext } from "./_core/context";
import { exchangeCode, startAuthorization } from "./google-ads";
import { registerGoogleAdsOAuth } from "./google-ads-oauth";
vi.mock("./_core/context", () => ({ createContext: vi.fn() }));
vi.mock("./google-ads", async original => ({
  ...(await original<typeof import("./google-ads")>()),
  exchangeCode: vi.fn(),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
function handler() {
  let run: any;
  registerGoogleAdsOAuth({
    get: vi.fn((_path, fn) => {
      run = fn;
    }),
  } as any);
  return run;
}
function response() {
  return { setHeader: vi.fn(), redirect: vi.fn() };
}
function state() {
  vi.stubEnv("GOOGLE_ADS_CLIENT_ID", "fixture");
  vi.stubEnv("GOOGLE_ADS_CLIENT_SECRET", "secret");
  vi.stubEnv("GOOGLE_ADS_ENCRYPTION_KEY", "ab".repeat(32));
  vi.stubEnv("GOOGLE_ADS_CUSTOMER_ID", "3771755064");
  vi.stubEnv("VITE_APP_URL", "https://staging.iamet.mx");
  return new URL(startAuthorization(1, "session-a")).searchParams.get("state")!;
}
describe("Google Ads OAuth callback", () => {
  it("requires a current administrator session before exchanging any code", async () => {
    vi.mocked(createContext).mockResolvedValue({ user: null } as any);
    const res = response();
    await handler()({ query: { code: "private-code" }, headers: {} }, res);
    expect(exchangeCode).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(
      "/acceso?returnTo=%2Fadmin%2Fcampanas"
    );
  });
  it("rejects denial, session mismatch and replay without exposing OAuth codes", async () => {
    vi.mocked(createContext).mockResolvedValue({
      user: { id: 1, role: "admin" },
    } as any);
    const token = state();
    const res = response();
    const run = handler();
    await run(
      {
        query: { state: token, code: "private-code" },
        headers: { cookie: "iamet_session=wrong-session" },
      },
      res
    );
    await run(
      {
        query: { state: token, code: "private-code" },
        headers: { cookie: "iamet_session=session-a" },
      },
      res
    );
    await run(
      {
        query: { state: state(), error: "access_denied" },
        headers: { cookie: "iamet_session=session-a" },
      },
      res
    );
    expect(exchangeCode).not.toHaveBeenCalled();
    expect(
      res.redirect.mock.calls.every(
        ([url]) => url === "/admin/campanas?conexion=error"
      )
    ).toBe(true);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Referrer-Policy",
      "no-referrer"
    );
  });
  it("exchanges a valid one-use state and returns only a generic outcome", async () => {
    vi.mocked(createContext).mockResolvedValue({
      user: { id: 1, role: "admin" },
    } as any);
    const res = response();
    await handler()(
      {
        query: { state: state(), code: "private-code" },
        headers: { cookie: "iamet_session=session-a" },
      },
      res
    );
    expect(exchangeCode).toHaveBeenCalledWith(
      "private-code",
      expect.any(String)
    );
    expect(res.redirect).toHaveBeenCalledWith(
      "/admin/campanas?conexion=correcta"
    );
  });
});

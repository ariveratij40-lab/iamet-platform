import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  adsConfig,
  adsReport,
  consumeAuthorization,
  disconnectAds,
  exchangeCode,
  metricValues,
  openToken,
  reportingDates,
  savedToken,
  saveToken,
  sealToken,
  startAuthorization,
} from "./google-ads";
import { googleAdsRouter } from "./routers/googleAds";
const key = "ab".repeat(32);
function configure() {
  vi.stubEnv("GOOGLE_ADS_CLIENT_ID", "client.apps.googleusercontent.com");
  vi.stubEnv("GOOGLE_ADS_CLIENT_SECRET", "fixture-secret");
  vi.stubEnv("GOOGLE_ADS_ENCRYPTION_KEY", key);
  vi.stubEnv("GOOGLE_ADS_CUSTOMER_ID", "377-175-5064");
  vi.stubEnv("VITE_APP_URL", "https://staging.iamet.mx");
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("Google Ads private reporting", () => {
  it("encrypts stored authorization and rejects tampering and wrong keys", () => {
    const sealed = sealToken("private-refresh", key);
    expect(sealed).not.toContain("private-refresh");
    expect(openToken(sealed, key)).toBe("private-refresh");
    expect(() => openToken(sealed, "cd".repeat(32))).toThrow();
    const altered = Buffer.from(sealed, "base64");
    altered[30] ^= 1;
    expect(() => openToken(altered.toString("base64"), key)).toThrow();
  });
  it("fails closed without complete server settings", () => {
    configure();
    expect(adsConfig()?.callback).toBe(
      "https://staging.iamet.mx/api/google-ads/oauth/callback"
    );
    vi.stubEnv("GOOGLE_ADS_CUSTOMER_ID", "../other");
    expect(adsConfig()).toBeNull();
  });
  it("binds one-use state to the admin session and uses PKCE", () => {
    configure();
    const url = new URL(startAuthorization(1, "session-a"));
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("scope")).toBe(
      "https://www.googleapis.com/auth/adwords"
    );
    const state = url.searchParams.get("state")!;
    expect(consumeAuthorization(state, 1, "session-a")).toHaveLength(43);
    expect(() => consumeAuthorization(state, 1, "session-a")).toThrow();
    const other = new URL(startAuthorization(1, "session-a")).searchParams.get(
      "state"
    )!;
    expect(() => consumeAuthorization(other, 2, "session-a")).toThrow();
    const cross = new URL(startAuthorization(1, "session-a")).searchParams.get(
      "state"
    )!;
    expect(() => consumeAuthorization(cross, 1, "session-b")).toThrow();
  });
  it("expires pending authorizations after ten minutes", () => {
    configure();
    vi.useFakeTimers();
    const state = new URL(startAuthorization(1, "session")).searchParams.get(
      "state"
    )!;
    vi.advanceTimersByTime(600001);
    expect(() => consumeAuthorization(state, 1, "session")).toThrow();
  });
  it("computes date boundaries in the Ads account time zone and converts micros", () => {
    expect(
      reportingDates(7, "America/Tijuana", new Date("2026-10-31T01:00:00Z"))
    ).toEqual({ start: "2026-10-24", end: "2026-10-30" });
    expect(
      metricValues({
        costMicros: "1234500",
        clicks: "3",
        impressions: "100",
        conversions: 1.5,
      })
    ).toEqual({ cost: 1.2345, clicks: 3, impressions: 100, conversions: 1.5 });
  });
  it("blocks anonymous and customer access to every operation", async () => {
    for (const user of [null, { id: 2, role: "user" }]) {
      const caller = googleAdsRouter.createCaller({
        user,
        req: {},
        res: {},
      } as any);
      await expect(caller.status()).rejects.toThrow();
      await expect(caller.report({ days: 7 })).rejects.toThrow();
      await expect(caller.connect()).rejects.toThrow();
      await expect(caller.disconnect()).rejects.toThrow();
    }
  });
  it("blocks cross-origin connection mutations", async () => {
    configure();
    const caller = googleAdsRouter.createCaller({
      user: { id: 1, role: "admin" },
      req: {
        headers: {
          origin: "https://other.invalid",
          cookie: "iamet_session=test",
        },
      },
      res: {},
    } as any);
    await expect(caller.connect()).rejects.toThrow("Inicie la conexión");
    await expect(caller.disconnect()).rejects.toThrow("Solicitud inválida");
  });
  it("persists only encrypted refresh tokens, aggregates pages, caches and disconnects", async () => {
    configure();
    const dir = await mkdtemp(path.join(os.tmpdir(), "iamet-ads-"));
    vi.stubEnv("GOOGLE_ADS_STATE_DIR", dir);
    try {
      await saveToken("refresh-fixture");
      expect(await savedToken()).toBe("refresh-fixture");
      expect(
        await readFile(path.join(dir, "connection.enc"), "utf8")
      ).not.toContain("refresh-fixture");
      const mock = vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ access_token: "access-fixture" })
        )
        .mockResolvedValueOnce(
          Response.json({
            results: [
              {
                customer: {
                  id: "3771755064",
                  currencyCode: "MXN",
                  timeZone: "America/Tijuana",
                },
              },
            ],
          })
        )
        .mockResolvedValueOnce(
          Response.json({
            results: [
              {
                campaign: { id: "1", name: "Panduit", status: "PAUSED" },
                segments: { date: "2026-10-29" },
                metrics: {
                  clicks: "2",
                  impressions: "10",
                  costMicros: "1000000",
                  conversions: 0.5,
                },
              },
            ],
            nextPageToken: "page-2",
          })
        )
        .mockResolvedValueOnce(
          Response.json({
            results: [
              {
                campaign: { id: "1", name: "Panduit", status: "PAUSED" },
                segments: { date: "2026-10-30" },
                metrics: {
                  clicks: "3",
                  impressions: "20",
                  costMicros: "2000000",
                  conversions: 1,
                },
              },
            ],
          })
        )
        .mockResolvedValueOnce(
          Response.json({
            results: [
              {
                landingPageView: {
                  unexpandedFinalUrl:
                    "https://staging.iamet.mx/soluciones/infraestructura",
                },
                metrics: {
                  clicks: "5",
                  impressions: "30",
                  costMicros: "3000000",
                },
              },
            ],
          })
        );
      vi.stubGlobal("fetch", mock);
      const [a, b] = await Promise.all([adsReport(7), adsReport(7)]);
      expect(a).toEqual(b);
      expect(mock).toHaveBeenCalledTimes(5);
      expect(a.campaigns[0]).toMatchObject({
        id: "1",
        cost: 3,
        clicks: 5,
        impressions: 30,
        conversions: 1.5,
      });
      expect(a.landings[0].cost).toBe(3);
      const queries = mock.mock.calls.slice(1);
      expect(
        queries.every(([url]) => String(url).endsWith("/googleAds:search"))
      ).toBe(true);
      expect(JSON.parse(mock.mock.calls[3][1].body).pageToken).toBe("page-2");
      await disconnectAds();
      expect(await savedToken()).toBeNull();
      await expect(adsReport(7)).rejects.toThrow("Conecte su cuenta");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  it("does not save a grant without Ads scope or accessible customer", async () => {
    configure();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({
            access_token: "access",
            refresh_token: "refresh",
            scope: "openid",
          })
        )
    );
    await expect(exchangeCode("code", "verifier")).rejects.toThrow(
      "permiso necesario"
    );
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({
            access_token: "access",
            refresh_token: "refresh",
            scope: "https://www.googleapis.com/auth/adwords",
          })
        )
        .mockResolvedValueOnce(
          Response.json({ error: { message: "private data" } }, { status: 403 })
        )
    );
    await expect(exchangeCode("code", "verifier")).rejects.toThrow("HTTP 403");
  });
});

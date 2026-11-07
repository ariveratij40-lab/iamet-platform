import { describe, it, expect } from "vitest";
import { validCablingReceipt } from "../shared/cabling-campaign";
describe("Cabling receipt presentation", () => {
  const now = 1900000000000;
  it("does not infer a submission from visiting the thank you URL", () => {
    for (const value of [null, "", "NaN", "Infinity", "0", "-1"])
      expect(validCablingReceipt(value, now)).toBe(false);
  });
  it("accepts a recent session receipt and expires it after thirty minutes", () => {
    expect(validCablingReceipt(String(now), now)).toBe(true);
    expect(validCablingReceipt(String(now - 1799999), now)).toBe(true);
    expect(validCablingReceipt(String(now - 1800000), now)).toBe(false);
    expect(validCablingReceipt(String(now + 1), now)).toBe(false);
  });
});

describe("Cabling host selection", () => {
  it("selects only the exact campaign host and leaves staging and corporate routes alone", async () => {
    const { isCablingHostname } = await import("../shared/cabling-campaign");
    expect(isCablingHostname("cableadoestructurado.iamet.mx")).toBe(true);
    expect(isCablingHostname("CABLEADOESTRUCTURADO.IAMET.MX")).toBe(true);
    for (const host of [
      "staging.iamet.mx",
      "iamet.mx",
      "localhost",
      "cableadoestructurado.iamet.mx.example.com",
    ])
      expect(isCablingHostname(host)).toBe(false);
  });
});

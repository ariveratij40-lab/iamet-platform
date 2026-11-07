import { describe, expect, it } from "vitest";
import {
  customerDestination,
  staffDestination,
} from "../shared/account-access";
describe("Account access destinations", () => {
  it("directs customers to their service portal while the storefront is paused", () => {
    expect(customerDestination(null)).toBe("/garantias#portal");
    expect(customerDestination("/garantias")).toBe("/garantias#portal");
    expect(customerDestination("/tienda/perfil")).toBe("/garantias#portal");
    expect(customerDestination("/tienda")).toBe("/garantias#portal");
    expect(customerDestination("/admin/crm")).toBe("/garantias#portal");
  });
  it("preserves administrative destinations without redirecting to login again", () => {
    expect(staffDestination("/admin/garantias")).toBe("/admin/garantias");
    expect(staffDestination("/admin/crm")).toBe("/admin/crm");
    expect(staffDestination("/admin/login")).toBe("/admin/crm");
  });
  it.each([
    null,
    "https://other.example",
    "//other.example",
    "/admin/../tienda",
    "/admin/%2e%2e/tienda",
    "/admin/crm?returnTo=https://other.example",
    "/garantias",
    "javascript:alert(1)",
  ])("rejects unsafe administrative returnTo: %s", value => {
    expect(staffDestination(value)).toBe("/admin/crm");
    expect(customerDestination(value)).toBe("/garantias#portal");
  });
});

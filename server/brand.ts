import { ENV } from "./_core/env";
import { iametBrand } from "../shared/iamet-brand";
/** Email clients need an absolute HTTPS PNG; use our own deployed asset. */
export function emailBrandLogoUrl() {
  const origin = new URL(ENV.appUrl || "https://staging.iamet.mx").origin;
  return `${origin}${iametBrand.emailLogoPath}`;
}

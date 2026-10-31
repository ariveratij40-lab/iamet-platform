// Redirects are restricted to known local areas; never trust a returnTo URL.
export function customerDestination(_returnTo: string | null): string {
  // The storefront is paused; every customer enters the active service portal.
  return "/garantias#portal";
}
export function staffDestination(returnTo: string | null): string {
  return returnTo &&
    /^\/admin(?:\/[a-z0-9-]+)*$/.test(returnTo) &&
    returnTo !== "/admin/login"
    ? returnTo
    : "/admin/crm";
}

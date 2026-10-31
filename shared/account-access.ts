// Redirects are restricted to known local areas; never trust a returnTo URL.
export function customerDestination(returnTo: string | null): string {
  if (returnTo === "/tienda" || returnTo === "/tienda/perfil") return returnTo;
  return "/garantias#portal";
}
export function staffDestination(returnTo: string | null): string {
  return returnTo &&
    /^\/admin(?:\/[a-z0-9-]+)*$/.test(returnTo) &&
    returnTo !== "/admin/login"
    ? returnTo
    : "/admin/crm";
}

// Internal smoke check; no tokens or passwords are printed.
const origin = "http://127.0.0.1:3000";
const password = process.env.ADMIN_PASSWORD;
const health = await (await fetch(`${origin}/api/health`)).json();
if (health.release !== process.env.DEPLOY_RELEASE)
  throw new Error("Unexpected release");
const response = await fetch(`${origin}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "alvaro.rivera@iamet.mx", password }),
});
if (!response.ok)
  throw new Error(`Administrator login failed: HTTP ${response.status}`);
const cookie = response.headers.get("set-cookie")?.split(";")[0];
if (!cookie) throw new Error("Missing session cookie");
const input = encodeURIComponent(
  JSON.stringify({ json: { days: 30, page: 0 } })
);
const dashboard = await fetch(
  `${origin}/api/trpc/visitorAssistant.dashboard?input=${input}`,
  { headers: { Cookie: cookie } }
);
if (!dashboard.ok)
  throw new Error(`Assistant CRM failed: HTTP ${dashboard.status}`);
const result = await dashboard.json();
if (!result.result?.data?.json?.totals)
  throw new Error("Unexpected assistant CRM response");
const crm = await fetch(
  `${origin}/api/trpc/crmV2.overview?input=${encodeURIComponent(JSON.stringify({ json: { days: 30 } }))}`,
  { headers: { Cookie: cookie } }
);
if (!crm.ok || !(await crm.json()).result?.data?.json?.stages)
  throw new Error("New commercial CRM failed");
for (const route of [
  "/",
  "/nosotros",
  "/cotizacion",
  "/garantias",
  "/soluciones/infraestructura",
  "/admin/crm",
]) {
  if (!(await fetch(origin + route)).ok)
    throw new Error(`Page failed: ${route}`);
}
console.log("Administrator login, protected CRM and public pages passed.");

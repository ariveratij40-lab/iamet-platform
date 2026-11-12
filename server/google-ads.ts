import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { readFile, writeFile, rename, mkdir, unlink } from "node:fs/promises";
import path from "node:path";

export const ADS_SCOPE = "https://www.googleapis.com/auth/adwords";
const API_VERSION = "v26"; // Current REST version, verified against Google's reporting documentation.
export function adsConfig() {
  const id = process.env.GOOGLE_ADS_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim();
  const encryption = process.env.GOOGLE_ADS_ENCRYPTION_KEY?.trim();
  const customer = process.env.GOOGLE_ADS_CUSTOMER_ID?.replace(/-/g, "");
  const origin = process.env.VITE_APP_URL;
  if (
    !id ||
    !secret ||
    !encryption ||
    !/^[a-f0-9]{64}$/i.test(encryption) ||
    !customer ||
    !/^\d{10}$/.test(customer) ||
    !origin
  )
    return null;
  const url = new URL(origin);
  if (url.protocol !== "https:") return null;
  return {
    id,
    secret,
    encryption,
    customer,
    callback: `${url.origin}/api/google-ads/oauth/callback`,
  };
}
function config() {
  const value = adsConfig();
  if (!value)
    throw new Error(
      "La conexión de Google Ads no está configurada en el servidor."
    );
  return value;
}
function tokenFile() {
  return path.join(
    process.env.GOOGLE_ADS_STATE_DIR || "/app/var/google-ads",
    "connection.enc"
  );
}
export function sealToken(token: string, key: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}
export function openToken(value: string, key: string) {
  const raw = Buffer.from(value, "base64");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    raw.subarray(0, 12)
  );
  cipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([
    cipher.update(raw.subarray(28)),
    cipher.final(),
  ]).toString("utf8");
}
export async function savedToken() {
  try {
    return openToken(await readFile(tokenFile(), "utf8"), config().encryption);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error(
      "No se pudo leer la conexión guardada. Revise la configuración del servidor."
    );
  }
}
export async function saveToken(token: string) {
  const file = tokenFile();
  await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomBytes(8).toString("hex")}`;
  await writeFile(temporary, sealToken(token, config().encryption), {
    mode: 0o600,
  });
  await rename(temporary, file);
  cache.clear();
}
export async function disconnectAds() {
  await unlink(tokenFile()).catch(e => {
    if (e.code !== "ENOENT") throw e;
  });
  cache.clear();
}
async function tokenRequest(parameters: Record<string, string>) {
  const cfg = config();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      ...parameters,
      client_id: cfg.id,
      client_secret: cfg.secret,
    }),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok || !data.access_token)
    throw new Error(
      "Google no pudo renovar la autorización. Vuelva a conectar la cuenta y revise su acceso a Google Ads."
    );
  return data as {
    access_token: string;
    refresh_token?: string;
    scope?: string;
  };
}
export async function exchangeCode(code: string, verifier: string) {
  const tokens = await tokenRequest({
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: config().callback,
  });
  if (!tokens.refresh_token || !tokens.scope?.split(" ").includes(ADS_SCOPE))
    throw new Error(
      "Google no concedió el permiso necesario. Vuelva a conectar y autorice Google Ads."
    );
  // Confirm the configured Ads account is accessible before replacing an existing connection.
  await searchAds(
    tokens.access_token,
    "SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1"
  );
  await saveToken(tokens.refresh_token);
}
export function sessionFingerprint(cookie: string) {
  return createHash("sha256").update(cookie).digest("hex");
}
const pending = new Map<
  string,
  { user: number; session: string; verifier: string; expires: number }
>();
export function startAuthorization(user: number, cookie: string) {
  const cfg = config();
  for (const [key, item] of Array.from(pending))
    if (item.expires < Date.now()) pending.delete(key);
  if (pending.size >= 100)
    throw new Error("Espere unos minutos antes de conectar otra vez.");
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  pending.set(state, {
    user,
    session: sessionFingerprint(cookie),
    verifier,
    expires: Date.now() + 600000,
  });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: cfg.id,
    redirect_uri: cfg.callback,
    response_type: "code",
    scope: ADS_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}
export function consumeAuthorization(
  state: string,
  user: number,
  cookie: string
) {
  const item = pending.get(state);
  pending.delete(state);
  if (
    !item ||
    item.expires < Date.now() ||
    item.user !== user ||
    item.session !== sessionFingerprint(cookie)
  )
    throw new Error("Autorización inválida o vencida.");
  return item.verifier;
}
export async function searchAds(access: string, query: string) {
  const cfg = config();
  const rows: any[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 20; page++) {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    };
    const manager = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID?.replace(/-/g, "");
    if (manager && /^\d{10}$/.test(manager))
      headers["login-customer-id"] = manager;
    const response = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${cfg.customer}/googleAds:search`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
        signal: AbortSignal.timeout(20000),
      }
    );
    const data = await response.json();
    if (!response.ok)
      throw new Error(
        `Google Ads rechazó la consulta (HTTP ${response.status}). Revise el acceso de la cuenta, el nivel de API y la autorización.`
      );
    rows.push(...(data.results ?? []));
    pageToken = data.nextPageToken;
    if (!pageToken) return rows;
  }
  throw new Error(
    "El informe supera el límite de filas. Seleccione un período menor."
  );
}
export function reportingDates(days: number, zone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find(p => p.type === name)!.value;
  const end = `${part("year")}-${part("month")}-${part("day")}`;
  const start = new Date(`${end}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { start: start.toISOString().slice(0, 10), end };
}
export function metricValues(metrics: any) {
  return {
    impressions: Number(metrics?.impressions ?? 0),
    clicks: Number(metrics?.clicks ?? 0),
    cost: Number(metrics?.costMicros ?? 0) / 1e6,
    conversions: Number(metrics?.conversions ?? 0),
  };
}
const cache = new Map<number, { expires: number; value: AdsReport }>();
let queue: Promise<unknown> = Promise.resolve();
export type AdsReport = {
  customer: string;
  currency: string;
  zone: string;
  start: string;
  end: string;
  fetchedAt: string;
  campaigns: {
    id: string;
    name: string;
    status: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
  }[];
  daily: { date: string; clicks: number; cost: number }[];
  landings: {
    url: string;
    clicks: number;
    impressions: number;
    cost: number;
  }[];
};
export async function adsReport(days: number): Promise<AdsReport> {
  // Serialize refreshes and coalesce concurrent requests; at most 3 reports per 5-minute window.
  const run = queue
    .catch(() => {})
    .then(async () => {
      const hit = cache.get(days);
      if (hit && hit.expires > Date.now()) return hit.value;
      const refresh = await savedToken();
      if (!refresh)
        throw new Error(
          "Conecte su cuenta de Google Ads para consultar las campañas."
        );
      const tokens = await tokenRequest({
        grant_type: "refresh_token",
        refresh_token: refresh,
      });
      const [metadata] = await searchAds(
        tokens.access_token,
        "SELECT customer.id, customer.currency_code, customer.time_zone FROM customer LIMIT 1"
      );
      const customer = metadata.customer;
      const { start, end } = reportingDates(days, customer.timeZone);
      const rows = await searchAds(
        tokens.access_token,
        `SELECT campaign.id, campaign.name, campaign.status, segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date BETWEEN '${start}' AND '${end}'`
      );
      const landings = await searchAds(
        tokens.access_token,
        `SELECT landing_page_view.unexpanded_final_url, metrics.impressions, metrics.clicks, metrics.cost_micros FROM landing_page_view WHERE segments.date BETWEEN '${start}' AND '${end}'`
      );
      const campaigns = new Map<string, AdsReport["campaigns"][number]>();
      const daily = new Map<string, AdsReport["daily"][number]>();
      for (const row of rows) {
        const metrics = metricValues(row.metrics);
        const id = String(row.campaign.id);
        const campaign = campaigns.get(id) || {
          id,
          name: row.campaign.name,
          status: row.campaign.status,
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
        };
        for (const key of [
          "impressions",
          "clicks",
          "cost",
          "conversions",
        ] as const)
          campaign[key] += metrics[key];
        campaigns.set(id, campaign);
        const date = row.segments.date;
        const point = daily.get(date) || { date, clicks: 0, cost: 0 };
        point.clicks += metrics.clicks;
        point.cost += metrics.cost;
        daily.set(date, point);
      }
      const value: AdsReport = {
        customer: String(customer.id),
        currency: customer.currencyCode,
        zone: customer.timeZone,
        start,
        end,
        fetchedAt: new Date().toISOString(),
        campaigns: Array.from(campaigns.values()).sort(
          (a, b) => b.cost - a.cost
        ),
        daily: Array.from(daily.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
        landings: landings
          .map(row => ({
            url: row.landingPageView.unexpandedFinalUrl,
            ...metricValues(row.metrics),
          }))
          .sort((a, b) => b.clicks - a.clicks),
      };
      cache.set(days, { expires: Date.now() + 300000, value });
      return value;
    });
  queue = run;
  return run;
}

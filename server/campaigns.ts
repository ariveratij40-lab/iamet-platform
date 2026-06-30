/**
 * UTM Campaigns — Sprint 7
 * Manages campaign tracking links with UTM parameters.
 * Captures lead attribution from sessionStorage on the frontend.
 */

import { getDb } from "./db";
import { sql } from "drizzle-orm";

export interface CampaignInput {
  name: string;
  source: string;   // google, linkedin, meta, email, referral
  medium: string;   // cpc, social, email, organic
  campaign: string; // campaign name slug
  term?: string;    // keyword
  content?: string; // ad variation
  baseUrl: string;  // destination URL
}

export interface CampaignStats {
  id: number;
  name: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  fullUrl: string;
  clicks: number;
  leads: number;
  conversions: number;
  revenue: number;
  cpl: number;        // cost per lead (estimated)
  roi: number;        // revenue / (leads * estimated cost)
  createdAt: number;
}

/**
 * Build a full UTM URL from campaign parameters.
 */
export function buildUtmUrl(input: CampaignInput): string {
  const url = new URL(input.baseUrl);
  url.searchParams.set("utm_source", input.source);
  url.searchParams.set("utm_medium", input.medium);
  url.searchParams.set("utm_campaign", input.campaign);
  if (input.term) url.searchParams.set("utm_term", input.term);
  if (input.content) url.searchParams.set("utm_content", input.content);
  return url.toString();
}

/**
 * Create a new campaign in the database.
 */
export async function createCampaign(input: CampaignInput): Promise<{ id: number; fullUrl: string }> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");

  const fullUrl = buildUtmUrl(input);

  const result = await db.execute(sql.raw(`
    INSERT INTO utm_campaigns (name, source, medium, campaign, term, content, fullUrl, clicks, leads, conversions, revenue, createdAt)
    VALUES (
      ${JSON.stringify(input.name)},
      ${JSON.stringify(input.source)},
      ${JSON.stringify(input.medium)},
      ${JSON.stringify(input.campaign)},
      ${input.term ? JSON.stringify(input.term) : 'NULL'},
      ${input.content ? JSON.stringify(input.content) : 'NULL'},
      ${JSON.stringify(fullUrl)},
      0, 0, 0, 0,
      ${Date.now()}
    )
  `)) as any;

  const id = result?.insertId ?? result?.[0]?.insertId ?? 0;
  return { id: Number(id), fullUrl };
}

/**
 * List all campaigns with computed metrics.
 */
export async function listCampaigns(): Promise<CampaignStats[]> {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.execute(sql.raw(`
    SELECT * FROM utm_campaigns ORDER BY createdAt DESC
  `)) as any;

  const arr = Array.isArray(rows) ? rows : (rows?.rows ?? []);
  return arr.map((r: any) => ({
    id: r.id,
    name: r.name,
    source: r.source,
    medium: r.medium,
    campaign: r.campaign,
    term: r.term,
    content: r.content,
    fullUrl: r.fullUrl,
    clicks: Number(r.clicks ?? 0),
    leads: Number(r.leads ?? 0),
    conversions: Number(r.conversions ?? 0),
    revenue: Number(r.revenue ?? 0),
    cpl: Number(r.leads ?? 0) > 0 ? Math.round(Number(r.revenue ?? 0) / Number(r.leads)) : 0,
    roi: Number(r.revenue ?? 0) > 0 ? Math.round((Number(r.revenue) / Math.max(Number(r.leads ?? 1) * 500, 1)) * 100) : 0,
    createdAt: Number(r.createdAt ?? 0),
  }));
}

/**
 * Record a click on a campaign link.
 */
export async function recordCampaignClick(campaignId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql.raw(`UPDATE utm_campaigns SET clicks = clicks + 1 WHERE id = ${campaignId}`));
}

/**
 * Record a lead conversion for a campaign (by UTM source/medium/campaign).
 */
export async function recordCampaignLead(utmSource: string, utmMedium: string, utmCampaign: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql.raw(`
    UPDATE utm_campaigns
    SET leads = leads + 1
    WHERE source = ${JSON.stringify(utmSource)}
      AND medium = ${JSON.stringify(utmMedium)}
      AND campaign = ${JSON.stringify(utmCampaign)}
    LIMIT 1
  `));
}

/**
 * Record a won deal for a campaign.
 */
export async function recordCampaignConversion(utmSource: string, utmMedium: string, utmCampaign: string, revenue: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql.raw(`
    UPDATE utm_campaigns
    SET conversions = conversions + 1, revenue = revenue + ${revenue}
    WHERE source = ${JSON.stringify(utmSource)}
      AND medium = ${JSON.stringify(utmMedium)}
      AND campaign = ${JSON.stringify(utmCampaign)}
    LIMIT 1
  `));
}

export const CAMPAIGN_TEMPLATES = [
  {
    name: "Google Ads — CCTV Empresas",
    source: "google",
    medium: "cpc",
    campaign: "cctv-empresas-2026",
    term: "camaras seguridad empresas",
    content: "ad-v1",
  },
  {
    name: "LinkedIn — Control de Acceso",
    source: "linkedin",
    medium: "social",
    campaign: "control-acceso-linkedin",
    content: "post-organico",
  },
  {
    name: "Meta — Infraestructura TI",
    source: "facebook",
    medium: "social",
    campaign: "infraestructura-ti-meta",
    content: "carousel-v1",
  },
  {
    name: "Email — Newsletter Mensual",
    source: "email",
    medium: "email",
    campaign: "newsletter-julio-2026",
    content: "cta-principal",
  },
  {
    name: "Referidos — Partners",
    source: "referral",
    medium: "referral",
    campaign: "programa-partners-2026",
  },
];

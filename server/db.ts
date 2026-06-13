import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, User, users,
  verticals, Vertical,
  leads, Lead, InsertLead,
  conversations, Conversation, InsertConversation,
  messages, Message, InsertMessage,
  advisorSessions, AdvisorSession, InsertAdvisorSession,
  courses, Course,
  enrollments, InsertEnrollment,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Verticals ────────────────────────────────────────────────────────────────
export async function getVerticals(): Promise<Vertical[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(verticals).orderBy(verticals.order);
}

export async function getVerticalBySlug(slug: string): Promise<Vertical | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(verticals).where(eq(verticals.slug, slug)).limit(1);
  return result[0];
}

// ─── Lead Scoring ─────────────────────────────────────────────────────────────
export function calculateLeadScore(data: {
  companySize?: string | null;
  industry?: string | null;
  problemDescription?: string | null;
  verticalSlug?: string | null;
  source?: string;
}): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};

  // Company size score (0-35)
  const sizeScores: Record<string, number> = {
    "500+": 35, "201-500": 30, "51-200": 20, "11-50": 10, "1-10": 5,
  };
  breakdown.companySize = sizeScores[data.companySize ?? ""] ?? 0;

  // Has vertical (0-20)
  breakdown.vertical = data.verticalSlug ? 20 : 0;

  // Problem description length (0-25)
  const descLen = (data.problemDescription ?? "").length;
  breakdown.problemDetail = descLen > 200 ? 25 : descLen > 100 ? 15 : descLen > 30 ? 8 : 0;

  // Industry (0-15)
  const highValueIndustries = ["manufactura", "logística", "retail", "salud", "gobierno", "financiero", "educación"];
  const industryLower = (data.industry ?? "").toLowerCase();
  breakdown.industry = highValueIndustries.some((i) => industryLower.includes(i)) ? 15 : 5;

  // Source bonus (0-5)
  const sourceBonus: Record<string, number> = { advisor: 5, agent: 4, form: 2, academy: 3 };
  breakdown.source = sourceBonus[data.source ?? "form"] ?? 2;

  const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));
  return { score, breakdown };
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export async function createLead(data: InsertLead): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const { score, breakdown } = calculateLeadScore(data);
  const result = await db.insert(leads).values({
    ...data,
    score,
    scoreBreakdown: breakdown,
  });
  return (result as any)[0]?.insertId ?? 0;
}

export async function getLeads(filters?: {
  status?: string;
  verticalSlug?: string;
  limit?: number;
}): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(leads.status, filters.status as any));
  if (filters?.verticalSlug) conditions.push(eq(leads.verticalSlug, filters.verticalSlug));
  return db
    .select()
    .from(leads)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(leads.createdAt))
    .limit(filters?.limit ?? 100);
}

export async function updateLeadStatus(id: number, status: string, notes?: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(leads).set({ status: status as any, notes }).where(eq(leads.id, id));
}

// ─── Conversations ────────────────────────────────────────────────────────────
export async function createConversation(data: InsertConversation): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(conversations).values(data);
  return (result as any)[0]?.insertId ?? 0;
}

export async function getConversationBySession(sessionId: string): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations).where(eq(conversations.sessionId, sessionId)).limit(1);
  return result[0];
}

export async function updateConversation(sessionId: string, data: Partial<Conversation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set(data as any).where(eq(conversations.sessionId, sessionId));
}

export async function getConversations(limit = 50): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations).orderBy(desc(conversations.createdAt)).limit(limit);
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function addMessage(data: InsertMessage): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(messages).values(data);
}

export async function getMessagesByConversation(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

// ─── Advisor Sessions ─────────────────────────────────────────────────────────
export async function createAdvisorSession(data: InsertAdvisorSession): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(advisorSessions).values(data);
  return (result as any)[0]?.insertId ?? 0;
}

export async function getAdvisorSession(sessionId: string): Promise<AdvisorSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(advisorSessions).where(eq(advisorSessions.sessionId, sessionId)).limit(1);
  return result[0];
}

export async function updateAdvisorSession(sessionId: string, data: Partial<AdvisorSession>) {
  const db = await getDb();
  if (!db) return;
  await db.update(advisorSessions).set(data as any).where(eq(advisorSessions.sessionId, sessionId));
}

// ─── Courses ──────────────────────────────────────────────────────────────────
export async function getCourses(verticalSlug?: string): Promise<Course[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(courses.active, true)];
  if (verticalSlug) conditions.push(eq(courses.verticalSlug, verticalSlug));
  return db.select().from(courses).where(and(...conditions)).orderBy(courses.order);
}

export async function getCourseBySlug(slug: string): Promise<Course | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  return result[0];
}

// ─── Enrollments ──────────────────────────────────────────────────────────────
export async function createEnrollment(data: InsertEnrollment): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(enrollments).values(data);
  return (result as any)[0]?.insertId ?? 0;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalytics() {
  const db = await getDb();
  if (!db) return { totalLeads: 0, byVertical: [], byStatus: [], recentLeads: [] };

  const [totalResult] = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const totalLeads = Number(totalResult?.count ?? 0);

  const byVertical = await db
    .select({ verticalSlug: leads.verticalSlug, count: sql<number>`count(*)` })
    .from(leads)
    .groupBy(leads.verticalSlug);

  const byStatus = await db
    .select({ status: leads.status, count: sql<number>`count(*)` })
    .from(leads)
    .groupBy(leads.status);

  const recentLeads = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(5);

  return { totalLeads, byVertical, byStatus, recentLeads };
}

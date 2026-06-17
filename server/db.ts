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
  visitorSessions, InsertVisitorSession, VisitorSession,
  pageEvents, InsertPageEvent,
  liveChatMessages, LiveChatMessage, InsertLiveChatMessage,
  storeCategories, StoreCategory, InsertStoreCategory,
  storeProducts, StoreProduct, InsertStoreProduct,
  quoteRequests, QuoteRequest, InsertQuoteRequest,
  quoteItems, QuoteItem, InsertQuoteItem,
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
export async function getLatestConversationByVisitor(visitorId: string): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(conversations)
    .where(eq(conversations.visitorId, visitorId))
    .orderBy(desc(conversations.updatedAt))
    .limit(1);
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

// ─── Visitor Tracking ────────────────────────────────────────────────────────
export async function upsertVisitorSession(data: {
  visitorId: string;
  currentPage?: string;
  currentSection?: string;
  chatActive?: boolean;
  chatDuration?: number;
  chatMessages?: number;
  country?: string;
  city?: string;
  countryCode?: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select({ id: visitorSessions.id })
    .from(visitorSessions)
    .where(eq(visitorSessions.visitorId, data.visitorId))
    .limit(1);
  const now = new Date();
  if (existing.length > 0) {
    await db
      .update(visitorSessions)
      .set({
        ...(data.currentPage !== undefined && { currentPage: data.currentPage }),
        ...(data.currentSection !== undefined && { currentSection: data.currentSection }),
        ...(data.chatActive !== undefined && { chatActive: data.chatActive }),
        ...(data.chatDuration !== undefined && { chatDuration: data.chatDuration }),
        ...(data.chatMessages !== undefined && { chatMessages: data.chatMessages }),
        lastSeenAt: now,
      })
      .where(eq(visitorSessions.visitorId, data.visitorId));
  } else {
    await db.insert(visitorSessions).values({
      visitorId: data.visitorId,
      currentPage: data.currentPage ?? "/",
      currentSection: data.currentSection ?? "hero",
      chatActive: data.chatActive ?? false,
      chatDuration: data.chatDuration ?? 0,
      chatMessages: data.chatMessages ?? 0,
      country: data.country,
      city: data.city,
      countryCode: data.countryCode,
      ip: data.ip,
      userAgent: data.userAgent,
      referrer: data.referrer,
      lastSeenAt: now,
    });
  }
}

export async function addPageEvent(data: InsertPageEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(pageEvents).values(data);
}

export async function getLiveVisitors(windowMs = 2 * 60 * 1000): Promise<VisitorSession[]> {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date(Date.now() - windowMs);
  return db
    .select()
    .from(visitorSessions)
    .where(sql`${visitorSessions.lastSeenAt} >= ${cutoff}`)
    .orderBy(desc(visitorSessions.lastSeenAt));
}

export async function getVisitorEvents(visitorId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pageEvents)
    .where(eq(pageEvents.visitorId, visitorId))
    .orderBy(desc(pageEvents.createdAt))
    .limit(limit);
}

export async function getVisitorStats() {
  const db = await getDb();
  if (!db) return { total: 0, active: 0, withChat: 0 };
  const cutoff2m = new Date(Date.now() - 2 * 60 * 1000);
  const cutoff24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(visitorSessions)
    .where(sql`${visitorSessions.createdAt} >= ${cutoff24h}`);
  const [activeResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(visitorSessions)
    .where(sql`${visitorSessions.lastSeenAt} >= ${cutoff2m}`);
  const [chatResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(visitorSessions)
    .where(sql`${visitorSessions.chatMessages} > 0 AND ${visitorSessions.createdAt} >= ${cutoff24h}`);
  return {
    total: Number(totalResult?.count ?? 0),
    active: Number(activeResult?.count ?? 0),
    withChat: Number(chatResult?.count ?? 0),
  };
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

// ─── Live Chat (Intervención Humana) ─────────────────────────────────────────
export async function addLiveChatMessage(data: InsertLiveChatMessage): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(liveChatMessages).values(data);
}

export async function getLiveChatMessages(sessionId: string, since?: Date): Promise<LiveChatMessage[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(liveChatMessages.sessionId, sessionId)];
  if (since) conditions.push(sql`${liveChatMessages.createdAt} > ${since}`);
  return db
    .select()
    .from(liveChatMessages)
    .where(and(...conditions))
    .orderBy(liveChatMessages.createdAt);
}

export async function markLiveChatRead(sessionId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(liveChatMessages)
    .set({ read: true })
    .where(and(eq(liveChatMessages.sessionId, sessionId), eq(liveChatMessages.read, false)));
}

export async function getActiveLiveSessions(): Promise<Array<{
  sessionId: string;
  lastMessage: LiveChatMessage | null;
  unreadCount: number;
  conversation: Conversation | null;
}>> {
  const db = await getDb();
  if (!db) return [];
  const takenOver = await db
    .select()
    .from(conversations)
    .where(eq(conversations.humanTookOver, true))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);
  const results = await Promise.all(
    takenOver.map(async (conv) => {
      const msgs = await db!
        .select()
        .from(liveChatMessages)
        .where(eq(liveChatMessages.sessionId, conv.sessionId))
        .orderBy(desc(liveChatMessages.createdAt))
        .limit(1);
      const [unreadRow] = await db!
        .select({ count: sql<number>`count(*)` })
        .from(liveChatMessages)
        .where(and(
          eq(liveChatMessages.sessionId, conv.sessionId),
          eq(liveChatMessages.read, false),
          eq(liveChatMessages.role, "user")
        ));
      return {
        sessionId: conv.sessionId,
        lastMessage: msgs[0] ?? null,
        unreadCount: Number(unreadRow?.count ?? 0),
        conversation: conv,
      };
    })
  );
  return results;
}

// ─── E-Commerce: Tienda IAMET ─────────────────────────────────────────────────

export async function getStoreCategories(): Promise<StoreCategory[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(storeCategories).where(eq(storeCategories.active, true)).orderBy(storeCategories.order);
}

export async function getStoreProducts(opts: {
  categorySlug?: string;
  search?: string;
  featuredOnly?: boolean;
  limit?: number;
} = {}): Promise<(StoreProduct & { categoryName: string; categorySlug: string })[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      product: storeProducts,
      categoryName: storeCategories.name,
      categorySlug: storeCategories.slug,
    })
    .from(storeProducts)
    .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .where(eq(storeProducts.active, true))
    .orderBy(desc(storeProducts.featured), storeProducts.name)
    .limit(opts.limit ?? 200);

  let results = rows.map((r) => ({ ...r.product, categoryName: r.categoryName, categorySlug: r.categorySlug }));
  if (opts.categorySlug) results = results.filter((p) => p.categorySlug === opts.categorySlug);
  if (opts.featuredOnly) results = results.filter((p) => p.featured);
  if (opts.search) {
    const q = opts.search.toLowerCase();
    results = results.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      (p.shortDesc ?? "").toLowerCase().includes(q) ||
      (p.sku ?? "").toLowerCase().includes(q)
    );
  }
  return results;
}

export async function getStoreProductBySlug(slug: string): Promise<
  (StoreProduct & { categoryName: string; categorySlug: string; related: (StoreProduct & { categoryName: string; categorySlug: string })[] }) | undefined
> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select({ product: storeProducts, categoryName: storeCategories.name, categorySlug: storeCategories.slug })
    .from(storeProducts)
    .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .where(eq(storeProducts.slug, slug))
    .limit(1);
  if (!rows[0]) return undefined;
  const product = { ...rows[0].product, categoryName: rows[0].categoryName, categorySlug: rows[0].categorySlug };
  // Fetch related products (same category, excluding self, max 4)
  const relatedRows = await db
    .select({ product: storeProducts, categoryName: storeCategories.name, categorySlug: storeCategories.slug })
    .from(storeProducts)
    .innerJoin(storeCategories, eq(storeProducts.categoryId, storeCategories.id))
    .where(and(eq(storeProducts.categoryId, rows[0].product.categoryId), eq(storeProducts.active, true)))
    .orderBy(desc(storeProducts.featured), storeProducts.name)
    .limit(5);
  const related = relatedRows
    .map((r) => ({ ...r.product, categoryName: r.categoryName, categorySlug: r.categorySlug }))
    .filter((p) => p.slug !== slug)
    .slice(0, 4);
  return { ...product, related };
}

export async function createQuoteRequest(data: InsertQuoteRequest, items: InsertQuoteItem[]): Promise<QuoteRequest> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(quoteRequests).values(data);
  const [created] = await db.select().from(quoteRequests).where(eq(quoteRequests.refCode, data.refCode)).limit(1);
  if (items.length > 0) {
    await db.insert(quoteItems).values(items.map((i) => ({ ...i, quoteRequestId: created.id })));
  }
  return created;
}

export async function getQuoteRequests(limit = 50): Promise<Array<QuoteRequest & { items: QuoteItem[] }>> {
  const db = await getDb();
  if (!db) return [];
  const quotes = await db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt)).limit(limit);
  const results = await Promise.all(
    quotes.map(async (q) => {
      const items = await db!.select().from(quoteItems).where(eq(quoteItems.quoteRequestId, q.id));
      return { ...q, items };
    })
  );
  return results;
}

export async function updateQuoteStatus(id: number, status: QuoteRequest["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(quoteRequests).set({ status }).where(eq(quoteRequests.id, id));
}

export async function upsertStoreProduct(data: InsertStoreProduct & { id?: number }): Promise<void> {
  const db = await getDb();
  if (!db) return;
  if (data.id) {
    const { id, ...rest } = data;
    await db.update(storeProducts).set(rest as any).where(eq(storeProducts.id, id));
  } else {
    await db.insert(storeProducts).values(data);
  }
}

export async function toggleStoreProductActive(id: number, active: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(storeProducts).set({ active }).where(eq(storeProducts.id, id));
}

export async function seedStoreData(): Promise<{ categoriesInserted: number; productsInserted: number }> {
  const db = await getDb();
  if (!db) return { categoriesInserted: 0, productsInserted: 0 };

  // Check if already seeded
  const existing = await db.select().from(storeCategories).limit(1);
  if (existing.length > 0) return { categoriesInserted: 0, productsInserted: 0 };

  const cats: InsertStoreCategory[] = [
    { name: "Seguridad Electrónica", slug: "seguridad", icon: "Shield", description: "Cámaras IP, DVR/NVR, control de acceso, alarmas", order: 1 },
    { name: "Redes y Conectividad", slug: "redes", icon: "Network", description: "Switches, routers, access points, firewalls", order: 2 },
    { name: "Cómputo y Servidores", slug: "computo", icon: "Monitor", description: "Laptops, desktops, servidores, workstations", order: 3 },
    { name: "Cableado Estructurado", slug: "cableado", icon: "Cable", description: "Cable Cat6A, fibra óptica, patch panels, racks", order: 4 },
    { name: "Software y Licencias", slug: "software", icon: "Code2", description: "Licencias Microsoft, antivirus, ERP, productividad", order: 5 },
    { name: "Energía y UPS", slug: "energia", icon: "Zap", description: "UPS, reguladores, plantas de emergencia, PDU", order: 6 },
    { name: "Servicios Profesionales", slug: "servicios", icon: "Wrench", description: "Instalación, mantenimiento, consultoría, soporte", order: 7 },
  ];

  await db.insert(storeCategories).values(cats);
  const insertedCats = await db.select().from(storeCategories).orderBy(storeCategories.order);
  const catMap = Object.fromEntries(insertedCats.map((c) => [c.slug, c.id]));

  const products: InsertStoreProduct[] = [
    // Seguridad
    { categoryId: catMap["seguridad"], name: "Cámara IP Domo 4MP H.265", slug: "camara-ip-domo-4mp", shortDesc: "Cámara domo para interiores, resolución 4MP, visión nocturna 30m, PoE", sku: "CAM-DOMO-4MP", priceRef: 2800, unit: "pieza", featured: true, tags: ["cámara", "IP", "domo", "PoE"], specs: { "Resolución": "4MP (2560×1440)", "Sensor": "1/3\" CMOS progresivo", "Compresión": "H.265+ / H.264+", "Visión nocturna": "30m IR inteligente", "Alimentación": "PoE IEEE 802.3af", "Protección": "IP67, IK10", "Ángulo de visión": "103° horizontal", "Almacenamiento": "Micro SD hasta 256GB", "Interfaz": "RJ-45 10/100M" } },
    { categoryId: catMap["seguridad"], name: "Cámara PTZ 4K con IA", slug: "camara-ptz-4k-ia", shortDesc: "Cámara PTZ exterior 4K con detección de personas y vehículos por IA", sku: "CAM-PTZ-4K", priceRef: 12500, unit: "pieza", featured: true, tags: ["cámara", "PTZ", "4K", "IA"], specs: { "Resolución": "4K (3840×2160)", "Zoom óptico": "25x", "Zoom digital": "16x", "Velocidad Pan": "0.1°–200°/s", "Velocidad Tilt": "0.1°–120°/s", "Visión nocturna": "100m IR", "Detección IA": "Personas, vehículos, rostros", "Protección": "IP66, IK10", "Alimentación": "24VAC / PoE+" } },
    { categoryId: catMap["seguridad"], name: "NVR 16 Canales 4K", slug: "nvr-16-canales-4k", shortDesc: "Grabador de red 16 canales, soporte 4K, 2 bahías HDD, HDMI 4K", sku: "NVR-16CH-4K", priceRef: 8900, unit: "pieza", tags: ["NVR", "grabador", "16 canales"], specs: { "Canales de video": "16 canales IP", "Resolución máx.": "4K (8MP)", "Compresión": "H.265+ / H.264+", "Bahías HDD": "2x SATA hasta 10TB c/u", "Salida de video": "HDMI 4K + VGA", "Puertos red": "2x RJ-45 Gigabit", "Ancho de banda": "160Mbps entrante", "Protocolos": "ONVIF 2.4, RTSP" } },
    { categoryId: catMap["seguridad"], name: "Control de Acceso Biométrico", slug: "control-acceso-biometrico", shortDesc: "Lector de huella + tarjeta RFID, capacidad 3000 usuarios, TCP/IP", sku: "ACC-BIO-3K", priceRef: 4500, unit: "pieza", featured: true, tags: ["acceso", "biométrico", "RFID"], specs: { "Capacidad usuarios": "3,000", "Capacidad registros": "100,000 eventos", "Modos de acceso": "Huella + RFID + PIN", "Tiempo verificación": "< 1 segundo", "Comunicación": "TCP/IP, RS-485, Wiegand", "Pantalla": "TFT 2.8\" color", "Alimentación": "12VDC / PoE", "Temperatura": "-10°C a +60°C" } },
    { categoryId: catMap["seguridad"], name: "Kit Alarma Inalámbrica 8 Zonas", slug: "kit-alarma-inalambrica-8z", shortDesc: "Panel central + 8 sensores PIR + sirena + teclado, comunicación GSM/IP", sku: "ALM-KIT-8Z", priceRef: 6200, unit: "kit", tags: ["alarma", "inalámbrica", "GSM"] },
    // Redes
    { categoryId: catMap["redes"], name: "Switch Administrable 24 Puertos PoE+", slug: "switch-24p-poe-plus", shortDesc: "Switch L2+ 24 puertos GbE PoE+ (370W) + 4 SFP uplink, VLAN, QoS", sku: "SW-24P-POE", priceRef: 11500, unit: "pieza", featured: true, tags: ["switch", "PoE", "administrable"], specs: { "Puertos PoE+": "24x GbE RJ-45 PoE+", "Puertos uplink": "4x SFP 1G", "Presupuesto PoE": "370W total", "Switching capacity": "56 Gbps", "Capa": "L2+ (L3 lite)", "VLANs": "4094 VLANs 802.1Q", "QoS": "8 colas por puerto, 802.1p", "Gestión": "Web GUI, CLI, SNMP v1/v2/v3", "Factor de forma": "1U rack 19\"" } },
    { categoryId: catMap["redes"], name: "Router Empresarial con VPN", slug: "router-empresarial-vpn", shortDesc: "Router dual WAN, VPN IPSec/SSL, firewall integrado, hasta 100 usuarios", sku: "RTR-ENT-VPN", priceRef: 7800, unit: "pieza", tags: ["router", "VPN", "firewall"] },
    { categoryId: catMap["redes"], name: "Access Point WiFi 6 Techo", slug: "access-point-wifi6-techo", shortDesc: "AP WiFi 6 (802.11ax) para techo, 2.4/5GHz, hasta 300 dispositivos, PoE", sku: "AP-W6-CEIL", priceRef: 3900, unit: "pieza", featured: true, tags: ["WiFi 6", "access point", "PoE"], specs: { "Estándar": "IEEE 802.11ax (WiFi 6)", "Bandas": "2.4GHz + 5GHz dual band", "Velocidad máx.": "574 Mbps (2.4G) + 2402 Mbps (5G)", "Dispositivos simultáneos": "Hasta 300", "Antenas": "4×4 MU-MIMO OFDMA", "Alimentación": "PoE 802.3af/at", "Montaje": "Techo (ceiling mount)", "Gestión": "Controlador en la nube o standalone" } },
    { categoryId: catMap["redes"], name: "Firewall NGFW 1Gbps", slug: "firewall-ngfw-1gbps", shortDesc: "Next-Gen Firewall con IPS, antivirus, filtrado web, VPN, 1Gbps throughput", sku: "FW-NGFW-1G", priceRef: 22000, unit: "pieza", tags: ["firewall", "NGFW", "seguridad"] },
    // Cómputo
    { categoryId: catMap["computo"], name: "Laptop Empresarial Core i7 16GB", slug: "laptop-empresarial-i7-16gb", shortDesc: "Laptop 14\" FHD, Intel Core i7 12a gen, 16GB RAM, 512GB SSD, Windows 11 Pro", sku: "LAP-I7-16-512", priceRef: 18500, unit: "pieza", featured: true, tags: ["laptop", "Core i7", "Windows 11"], specs: { "Procesador": "Intel Core i7-1265U (12a gen)", "RAM": "16GB DDR4 3200MHz", "Almacenamiento": "512GB NVMe PCIe 4.0", "Pantalla": "14\" FHD IPS 300 nits", "Gráficos": "Intel Iris Xe integrado", "Batería": "56Wh, hasta 10h", "Conectividad": "WiFi 6, Bluetooth 5.2", "Puertos": "2x USB-A, 2x USB-C, HDMI, SD", "SO": "Windows 11 Pro" } },
    { categoryId: catMap["computo"], name: "Servidor Torre Xeon 32GB", slug: "servidor-torre-xeon-32gb", shortDesc: "Servidor torre Intel Xeon E-2300, 32GB ECC, 2x1TB SATA, RAID, Windows Server", sku: "SRV-TWR-XE32", priceRef: 45000, unit: "pieza", tags: ["servidor", "Xeon", "torre"] },
    { categoryId: catMap["computo"], name: "Workstation CAD/Diseño", slug: "workstation-cad-diseno", shortDesc: "Workstation Intel Core i9, 64GB RAM, NVIDIA RTX 3060, 1TB NVMe, para CAD/BIM", sku: "WS-CAD-I9-64", priceRef: 52000, unit: "pieza", tags: ["workstation", "CAD", "RTX"] },
    // Cableado
    { categoryId: catMap["cableado"], name: "Cable UTP Cat6A 305m (caja)", slug: "cable-utp-cat6a-305m", shortDesc: "Cable UTP Cat6A 23AWG, caja 305m, certificado TIA-568-C.2, CMR", sku: "CAB-C6A-305", priceRef: 2200, unit: "caja", featured: true, tags: ["Cat6A", "UTP", "cableado"], specs: { "Categoría": "Cat6A (TIA-568-C.2)", "Calibre": "23 AWG sólido", "Longitud": "305 metros por caja", "Impedancia": "100 Ohm ±15%", "Velocidad": "10 Gbps hasta 100m", "Frecuencia": "500 MHz", "Chaqueta": "CMR (riser rated)", "Color": "Azul", "Certificación": "ETL, UL Listed" } },
    { categoryId: catMap["cableado"], name: "Patch Panel 24 Puertos Cat6A", slug: "patch-panel-24p-cat6a", shortDesc: "Patch panel 24 puertos Cat6A, 1U rack, con etiquetas, certificado", sku: "PP-24P-C6A", priceRef: 1800, unit: "pieza", tags: ["patch panel", "Cat6A", "rack"] },
    { categoryId: catMap["cableado"], name: "Rack Abierto 42U 600x1000", slug: "rack-abierto-42u", shortDesc: "Rack abierto 42U, 600x1000mm, con ruedas y niveladores, capacidad 800kg", sku: "RACK-42U-60100", priceRef: 9500, unit: "pieza", tags: ["rack", "42U", "abierto"], specs: { "Unidades": "42U", "Ancho": "600mm", "Profundidad": "1000mm", "Alto total": "2055mm", "Capacidad de carga": "800 kg", "Movilidad": "4 ruedas con freno", "Niveladores": "4 patas ajustables", "Material": "Acero SPCC calibre 16", "Acabado": "Pintura electrostática negra" } },
    { categoryId: catMap["cableado"], name: "Fibra Óptica Monomodo 12H 1km", slug: "fibra-optica-monomodo-12h", shortDesc: "Cable fibra óptica monomodo OS2 12 hilos, exterior, 1km, LSZH", sku: "FO-SM-12H-1K", priceRef: 4800, unit: "rollo", tags: ["fibra óptica", "monomodo", "OS2"] },
    // Software
    { categoryId: catMap["software"], name: "Microsoft 365 Business Standard (anual)", slug: "microsoft-365-business-standard", shortDesc: "Licencia Microsoft 365 Business Standard por usuario/año: Teams, Office, 1TB OneDrive", sku: "MS365-BS-1Y", priceRef: 2400, unit: "licencia/año", featured: true, tags: ["Microsoft 365", "Office", "Teams"] },
    { categoryId: catMap["software"], name: "Antivirus Empresarial 25 equipos", slug: "antivirus-empresarial-25", shortDesc: "Solución antivirus/EDR para 25 equipos, consola centralizada, 1 año", sku: "AV-ENT-25-1Y", priceRef: 8500, unit: "licencia/año", tags: ["antivirus", "EDR", "seguridad"] },
    { categoryId: catMap["software"], name: "Backup en la Nube 1TB (anual)", slug: "backup-nube-1tb", shortDesc: "Servicio de backup en la nube 1TB, cifrado AES-256, recuperación ante desastres", sku: "BCK-CLD-1T-1Y", priceRef: 3600, unit: "servicio/año", tags: ["backup", "nube", "recuperación"] },
    // Energía
    { categoryId: catMap["energia"], name: "UPS Online 3kVA Torre", slug: "ups-online-3kva-torre", shortDesc: "UPS online doble conversión 3kVA/2.7kW, autonomía 8min a plena carga, SNMP", sku: "UPS-3KVA-TWR", priceRef: 14500, unit: "pieza", featured: true, tags: ["UPS", "online", "3kVA"], specs: { "Potencia": "3kVA / 2700W", "Tecnología": "Doble conversión online", "Autonomía": "8 min a plena carga", "Entrada": "120/208/240VAC ±25%", "Salida": "120/208/240VAC ±1%", "Batería": "12V 9Ah x6 (selladas VRLA)", "Comunicación": "SNMP, USB, RS-232", "Factor de forma": "Torre / Rack 2U", "Eficiencia": "≥ 92% en modo ECO" } },
    { categoryId: catMap["energia"], name: "Regulador de Voltaje 2000VA", slug: "regulador-voltaje-2000va", shortDesc: "Regulador ferroresonante 2000VA, protección contra picos, 8 contactos", sku: "REG-2000VA", priceRef: 2800, unit: "pieza", tags: ["regulador", "voltaje", "protección"] },
    // Servicios
    { categoryId: catMap["servicios"], name: "Instalación y Configuración de Red", slug: "instalacion-configuracion-red", shortDesc: "Servicio de instalación de red LAN/WLAN: tendido de cable, configuración de equipos activos", sku: "SVC-NET-INST", priceRef: 8000, unit: "proyecto", featured: true, tags: ["instalación", "red", "servicio"] },
    { categoryId: catMap["servicios"], name: "Póliza de Mantenimiento Preventivo", slug: "poliza-mantenimiento-preventivo", shortDesc: "Póliza anual de mantenimiento preventivo: 4 visitas/año, reporte de estado, prioridad en soporte", sku: "SVC-MANT-PREV", priceRef: 12000, unit: "póliza/año", tags: ["mantenimiento", "póliza", "preventivo"] },
    { categoryId: catMap["servicios"], name: "Consultoría en Ciberseguridad", slug: "consultoria-ciberseguridad", shortDesc: "Diagnóstico de vulnerabilidades, análisis de riesgos, plan de remediación, reporte ejecutivo", sku: "SVC-CSEC-DIAG", priceRef: 18000, unit: "proyecto", tags: ["ciberseguridad", "consultoría", "diagnóstico"] },
    { categoryId: catMap["servicios"], name: "Soporte Técnico Remoto (mensual)", slug: "soporte-tecnico-remoto", shortDesc: "Soporte técnico remoto ilimitado, tiempo de respuesta 2h, acceso a portal de tickets", sku: "SVC-SUPP-REM", priceRef: 3500, unit: "mes", tags: ["soporte", "remoto", "tickets"] },
  ];

  await db.insert(storeProducts).values(products);
  return { categoriesInserted: cats.length, productsInserted: products.length };
}

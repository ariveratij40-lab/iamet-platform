import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Core Users ──────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Verticales de Negocio ────────────────────────────────────────────────────
export const verticals = mysqlTable("verticals", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }),
  solutions: json("solutions"),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vertical = typeof verticals.$inferSelect;

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  company: varchar("company", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  industry: varchar("industry", { length: 128 }),
  companySize: mysqlEnum("companySize", ["1-10", "11-50", "51-200", "201-500", "500+"]),
  problemDescription: text("problemDescription"),
  verticalSlug: varchar("verticalSlug", { length: 64 }),
  source: mysqlEnum("source", ["form", "agent", "advisor", "academy"]).default("form").notNull(),
  score: int("score").default(0),
  scoreBreakdown: json("scoreBreakdown"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "closed_won", "closed_lost"]).default("new").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Conversaciones con el Agente Virtual ────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  visitorId: varchar("visitorId", { length: 64 }),
  leadId: int("leadId"),
  verticalSlug: varchar("verticalSlug", { length: 64 }),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  summary: text("summary"),
  detectedIntent: varchar("detectedIntent", { length: 128 }),
  leadScore: int("leadScore").default(0),
  humanTookOver: boolean("humanTookOver").default(false).notNull(),
  humanAgentName: varchar("humanAgentName", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── IAMET Tech Advisor Sessions ─────────────────────────────────────────────
export const advisorSessions = mysqlTable("advisor_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  visitorId: varchar("visitorId", { length: 64 }),
  sector: varchar("sector", { length: 128 }),
  companySize: varchar("companySize", { length: 32 }),
  currentProblems: json("currentProblems"),
  recommendations: json("recommendations"),
  recommendedVerticals: json("recommendedVerticals"),
  leadId: int("leadId"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdvisorSession = typeof advisorSessions.$inferSelect;
export type InsertAdvisorSession = typeof advisorSessions.$inferInsert;

// ─── IAMET Academy ────────────────────────────────────────────────────────────
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  verticalSlug: varchar("verticalSlug", { length: 64 }),
  level: mysqlEnum("level", ["basico", "intermedio", "avanzado"]).default("basico").notNull(),
  duration: varchar("duration", { length: 64 }),
  modality: mysqlEnum("modality", ["online", "presencial", "hibrido"]).default("online").notNull(),
  price: float("price").default(0),
  isFree: boolean("isFree").default(false),
  syllabus: json("syllabus"),
  instructor: varchar("instructor", { length: 128 }),
  certification: boolean("certification").default(false),
  active: boolean("active").default(true),
  order: int("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 256 }),
  phone: varchar("phone", { length: 32 }),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "confirmed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

// ─── Visitor Presence Tracking ───────────────────────────────────────────────
export const visitorSessions = mysqlTable("visitor_sessions", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 64 }).notNull(),
  currentPage: varchar("currentPage", { length: 256 }).default("/").notNull(),
  currentSection: varchar("currentSection", { length: 128 }).default("hero").notNull(),
  chatActive: boolean("chatActive").default(false).notNull(),
  chatDuration: int("chatDuration").default(0).notNull(), // segundos
  chatMessages: int("chatMessages").default(0).notNull(),
  country: varchar("country", { length: 64 }),
  city: varchar("city", { length: 128 }),
  countryCode: varchar("countryCode", { length: 4 }),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("userAgent"),
  referrer: text("referrer"),
  lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VisitorSession = typeof visitorSessions.$inferSelect;
export type InsertVisitorSession = typeof visitorSessions.$inferInsert;

export const pageEvents = mysqlTable("page_events", {
  id: int("id").autoincrement().primaryKey(),
  visitorId: varchar("visitorId", { length: 64 }).notNull(),
  event: mysqlEnum("event", ["page_view", "section_change", "chat_open", "chat_message", "service_click", "heartbeat"]).notNull(),
  page: varchar("page", { length: 256 }),
  section: varchar("section", { length: 128 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageEvent = typeof pageEvents.$inferSelect;
export type InsertPageEvent = typeof pageEvents.$inferInsert;

// ─── Live Chat (Intervención Humana) ─────────────────────────────────────────────────────
export const liveChatMessages = mysqlTable("live_chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: mysqlEnum("role", ["user", "human"]).notNull(),
  content: text("content").notNull(),
  agentName: varchar("agentName", { length: 128 }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LiveChatMessage = typeof liveChatMessages.$inferSelect;
export type InsertLiveChatMessage = typeof liveChatMessages.$inferInsert;

// ─── E-Commerce: Tienda IAMET ─────────────────────────────────────────────────
export const storeCategories = mysqlTable("store_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  icon: varchar("icon", { length: 64 }),
  description: text("description"),
  order: int("order").default(0),
  active: boolean("active").default(true).notNull(),
});
export type StoreCategory = typeof storeCategories.$inferSelect;
export type InsertStoreCategory = typeof storeCategories.$inferInsert;

export const storeProducts = mysqlTable("store_products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  shortDesc: varchar("shortDesc", { length: 512 }),
  sku: varchar("sku", { length: 64 }),
  priceRef: float("priceRef"),
  unit: varchar("unit", { length: 32 }).default("pieza"),
  imageUrl: text("imageUrl"),
  tags: json("tags"),
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StoreProduct = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = typeof storeProducts.$inferInsert;

export const quoteRequests = mysqlTable("quote_requests", {
  id: int("id").autoincrement().primaryKey(),
  refCode: varchar("refCode", { length: 32 }).notNull().unique(),
  visitorName: varchar("visitorName", { length: 128 }).notNull(),
  company: varchar("company", { length: 256 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "reviewed", "quoted", "closed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;

export const quoteItems = mysqlTable("quote_items", {
  id: int("id").autoincrement().primaryKey(),
  quoteRequestId: int("quoteRequestId").notNull(),
  productId: int("productId"),
  productName: varchar("productName", { length: 256 }).notNull(),
  productSku: varchar("productSku", { length: 64 }),
  quantity: int("quantity").default(1).notNull(),
  notes: text("notes"),
});
export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

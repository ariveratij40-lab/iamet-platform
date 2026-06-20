import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  real,
  boolean,
  json,
  serial,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const companySizeEnum = pgEnum("company_size", ["1-10", "11-50", "51-200", "201-500", "500+"]);
export const leadSourceEnum = pgEnum("lead_source", ["form", "agent", "advisor", "academy"]);
export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "proposal", "closed_won", "closed_lost"]);
export const convStatusEnum = pgEnum("conv_status", ["active", "completed", "abandoned"]);
export const msgRoleEnum = pgEnum("msg_role", ["user", "assistant", "system"]);
export const courseLevelEnum = pgEnum("course_level", ["basico", "intermedio", "avanzado"]);
export const courseModalityEnum = pgEnum("course_modality", ["online", "presencial", "hibrido"]);
export const enrollStatusEnum = pgEnum("enroll_status", ["pending", "confirmed", "cancelled"]);
export const pageEventEnum = pgEnum("page_event", ["page_view", "section_change", "chat_open", "chat_message", "service_click", "heartbeat"]);
export const liveChatRoleEnum = pgEnum("live_chat_role", ["user", "human"]);
export const quoteStatusEnum = pgEnum("quote_status", ["pending", "reviewed", "quoted", "closed"]);

// ─── Core Users ──────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Verticales de Negocio ────────────────────────────────────────────────────
export const verticals = pgTable("verticals", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  color: varchar("color", { length: 32 }),
  solutions: json("solutions"),
  order: integer("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vertical = typeof verticals.$inferSelect;

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  company: varchar("company", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  industry: varchar("industry", { length: 128 }),
  companySize: companySizeEnum("companySize"),
  problemDescription: text("problemDescription"),
  verticalSlug: varchar("verticalSlug", { length: 64 }),
  source: leadSourceEnum("source").default("form").notNull(),
  score: integer("score").default(0),
  scoreBreakdown: json("scoreBreakdown"),
  status: leadStatusEnum("status").default("new").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Conversaciones con el Agente Virtual ────────────────────────────────────
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  visitorId: varchar("visitorId", { length: 64 }),
  leadId: integer("leadId"),
  verticalSlug: varchar("verticalSlug", { length: 64 }),
  status: convStatusEnum("status").default("active").notNull(),
  summary: text("summary"),
  detectedIntent: varchar("detectedIntent", { length: 128 }),
  leadScore: integer("leadScore").default(0),
  humanTookOver: boolean("humanTookOver").default(false).notNull(),
  humanAgentName: varchar("humanAgentName", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  role: msgRoleEnum("role").notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── IAMET Tech Advisor Sessions ─────────────────────────────────────────────
export const advisorSessions = pgTable("advisor_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull().unique(),
  visitorId: varchar("visitorId", { length: 64 }),
  sector: varchar("sector", { length: 128 }),
  companySize: varchar("companySize", { length: 32 }),
  currentProblems: json("currentProblems"),
  recommendations: json("recommendations"),
  recommendedVerticals: json("recommendedVerticals"),
  leadId: integer("leadId"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AdvisorSession = typeof advisorSessions.$inferSelect;
export type InsertAdvisorSession = typeof advisorSessions.$inferInsert;

// ─── IAMET Academy ────────────────────────────────────────────────────────────
export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  verticalSlug: varchar("verticalSlug", { length: 64 }),
  level: courseLevelEnum("level").default("basico").notNull(),
  duration: varchar("duration", { length: 64 }),
  modality: courseModalityEnum("modality").default("online").notNull(),
  price: real("price").default(0),
  isFree: boolean("isFree").default(false),
  syllabus: json("syllabus"),
  instructor: varchar("instructor", { length: 128 }),
  certification: boolean("certification").default(false),
  active: boolean("active").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("courseId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 256 }),
  phone: varchar("phone", { length: 32 }),
  message: text("message"),
  status: enrollStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

// ─── Visitor Presence Tracking ───────────────────────────────────────────────
export const visitorSessions = pgTable("visitor_sessions", {
  id: serial("id").primaryKey(),
  visitorId: varchar("visitorId", { length: 64 }).notNull(),
  currentPage: varchar("currentPage", { length: 256 }).default("/").notNull(),
  currentSection: varchar("currentSection", { length: 128 }).default("hero").notNull(),
  chatActive: boolean("chatActive").default(false).notNull(),
  chatDuration: integer("chatDuration").default(0).notNull(),
  chatMessages: integer("chatMessages").default(0).notNull(),
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

export const pageEvents = pgTable("page_events", {
  id: serial("id").primaryKey(),
  visitorId: varchar("visitorId", { length: 64 }).notNull(),
  event: pageEventEnum("event").notNull(),
  page: varchar("page", { length: 256 }),
  section: varchar("section", { length: 128 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageEvent = typeof pageEvents.$inferSelect;
export type InsertPageEvent = typeof pageEvents.$inferInsert;

// ─── Live Chat (Intervención Humana) ─────────────────────────────────────────
export const liveChatMessages = pgTable("live_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: varchar("sessionId", { length: 64 }).notNull(),
  role: liveChatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  agentName: varchar("agentName", { length: 128 }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LiveChatMessage = typeof liveChatMessages.$inferSelect;
export type InsertLiveChatMessage = typeof liveChatMessages.$inferInsert;

// ─── E-Commerce: Tienda IAMET ─────────────────────────────────────────────────
export const storeCategories = pgTable("store_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  icon: varchar("icon", { length: 64 }),
  description: text("description"),
  order: integer("order").default(0),
  active: boolean("active").default(true).notNull(),
});
export type StoreCategory = typeof storeCategories.$inferSelect;
export type InsertStoreCategory = typeof storeCategories.$inferInsert;

export const storeProducts = pgTable("store_products", {
  id: serial("id").primaryKey(),
  categoryId: integer("categoryId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  shortDesc: varchar("shortDesc", { length: 512 }),
  sku: varchar("sku", { length: 64 }),
  priceRef: real("priceRef"),
  unit: varchar("unit", { length: 32 }).default("pieza"),
  imageUrl: text("imageUrl"),
  tags: json("tags"),
  specs: json("specs"),
  deliveryTime: varchar("deliveryTime", { length: 128 }),
  dataSheetUrl: text("dataSheetUrl"),
  featured: boolean("featured").default(false).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type StoreProduct = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = typeof storeProducts.$inferInsert;

export const storeVisitors = pgTable("store_visitors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  phone: varchar("phone", { length: 32 }),
  verifiedAt: timestamp("verifiedAt"),
  verificationToken: varchar("verificationToken", { length: 128 }),
  tokenExpiry: timestamp("tokenExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StoreVisitor = typeof storeVisitors.$inferSelect;
export type InsertStoreVisitor = typeof storeVisitors.$inferInsert;

export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  refCode: varchar("refCode", { length: 32 }).notNull().unique(),
  visitorName: varchar("visitorName", { length: 128 }).notNull(),
  company: varchar("company", { length: 256 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  notes: text("notes"),
  status: quoteStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type QuoteRequest = typeof quoteRequests.$inferSelect;
export type InsertQuoteRequest = typeof quoteRequests.$inferInsert;

export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteRequestId: integer("quoteRequestId").notNull(),
  productId: integer("productId"),
  productName: varchar("productName", { length: 256 }).notNull(),
  productSku: varchar("productSku", { length: 64 }),
  quantity: integer("quantity").default(1).notNull(),
  notes: text("notes"),
});
export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

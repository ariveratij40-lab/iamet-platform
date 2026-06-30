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
  // Attribution
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmTerm: varchar("utm_term", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  gclid: varchar("gclid", { length: 255 }),
  fbclid: varchar("fbclid", { length: 255 }),
  msclkid: varchar("msclkid", { length: 255 }),
  referrer: text("referrer"),
  landingUrl: text("landing_url"),
  firstPage: varchar("first_page", { length: 500 }),
  sessionId: varchar("session_id", { length: 128 }),
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
  userId: integer("userId"),   // FK a users.id (null si es visitante anónimo)
  storeUserId: integer("storeUserId"), // FK a store_users.id (null si no autenticado en tienda)
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

// ─── Carrito Guardado ─────────────────────────────────────────────────────────
export const savedCarts = pgTable("saved_carts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(), // un carrito por usuario
  items: json("items").notNull().default([]),    // Array de { productId, quantity, notes }
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type SavedCart = typeof savedCarts.$inferSelect;
export type InsertSavedCart = typeof savedCarts.$inferInsert;

// ─── Usuarios de la Tienda (auth propia, sin Manus OAuth) ──────────────────────────────────────────
export const storeUsers = pgTable("store_users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  phone: varchar("phone", { length: 32 }),
  company: varchar("company", { length: 256 }),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  verificationToken: varchar("verificationToken", { length: 128 }),
  tokenExpiry: timestamp("tokenExpiry"),
  resetToken: varchar("resetToken", { length: 128 }),
  resetTokenExpiry: timestamp("resetTokenExpiry"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type StoreUser = typeof storeUsers.$inferSelect;
export type InsertStoreUser = typeof storeUsers.$inferInsert;

// ─── Calendario Inteligente (SDR) ─────────────────────────────────────────────
export const meetingStatusEnum = pgEnum("meeting_status", ["pending", "confirmed", "cancelled", "completed"]);

export const engineers = pgTable("engineers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  specialty: varchar("specialty", { length: 128 }),  // e.g. "Infraestructura, CCTV"
  avatarUrl: text("avatarUrl"),
  timezone: varchar("timezone", { length: 64 }).default("America/Mexico_City").notNull(),
  active: boolean("active").default(true).notNull(),
  certifications: text("certifications"),  // e.g. "Panduit NetKey, TIA-568, BICSI"
  languages: varchar("languages", { length: 256 }).default("Español"),  // e.g. "Español, Inglés"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Engineer = typeof engineers.$inferSelect;
export type InsertEngineer = typeof engineers.$inferInsert;

export const availabilitySlots = pgTable("availability_slots", {
  id: serial("id").primaryKey(),
  engineerId: integer("engineerId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),       // YYYY-MM-DD
  startTime: varchar("startTime", { length: 5 }).notNull(), // HH:MM
  endTime: varchar("endTime", { length: 5 }).notNull(),     // HH:MM
  isBooked: boolean("isBooked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AvailabilitySlot = typeof availabilitySlots.$inferSelect;
export type InsertAvailabilitySlot = typeof availabilitySlots.$inferInsert;

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  slotId: integer("slotId").notNull(),
  engineerId: integer("engineerId").notNull(),
  clientName: varchar("clientName", { length: 128 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 32 }),
  company: varchar("company", { length: 256 }),
  topic: text("topic").notNull(),
  specialistId: varchar("specialistId", { length: 64 }),  // ID del especialista IA que derivó
  conversationId: varchar("conversationId", { length: 64 }), // sesión del agente
  status: meetingStatusEnum("status").default("pending").notNull(),
  cancelToken: varchar("cancelToken", { length: 128 }),  // token único para cancelar
  notes: text("notes"),
  meetingUrl: varchar("meeting_url", { length: 500 }),  // Google Meet / Teams link
  // Attribution
  utmSource: varchar("utm_source", { length: 255 }),
  utmMedium: varchar("utm_medium", { length: 255 }),
  utmCampaign: varchar("utm_campaign", { length: 255 }),
  utmTerm: varchar("utm_term", { length: 255 }),
  utmContent: varchar("utm_content", { length: 255 }),
  gclid: varchar("gclid", { length: 255 }),
  fbclid: varchar("fbclid", { length: 255 }),
  msclkid: varchar("msclkid", { length: 255 }),
  referrer: text("referrer"),
  landingUrl: text("landing_url"),
  sessionId: varchar("session_id", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

// ─── Analytics de Conversión (Landing Factory) ────────────────────────────────
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  event: varchar("event", { length: 64 }).notNull(),
  vertical: varchar("vertical", { length: 64 }),
  sessionId: varchar("sessionId", { length: 128 }),
  utmSource: varchar("utmSource", { length: 128 }),
  utmMedium: varchar("utmMedium", { length: 128 }),
  utmCampaign: varchar("utmCampaign", { length: 128 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

// ─── Sprint 6: Agent Traces (Observabilidad del Agente) ───────────────────────
export const agentTraces = pgTable("agent_traces", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId"),
  sessionId: varchar("sessionId", { length: 64 }),
  iterationNum: integer("iterationNum").default(1).notNull(),
  toolName: varchar("toolName", { length: 64 }).notNull(),
  params: json("params"),
  result: json("result"),
  durationMs: integer("durationMs"),
  success: boolean("success").default(true).notNull(),
  error: text("error"),
  promptTokens: integer("promptTokens"),
  completionTokens: integer("completionTokens"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AgentTrace = typeof agentTraces.$inferSelect;
export type InsertAgentTrace = typeof agentTraces.$inferInsert;

// ─── Sprint 6: Enterprise RAG — Knowledge Base ────────────────────────────────
export const knowledgeCollections = pgTable("knowledge_collections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 32 }),
  icon: varchar("icon", { length: 64 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KnowledgeCollection = typeof knowledgeCollections.$inferSelect;

export const knowledgeDocStatusEnum = pgEnum("knowledge_doc_status", ["pending", "processing", "ready", "error"]);

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  collectionId: integer("collectionId"),
  title: varchar("title", { length: 256 }).notNull(),
  category: varchar("category", { length: 128 }),
  manufacturer: varchar("manufacturer", { length: 128 }),
  product: varchar("product", { length: 256 }),
  version: varchar("version", { length: 64 }),
  author: varchar("author", { length: 128 }),
  source: varchar("source", { length: 512 }),
  fileType: varchar("fileType", { length: 32 }),
  fileKey: text("fileKey"),
  fileUrl: text("fileUrl"),
  fileSizeBytes: integer("fileSizeBytes"),
  status: knowledgeDocStatusEnum("status").default("pending").notNull(),
  summary: text("summary"),
  keywords: json("keywords"),
  tags: json("tags"),
  chunkCount: integer("chunkCount").default(0).notNull(),
  processedAt: timestamp("processedAt"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type KnowledgeDocument = typeof knowledgeDocuments.$inferSelect;
export type InsertKnowledgeDocument = typeof knowledgeDocuments.$inferInsert;

export const knowledgeChunks = pgTable("knowledge_chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("documentId").notNull(),
  chunkIndex: integer("chunkIndex").notNull(),
  content: text("content").notNull(),
  embedding: json("embedding"),  // vector stored as JSON array
  tokenCount: integer("tokenCount"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KnowledgeChunk = typeof knowledgeChunks.$inferSelect;
export type InsertKnowledgeChunk = typeof knowledgeChunks.$inferInsert;

export const knowledgeFeedback = pgTable("knowledge_feedback", {
  id: serial("id").primaryKey(),
  chunkId: integer("chunkId").notNull(),
  sessionId: varchar("sessionId", { length: 64 }),
  query: text("query"),
  helpful: boolean("helpful"),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type KnowledgeFeedback = typeof knowledgeFeedback.$inferSelect;

// ─── Sprint 6: Commercial Learnings (Aprendizaje Comercial) ──────────────────
export const commercialOutcomeEnum = pgEnum("commercial_outcome", ["won", "lost"]);

export const commercialLearnings = pgTable("commercial_learnings", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId"),
  outcome: commercialOutcomeEnum("outcome").notNull(),
  industry: varchar("industry", { length: 128 }),
  employees: varchar("employees", { length: 64 }),
  vertical: varchar("vertical", { length: 64 }),
  problem: text("problem"),
  pain: text("pain"),
  budget: varchar("budget", { length: 128 }),
  competitor: varchar("competitor", { length: 256 }),
  productsSold: json("productsSold"),
  closingDays: integer("closingDays"),
  lossReason: text("lossReason"),
  successReason: text("successReason"),
  decisionMaker: varchar("decisionMaker", { length: 128 }),
  channel: varchar("channel", { length: 64 }),
  campaign: varchar("campaign", { length: 128 }),
  source: varchar("source", { length: 64 }),
  extractedAt: timestamp("extractedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CommercialLearning = typeof commercialLearnings.$inferSelect;
export type InsertCommercialLearning = typeof commercialLearnings.$inferInsert;

// ─── Sprint 6: Daily Briefings (Briefing Ejecutivo IA) ───────────────────────
export const dailyBriefings = pgTable("daily_briefings", {
  id: serial("id").primaryKey(),
  date: varchar("date", { length: 10 }).notNull().unique(),  // YYYY-MM-DD
  content: json("content").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
});
export type DailyBriefing = typeof dailyBriefings.$inferSelect;
export type InsertDailyBriefing = typeof dailyBriefings.$inferInsert;

// ─── Sprint 6: Channel ROI ────────────────────────────────────────────────────
export const channelRoi = pgTable("channel_roi", {
  id: serial("id").primaryKey(),
  channel: varchar("channel", { length: 64 }).notNull(),  // google_ads, linkedin, facebook, referral, organic, email, utm
  period: varchar("period", { length: 7 }).notNull(),     // YYYY-MM
  spend: real("spend").default(0),
  leads: integer("leads").default(0),
  meetings: integer("meetings").default(0),
  opportunities: integer("opportunities").default(0),
  won: integer("won").default(0),
  revenue: real("revenue").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ChannelRoi = typeof channelRoi.$inferSelect;
export type InsertChannelRoi = typeof channelRoi.$inferInsert;

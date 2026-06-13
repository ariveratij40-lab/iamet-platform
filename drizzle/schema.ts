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

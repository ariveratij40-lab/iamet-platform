CREATE TYPE "public"."commercial_outcome" AS ENUM('won', 'lost');
CREATE TYPE "public"."company_size" AS ENUM('1-10', '11-50', '51-200', '201-500', '500+');
CREATE TYPE "public"."conv_status" AS ENUM('active', 'completed', 'abandoned');
CREATE TYPE "public"."course_level" AS ENUM('basico', 'intermedio', 'avanzado');
CREATE TYPE "public"."course_modality" AS ENUM('online', 'presencial', 'hibrido');
CREATE TYPE "public"."enroll_status" AS ENUM('pending', 'confirmed', 'cancelled');
CREATE TYPE "public"."knowledge_doc_status" AS ENUM('pending', 'processing', 'ready', 'error');
CREATE TYPE "public"."lead_source" AS ENUM('form', 'agent', 'advisor', 'academy');
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost');
CREATE TYPE "public"."live_chat_role" AS ENUM('user', 'human');
CREATE TYPE "public"."meeting_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE "public"."msg_role" AS ENUM('user', 'assistant', 'system');
CREATE TYPE "public"."page_event" AS ENUM('page_view', 'section_change', 'chat_open', 'chat_message', 'service_click', 'heartbeat');
CREATE TYPE "public"."quote_status" AS ENUM('pending', 'reviewed', 'quoted', 'closed');
CREATE TYPE "public"."role" AS ENUM('user', 'admin');
CREATE TYPE "public"."subscriber_plan" AS ENUM('free', 'pro', 'enterprise');
CREATE TYPE "public"."subscriber_status" AS ENUM('active', 'inactive', 'suspended');
CREATE TABLE "advisor_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" varchar(64) NOT NULL,
	"visitorId" varchar(64),
	"sector" varchar(128),
	"companySize" varchar(32),
	"currentProblems" json,
	"recommendations" json,
	"recommendedVerticals" json,
	"leadId" integer,
	"completed" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advisor_sessions_sessionId_unique" UNIQUE("sessionId")
);

CREATE TABLE "agent_traces" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" integer,
	"sessionId" varchar(64),
	"iterationNum" integer DEFAULT 1 NOT NULL,
	"toolName" varchar(64) NOT NULL,
	"params" json,
	"result" json,
	"durationMs" integer,
	"success" boolean DEFAULT true NOT NULL,
	"error" text,
	"promptTokens" integer,
	"completionTokens" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event" varchar(64) NOT NULL,
	"vertical" varchar(64),
	"sessionId" varchar(128),
	"utmSource" varchar(128),
	"utmMedium" varchar(128),
	"utmCampaign" varchar(128),
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "assistant_conversations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"page" varchar(180) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "assistant_turns" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" varchar(36) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"mode" varchar(10) NOT NULL,
	"topic" varchar(80) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "availability_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"engineerId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"startTime" varchar(5) NOT NULL,
	"endTime" varchar(5) NOT NULL,
	"isBooked" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "channel_roi" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" varchar(64) NOT NULL,
	"period" varchar(7) NOT NULL,
	"spend" real DEFAULT 0,
	"leads" integer DEFAULT 0,
	"meetings" integer DEFAULT 0,
	"opportunities" integer DEFAULT 0,
	"won" integer DEFAULT 0,
	"revenue" real DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "commercial_learnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"leadId" integer,
	"outcome" "commercial_outcome" NOT NULL,
	"industry" varchar(128),
	"employees" varchar(64),
	"vertical" varchar(64),
	"problem" text,
	"pain" text,
	"budget" varchar(128),
	"competitor" varchar(256),
	"productsSold" json,
	"closingDays" integer,
	"lossReason" text,
	"successReason" text,
	"decisionMaker" varchar(128),
	"channel" varchar(64),
	"campaign" varchar(128),
	"source" varchar(64),
	"extractedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" varchar(64) NOT NULL,
	"visitorId" varchar(64),
	"leadId" integer,
	"verticalSlug" varchar(64),
	"status" "conv_status" DEFAULT 'active' NOT NULL,
	"summary" text,
	"detectedIntent" varchar(128),
	"leadScore" integer DEFAULT 0,
	"humanTookOver" boolean DEFAULT false NOT NULL,
	"humanAgentName" varchar(128),
	"subscriberId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_sessionId_unique" UNIQUE("sessionId")
);

CREATE TABLE "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(128) NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text,
	"verticalSlug" varchar(64),
	"level" "course_level" DEFAULT 'basico' NOT NULL,
	"duration" varchar(64),
	"modality" "course_modality" DEFAULT 'online' NOT NULL,
	"price" real DEFAULT 0,
	"isFree" boolean DEFAULT false,
	"syllabus" json,
	"instructor" varchar(128),
	"certification" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);

CREATE TABLE "customer_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_user_id" integer NOT NULL,
	"reference" varchar(64) NOT NULL,
	"kind" varchar(24) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(24) DEFAULT 'received' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_orders_reference_unique" UNIQUE("reference")
);

CREATE TABLE "daily_briefings" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"content" json NOT NULL,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"scheduleCronTaskUid" varchar(65),
	CONSTRAINT "daily_briefings_date_unique" UNIQUE("date")
);

CREATE TABLE "engineers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"email" varchar(320) NOT NULL,
	"specialty" varchar(128),
	"avatarUrl" text,
	"timezone" varchar(64) DEFAULT 'America/Mexico_City' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"certifications" text,
	"languages" varchar(256) DEFAULT 'Español',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "engineers_email_unique" UNIQUE("email")
);

CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" integer NOT NULL,
	"name" varchar(128) NOT NULL,
	"email" varchar(320) NOT NULL,
	"company" varchar(256),
	"phone" varchar(32),
	"message" text,
	"status" "enroll_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "knowledge_chunks" (
	"id" serial PRIMARY KEY NOT NULL,
	"documentId" integer NOT NULL,
	"chunkIndex" integer NOT NULL,
	"content" text NOT NULL,
	"embedding" json,
	"tokenCount" integer,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "knowledge_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"description" text,
	"color" varchar(32),
	"icon" varchar(64),
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "knowledge_collections_slug_unique" UNIQUE("slug")
);

CREATE TABLE "knowledge_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"collectionId" integer,
	"title" varchar(256) NOT NULL,
	"category" varchar(128),
	"manufacturer" varchar(128),
	"product" varchar(256),
	"version" varchar(64),
	"author" varchar(128),
	"source" varchar(512),
	"fileType" varchar(32),
	"fileKey" text,
	"fileUrl" text,
	"fileSizeBytes" integer,
	"status" "knowledge_doc_status" DEFAULT 'pending' NOT NULL,
	"summary" text,
	"keywords" json,
	"tags" json,
	"chunkCount" integer DEFAULT 0 NOT NULL,
	"processedAt" timestamp,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "knowledge_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"chunkId" integer NOT NULL,
	"sessionId" varchar(64),
	"query" text,
	"helpful" boolean,
	"comment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"company" varchar(256) NOT NULL,
	"contactName" varchar(128) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(32),
	"industry" varchar(128),
	"companySize" "company_size",
	"problemDescription" text,
	"verticalSlug" varchar(64),
	"source" "lead_source" DEFAULT 'form' NOT NULL,
	"score" integer DEFAULT 0,
	"scoreBreakdown" json,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"utm_term" varchar(255),
	"utm_content" varchar(255),
	"gclid" varchar(255),
	"fbclid" varchar(255),
	"msclkid" varchar(255),
	"referrer" text,
	"landing_url" text,
	"first_page" varchar(500),
	"session_id" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "live_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" varchar(64) NOT NULL,
	"role" "live_chat_role" NOT NULL,
	"content" text NOT NULL,
	"agentName" varchar(128),
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"slotId" integer NOT NULL,
	"engineerId" integer NOT NULL,
	"clientName" varchar(128) NOT NULL,
	"clientEmail" varchar(320) NOT NULL,
	"clientPhone" varchar(32),
	"company" varchar(256),
	"topic" text NOT NULL,
	"specialistId" varchar(64),
	"conversationId" varchar(64),
	"status" "meeting_status" DEFAULT 'pending' NOT NULL,
	"cancelToken" varchar(128),
	"notes" text,
	"meeting_url" varchar(500),
	"utm_source" varchar(255),
	"utm_medium" varchar(255),
	"utm_campaign" varchar(255),
	"utm_term" varchar(255),
	"utm_content" varchar(255),
	"gclid" varchar(255),
	"fbclid" varchar(255),
	"msclkid" varchar(255),
	"referrer" text,
	"landing_url" text,
	"session_id" varchar(128),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" integer NOT NULL,
	"role" "msg_role" NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "page_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitorId" varchar(64) NOT NULL,
	"event" "page_event" NOT NULL,
	"page" varchar(256),
	"section" varchar(128),
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "quote_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quoteRequestId" integer NOT NULL,
	"productId" integer,
	"productName" varchar(256) NOT NULL,
	"productSku" varchar(64),
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text
);

CREATE TABLE "quote_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"refCode" varchar(32) NOT NULL,
	"userId" integer,
	"storeUserId" integer,
	"visitorName" varchar(128) NOT NULL,
	"company" varchar(256),
	"email" varchar(320) NOT NULL,
	"phone" varchar(32),
	"notes" text,
	"status" "quote_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quote_requests_refCode_unique" UNIQUE("refCode")
);

CREATE TABLE "saved_carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"items" json DEFAULT '[]'::json NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_carts_userId_unique" UNIQUE("userId")
);

CREATE TABLE "store_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"icon" varchar(64),
	"description" text,
	"order" integer DEFAULT 0,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "store_categories_slug_unique" UNIQUE("slug")
);

CREATE TABLE "store_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"categoryId" integer NOT NULL,
	"name" varchar(256) NOT NULL,
	"slug" varchar(128) NOT NULL,
	"description" text,
	"shortDesc" varchar(512),
	"sku" varchar(64),
	"priceRef" real,
	"unit" varchar(32) DEFAULT 'pieza',
	"imageUrl" text,
	"tags" json,
	"specs" json,
	"deliveryTime" varchar(128),
	"dataSheetUrl" text,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_products_slug_unique" UNIQUE("slug")
);

CREATE TABLE "store_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(320) NOT NULL,
	"passwordHash" text NOT NULL,
	"phone" varchar(32),
	"company" varchar(256),
	"emailVerified" boolean DEFAULT false NOT NULL,
	"verificationToken" varchar(128),
	"tokenExpiry" timestamp,
	"resetToken" varchar(128),
	"resetTokenExpiry" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_users_email_unique" UNIQUE("email")
);

CREATE TABLE "store_visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"phone" varchar(32),
	"verifiedAt" timestamp,
	"verificationToken" varchar(128),
	"tokenExpiry" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_visitors_email_unique" UNIQUE("email")
);

CREATE TABLE "subscriber_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriberId" integer NOT NULL,
	"token" varchar(256) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriber_sessions_token_unique" UNIQUE("token")
);

CREATE TABLE "subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"passwordHash" text NOT NULL,
	"name" varchar(128) NOT NULL,
	"company" varchar(256),
	"phone" varchar(32),
	"plan" "subscriber_plan" DEFAULT 'free' NOT NULL,
	"status" "subscriber_status" DEFAULT 'active' NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"verificationToken" varchar(128),
	"verificationTokenExpiresAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email")
);

CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);

CREATE TABLE "verticals" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"description" text,
	"icon" varchar(64),
	"color" varchar(32),
	"solutions" json,
	"order" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "verticals_slug_unique" UNIQUE("slug")
);

CREATE TABLE "visitor_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitorId" varchar(64) NOT NULL,
	"currentPage" varchar(256) DEFAULT '/' NOT NULL,
	"currentSection" varchar(128) DEFAULT 'hero' NOT NULL,
	"chatActive" boolean DEFAULT false NOT NULL,
	"chatDuration" integer DEFAULT 0 NOT NULL,
	"chatMessages" integer DEFAULT 0 NOT NULL,
	"country" varchar(64),
	"city" varchar(128),
	"countryCode" varchar(4),
	"ip" varchar(64),
	"userAgent" text,
	"referrer" text,
	"lastSeenAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "warranty_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"filename" varchar(180) NOT NULL,
	"mime_type" varchar(40) NOT NULL,
	"data" text NOT NULL,
	CONSTRAINT "warranty_invoices_ticket_id_unique" UNIQUE("ticket_id")
);

CREATE TABLE "warranty_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_user_id" integer NOT NULL,
	"reference" varchar(40) NOT NULL,
	"product" varchar(180) NOT NULL,
	"description" text NOT NULL,
	"purchase_reference" varchar(120),
	"status" varchar(32) DEFAULT 'received' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warranty_tickets_reference_unique" UNIQUE("reference")
);

CREATE TABLE "warranty_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"author" varchar(16) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(32),
	"created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "assistant_turns" ADD CONSTRAINT "assistant_turns_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_store_user_id_store_users_id_fk" FOREIGN KEY ("store_user_id") REFERENCES "public"."store_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "warranty_invoices" ADD CONSTRAINT "warranty_invoices_ticket_id_warranty_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."warranty_tickets"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "warranty_tickets" ADD CONSTRAINT "warranty_tickets_store_user_id_store_users_id_fk" FOREIGN KEY ("store_user_id") REFERENCES "public"."store_users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "warranty_updates" ADD CONSTRAINT "warranty_updates_ticket_id_warranty_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."warranty_tickets"("id") ON DELETE cascade ON UPDATE no action;

-- Local authentication fields are maintained outside the legacy Drizzle history.
ALTER TABLE users ADD COLUMN "passwordHash" text;
ALTER TABLE users ADD COLUMN "status" varchar(32) NOT NULL DEFAULT 'active';
ALTER TABLE users ADD COLUMN "lastLoginAt" timestamp;
ALTER TYPE role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE role ADD VALUE IF NOT EXISTS 'viewer';
CREATE INDEX assistant_turns_created_at_idx ON assistant_turns(created_at);
CREATE INDEX assistant_turns_conversation_idx ON assistant_turns(conversation_id);

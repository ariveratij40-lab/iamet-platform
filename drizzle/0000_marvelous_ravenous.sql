CREATE TYPE "public"."company_size" AS ENUM('1-10', '11-50', '51-200', '201-500', '500+');--> statement-breakpoint
CREATE TYPE "public"."conv_status" AS ENUM('active', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."course_level" AS ENUM('basico', 'intermedio', 'avanzado');--> statement-breakpoint
CREATE TYPE "public"."course_modality" AS ENUM('online', 'presencial', 'hibrido');--> statement-breakpoint
CREATE TYPE "public"."enroll_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."lead_source" AS ENUM('form', 'agent', 'advisor', 'academy');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost');--> statement-breakpoint
CREATE TYPE "public"."live_chat_role" AS ENUM('user', 'human');--> statement-breakpoint
CREATE TYPE "public"."msg_role" AS ENUM('user', 'assistant', 'system');--> statement-breakpoint
CREATE TYPE "public"."page_event" AS ENUM('page_view', 'section_change', 'chat_open', 'chat_message', 'service_click', 'heartbeat');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('pending', 'reviewed', 'quoted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
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
--> statement-breakpoint
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
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_sessionId_unique" UNIQUE("sessionId")
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_chat_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sessionId" varchar(64) NOT NULL,
	"role" "live_chat_role" NOT NULL,
	"content" text NOT NULL,
	"agentName" varchar(128),
	"read" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" integer NOT NULL,
	"role" "msg_role" NOT NULL,
	"content" text NOT NULL,
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"visitorId" varchar(64) NOT NULL,
	"event" "page_event" NOT NULL,
	"page" varchar(256),
	"section" varchar(128),
	"metadata" json,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quoteRequestId" integer NOT NULL,
	"productId" integer,
	"productName" varchar(256) NOT NULL,
	"productSku" varchar(64),
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "quote_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"refCode" varchar(32) NOT NULL,
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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

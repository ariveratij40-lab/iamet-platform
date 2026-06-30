CREATE TYPE "public"."commercial_outcome" AS ENUM('won', 'lost');--> statement-breakpoint
CREATE TYPE "public"."knowledge_doc_status" AS ENUM('pending', 'processing', 'ready', 'error');--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "daily_briefings" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(10) NOT NULL,
	"content" json NOT NULL,
	"generatedAt" timestamp DEFAULT now() NOT NULL,
	"scheduleCronTaskUid" varchar(65),
	CONSTRAINT "daily_briefings_date_unique" UNIQUE("date")
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "knowledge_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"chunkId" integer NOT NULL,
	"sessionId" varchar(64),
	"query" text,
	"helpful" boolean,
	"comment" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_source" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_medium" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_campaign" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_term" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_content" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "gclid" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "fbclid" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "msclkid" varchar(255);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "referrer" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "landing_url" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "first_page" varchar(500);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "session_id" varchar(128);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "meeting_url" varchar(500);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "utm_source" varchar(255);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "utm_medium" varchar(255);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "utm_campaign" varchar(255);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "utm_term" varchar(255);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "utm_content" varchar(255);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "gclid" varchar(255);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "fbclid" varchar(255);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "msclkid" varchar(255);--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "referrer" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "landing_url" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD COLUMN "session_id" varchar(128);
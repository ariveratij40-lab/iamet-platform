CREATE TYPE "public"."meeting_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TABLE "availability_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"engineerId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"startTime" varchar(5) NOT NULL,
	"endTime" varchar(5) NOT NULL,
	"isBooked" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "engineers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"email" varchar(320) NOT NULL,
	"specialty" varchar(128),
	"avatarUrl" text,
	"timezone" varchar(64) DEFAULT 'America/Mexico_City' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "engineers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
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
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "storeUserId" integer;
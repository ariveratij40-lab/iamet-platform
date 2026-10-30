CREATE TYPE "public"."subscriber_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "subscriber_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriberId" integer NOT NULL,
	"token" varchar(256) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriber_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "warranty_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"filename" varchar(180) NOT NULL,
	"mime_type" varchar(40) NOT NULL,
	"data" text NOT NULL,
	CONSTRAINT "warranty_invoices_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "warranty_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"author" varchar(16) NOT NULL,
	"message" text NOT NULL,
	"status" varchar(32),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_store_user_id_store_users_id_fk" FOREIGN KEY ("store_user_id") REFERENCES "public"."store_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_invoices" ADD CONSTRAINT "warranty_invoices_ticket_id_warranty_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."warranty_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_tickets" ADD CONSTRAINT "warranty_tickets_store_user_id_store_users_id_fk" FOREIGN KEY ("store_user_id") REFERENCES "public"."store_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warranty_updates" ADD CONSTRAINT "warranty_updates_ticket_id_warranty_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."warranty_tickets"("id") ON DELETE cascade ON UPDATE no action;
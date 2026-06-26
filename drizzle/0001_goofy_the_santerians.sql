CREATE TABLE "saved_carts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"items" json DEFAULT '[]'::json NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_carts_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
ALTER TABLE "quote_requests" ADD COLUMN "userId" integer;
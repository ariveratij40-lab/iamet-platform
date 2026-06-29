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
--> statement-breakpoint
ALTER TABLE "engineers" ADD COLUMN "certifications" text;--> statement-breakpoint
ALTER TABLE "engineers" ADD COLUMN "languages" varchar(256) DEFAULT 'Español';
ALTER TABLE "leads" ADD COLUMN "crm_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "crm_sync_error" text;
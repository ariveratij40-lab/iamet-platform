CREATE TABLE "assistant_conversations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"page" varchar(180) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assistant_turns" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" varchar(36) NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"mode" varchar(10) NOT NULL,
	"topic" varchar(80) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assistant_turns" ADD CONSTRAINT "assistant_turns_conversation_id_assistant_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."assistant_conversations"("id") ON DELETE cascade ON UPDATE no action;
CREATE TYPE "public"."blog_source" AS ENUM('ai', 'manual');--> statement-breakpoint
CREATE TYPE "public"."blog_status" AS ENUM('published', 'draft', 'archived');--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(80) NOT NULL,
	"title" varchar(200) NOT NULL,
	"intro" varchar(320) DEFAULT '' NOT NULL,
	"body" text NOT NULL,
	"meta_description" varchar(220) DEFAULT '' NOT NULL,
	"image_url" text,
	"image_credit" varchar(300),
	"image_credit_url" text,
	"topic" varchar(220) DEFAULT '' NOT NULL,
	"source_headline" varchar(300),
	"source" "blog_source" DEFAULT 'ai' NOT NULL,
	"status" "blog_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
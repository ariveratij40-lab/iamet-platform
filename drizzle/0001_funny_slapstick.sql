CREATE TABLE `advisor_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`visitorId` varchar(64),
	`sector` varchar(128),
	`companySize` varchar(32),
	`currentProblems` json,
	`recommendations` json,
	`recommendedVerticals` json,
	`leadId` int,
	`completed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advisor_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `advisor_sessions_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`visitorId` varchar(64),
	`leadId` int,
	`verticalSlug` varchar(64),
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`summary` text,
	`detectedIntent` varchar(128),
	`leadScore` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_sessionId_unique` UNIQUE(`sessionId`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(128) NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`verticalSlug` varchar(64),
	`level` enum('basico','intermedio','avanzado') NOT NULL DEFAULT 'basico',
	`duration` varchar(64),
	`modality` enum('online','presencial','hibrido') NOT NULL DEFAULT 'online',
	`price` float DEFAULT 0,
	`isFree` boolean DEFAULT false,
	`syllabus` json,
	`instructor` varchar(128),
	`certification` boolean DEFAULT false,
	`active` boolean DEFAULT true,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`email` varchar(320) NOT NULL,
	`company` varchar(256),
	`phone` varchar(32),
	`message` text,
	`status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`company` varchar(256) NOT NULL,
	`contactName` varchar(128) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`industry` varchar(128),
	`companySize` enum('1-10','11-50','51-200','201-500','500+'),
	`problemDescription` text,
	`verticalSlug` varchar(64),
	`source` enum('form','agent','advisor','academy') NOT NULL DEFAULT 'form',
	`score` int DEFAULT 0,
	`scoreBreakdown` json,
	`status` enum('new','contacted','qualified','proposal','closed_won','closed_lost') NOT NULL DEFAULT 'new',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verticals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`icon` varchar(64),
	`color` varchar(32),
	`solutions` json,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verticals_id` PRIMARY KEY(`id`),
	CONSTRAINT `verticals_slug_unique` UNIQUE(`slug`)
);

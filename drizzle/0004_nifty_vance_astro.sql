CREATE TABLE `quote_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteRequestId` int NOT NULL,
	`productId` int,
	`productName` varchar(256) NOT NULL,
	`productSku` varchar(64),
	`quantity` int NOT NULL DEFAULT 1,
	`notes` text,
	CONSTRAINT `quote_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quote_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`refCode` varchar(32) NOT NULL,
	`visitorName` varchar(128) NOT NULL,
	`company` varchar(256),
	`email` varchar(320) NOT NULL,
	`phone` varchar(32),
	`notes` text,
	`status` enum('pending','reviewed','quoted','closed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quote_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `quote_requests_refCode_unique` UNIQUE(`refCode`)
);
--> statement-breakpoint
CREATE TABLE `store_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`icon` varchar(64),
	`description` text,
	`order` int DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `store_categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `store_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`shortDesc` varchar(512),
	`sku` varchar(64),
	`priceRef` float,
	`unit` varchar(32) DEFAULT 'pieza',
	`imageUrl` text,
	`tags` json,
	`featured` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `store_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_products_slug_unique` UNIQUE(`slug`)
);

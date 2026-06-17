CREATE TABLE `store_visitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`email` varchar(256) NOT NULL,
	`phone` varchar(32),
	`verifiedAt` timestamp,
	`verificationToken` varchar(128),
	`tokenExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `store_visitors_id` PRIMARY KEY(`id`),
	CONSTRAINT `store_visitors_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `store_products` ADD `deliveryTime` varchar(128);--> statement-breakpoint
ALTER TABLE `store_products` ADD `dataSheetUrl` text;
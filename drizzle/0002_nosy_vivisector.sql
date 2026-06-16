CREATE TABLE `page_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(64) NOT NULL,
	`event` enum('page_view','section_change','chat_open','chat_message','service_click','heartbeat') NOT NULL,
	`page` varchar(256),
	`section` varchar(128),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitor_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorId` varchar(64) NOT NULL,
	`currentPage` varchar(256) NOT NULL DEFAULT '/',
	`currentSection` varchar(128) NOT NULL DEFAULT 'hero',
	`chatActive` boolean NOT NULL DEFAULT false,
	`chatDuration` int NOT NULL DEFAULT 0,
	`chatMessages` int NOT NULL DEFAULT 0,
	`country` varchar(64),
	`city` varchar(128),
	`countryCode` varchar(4),
	`ip` varchar(64),
	`userAgent` text,
	`referrer` text,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `visitor_sessions_id` PRIMARY KEY(`id`)
);

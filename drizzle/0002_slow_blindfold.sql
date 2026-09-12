CREATE TABLE `ecojoi_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`salt` text NOT NULL,
	`disabled` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ecojoi_accounts_owner_id_unique` ON `ecojoi_accounts` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ecojoi_accounts_email_unique` ON `ecojoi_accounts` (`email`);--> statement-breakpoint
CREATE TABLE `ecojoi_auth_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`attempts` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `auth_attempts_expiry` ON `ecojoi_auth_attempts` (`expires_at`);--> statement-breakpoint
CREATE TABLE `ecojoi_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `ecojoi_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_account` ON `ecojoi_sessions` (`account_id`);--> statement-breakpoint
CREATE INDEX `sessions_expiry` ON `ecojoi_sessions` (`expires_at`);
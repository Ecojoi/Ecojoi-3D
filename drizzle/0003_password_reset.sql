CREATE TABLE `ecojoi_password_resets` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `ecojoi_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `password_resets_account` ON `ecojoi_password_resets` (`account_id`);
--> statement-breakpoint
CREATE INDEX `password_resets_expiry` ON `ecojoi_password_resets` (`expires_at`);


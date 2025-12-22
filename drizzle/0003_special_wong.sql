CREATE TABLE `prompt_run_table` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text,
	`harnessId` text,
	`tokens` integer,
	`tools` text,
	`toolInputs` text,
	`output` text,
	`status` text,
	FOREIGN KEY (`user`) REFERENCES `users_table`(`email`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`harnessId`) REFERENCES `harness_config_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_harness_config_table` (
	`id` text PRIMARY KEY NOT NULL,
	`user` text,
	`model` text,
	`systemPrompt` text,
	`tools` text,
	FOREIGN KEY (`user`) REFERENCES `users_table`(`email`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_harness_config_table`("id", "user", "model", "systemPrompt", "tools") SELECT "id", "user", "model", "systemPrompt", "tools" FROM `harness_config_table`;--> statement-breakpoint
DROP TABLE `harness_config_table`;--> statement-breakpoint
ALTER TABLE `__new_harness_config_table` RENAME TO `harness_config_table`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_users_table` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users_table`("id", "name", "email") SELECT "id", "name", "email" FROM `users_table`;--> statement-breakpoint
DROP TABLE `users_table`;--> statement-breakpoint
ALTER TABLE `__new_users_table` RENAME TO `users_table`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_table_email_unique` ON `users_table` (`email`);
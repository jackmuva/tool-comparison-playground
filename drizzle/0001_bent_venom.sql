CREATE TABLE `harness_config_table` (
	`id` text NOT NULL,
	`user` text,
	`systemPrompt` text,
	`tools` text,
	FOREIGN KEY (`user`) REFERENCES `users_table`(`email`) ON UPDATE no action ON DELETE no action
);

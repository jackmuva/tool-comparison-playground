import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { ToolConfig } from "../types/types";

export const usersTable = sqliteTable("users_table", {
	id: text().$defaultFn(() => crypto.randomUUID()).notNull(),
	name: text().notNull(),
	email: text().notNull().unique(),
});

export type User = typeof usersTable.$inferSelect;

export const harnessConfigTable = sqliteTable("harness_config_table", {
	id: text().$defaultFn(() => crypto.randomUUID()).notNull(),
	user: text().references(() => usersTable.email),
	model: text(),
	systemPrompt: text(),
	tools: text({ mode: "json" }).$type<ToolConfig>(),
});

export type HarnessConfig = typeof harnessConfigTable.$inferSelect;

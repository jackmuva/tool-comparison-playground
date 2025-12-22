import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export type ToolConfig = {
	[provider: string]: string[],
}

export type ToolParams = {
	[tool: string]: {
		[paramName: string]: string
	}
}

export enum PromptStatus {
	SUBMITTED = "SUBMITTED",
	IN_PROGRESS = "IN_PROGRESS",
	COMPLETE = "COMPLETE",
	ERRORED = "ERRORED",
}

export const usersTable = sqliteTable("users_table", {
	id: text().primaryKey().$defaultFn(() => crypto.randomUUID()).notNull(),
	name: text().notNull(),
	email: text().notNull().unique(),
});

export type User = typeof usersTable.$inferSelect;

export const harnessConfigTable = sqliteTable("harness_config_table", {
	id: text().primaryKey().$defaultFn(() => crypto.randomUUID()).notNull(),
	user: text().references(() => usersTable.email),
	model: text(),
	systemPrompt: text(),
	tools: text({ mode: "json" }).$type<ToolConfig>(),
});

export type HarnessConfig = typeof harnessConfigTable.$inferSelect;

export const promptRunTable = sqliteTable("prompt_run_table", {
	id: text().primaryKey().$defaultFn(() => crypto.randomUUID()).notNull(),
	user: text().references(() => usersTable.email),
	harnessId: text().references(() => harnessConfigTable.id),
	tokens: integer(),
	tools: text({ mode: "json" }).$type<Array<string>>(),
	toolInputs: text({ mode: "json" }).$type<Array<ToolParams>>(),
	output: text(),
	status: text().$type<PromptStatus>(),
})

export type PromptRun = typeof promptRunTable.$inferSelect;

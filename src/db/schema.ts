import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
	id: text().$defaultFn(() => crypto.randomUUID()).notNull(),
	name: text().notNull(),
	email: text().notNull().unique(),
});

export type User = typeof usersTable.$inferSelect;

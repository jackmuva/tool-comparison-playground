import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { HarnessConfig, harnessConfigTable, User, usersTable } from './schema';
import { ToolConfig } from '../types/types';
import { eq } from 'drizzle-orm';

const client = createClient({
	url: process.env.TURSO_DATABASE_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!
});
const db = drizzle({ client });

export const insertUser = async (name: string, email: string) => {
	try {
		await db.insert(usersTable).values({
			name: name,
			email: email,
		});
	} catch (e) {
		console.error(e);
	}
}

export const getUser = async (email: string): Promise<User | null> => {
	try {
		const userArr = await db.select().from(usersTable).where(eq(usersTable.email, email));
		return userArr[0];
	} catch (e) {
		console.error(e);
	}
	return null;
}

export const getHarnessConfig = async (email: string): Promise<HarnessConfig | null> => {
	try {
		const harnessArr = await db.select().from(harnessConfigTable).where(eq(harnessConfigTable.user, email));
		return harnessArr[0];
	} catch (e) {
		console.error(e);
	}
	return null;
}

export const insertHarnessConfig = async (user: string, model: string, systemPrompt: string, tools: ToolConfig): Promise<HarnessConfig | null> => {
	try {
		const harness = await getHarnessConfig(user);
		if (harness) {
			return (await db.update(harnessConfigTable).set({
				user: user,
				model: model,
				systemPrompt: systemPrompt,
				tools: tools,
			}).returning())[0];
		} else {
			return (await db.insert(harnessConfigTable).values({
				user: user,
				model: model,
				systemPrompt: systemPrompt,
				tools: tools,
			}).returning())[0];
		}
	} catch (e) {
		console.error(e);
	}
	return null;
}

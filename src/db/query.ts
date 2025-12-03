import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { usersTable } from './schema';

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

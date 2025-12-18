import { insertHarnessConfig } from "@/src/db/query";
import { HarnessConfig } from "@/src/db/schema";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	const user = await withAuth();
	if (!user.user) {
		return NextResponse.json({
			statusCode: 401
		})
	}
	try {
		const config = await request.json();
		const savedConfig: HarnessConfig | null = await insertHarnessConfig(user.user.email, config.model, config.systemPrompt, config.tools)

		if (!savedConfig) throw new Error;

		return NextResponse.json({
			statusCode: 200,
			config: savedConfig,
		});
	} catch (e) {
		return NextResponse.json({
			statusCode: 500,
			message: e
		});
	}
}

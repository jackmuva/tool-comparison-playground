import { withAuth } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { redirect } from 'next/navigation'

const NOTION_AUTH_CONFIG_ID = "ac_bIhdNG-H-8b8";
export async function GET() {
	const user = await withAuth();
	if (!user.user) {
		return NextResponse.json({
			statusCode: 401
		})
	}
	try {
		const composio = new Composio({
			apiKey: process.env.COMPOSIO_API_KEY!,
			provider: new VercelProvider(),
		});

		const externalUserId = user.user.id;


		const connectionRequest = await composio.connectedAccounts.link(
			externalUserId,
			NOTION_AUTH_CONFIG_ID,
		);

		const redirectUrl = connectionRequest.redirectUrl;
		if (redirectUrl) {
			return NextResponse.json({ url: redirectUrl });
		} else {
			throw new Error("Unable to get Composio auth url");
		}
	} catch (e) {
		return NextResponse.json({
			statusCode: 500,
			message: e
		});
	}
}

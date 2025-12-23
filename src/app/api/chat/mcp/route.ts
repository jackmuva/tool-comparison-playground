import { ComposioService } from '@/src/lib/composio';
import { ToolConfig } from '@/src/types/types';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { validateUIMessages, stepCountIs, UIMessage, streamText, convertToModelMessages } from 'ai';
import { Experimental_Agent as Agent } from 'ai';
import { NextResponse } from 'next/server';
import { createMCPClient } from "@ai-sdk/mcp"
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { userWithToken } from '@/src/lib/auth';

export const maxDuration = 30;

const NOTION_MCP_URL = "https://mcp.notion.com/sse";

export async function POST(req: Request) {
	const user = await userWithToken();

	if (!user.userInfo) {
		return NextResponse.json({
			statusCode: 401
		})
	}

	const { messages, model, systemPrompt, toolConfig }: { messages: UIMessage[], model: string, systemPrompt: string, toolConfig: ToolConfig } = await req.json();

	const mcpClient = await createMCPClient({
		transport: {
			type: "sse",
			url: NOTION_MCP_URL,
			headers: {
				"WWW-Authenticate": 'Bearer realm="mcp"',
			}
		}
	});
	console.log("mcp client: ", mcpClient);

	const selectedTools = await mcpClient.tools();

	console.log("[MCP] selected tools: ", selectedTools);

	const result = streamText({
		model: model,
		system: systemPrompt,
		messages: convertToModelMessages(messages),
		// tools: selectedTools,
		stopWhen: stepCountIs(5),
	});

	return result.toUIMessageStreamResponse({
		originalMessages: messages,
		messageMetadata: ({ part }) => {
			if (part.type === 'finish') {
				return {
					totalUsage: part.totalUsage,
				};
			}
		},
	});
}

import { ToolConfig } from '@/src/types/types';
import { validateUIMessages, stepCountIs, UIMessage, streamText, convertToModelMessages } from 'ai';
import { NextResponse } from 'next/server';
import { userWithToken } from '@/src/lib/auth';
import { StreamableHTTPClientTransportOptions } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport, SSEClientTransportOptions } from '@modelcontextprotocol/sdk/client/sse.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { CustomHeaders, Notification } from '@/src/hooks/useMcpConnection';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { ListToolsResultSchema, Result, ClientRequest } from "@modelcontextprotocol/sdk/types.js";
import { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js';

const NOTION_MCP_URL = "https://mcp.notion.com/sse";

export const maxDuration = 60;

export async function POST(req: Request) {
	const user = await userWithToken();

	if (!user.userInfo) {
		return NextResponse.json({
			statusCode: 401
		})
	}

	const { messages, model, systemPrompt, toolConfig }: { messages: UIMessage[], model: string, systemPrompt: string, toolConfig: ToolConfig } = await req.json();

	const lastUserMessage = messages.filter(m => m.role === 'user').pop();
	const metadata = lastUserMessage?.metadata as any;

	const mcpToken = metadata.mcpToken;

	let transportOptions:
		| StreamableHTTPClientTransportOptions
		| SSEClientTransportOptions;

	const headers: HeadersInit = {};
	let finalHeaders: CustomHeaders = [];
	finalHeaders = [
		{
			name: "Authorization",
			value: `Bearer ${mcpToken}`,
			enabled: true,
		},
	];

	const customHeaderNames: string[] = [];
	finalHeaders.forEach((header) => {
		if (header.enabled && header.name.trim() && header.value.trim()) {
			const headerName = header.name.trim();
			const headerValue = header.value.trim();

			headers[headerName] = headerValue;

			// Track custom header names for server processing
			if (headerName.toLowerCase() !== "authorization") {
				customHeaderNames.push(headerName);
			}
		}
	});

	let serverUrl: URL;
	serverUrl = new URL(NOTION_MCP_URL);

	const requestHeaders = { ...headers };

	requestHeaders["Accept"] = "text/event-stream";
	requestHeaders["content-type"] = "application/json";
	transportOptions = {
		fetch: async (
			url: string | URL | globalThis.Request,
			init?: RequestInit,
		) => {
			const response = await fetch(url, {
				...init,
				headers: requestHeaders,
			});

			return response;
		},
		requestInit: {
			headers: requestHeaders,
		},
	};

	const transport = new SSEClientTransport(serverUrl, transportOptions);

	console.log("[SERVER_URL]: ", serverUrl);
	console.log("[TRANSPORT OPTIONS]: ", transportOptions);

	const clientCapabilities = {
		capabilities: {
			sampling: {},
			elicitation: {},
			roots: {
				listChanged: true,
			},
		},
	};

	const client = new Client<Request, Notification, Result>(
		{ name: "tool-comparison", version: "0.1.0" },
		clientCapabilities,
	);
	await client.connect(transport as Transport);

	const request: ClientRequest = {
		method: "tools/list" as const,
		params: {},
	}

	const shouldAddGeneralMetadata = request.method !== "tools/call" && Object.keys(metadata).length > 0;
	const requestWithMetadata = shouldAddGeneralMetadata
		? {
			...request,
			params: {
				...request.params,
				_meta: metadata,
			},
		}
		: request;

	const abortController = new AbortController();

	const mcpRequestOptions: RequestOptions = {
		signal: abortController.signal,
	};

	const tools = await client.request(
		requestWithMetadata,
		ListToolsResultSchema,
		mcpRequestOptions,
	);

	console.log("tool list: ", tools);

	const selectedTools = tools.tools;

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

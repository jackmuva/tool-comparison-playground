"use client";

import { Button } from "@/components/ui/button";
import { UserInfo } from "@workos-inc/authkit-nextjs";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from "react";
import { useTestingStore } from "@/src/store/testing-store";
import { ProviderType } from "./harness-setup";
import useSWR from 'swr'
import { ChatMessage } from "./chat-message";
import { MetricsPanel } from "./metrics-panel";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
	NotificationSchema as BaseNotificationSchema,
	ClientNotificationSchema,
	ServerNotificationSchema,
	Result,
} from "@modelcontextprotocol/sdk/types.js";
import type { SchemaOutput } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
	SSEClientTransport,
	SseError,
	SSEClientTransportOptions,
} from "@modelcontextprotocol/sdk/client/sse.js";
import {
	StreamableHTTPClientTransport,
	StreamableHTTPClientTransportOptions,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export const NotificationSchema = ClientNotificationSchema.or(
	ServerNotificationSchema,
).or(BaseNotificationSchema);

export type Notification = SchemaOutput<typeof NotificationSchema>;

export interface CustomHeader {
	name: string;
	value: string;
	enabled: boolean;
}

export type CustomHeaders = CustomHeader[];

export const McpChat = ({
	user,
	chatInput,
	submittingMessage,
	clearId,
}: {
	user: { userInfo: UserInfo, paragonUserToken: string },
	chatInput: string,
	submittingMessage: boolean,
	clearId: string | null,
}) => {
	const { setChatReady, config } = useTestingStore((state) => state);
	const { messages, sendMessage, status, setMessages: setChatMessages } = useChat({
		transport: new DefaultChatTransport({
			api: '/api/chat/mcp',
			body: {
				model: config?.model,
				systemPrompt: config?.systemPrompt,
				toolConfig: config?.tools,
			},
		}),
	});
	const [usage, setUsage] = useState<{
		runningTotal: number,
		runningInput: number,
		runningOutput: number,
		lastInput: number,
		lastOutput: number
	}>({
		runningTotal: 0,
		runningInput: 0,
		runningOutput: 0,
		lastInput: 0,
		lastOutput: 0,
	});
	const messageWindowRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (messages.length > 0) {
			const usage: {
				cachedInputTokens: number,
				inputTokens: number,
				outputTokens: number,
				reasoningTokens: number,
				totalTokens: number,
			} | undefined = (messages.at(-1)?.metadata as any)?.totalUsage;
			if (usage) {
				setUsage((prev) => ({
					runningTotal: prev.runningTotal + usage.totalTokens,
					runningInput: prev.runningInput + usage.inputTokens,
					runningOutput: prev.runningOutput + usage.outputTokens,
					lastInput: usage.inputTokens,
					lastOutput: usage.outputTokens,
				}));
			}
		}

		if (status !== "ready") {
			setChatReady(ProviderType.COMPOSIO, false);
		} else {
			setChatReady(ProviderType.COMPOSIO, true);
		}
	}, [status]);

	useEffect(() => {
		if (clearId) {
			setChatMessages([]);
			setUsage({
				runningTotal: 0,
				runningInput: 0,
				runningOutput: 0,
				lastInput: 0,
				lastOutput: 0,
			});
		}
	}, [clearId]);

	useEffect(() => {
		if (submittingMessage) sendMessage({ text: chatInput });
	}, [submittingMessage]);

	useEffect(() => {
		if (messageWindowRef.current) {
			messageWindowRef.current.scrollTop = messageWindowRef.current.scrollHeight;
		}
	}, [messages]);


	//NOTE:MCP LOGIC
	const [mcpSessionId, setMcpSessionId] = useState<string | null>(null);

	const captureResponseHeaders = (response: Response): void => {
		const sessionId = response.headers.get("mcp-session-id");
		const protocolVersion = response.headers.get("mcp-protocol-version");
		if (sessionId && sessionId !== mcpSessionId) {
			setMcpSessionId(sessionId);
		}
	}

	const isEmptyAuthHeader = (header: CustomHeaders[number]) =>
		header.name.trim().toLowerCase() === "authorization" &&
		header.value.trim().toLowerCase() === "bearer";

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

	const transportType: string = "sse";
	const headers: HeadersInit = {};
	const requestHeaders = { ...headers };
	let finalHeaders: CustomHeaders = [];

	const needsOAuthToken = !finalHeaders.some(
		(header) =>
			header.enabled &&
			header.name.trim().toLowerCase() === "authorization",
	);

	if (needsOAuthToken) {
		console.log("[OAUTH] GETTING TOKEN");
		const oauthToken = sessionStorage.getItem("NOTION_MCP_TOKEN");
		console.log("[OAUTH] Access token: ", oauthToken);
		if (oauthToken) {
			// Add the OAuth token
			finalHeaders = [
				// Remove any existing Authorization headers with empty tokens
				...finalHeaders.filter((header) => !isEmptyAuthHeader(header)),
				{
					name: "Authorization",
					value: `Bearer ${oauthToken}`,
					enabled: true,
				},
			];
		}
	}

	let transportOptions:
		| StreamableHTTPClientTransportOptions
		| SSEClientTransportOptions;

	let serverUrl: URL;
	serverUrl = new URL("http://mcp.notion.com/sse");

	if (mcpSessionId) {
		requestHeaders["mcp-session-id"] = mcpSessionId;
	}


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

			// Capture protocol-related headers from response
			captureResponseHeaders(response);
			return response;
		},
		requestInit: {
			headers: requestHeaders,
		},
	};

	const transport = transportType === "streamable-http"
		? new StreamableHTTPClientTransport(serverUrl, {
			sessionId: undefined,
			...transportOptions,
		})
		: new SSEClientTransport(serverUrl, transportOptions);

	const connectMcpServer = async () => {
		console.log("[SERVER_URL]: ", serverUrl);
		console.log("[TRANSPORT OPTIONS]: ", transportOptions);
		await client.connect(transport as Transport);
	}

	return (
		<div className="w-full flex flex-col gap-4 p-4 rounded-sm border overflow-hidden">
			<h1 className="text-2xl">
				MCP Harness
			</h1>
			<div className="max-h-48 overflow-y-auto w-full rounded-sm border p-2 flex flex-col
				gap-2 items-center">
				<div className="w-full flex items-center gap-10 p-2 border-b justify-between">
					<div>
						Notion
					</div>
					<Button size={"sm"} onClick={async () => await connectMcpServer()}>
						Connect
					</Button>
				</div>
			</div>
			<MetricsPanel usage={usage} />
			<div ref={messageWindowRef}
				className="rounded-sm bg-muted-foreground/5 overflow-y-auto h-96
					p-2 overflow-x-hidden w-full">
				{messages.map(message => (
					<div key={message.id} className="whitespace-pre-wrap overflow-hidden flex flex-col">
						{message.parts.map((part, i) => {
							return <ChatMessage key={`${message.id}-${i}`}
								message={message}
								part={part} />
						})}
					</div>
				))}
			</div>
		</div>
	);
}

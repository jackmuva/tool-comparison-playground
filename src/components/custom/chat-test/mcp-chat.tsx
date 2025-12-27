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
import {
	auth,
	discoverOAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/client/auth.js";
import {
	OAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import { discoverAuthorizationServerMetadata } from "@modelcontextprotocol/sdk/client/auth.js";
import { InspectorOAuthClientProvider, saveScopeToSessionStorage } from "@/src/lib/mcp-auth";

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

export const connectMcpServer = async (_e?: unknown, retryCount: number = 0): Promise<void> => {
	if (retryCount > 3) return;

	const sseUrl = "https://mcp.notion.com/sse";

	const discoverScopes = async (
		serverUrl: string,
		resourceMetadata?: OAuthProtectedResourceMetadata,
	): Promise<string | undefined> => {
		try {
			const metadata = await discoverAuthorizationServerMetadata(
				new URL("/", serverUrl),
			);

			// Prefer resource metadata scopes, but fall back to OAuth metadata if empty
			const resourceScopes = resourceMetadata?.scopes_supported;
			const oauthScopes = metadata?.scopes_supported;

			const scopesSupported =
				resourceScopes && resourceScopes.length > 0
					? resourceScopes
					: oauthScopes;

			return scopesSupported && scopesSupported.length > 0
				? scopesSupported.join(" ")
				: undefined;
		} catch (error) {
			console.debug("OAuth scope discovery failed:", error);
			return undefined;
		}
	};

	const is401Error = (error: unknown): boolean => {
		return (
			(error instanceof SseError && error.code === 401) ||
			(error instanceof Error && error.message.includes("401")) ||
			(error instanceof Error && error.message.includes("Unauthorized"))
		);
	};

	const isProxyAuthError = (error: unknown): boolean => {
		return (
			error instanceof Error &&
			error.message.includes("Authentication required. Use the session token")
		);
	};

	const handleAuthError = async (error: unknown) => {
		if (is401Error(error)) {
			const oauthScope = "";
			let scope: string | undefined = oauthScope?.trim();
			if (!scope) {
				// Only discover resource metadata when we need to discover scopes
				let resourceMetadata;
				try {
					resourceMetadata = await discoverOAuthProtectedResourceMetadata(
						new URL("/", sseUrl),
					);
				} catch {
					// Resource metadata is optional, continue without it
				}
				scope = await discoverScopes(sseUrl, resourceMetadata);
			}

			saveScopeToSessionStorage(sseUrl, scope);
			const serverAuthProvider = new InspectorOAuthClientProvider(sseUrl);

			const result = await auth(serverAuthProvider, {
				serverUrl: sseUrl,
				scope,
			});
			return result === "AUTHORIZED";
		}

		return false;
	};

	const captureResponseHeaders = (response: Response): void => {
		const sessionId = response.headers.get("mcp-session-id");
		const protocolVersion = response.headers.get("mcp-protocol-version");
		// if (sessionId && sessionId !== mcpSessionId) {
		// 	setMcpSessionId(sessionId);
		// }
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

	const serverAuthProvider = new InspectorOAuthClientProvider(sseUrl);
	const transportType: string = "sse";
	const headers: HeadersInit = {};
	let finalHeaders: CustomHeaders = [];

	const needsOAuthToken = !finalHeaders.some(
		(header) =>
			header.enabled &&
			header.name.trim().toLowerCase() === "authorization",
	);

	if (needsOAuthToken) {
		console.log("[OAUTH] GETTING TOKEN");
		const oauthToken = (await serverAuthProvider.tokens())?.access_token;
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

	let transportOptions:
		| StreamableHTTPClientTransportOptions
		| SSEClientTransportOptions;

	let serverUrl: URL;
	serverUrl = new URL(sseUrl);

	// if (mcpSessionId) {
	// 	requestHeaders["mcp-session-id"] = mcpSessionId;
	// }


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

			// Capture protocol-related headers from response
			captureResponseHeaders(response);
			return response;
		},
		requestInit: {
			headers: requestHeaders,
		},
	};

	try {
		const transport = transportType === "streamable-http"
			? new StreamableHTTPClientTransport(serverUrl, {
				sessionId: undefined,
				...transportOptions,
			})
			: new SSEClientTransport(serverUrl, transportOptions);

		console.log("[SERVER_URL]: ", serverUrl);
		console.log("[TRANSPORT OPTIONS]: ", transportOptions);
		await client.connect(transport as Transport);
	} catch (error) {
		const shouldRetry = await handleAuthError(error);
		if (shouldRetry) {
			return connectMcpServer(undefined, retryCount + 1);
		}
		if (is401Error(error)) {
			// Don't set error state if we're about to redirect for auth

			return;
		}
		throw error;
	}
}
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
			setChatReady(ProviderType.MCP, false);
		} else {
			setChatReady(ProviderType.MCP, true);
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


	// const [mcpSessionId, setMcpSessionId] = useState<string | null>(null);

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

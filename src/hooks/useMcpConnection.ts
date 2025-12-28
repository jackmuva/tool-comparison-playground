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
import { discoverScopes, InspectorOAuthClientProvider, saveScopeToSessionStorage } from "@/src/lib/mcp-auth";
import { useState } from "react";


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

export function useMcpConnection({
	sseUrl,
}: {
	sseUrl: string
}) {
	const [mcpSessionId, setMcpSessionId] = useState<string | null>(null);

	const is401Error = (error: unknown): boolean => {
		return (
			(error instanceof SseError && error.code === 401) ||
			(error instanceof Error && error.message.includes("401")) ||
			(error instanceof Error && error.message.includes("Unauthorized"))
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
		if (sessionId && sessionId !== mcpSessionId) {
			setMcpSessionId(sessionId);
		}
	}

	const connectMcpServer = async (_e?: unknown, retryCount: number = 0): Promise<string | null> => {
		if (retryCount > 3) return null;

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
		let oauthToken: null | string = null;
		if (needsOAuthToken) {
			console.log("[OAUTH] GETTING TOKEN");
			oauthToken = (await serverAuthProvider.tokens())?.access_token ?? null;
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
		} else {
			oauthToken = finalHeaders.filter((header) => header.name.trim().toLowerCase() === "authorization")[0].value.split(" ")[1];
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

		const requestHeaders = { ...headers };

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
			return oauthToken;
		} catch (error) {
			const shouldRetry = await handleAuthError(error);
			if (shouldRetry) {
				return connectMcpServer(undefined, retryCount + 1);
			}
			if (is401Error(error)) {
				// Don't set error state if we're about to redirect for auth

				return null;
			}
			throw error;
		}
	}

	return { connectMcpServer };
}

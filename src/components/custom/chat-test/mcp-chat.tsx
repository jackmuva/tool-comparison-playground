"use client";

import { Button } from "@/components/ui/button";
import { UserInfo } from "@workos-inc/authkit-nextjs";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from "react";
import { useTestingStore } from "@/src/store/testing-store";
import { ProviderType } from "./harness-setup";
import { ChatMessage } from "./chat-message";
import { MetricsPanel } from "./metrics-panel";
import { useMcpConnection } from "@/src/hooks/useMcpConnection";
import { InspectorOAuthClientProvider } from "@/src/lib/mcp-auth";

export const NOTION_MCP_URL = "https://mcp.notion.com/sse";

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
	const { connectMcpServer } = useMcpConnection({ sseUrl: NOTION_MCP_URL });
	const [oauthToken, setOAuthToken] = useState<null | string>(null);

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
		if (submittingMessage) sendMessage({
			text: chatInput,
			metadata: {
				mcpToken: oauthToken,
			}
		});
	}, [submittingMessage, oauthToken]);

	useEffect(() => {
		if (messageWindowRef.current) {
			messageWindowRef.current.scrollTop = messageWindowRef.current.scrollHeight;
		}
	}, [messages]);

	useEffect(() => {
		const serverAuthProvider = new InspectorOAuthClientProvider(NOTION_MCP_URL);
		serverAuthProvider.tokens().then((token) => {
			const existingToken = token?.access_token;
			if (existingToken) setOAuthToken(existingToken);
		});
	}, []);

	console.log("mcpToken: ", oauthToken);

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
					<Button size={"sm"} onClick={async () => {
						const token = await connectMcpServer();
						if (token) setOAuthToken(token);
					}}>
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

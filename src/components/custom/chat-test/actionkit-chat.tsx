"use client";

import { Button } from "@/components/ui/button";
import useParagon from "@/src/hooks/useParagon";
import { UserInfo } from "@workos-inc/authkit-nextjs";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect, useRef, useState } from "react";
import { useTestingStore } from "@/src/store/testing-store";
import { ProviderType } from "./harness-setup";
import { ChatMessage } from "./chat-message";
import { MetricsPanel } from "./metrics-panel";

export const ActionKitChat = ({
	user,
	chatInput,
	submittingMessage,
	tools,
}: {
	user: { userInfo: UserInfo, paragonUserToken: string },
	chatInput: string,
	submittingMessage: boolean,
	tools: any,
}) => {

	const { paragonConnect } = useParagon(user.paragonUserToken);
	const { setChatReady, config } = useTestingStore((state) => state);
	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({
			api: '/api/chat/actionkit',
			body: {
				model: config?.model,
				systemPrompt: config?.systemPrompt,
				toolConfig: config?.tools,
				tools: tools
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
	})
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
			setChatReady(ProviderType.ACTIONKIT, false);
		} else {
			setChatReady(ProviderType.ACTIONKIT, true);
		}
	}, [status]);

	useEffect(() => {
		if (submittingMessage) {
			sendMessage({ text: chatInput });
		}
	}, [submittingMessage]);

	useEffect(() => {
		if (messageWindowRef.current) {
			messageWindowRef.current.scrollTop = messageWindowRef.current.scrollHeight;
		}
	}, [messages]);

	return (
		<div className="w-full flex flex-col gap-4 p-4 rounded-sm border overflow-hidden">
			<h1 className="text-2xl">
				ActionKit Harness
			</h1>
			<div className="max-h-48 overflow-y-auto w-full rounded-sm border p-2 flex flex-col
				gap-2 items-center">
				<div className="w-full flex items-center gap-10 p-2 border-b justify-between">
					<div>
						Notion
					</div>
					<Button size={"sm"} onClick={() => paragonConnect?.connect("notion", {})}>
						Connect
					</Button>
				</div>
			</div>
			<MetricsPanel usage={usage} />
			<div className="flex flex-col gap-4 max-w-full w-full overflow-hidden">
				<div ref={messageWindowRef}
					className="rounded-sm bg-muted-foreground/5 overflow-y-auto h-96 p-2 overflow-x-hidden w-full">
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
		</div>
	);
}

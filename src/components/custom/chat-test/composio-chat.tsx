"use client";

import { Button } from "@/components/ui/button";
import { UserInfo } from "@workos-inc/authkit-nextjs";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect } from "react";
import { useTestingStore } from "@/src/store/testing-store";
import { ProviderType } from "./harness-setup";
import useSWR from 'swr'

export const ComposioChat = ({
	user,
	chatInput,
	submittingMessage,
}: {
	user: { userInfo: UserInfo, paragonUserToken: string },
	chatInput: string,
	submittingMessage: boolean,

}) => {
	const { setChatReady, config } = useTestingStore((state) => state);
	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({
			api: '/api/chat/composio',
			body: {
				model: config?.model,
				systemPrompt: config?.systemPrompt,
				tools: config?.tools,
			},
		}),
	});

	useEffect(() => {
		if (status !== "ready") {
			setChatReady(ProviderType.COMPOSIO, false);
		} else {
			setChatReady(ProviderType.COMPOSIO, true);
		}
	}, [status]);

	useEffect(() => {
		if (submittingMessage) sendMessage({ text: chatInput });
	}, [submittingMessage]);

	const { data: url, error, isLoading } = useSWR(`composio/${user.userInfo.user.id}`, async () => {
		const res: Response = await fetch(`${window.location.origin}/api/composio/auth`, {
			method: "GET"
		});

		return (await res.json()).url;
	});

	return (
		<div className="w-full flex flex-col gap-4 p-4 rounded-sm border ">
			<h1 className="text-2xl">
				Composio Harness
			</h1>
			<div className="max-h-48 overflow-y-auto w-full rounded-sm border p-2 flex flex-col
				gap-2 items-center">
				<div className="w-full flex items-center gap-10 p-2 border-b justify-between">
					<div>
						Notion
					</div>
					<a href={url} target="_blank">
						<Button size={"sm"} disabled={isLoading}>
							Connect
						</Button>
					</a>
				</div>
			</div>
			<div className="flex flex-col gap-4">
				<div className="rounded-sm bg-muted-foreground/10 overflow-y-auto h-96
					p-2">
					{messages.map(message => (
						<div key={message.id}>
							{message.role === 'user' ? 'User: ' : 'AI: '}
							{message.parts.map((part, index) =>
								part.type === 'text' ? <span key={index}>{part.text}</span> : null,
							)}
						</div>
					))}
				</div>

			</div>
		</div>
	);
}

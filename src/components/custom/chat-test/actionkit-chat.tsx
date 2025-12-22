"use client";

import { Button } from "@/components/ui/button";
import useParagon from "@/src/hooks/useParagon";
import { UserInfo } from "@workos-inc/authkit-nextjs";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useEffect } from "react";
import { useTestingStore } from "@/src/store/testing-store";
import { ProviderType } from "./harness-setup";
import useSWR from "swr";

export const ActionKitChat = ({
	user,
	chatInput,
	submittingMessage,
}: {
	user: { userInfo: UserInfo, paragonUserToken: string },
	chatInput: string,
	submittingMessage: boolean,

}) => {
	const { data: tools, isLoading: toolsAreLoading } = useSWR(`actionkit/tools`, async () => {
		const response = await fetch(
			`https://actionkit.useparagon.com/projects/${process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID}/actions`,
			{
				headers: {
					Authorization: `Bearer ${user.paragonUserToken}`,
				},
			},
		);
		const data = await response.json();
		return data.actions;
	});

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

	console.log("tools: ", tools);

	useEffect(() => {
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


	return (
		<div className="w-full flex flex-col gap-4 p-4 rounded-sm border ">
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

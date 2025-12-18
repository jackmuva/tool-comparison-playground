"use client";

import { Button } from "@/components/ui/button";
import useParagon from "@/src/hooks/useParagon";
import { UserInfo } from "@workos-inc/authkit-nextjs";
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export const ActionKitChat = ({
	user,
}: {
	user: { userInfo: UserInfo, paragonUserToken: string }
}) => {
	const { paragonConnect } = useParagon(user.paragonUserToken);
	const { messages, sendMessage, status } = useChat({

		transport: new DefaultChatTransport({
			api: '/api/chat/actionkit',
		}),

	});

	const [input, setInput] = useState('');

	return (
		<div className="w-full flex flex-col gap-4 p-4 rounded-sm border ">
			<h1 className="text-2xl">
				ActionKit Harness
			</h1>
			<div className="rounded-sm border flex items-center gap-10 p-2">
				<div>
					Notion
				</div>
				<Button size={"sm"} onClick={() => paragonConnect?.connect("notion", {})}>
					Connect
				</Button>
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
				<form
					onSubmit={e => {
						e.preventDefault();
						if (input.trim()) {
							sendMessage({ text: input });
							setInput('');
						}
					}}
					className="flex gap-1 w-full justify-between"
				>
					<input value={input}
						onChange={e => setInput(e.target.value)}
						disabled={status !== 'ready'}
						className="outline p-1 rounded-sm grow"
						placeholder="Say something..."
					/>
					<Button type="submit" disabled={status !== 'ready'}>
						Submit
					</Button>
				</form>
			</div>
		</div>
	);
}

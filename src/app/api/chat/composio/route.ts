import { ComposioService } from '@/src/lib/composio';
import { ToolConfig } from '@/src/types/types';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { stepCountIs, UIMessage, streamText, convertToModelMessages } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 30;

export async function POST(req: Request) {
	const user = await withAuth();

	if (!user.user) {
		return NextResponse.json({
			statusCode: 401
		})
	}

	const { messages, model, systemPrompt, toolConfig }: { messages: UIMessage[], model: string, systemPrompt: string, toolConfig: ToolConfig } = await req.json();

	const selectedTools = await ComposioService.tools.get(user.user.id, {
		tools: toolConfig["Composio"]
	});

	const result = streamText({
		model: model,
		system: systemPrompt,
		messages: convertToModelMessages(messages),
		tools: selectedTools,
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

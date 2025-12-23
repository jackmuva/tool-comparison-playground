import { ComposioService } from '@/src/lib/composio';
import { ToolConfig } from '@/src/types/types';
import { withAuth } from '@workos-inc/authkit-nextjs';
import { validateUIMessages, stepCountIs, UIMessage } from 'ai';
import { Experimental_Agent as Agent } from 'ai';
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

	console.log("[Composio] selected tools: ", selectedTools);

	const actionKitAgent = new Agent({
		model: model,
		system: systemPrompt,
		tools: selectedTools,
		stopWhen: stepCountIs(5),
	});

	return actionKitAgent.respond({
		messages: await validateUIMessages({ messages }),
	});
}

import { convertToModelMessages, streamText, UIMessage } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages, model, systemPrompt }: { messages: UIMessage[], model: string, systemPrompt: string } = await req.json();

	const result = streamText({
		model: model,
		system: systemPrompt,
		messages: convertToModelMessages(messages),
	});

	return result.toUIMessageStreamResponse();
}

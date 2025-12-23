import { userWithToken } from '@/src/lib/auth';
import { ToolConfig } from '@/src/types/types';
import { validateUIMessages, UIMessage, tool, jsonSchema, stepCountIs } from 'ai';
import { Experimental_Agent as Agent } from 'ai';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
	const user = await userWithToken();

	if (!user.userInfo) {
		return NextResponse.json({
			statusCode: 401
		})
	}

	const { messages, model, systemPrompt, toolConfig, tools }: { messages: UIMessage[], model: string, systemPrompt: string, toolConfig: ToolConfig, tools: any } = await req.json();

	const selectedTools = Object.fromEntries(
		Object.keys(tools).flatMap((integration) => {
			return tools[integration]?.map((
				toolFunction: {
					type: string,
					function: {
						name: string,
						description: string,
						parameters: any
					}
				}
			) => {
				if (toolConfig["ActionKit"].includes(toolFunction.function.name)) {
					return [toolFunction.function.name, tool({
						description: toolFunction.function.description,
						inputSchema: jsonSchema(toolFunction.function.parameters),
						execute: async (params: any) => {
							console.log(`EXECUTING TOOL: ${toolFunction.function.name}`);
							console.log(`Tool params:`, params);
							try {
								const response = await fetch(
									`https://actionkit.useparagon.com/projects/${process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID}/actions`,
									{
										method: "POST",
										body: JSON.stringify({
											action: toolFunction.function.name,
											parameters: params,
										}),
										headers: {
											Authorization: `Bearer ${user.paragonUserToken}`,
											"Content-Type": "application/json",
										},
									}
								);
								const output = await response.json();
								if (!response.ok) {
									throw new Error(JSON.stringify(output, null, 2));
								}
								return output;
							} catch (err) {
								if (err instanceof Error) {
									return { error: { message: err.message } };
								}
								return err;
							}
						}
					})];
				}
			})
				.filter((toolSchema: undefined | Array<any>) => {
					return toolSchema ? true : false
				})
				|| []
		})
	)

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

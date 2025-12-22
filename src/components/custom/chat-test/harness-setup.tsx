"use client";

import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { CirclePlus, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { useTestingStore } from "@/src/store/testing-store";
import { HarnessConfig } from "@/src/db/schema";

export enum ProviderType {
	ACTIONKIT = "ActionKit",
	COMPOSIO = "Composio",
	MCP = "MCP",
}

const ACTIONKIT_NOTION_TOOLS = [
	"NOTION_CREATE_PAGE",
	"NOTION_UPDATE_PAGE",
	"NOTION_GET_PAGE_BY_ID",
	"NOTION_ARCHIVE_PAGE",
	"NOTION_SEARCH_PAGES",
	"NOTION_GET_PAGE_CONTENT",
	"NOTION_UPDATE_BLOCK",
	"NOTION_GET_BLOCK_BY_ID",
	"NOTION_DELETE_BLOCK",
	"NOTION_GET_PAGE_AS_MARKDOWN",
	"NOTION_CREATE_PAGE_WITH_MARKDOWN",
	"NOTION_UPDATE_PAGE_WITH_MARKDOWN",
];

const COMPOSIO_NOTION_TOOLS = [
	"NOTION_ADD_MULTIPLE_PAGE_CONTENT",
	"NOTION_ADD_PAGE_CONTENT",
	"NOTION_APPEND_BLOCK_CHILDREN",
	"NOTION_ARCHIVE_NOTION_PAGE",
	"NOTION_CREATE_COMMENT",
	"NOTION_CREATE_DATABASE",
	"NOTION_CREATE_FILE_UPLOAD",
	"NOTION_CREATE_NOTION_PAGE",
	"NOTION_DELETE_BLOCK",
	"NOTION_DUPLICATE_PAGE",
	"NOTION_FETCH_ALL_BLOCK_CONTENTS",
	"NOTION_FETCH_BLOCK_CONTENTS",
	"NOTION_FETCH_BLOCK_METADATA",
	"NOTION_FETCH_COMMENTS",
	"NOTION_FETCH_DATA",
	"NOTION_FETCH_DATABASE",
	"NOTION_FETCH_ROW",
	"NOTION_GET_ABOUT_ME",
	"NOTION_GET_ABOUT_USER",
	"NOTION_GET_PAGE_PROPERTY_ACTION",
	"NOTION_INSERT_ROW_DATABASE",
	"NOTION_LIST_DATA_SOURCE_TEMPLATES",
	"NOTION_LIST_USERS",
	"NOTION_QUERY_DATABASE",
	"NOTION_QUERY_DATABASE_WITH_FILTER",
	"NOTION_QUERY_DATA_SOURCE",
	"NOTION_RETRIEVE_COMMENT",
	"NOTION_RETRIEVE_DATABASE_PROPERTY",
	"NOTION_SEARCH_NOTION_PAGE",
	"NOTION_UPDATE_BLOCK",
	"NOTION_UPDATE_PAGE",
	"NOTION_UPDATE_ROW_DATABASE",
	"NOTION_UPDATE_SCHEMA_DATABASE",
];

const MCP_NOTION_TOOLS = [
	"notion-search",
	"notion-fetch",
	"notion-create-pages",
	"notion-update-page",
	"notion-move-pages",
	"notion-duplicate-page",
	"notion-create-database",
	"notion-update-database",
	"notion-query-data-sources",
	"notion-create-comment",
	"notion-get-comments",
	"notion-get-teams",
	"notion-get-users",
	"notion-get-user",
	"notion-get-self",
];

export function HarnessSetup({
	toggle,
	config,
}: {
	toggle: () => void,
	config: null | HarnessConfig,
}) {
	const [provider, setProvider] = useState<{ [provider: string]: boolean }>({
		ActionKit: false,
		Composio: false,
		MCP: false,
	});
	const [tools, setTools] = useState<{ [provider: string]: Set<string> }>({
		ActionKit: new Set(),
		Composio: new Set(),
		MCP: new Set(),
	});
	const [selectedModel, setSelectedModel] = useState<string>("");
	const [systemPrompt, setSystemPrompt] = useState<string>("");
	const setConfig = useTestingStore((state) => state.setConfig);

	useEffect(() => {
		if (config) {
			setSelectedModel(config.model ?? "");
			setSystemPrompt(config.systemPrompt ?? "");

			const newTools = { ...tools };
			const newProvider = { ...provider }
			for (const prov of Object.keys(config.tools ?? {})) {
				newProvider[prov] = config.tools![prov].length > 0 ? true : false;
				for (const toolName of config.tools![prov]) {
					newTools[prov].add(toolName);
				}
			}
			setProvider(newProvider);
			setTools(newTools);
		}
	}, [config]);

	const toggleProvider = (providerType: ProviderType) => {
		setTools((prev) => ({
			...prev,
			[providerType]: new Set(),
		}));

		setProvider((prev) => ({ ...prev, [providerType]: !prev[providerType] }));
	}

	const toggleTool = (provider: string, toolName: string) => {
		const newTools = { ...tools };
		newTools[provider].has(toolName) ? newTools[provider].delete(toolName) : newTools[provider].add(toolName);
		setTools(newTools);
	}

	const finishSetup = async () => {
		const toolList: { [provider: string]: string[] } = {};
		for (const prov of Object.keys(tools)) {
			toolList[prov] = Array.from(tools[prov]);
		}

		const res: Response = await fetch(`${window.document.location.origin}/api/setup`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				tools: toolList,
				model: selectedModel,
				systemPrompt: systemPrompt,
			}),
		});
		if (res.ok) {
			const saved = await res.json();
			if (saved.config) {
				setConfig(saved.config);
				toggle();
			}
		}
	}

	return (
		<div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
			max-h-3/4 h-[600px] w-[700px] max-w-11/12 shadow-2xl rounded-2xl bg-background border
			flex flex-col justify-between p-4 gap-2 overflow-y-auto">
			<div className="flex flex-col gap-2">
				<h1 className="font-bold text-xl">
					Harrness Setup
				</h1>
				<h2 className="font-semibold">
					Model:
				</h2>
				<Select value={selectedModel} onValueChange={setSelectedModel}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select a model" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectLabel>Models</SelectLabel>
							<SelectItem value="google/gemini-2.5-flash">gemini-2.5-flash</SelectItem>
							<SelectItem value="anthropic/claude-haiku-4.5">claude-haiku-4.5</SelectItem>
							<SelectItem value="openai/gpt-5-mini">gpt-5-mini</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<h2 className="font-semibold">
					System Prompt:
				</h2>
				<Textarea
					placeholder="System prompt for your Notion agent"
					value={systemPrompt}
					onChange={(e) => setSystemPrompt(e.target.value)}
				/>
				<h2 className="font-semibold">
					Tool Providers:
				</h2>
				<div className="flex gap-2">
					<Toggle size="sm"
						variant="outline"
						className="data-[state=on]:bg-blue-100 flex gap-1"
						pressed={provider["ActionKit"]}
						onClick={() => toggleProvider(ProviderType.ACTIONKIT)}>
						<CirclePlus />
						<div>ActionKit</div>
					</Toggle>
					<Toggle size="sm"
						variant="outline"
						className="data-[state=on]:bg-blue-100 flex gap-1"
						pressed={provider["Composio"]}
						onClick={() => toggleProvider(ProviderType.COMPOSIO)}>
						<CirclePlus />
						<div>Composio</div>
					</Toggle>
					<Toggle size="sm"
						variant="outline"
						className="data-[state=on]:bg-blue-100 flex gap-1"
						pressed={provider["MCP"]}
						onClick={() => toggleProvider(ProviderType.MCP)}>
						<CirclePlus />
						<div>Notion MCP</div>
					</Toggle>
				</div>
				{Object.keys(provider).filter((prov) => provider[prov]).length > 0 &&
					<>
						<h2 className="font-semibold">
							Tools:
						</h2>
						<Tabs defaultValue={Object.keys(provider).filter((prov) => provider[prov])[0]}>
							<TabsList>
								{Object.keys(provider).filter((prov) => provider[prov]).map((prov) => {
									return (
										<TabsTrigger value={prov} key={prov}>
											{prov}
										</TabsTrigger>
									);
								})}
							</TabsList>
							{Object.keys(provider).filter((prov) => provider[prov]).map((prov) => {
								let toolNames: string[] = [];
								if (prov === ProviderType.ACTIONKIT) toolNames = ACTIONKIT_NOTION_TOOLS;
								if (prov === ProviderType.COMPOSIO) toolNames = COMPOSIO_NOTION_TOOLS;
								if (prov === ProviderType.MCP) toolNames = MCP_NOTION_TOOLS;

								return (
									<TabsContent value={prov} key={prov}>
										<div className="rounded-md bg-muted p-4 grid grid-cols-2 overflow-y-auto
										h-36 gap-2">
											{toolNames.map((tool) => {
												return (
													<Toggle key={tool}
														size="sm"
														variant="outline"
														className="data-[state=on]:bg-green-100 flex gap-1"
														pressed={tools[prov].has(tool)}
														onClick={() => toggleTool(prov, tool)}>
														<Wrench />
														<div className="overflow-x-hidden">
															{tool}
														</div>
													</Toggle>
												);
											})}
										</div>
									</TabsContent>
								);
							})}
						</Tabs>
					</>
				}
			</div>
			<div className="flex gap-2">
				<Button className="w-20"
					onClick={() => finishSetup()}>
					Finished
				</Button>
				<Button className="w-20" variant={"outline"}
					onClick={() => toggle()}>
					Cancel
				</Button>
			</div>
		</div>
	);
}

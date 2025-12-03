import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToolConfig } from "@/src/types/types";
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { CirclePlus, CirclePower, Squircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

enum ProviderType {
	ACTIONKIT = "ActionKit",
	COMPOSIO = "Composio",
	MCP = "MCP",
}

export function HarnessSetup({
	toggle,
}: {
	toggle: () => void,
}) {
	const [provider, setProvider] = useState<{ [provider: string]: boolean }>({
		ActionKit: false,
		Composio: false,
		MCP: false,
	});

	const toggleProvider = (providerType: ProviderType) => {
		setProvider((prev) => ({ ...prev, [providerType]: !prev[providerType] }));
	}

	return (
		<div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
			max-h-3/4 h-[600px] w-[700px] max-w-11/12 shadow-2xl rounded-2xl bg-background border
			flex flex-col p-4 gap-2">
			<h1 className="font-bold text-xl">
				Harrness Setup
			</h1>
			<h2 className="font-semibold">
				System Prompt:
			</h2>
			<Textarea placeholder="System prompt for your Notion agent" />
			<h2 className="font-semibold">
				Tool Providers:
			</h2>
			<div className="flex gap-2">
				<Toggle size="sm"
					variant="outline"
					className="data-[state=on]:bg-blue-100 flex gap-1"
					onClick={() => toggleProvider(ProviderType.ACTIONKIT)}>
					<CirclePlus />
					<div>ActionKit</div>
				</Toggle>
				<Toggle size="sm"
					variant="outline"
					className="data-[state=on]:bg-blue-100 flex gap-1"
					onClick={() => toggleProvider(ProviderType.COMPOSIO)}>
					<CirclePlus />
					<div>Composio</div>
				</Toggle>
				<Toggle size="sm"
					variant="outline"
					className="data-[state=on]:bg-blue-100 flex gap-1"
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
							return (
								<TabsContent value={prov} key={prov}>
									<div className="rounded-md bg-muted p-4">
									</div>
								</TabsContent>
							);
						})}
					</Tabs>
				</>
			}
			<Button className="absolute bottom-4"
				onClick={() => toggle()}>
				Finished
			</Button>
		</div>
	);
}

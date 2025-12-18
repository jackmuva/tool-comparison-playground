"use client";

import { HarnessConfig } from "@/src/db/schema";
import { useTestingStore } from "@/src/store/testing-store";
import { useEffect, useState } from "react";
import { HarnessSetup } from "./harness-setup";
import { Button } from "@/components/ui/button";
import { UserInfo } from "@workos-inc/authkit-nextjs";
import { ActionKitChat } from "./actionkit-chat";

export function Chat({
	harnessConfig,
	user,
}: {
	harnessConfig: HarnessConfig | null,
	user: { userInfo: UserInfo, paragonUserToken: string }
}) {
	const { setupModal, setSetupModal, setConfig, config, } = useTestingStore((state) => state);
	const [chatTypes, setChatTypes] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (harnessConfig) {
			setConfig(harnessConfig);
			setSetupModal(false);
		}
		else {
			setSetupModal(true);
		}
	}, [harnessConfig])

	useEffect(() => {
		if (!config) return;
		const newChatTypes: Set<string> = new Set();
		for (const prov of Object.keys(config.tools!)) {
			if (config.tools![prov].length > 0) newChatTypes.add(prov);
		}
		setChatTypes(newChatTypes);
	}, [config])
	console.log(chatTypes.size);

	return (
		<div className="pt-20 flex flex-col gap-4 justify-start items-center ">
			{setupModal && <HarnessSetup toggle={() => setSetupModal(false)}
				config={config} />}
			<div className="w-[1100px] max-w-11/12">
				<div className="w-full">
					<Button onClick={() => setSetupModal(true)}
						variant={"outline"}>
						Configure Harness
					</Button>
				</div>
				<div className="flex flex-col sm:flex-row gap-4 w-full py-4">
					{chatTypes.has("ActionKit") &&
						<div className="flex-1">
							<ActionKitChat user={user} />
						</div>}
					{chatTypes.has("Composio") &&
						<div className="flex-1">
							<div className="w-full flex flex-col gap-4 p-4 rounded-sm border ">
								placeholder
							</div>
						</div>}
				</div>
			</div>
		</div >
	);
}

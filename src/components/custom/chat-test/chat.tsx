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
	const { setupModal, setSetupModal, setConfig, config, chatReady } = useTestingStore((state) => state);
	const [chatTypes, setChatTypes] = useState<Set<string>>(new Set());
	const [input, setInput] = useState('');
	const [allReady, setAllReady] = useState<boolean>(false);
	const [submittingMessage, setSubmittingMessage] = useState<boolean>(false);

	useEffect(() => {
		if (harnessConfig) {
			setConfig(harnessConfig);
			setSetupModal(false);
		}
		else {
			setSetupModal(true);
		}
	}, [harnessConfig]);

	useEffect(() => {
		if (!config) return;
		const newChatTypes: Set<string> = new Set();
		for (const prov of Object.keys(config.tools!)) {
			if (config.tools![prov].length > 0) newChatTypes.add(prov);
		}
		setChatTypes(newChatTypes);
	}, [config]);

	useEffect(() => {
		let newAllReady = true;
		for (const prov of Object.keys(chatReady)) {
			if (!chatReady[prov]) {
				newAllReady = false;
				break;
			}
		}
		if (newAllReady = true) {
			setSubmittingMessage(false);
		}
		setAllReady(newAllReady);
	}, [chatReady])

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
							<ActionKitChat user={user} chatInput={input} submittingMessage={submittingMessage} />
						</div>}
					{chatTypes.has("Composio") &&
						<div className="flex-1">
							<div className="w-full flex flex-col gap-4 p-4 rounded-sm border ">
								placeholder
							</div>
						</div>}
				</div>
				<form onSubmit={e => {
					e.preventDefault();
					if (input.trim()) {
						setInput('');
					}
					setSubmittingMessage(true);
				}} className="flex gap-1 w-full justify-between" >
					<input value={input}
						onChange={e => setInput(e.target.value)}
						disabled={!allReady}
						className="outline p-1 rounded-sm grow"
						placeholder="Say something..."
					/>
					<Button type="submit" disabled={!allReady}>
						Submit
					</Button>
				</form>
			</div>
		</div >
	);
}

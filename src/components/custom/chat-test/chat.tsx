"use client";

import { HarnessConfig } from "@/src/db/schema";
import { useTestingStore } from "@/src/store/testing-store";
import { useEffect } from "react";
import { HarnessSetup } from "./harness-setup";
import { Button } from "@/components/ui/button";

export function Chat({
	harnessConfig,
}: {
	harnessConfig: HarnessConfig | null,
}) {
	const { setupModal, setSetupModal, setConfig, config, } = useTestingStore((state) => state);
	useEffect(() => {
		if (harnessConfig) {
			setConfig(harnessConfig);
			setSetupModal(false);
		}
		else {
			setSetupModal(true);
		}
	}, [harnessConfig])

	return (
		<div className="pt-20 flex flex-col gap-4 justify-start items-center ">
			{setupModal && <HarnessSetup toggle={() => setSetupModal(false)}
				config={harnessConfig} />}
			<div className="w-[1100px] max-w-11/12">
				<div className="w-full">
					<Button onClick={() => setSetupModal(true)}
						variant={"outline"}>
						Configure Harness
					</Button>
				</div>
			</div>
		</div >
	);
}

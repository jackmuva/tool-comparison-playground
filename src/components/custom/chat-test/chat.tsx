"use client";

import { HarnessConfig } from "@/src/db/schema";
import { useTestingStore } from "@/src/store/testing-store";
import { useEffect } from "react";
import { HarnessSetup } from "./harness-setup";

export function Chat({
	harnessConfig,
}: {
	harnessConfig: HarnessConfig | null,
}) {
	const { setupModal, setSetupModal } = useTestingStore((state) => state);
	useEffect(() => {
		setSetupModal(harnessConfig ? false : true);
	}, [harnessConfig])

	return (
		<div className="pt-16">
			{setupModal && <HarnessSetup />}
		</div>
	);
}

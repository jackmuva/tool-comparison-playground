"use server";

import { UserInfo } from "@workos-inc/authkit-nextjs";
import Navbar from "../navbar";
import { HarnessConfig } from "@/src/db/schema";
import { getHarnessConfig } from "@/src/db/query";
import { Chat } from "./chat";

export default async function ChatTestPage({
	user
}: {
	user: UserInfo
}) {
	const harnessConfig: HarnessConfig | null = await getHarnessConfig(user.user.email);
	return (
		<div className="w-dvw h-dvh bg-background">
			<Navbar user={user} />
			<Chat harnessConfig={harnessConfig} />
		</div>
	);
}

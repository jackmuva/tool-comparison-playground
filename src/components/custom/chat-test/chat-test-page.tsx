"use server";

import { UserInfo } from "@workos-inc/authkit-nextjs";
import Navbar from "../navbar";
import { HarnessConfig } from "@/src/db/schema";
import { getHarnessConfig } from "@/src/db/query";
import { Chat } from "./chat";

export default async function ChatTestPage({
	user
}: {
	user: { userInfo: UserInfo, paragonUserToken: string }
}) {
	const harnessConfig: HarnessConfig | null = await getHarnessConfig(user.userInfo.user.email);
	return (
		<div className="w-dvw h-dvh bg-background">
			<Navbar userInfo={user.userInfo} />
			<Chat harnessConfig={harnessConfig} user={user} />
		</div>
	);
}

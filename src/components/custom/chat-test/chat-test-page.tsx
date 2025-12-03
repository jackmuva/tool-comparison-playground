import { UserInfo } from "@workos-inc/authkit-nextjs";
import Navbar from "../navbar";

export default async function ChatTestPage({
	user
}: {
	user: UserInfo
}) {
	return (
		<div className="w-dvw h-dvh bg-background">
			<Navbar user={user} />
		</div>
	);
}

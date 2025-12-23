import { Button } from "@/components/ui/button";
import { UserInfo, signOut } from "@workos-inc/authkit-nextjs";
import { Hammer } from "lucide-react";

export default async function Navbar({
	userInfo
}: {
	userInfo: UserInfo
}) {
	return (
		<div className="sticky bg-background left-0 top-0 border-b h-16 flex w-full items-center px-4 justify-between">
			<h1 className="text-xl font-bold flex gap-1">
				<Hammer size={25} />
				<div>Tool Evaluation Playground</div>
			</h1>
			<form
				action={async () => {
					'use server';
					await signOut();
				}}
			>
				<Button variant={"link"}>Sign out</Button>
			</form>
		</div>
	);
}

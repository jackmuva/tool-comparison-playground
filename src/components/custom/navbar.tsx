import { Button } from "@/components/ui/button";
import { UserInfo, signOut } from "@workos-inc/authkit-nextjs";

export default async function Navbar({
	user
}: {
	user: UserInfo
}) {
	return (
		<div className="absolute left-0 top-0 border-b h-16 flex w-full items-center px-4 justify-between">
			<h1 className="text-xl font-bold">
				ActionKit Eval
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

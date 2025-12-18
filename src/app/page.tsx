import Link from 'next/link';
import {
	getSignUpUrl,
	withAuth,
} from '@workos-inc/authkit-nextjs';
import ChatTestPage from '../components/custom/chat-test/chat-test-page';
import { userWithToken } from '../lib/auth';

export default async function HomePage() {
	const user = await userWithToken();
	const signUpUrl = await getSignUpUrl();

	if (!user.userInfo) {
		return (
			<div>
				<a href="/login">Sign in</a>
				<Link href={signUpUrl}>Sign up</Link>
			</div>
		);
	}

	return (
		<ChatTestPage user={user} />
	);
}


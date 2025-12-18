import Link from 'next/link';
import {
	getSignUpUrl,
	withAuth,
} from '@workos-inc/authkit-nextjs';
import ChatTestPage from '../components/custom/chat-test/chat-test-page';

export default async function HomePage() {
	const user = await withAuth();
	const signUpUrl = await getSignUpUrl();

	if (!user.user) {
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


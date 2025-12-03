import Link from 'next/link';
import {
	getSignUpUrl,
	withAuth,
} from '@workos-inc/authkit-nextjs';
import ChatTestPage from '../components/custom/chat-test/chat-test-page';

export default async function HomePage() {
	// Retrieves the user from the session or returns `null` if no user is signed in
	const user = await withAuth();

	// Get the URL to redirect the user to AuthKit to sign up
	const signUpUrl = await getSignUpUrl();

	if (!user.user) {
		return (
			<>
				<a href="/login">Sign in</a>
				<Link href={signUpUrl}>Sign up</Link>
			</>
		);
	}

	return (
		<ChatTestPage user={user} />
	);
}


import Link from 'next/link';
import { getSignUpUrl, withAuth } from '@workos-inc/authkit-nextjs';

export default async function HomePage() {
	const { user } = await withAuth();
	const signUpUrl = await getSignUpUrl();

	if (!user) {
		return (
			<>
				<a href="/login">Sign in</a>
				<Link href={signUpUrl}>Sign up</Link>
			</>
		);
	}

	return (
		<>
			<p>Welcome back{user.firstName && `, ${user.firstName}`}</p>
		</>
	);
}


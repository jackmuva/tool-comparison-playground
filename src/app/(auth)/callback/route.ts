import { insertUser } from '@/src/db/query';
import { handleAuth, HandleAuthSuccessData } from '@workos-inc/authkit-nextjs';

// Redirect the user to `/` after successful sign in
// The redirect can be customized: `handleAuth({ returnPathname: '/foo' })`
export const GET = handleAuth({
	onSuccess: async (data: HandleAuthSuccessData) => {
		await insertUser(data.user.firstName + " " + data.user.lastName, data.user.email);
	}
});

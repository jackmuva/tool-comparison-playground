import { paragon } from '@useparagon/connect';
import ConnectSDK from "@useparagon/connect/ConnectSDK";
import { useCallback, useEffect, useState } from "react";

declare global {
	interface Window {
		paragon: typeof paragon;
	}
}

let paragonConnect: ConnectSDK | undefined;
export default function useParagon(paragonUserToken: string) {
	useEffect(() => {
		if (typeof window !== "undefined" && typeof paragonConnect === "undefined") {
			paragonConnect = new ConnectSDK();
		}

		if (!window.paragon) {
			window.paragon = paragon;
		}
	}, []);

	const [user, setUser] = useState(paragonConnect ? paragonConnect.getUser() : null);
	const [error, setError] = useState();

	const updateUser = useCallback(async () => {
		if (!paragonConnect) {
			return;
		}

		const authedUser = paragonConnect.getUser();
		if (authedUser.authenticated) {
			setUser({ ...authedUser });
		}
	}, []);

	// Listen for account state changes
	useEffect(() => {
		// @ts-expect-error event type
		paragonConnect.subscribe("onIntegrationInstall", updateUser);
		// @ts-expect-error event type
		paragonConnect.subscribe("onIntegrationUninstall", updateUser);
		return () => {
			// @ts-expect-error event type
			paragonConnect.unsubscribe("onIntegrationInstall", updateUser);
			// @ts-expect-error event type
			paragonConnect.unsubscribe("onIntegrationUninstall", updateUser);
		};
	}, []);

	useEffect(() => {
		if (!error) {
			paragon.authenticate(
				process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID!,
				paragonUserToken
			).then(() => {
				if (paragonConnect) {
					paragonConnect.authenticate(
						process.env.NEXT_PUBLIC_PARAGON_PROJECT_ID!,
						paragonUserToken
					)
						.then(updateUser)
						.catch(setError);
				}
			}).catch(setError);
		}
	}, [error, paragonUserToken]);

	return {
		paragonConnect,
		user,
		error,
		updateUser,
	};
}

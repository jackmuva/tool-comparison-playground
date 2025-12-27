"use client";
import { connectMcpServer } from "@/src/components/custom/chat-test/mcp-chat";
import OAuthCallback from "@/src/components/custom/chat-test/OAuthCallback";
import { useCallback } from "react";

export default async function OAuthPage() {
	const onOAuthConnect = useCallback(
		(serverUrl: string) => {
			void connectMcpServer();
		}, [connectMcpServer]);
	return (
		<OAuthCallback onConnect={onOAuthConnect} />
	);
}


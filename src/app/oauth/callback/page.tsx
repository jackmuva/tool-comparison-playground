"use client";

import { NOTION_MCP_URL } from "@/src/components/custom/chat-test/mcp-chat";
import OAuthCallback from "@/src/components/custom/chat-test/OAuthCallback";
import { useMcpConnection } from "@/src/hooks/useMcpConnection";
import { useCallback } from "react";

export default function OAuthPage() {
	const { connectMcpServer } = useMcpConnection({ sseUrl: NOTION_MCP_URL });
	const onOAuthConnect = useCallback(
		() => {
			void connectMcpServer();
		}, [connectMcpServer]);
	return (
		<OAuthCallback onConnect={onOAuthConnect} />
	);
}


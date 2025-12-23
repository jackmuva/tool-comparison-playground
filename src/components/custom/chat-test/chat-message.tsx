import { UIMessage } from "ai";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { ChevronDownIcon } from "lucide-react";

export const ChatMessage = ({ message, part }:
	{ message: UIMessage, part: any }) => {
	const [expand, setExpand] = useState(false);
	const toggleExpand = () => {
		setExpand((prev) => !prev);
	}
	useEffect(() => {
		const links = document.getElementsByTagName("a");
		for (const link of links) {
			link.target = "_blank";
		}
	}, [message, part]);

	if (part.type === "text") {
		return (
			<div className={`w-fit p-2 m-1 rounded-md min-w-16 
					max-w-3/4 text-left
					${message.role === 'user' ?
					"place-self-end bg-foreground-muted/20" :
					""}`}>
				<div className="markdown flex flex-col space-y-2">
					<ReactMarkdown>
						{part.text}
					</ReactMarkdown>
				</div>
			</div>
		);
	} else if (part.type.substring(0, 4) === 'tool' || part.type === 'dynamic-tool') {
		return (
			<div className={`p-2 m-1 rounded-md min-w-16 max-w-3/4 
				flex flex-col ${expand ? "max-h-96" : "max-h-28"}`}>
				<div className={`flex items-center rounded-t-sm w-fit p-1 
						cursor-pointer underline text-indigo-700 hover:text-indigo-600`}
					onClick={toggleExpand}>
					<div className={expand ? "text-muted-foreground rotate-180" :
						"text-muted-foreground"} >
						<ChevronDownIcon className={``} size={20} />
					</div>
					<div className="font-semibold">
						See tool
					</div>
				</div>
				<pre className={`p-2 text-sm bg-background-muted/20 cursor-pointer rounded-sm 
						font-mono ${expand ? "overflow-auto" :
						"overflow-hidden"}`} onClick={toggleExpand}>
					{JSON.stringify(part, null, 2)}
				</pre>
			</div>
		);
	}
}

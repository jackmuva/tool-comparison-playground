interface UsageMetrics {
	runningTotal: number;
	runningInput: number;
	runningOutput: number;
	lastInput: number;
	lastOutput: number;
}

export const MetricsPanel = ({ usage }: { usage: UsageMetrics }) => {
	const formatNumber = (num: number): string => {
		return num.toLocaleString();
	};

	return (
		<div className="w-full rounded-sm border p-4 bg-muted-foreground/5">
			<h3 className="text-sm font-semibold mb-3 text-foreground">Usage Metrics</h3>
			<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
				<div className="col-span-2 flex flex-col gap-0 p-2 rounded bg-red-500/10 border border-red-500/20">
					<span className="text-xs font-medium text-red-700 dark:text-red-400">Total Tokens Used</span>
					<span className="text-lg font-bold text-red-900 dark:text-red-200">
						{formatNumber(usage.runningTotal)}
					</span>
				</div>
				{/* <div className="flex flex-col gap-0 p-2 rounded bg-purple-500/10 border border-purple-500/20"> */}
				{/* 	<span className="text-xs font-medium text-purple-700 dark:text-purple-400">Total Input Tokens</span> */}
				{/* 	<span className="text-lg font-bold text-purple-900 dark:text-purple-200"> */}
				{/* 		{formatNumber(usage.runningInput)} */}
				{/* 	</span> */}
				{/* </div> */}
				{/* <div className="flex flex-col gap-0 p-2 rounded bg-orange-500/10 border border-orange-500/20"> */}
				{/* 	<span className="text-xs font-medium text-orange-700 dark:text-orange-400">Total Output Tokens</span> */}
				{/* 	<span className="text-lg font-bold text-orange-900 dark:text-orange-200"> */}
				{/* 		{formatNumber(usage.runningOutput)} */}
				{/* 	</span> */}
				{/* </div> */}
				<div className="flex flex-col gap-0 p-2 rounded bg-blue-500/10 border border-blue-500/20">
					<span className="text-xs font-medium text-blue-700 dark:text-blue-400">Input Tokens</span>
					<span className="text-lg font-bold text-blue-900 dark:text-blue-200">
						{formatNumber(usage.lastInput)}
					</span>
				</div>
				<div className="flex flex-col gap-0 p-2 rounded bg-green-500/10 border border-green-500/20">
					<span className="text-xs font-medium text-green-700 dark:text-green-400">Output Tokens</span>
					<span className="text-lg font-bold text-green-900 dark:text-green-200">
						{formatNumber(usage.lastOutput)}
					</span>
				</div>

			</div>
		</div>
	);
};

"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
	message: string;
	onRetry?: () => void;
	title?: string;
}

export function ErrorState({
	message,
	onRetry,
	title = "Unable to load this section",
}: ErrorStateProps) {
	return (
		<div
			role="alert"
			className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20"
		>
			<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
			<div className="space-y-1">
				<h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
					{title}
				</h2>
				<p className="max-w-lg text-xs text-zinc-600 dark:text-zinc-300">
					{message}
				</p>
			</div>
			{onRetry && (
				<button onClick={onRetry} className="btn-secondary">
					<RefreshCw className="h-3.5 w-3.5" />
					<span>Try again</span>
				</button>
			)}
		</div>
	);
}

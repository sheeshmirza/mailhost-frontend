"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function RouteError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Route rendering failed", error);
	}, [error]);

	return (
		<main className="page-container flex min-h-[60vh] items-center justify-center">
			<ErrorState
				title="Something went wrong loading this page"
				message="We had trouble displaying this page. Your data is completely safe. Please try loading it again."
				onRetry={reset}
			/>
		</main>
	);
}

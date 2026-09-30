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
				title="This page encountered an error"
				message="The page could not be displayed. Your data is unchanged; try loading it again."
				onRetry={reset}
			/>
		</main>
	);
}

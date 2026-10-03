"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error("Application rendering failed", error);
	}, [error]);

	return (
		<html lang="en">
			<body className="min-h-screen bg-background text-foreground font-sans antialiased">
				<main className="page-container flex min-h-screen items-center justify-center">
					<ErrorState
						title="Something went wrong"
						message="We could not display the page right now. Please refresh or try again in a moment."
						onRetry={reset}
					/>
				</main>
			</body>
		</html>
	);
}

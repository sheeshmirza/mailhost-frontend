"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary triggered:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 mb-5 shadow-sm">
        <AlertCircle className="h-7 w-7" />
      </div>

      <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
        Something went wrong
      </h1>

      <p className="mt-2 max-w-md text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
        An error occurred while loading this page. Our platform error handler has recorded this state.
      </p>

      {error?.message && (
        <div className="mt-4 max-w-lg rounded-lg border border-surface-border bg-surface-raised p-3 text-left font-mono text-[11px] text-zinc-600 dark:text-zinc-400 overflow-x-auto">
          <code>{error.message}</code>
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="btn-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>

        <Link
          href="/overview"
          className="btn-secondary"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

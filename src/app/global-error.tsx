"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-zinc-900 font-sans antialiased flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4 shadow-sm">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Application Error</h1>
          <p className="text-xs text-zinc-600 leading-relaxed">
            A critical error occurred while initializing the application. You can reload the application to restore state.
          </p>
          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

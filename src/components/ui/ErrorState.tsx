"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, ArrowLeft, ExternalLink } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: string | Error | null;
  onRetry?: () => Promise<void> | void;
  retryLabel?: string;
  actionHref?: string;
  actionLabel?: string;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message = "An unexpected error occurred while communicating with the service.",
  error,
  onRetry,
  retryLabel = "Try Again",
  actionHref,
  actionLabel,
  compact = false,
  className = "",
}: ErrorStateProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const rawErrorMessage = error
    ? typeof error === "string"
      ? error
      : error.message
    : null;

  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-3 rounded-lg border border-red-200/60 bg-red-50/50 p-3 text-xs text-red-900 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200 ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span className="truncate font-medium">{rawErrorMessage || message}</span>
        </div>
        {onRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex shrink-0 items-center gap-1 rounded bg-red-100 dark:bg-red-900/40 px-2 py-1 text-[11px] font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/60 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Retrying..." : retryLabel}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-surface-border bg-surface p-8 text-center shadow-sm animate-fade-in ${className}`}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 mb-4">
        <AlertCircle className="h-6 w-6" />
      </div>

      <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
        {title}
      </h3>

      <p className="mx-auto mt-1.5 max-w-md text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
        {message}
      </p>

      {rawErrorMessage && rawErrorMessage !== message && (
        <div className="mx-auto mt-3 max-w-md rounded-lg border border-surface-border bg-surface-raised p-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 text-left overflow-x-auto">
          <code>{rawErrorMessage}</code>
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-3">
        {onRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="btn-primary"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Retrying..." : retryLabel}</span>
          </button>
        )}

        {actionHref && actionLabel && (
          <Link href={actionHref} className="btn-secondary">
            <span>{actionLabel}</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

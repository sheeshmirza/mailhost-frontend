"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ShieldAlert,
  FileQuestion,
  ServerCrash,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

interface HttpErrorFallbackProps {
  status: 400 | 401 | 403 | 404 | 429 | 500 | 504 | number;
  message?: string;
  onRetry?: () => void;
  showHomeLink?: boolean;
}

export function HttpErrorFallback({
  status,
  message,
  onRetry,
  showHomeLink = true,
}: HttpErrorFallbackProps) {
  const getErrorConfig = () => {
    switch (status) {
      case 400:
        return {
          title: "Invalid Request",
          defaultMsg: "Something in this request was incomplete or incorrectly formatted. Please check your inputs and try again.",
          icon: <AlertTriangle className="h-8 w-8 text-amber-500" />,
        };
      case 401:
        return {
          title: "Please Sign In",
          defaultMsg: "Your session has expired. Please sign in again to continue.",
          icon: <ShieldAlert className="h-8 w-8 text-amber-600" />,
        };
      case 403:
        return {
          title: "Access Denied",
          defaultMsg: "You do not have permission to view or edit this section.",
          icon: <ShieldAlert className="h-8 w-8 text-red-500" />,
        };
      case 404:
        return {
          title: "Page or Item Not Found",
          defaultMsg: "The item or page you are looking for does not exist or has been moved.",
          icon: <FileQuestion className="h-8 w-8 text-zinc-400" />,
        };
      case 429:
        return {
          title: "Too Many Requests",
          defaultMsg: "You have made too many requests in a short time. Please wait a moment and try again.",
          icon: <Clock className="h-8 w-8 text-amber-500" />,
        };
      case 504:
        return {
          title: "Connection Timed Out",
          defaultMsg: "The server took too long to respond. Please check your internet connection or try again shortly.",
          icon: <Clock className="h-8 w-8 text-red-500" />,
        };
      case 500:
      default:
        return {
          title: "Something Went Wrong",
          defaultMsg: "Our servers ran into an unexpected problem. Please try again in a few moments.",
          icon: <ServerCrash className="h-8 w-8 text-red-500" />,
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className="flex min-h-[340px] w-full flex-col items-center justify-center rounded-2xl border border-surface-border bg-surface p-8 text-center space-y-4 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-raised border border-surface-border">
        {config.icon}
      </div>

      <div className="space-y-1.5 max-w-md">
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-raised text-zinc-600 dark:text-zinc-400 border border-surface-border">
            HTTP {status}
          </span>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            {config.title}
          </h2>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {message || config.defaultMsg}
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-xs font-medium text-zinc-800 hover:bg-surface dark:text-zinc-200 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        )}
        {showHomeLink && (
          <Link
            href="/overview"
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Overview</span>
          </Link>
        )}
      </div>
    </div>
  );
}

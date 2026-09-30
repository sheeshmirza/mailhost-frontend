import Link from "next/link";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-raised text-zinc-400 border border-surface-border mb-5 shadow-sm">
        <FileQuestion className="h-7 w-7" />
      </div>

      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
        404 Not Found
      </span>

      <h1 className="mt-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Page does not exist
      </h1>

      <p className="mt-2 max-w-sm text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
        The page you are looking for has been moved, removed, or never existed in the platform.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href="/overview"
          className="btn-primary"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Go to Overview</span>
        </Link>
        <Link
          href="/"
          className="btn-secondary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
      </div>
    </div>
  );
}

import { ChevronLeft, ChevronRight } from "lucide-react";

interface CursorPaginationProps {
  page: number;
  canGoNewer: boolean;
  canGoOlder: boolean;
  isLoading: boolean;
  onNewer: () => void;
  onOlder: () => void;
}

export function CursorPagination({
  page,
  canGoNewer,
  canGoOlder,
  isLoading,
  onNewer,
  onOlder,
}: CursorPaginationProps) {
  return (
    <nav aria-label="Result pages" className="flex flex-wrap items-center justify-between gap-3 text-xs">
      <span className="text-zinc-500 dark:text-zinc-400">Page {page}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onNewer}
          disabled={!canGoNewer || isLoading}
          aria-label="Show newer results"
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Newer</span>
        </button>
        <button
          type="button"
          onClick={onOlder}
          disabled={!canGoOlder || isLoading}
          aria-label="Show older results"
          className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{isLoading ? "Loading..." : "Older"}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </nav>
  );
}
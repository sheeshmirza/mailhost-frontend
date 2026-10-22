"use client";

import { useState, useCallback } from "react";

export interface UseCursorPaginationResult {
  cursor: string | undefined;
  nextCursor: string | undefined;
  history: (string | undefined)[];
  page: number;
  canGoNewer: boolean;
  canGoOlder: boolean;
  hasPagination: boolean;
  isLoading: boolean;
  setNextCursor: React.Dispatch<React.SetStateAction<string | undefined>>;
  loadOlder: () => Promise<void>;
  loadNewer: () => Promise<void>;
  onFetchSuccess: (currentBefore?: string, nextBefore?: string, reset?: boolean) => void;
  reset: () => void;
}

/**
 * Reusable cursor-based pagination hook for API collections.
 * Handles page stack history, boundary validation, and next_before pointer tracking.
 */
export function useCursorPagination(
  fetchPage: (before?: string, resetPage?: boolean) => Promise<boolean>,
  isLoading: boolean
): UseCursorPaginationResult {
  const [cursor, setCursor] = useState<string | undefined>();
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [history, setHistory] = useState<(string | undefined)[]>([]);

  const onFetchSuccess = useCallback(
    (currentBefore?: string, nextBefore?: string, reset = false) => {
      setCursor(currentBefore);
      setNextCursor(nextBefore);
      if (reset) {
        setHistory([]);
      }
    },
    []
  );

  const loadOlder = useCallback(async () => {
    if (!nextCursor || isLoading) return;
    const currentBefore = cursor;
    const success = await fetchPage(nextCursor, false);
    if (success) {
      setHistory((prev) => [...prev, currentBefore]);
    }
  }, [cursor, nextCursor, isLoading, fetchPage]);

  const loadNewer = useCallback(async () => {
    if (history.length === 0 || isLoading) return;
    const previousBefore = history[history.length - 1];
    const success = await fetchPage(previousBefore, false);
    if (success) {
      setHistory((prev) => prev.slice(0, -1));
    }
  }, [history, isLoading, fetchPage]);

  const reset = useCallback(() => {
    setCursor(undefined);
    setNextCursor(undefined);
    setHistory([]);
  }, []);

  return {
    cursor,
    nextCursor,
    history,
    page: history.length + 1,
    canGoNewer: history.length > 0,
    canGoOlder: Boolean(nextCursor),
    hasPagination: history.length > 0 || Boolean(nextCursor),
    isLoading,
    setNextCursor,
    loadOlder,
    loadNewer,
    onFetchSuccess,
    reset,
  };
}


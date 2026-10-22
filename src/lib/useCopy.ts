"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "./toast-context";

export interface UseCopyOptions {
  timeoutMs?: number;
  successMessage?: string;
}

/**
 * Reusable hook for clipboard copy management with timeout reset and toast feedback.
 */
export function useCopy(options: UseCopyOptions = {}) {
  const { timeoutMs = 2000, successMessage } = options;
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const toast = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copy = useCallback(
    async (text: string, key = "default", customMessage?: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key);

        const msg = customMessage !== undefined ? customMessage : successMessage;
        if (msg) {
          toast.success(msg);
        }

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setCopiedKey((curr) => (curr === key ? null : curr));
        }, timeoutMs);
        return true;
      } catch (err) {
        console.error("Failed to copy to clipboard", err);
        toast.error("Failed to copy to clipboard");
        return false;
      }
    },
    [timeoutMs, successMessage, toast]
  );

  const isCopied = useCallback((key = "default") => copiedKey === key, [copiedKey]);

  return { copy, copiedKey, isCopied };
}

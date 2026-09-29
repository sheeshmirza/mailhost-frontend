"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  description?: string;
}

export interface ToastMethods {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

interface ToastContextType {
  toast: ToastMethods;
}

export type ToastHookReturn = ToastMethods & {
  toast: ToastMethods;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (type: "success" | "error" | "info", title: string, description?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type, title, description };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast: ToastMethods = {
    success: (title: string, description?: string) =>
      addToast("success", title, description),
    error: (title: string, description?: string) =>
      addToast("error", title, description),
    info: (title: string, description?: string) =>
      addToast("info", title, description),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container floating in bottom-right corner */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-surface-border bg-surface p-4 shadow-2xl backdrop-blur-md animate-fade-in transition-all"
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === "success" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              {t.type === "error" && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              {t.type === "info" && (
                <Info className="h-4 w-4 text-sky-500" />
              )}
            </div>
            <div className="flex-1 space-y-0.5">
              <p className="text-xs font-semibold text-zinc-900 dark:text-white">
                {t.title}
              </p>
              {t.description && (
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastHookReturn {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return {
    ...context.toast,
    toast: context.toast,
  };
}

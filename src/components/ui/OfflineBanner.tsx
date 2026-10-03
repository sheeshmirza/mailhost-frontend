"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";
import { telemetry } from "@/lib/telemetry";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      telemetry.log("offline_event", "Network connection re-established");
      const timer = window.setTimeout(() => setJustReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
      telemetry.log("offline_event", "Network connection lost");
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (justReconnected) {
    return (
      <div className="bg-emerald-600 px-4 py-2 text-white text-xs font-medium flex items-center justify-center gap-2 animate-fade-in shadow-sm z-50">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Connection restored. Synchronizing live telemetry...</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className="bg-amber-600 dark:bg-amber-700 px-4 py-2 text-white text-xs font-medium flex items-center justify-between gap-2 animate-fade-in shadow-md z-50 sticky top-0"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>You are currently offline. Mailhost is operating in cached mode. Actions will retry upon reconnection.</span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex items-center gap-1 rounded bg-amber-700 dark:bg-amber-800 px-2.5 py-1 text-[11px] font-semibold hover:bg-amber-800 transition-colors shrink-0"
      >
        <RefreshCw className="h-3 w-3" />
        <span>Retry</span>
      </button>
    </div>
  );
}

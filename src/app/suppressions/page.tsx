"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import {
  ShieldAlert,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function SuppressionsPage() {
  const { toast } = useToast();
  const [suppressions, setSuppressions] = useState<
    { address: string; reason?: string; created_at: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchSuppressions = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.listSuppressions();
      setSuppressions(res.data || []);
    } catch (err) {
      console.error("Failed to load suppressions", err);
      setLoadError(err instanceof Error ? err.message : "Could not load suppressions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppressions();
  }, []);

  const handleRemove = async (address: string) => {
    try {
      await api.deleteSuppression(address);
      toast.success(`Removed ${address} from suppression list`);
      fetchSuppressions();
    } catch (err: any) {
      toast.error("Failed to delete suppression: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Suppressions
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Recipients automatically blocked from receiving further mail due to hard bounces or spam complaints.
          </p>
        </div>

        <button
          onClick={fetchSuppressions}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          title="Refresh suppressions"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <span>Automatic Deliverability Protection</span>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Sending to known invalid or complaining addresses impairs your domain&apos;s reputation with major mailbox providers. The system automatically intercepts deliveries to suppressed addresses.
        </p>
      </div>

      {/* Suppressions Table */}
      {isLoading && suppressions.length === 0 ? (
        <TableSkeleton rows={5} cols={4} />
      ) : loadError && suppressions.length === 0 ? (
        <ErrorState message={loadError} onRetry={fetchSuppressions} />
      ) : (
      <div className="rounded-xl border border-surface-border overflow-hidden bg-surface">
        <table className="w-full text-left">
          <thead className="bg-surface-raised border-b border-surface-border text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Suppressed Email Address</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Suppressed Since</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {suppressions.length > 0 ? (
              suppressions.map((s) => (
                <tr key={s.address} className="hover:bg-surface-raised/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white font-medium">{s.address}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-2 py-0.5 text-[11px] font-medium">
                      {s.reason || "Hard Bounce"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-zinc-500 dark:text-zinc-400">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(s.address)}
                      title="Remove suppression"
                      className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-16 text-center text-sm text-zinc-500">
                  No addresses currently suppressed. Your sender reputation is clean!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
      {loadError && suppressions.length > 0 && (
        <ErrorState message={loadError} onRetry={fetchSuppressions} />
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
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

  const fetchSuppressions = async () => {
    setIsLoading(true);
    try {
      const res = await api.listSuppressions();
      setSuppressions(res.data || []);
    } catch (err: any) {
      console.error("Failed to load suppressions", err);
      toast.error("Failed to load suppressions: " + (err.response?.data?.message || err.message));
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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 animate-fade-in">
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
          className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          title="Refresh suppressions"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-surface-border bg-surface-raised/60 p-4 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
        <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <span>Automatic Deliverability Protection</span>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400">
          Sending to known invalid or complaining addresses destroys your domain&apos;s reputation with Google and Microsoft. Mailhost automatically intercepts deliveries to suppressed addresses.
        </p>
      </div>

      {/* Suppressions Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs min-w-[650px]">
          <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3">Suppressed Email Address</th>
              <th className="px-5 py-3">Reason</th>
              <th className="px-5 py-3">Suppressed Since</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border font-mono">
            {suppressions.length > 0 ? (
              suppressions.map((s) => (
                <tr key={s.address} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="px-5 py-3 text-zinc-900 dark:text-white font-medium">{s.address}</td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] text-red-700 font-sans dark:bg-red-950/60 dark:border-red-800/40 dark:text-red-300">
                      {s.reason || "Hard Bounce"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-400 dark:text-zinc-500 text-[11px]">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleRemove(s.address)}
                      title="Remove suppression"
                      className="rounded p-1 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  {isLoading
                    ? "Loading suppressions..."
                    : "No addresses currently suppressed. Your sender reputation is clean!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

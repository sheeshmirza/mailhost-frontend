"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  ShieldAlert,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function SuppressionsPage() {
  const [suppressions, setSuppressions] = useState<
    { address: string; reason?: string; created_at: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSuppressions = async () => {
    setIsLoading(true);
    try {
      const res = await api.listSuppressions();
      setSuppressions(res.data || []);
    } catch (err) {
      console.error("Failed to load suppressions", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppressions();
  }, []);

  const handleRemove = async (address: string) => {
    if (!confirm(`Are you sure you want to remove ${address} from the suppression list?`)) return;
    try {
      await api.deleteSuppression(address);
      fetchSuppressions();
    } catch (err: any) {
      alert("Failed to delete suppression: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Suppressions
          </h1>
          <p className="text-xs text-brand-400 mt-1">
            Recipients automatically blocked from receiving further mail due to hard bounces or spam complaints.
          </p>
        </div>

        <button
          onClick={fetchSuppressions}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-brand-400 hover:bg-surface-raised hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-surface-border bg-surface-raised/40 p-4 text-xs text-brand-300 space-y-1">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-amber-400" />
          <span>Automatic Deliverability Protection</span>
        </div>
        <p className="text-brand-400">
          Sending to known invalid or complaining addresses destroys your domain's reputation with Google and Microsoft. Mailhost automatically intercepts deliveries to suppressed addresses.
        </p>
      </div>

      {/* Suppressions Table */}
      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-brand-400">
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
                  <td className="px-5 py-3 text-white font-medium">{s.address}</td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-red-950/60 border border-red-800/40 px-2 py-0.5 text-[10px] text-red-300 font-sans">
                      {s.reason || "Hard Bounce"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-500 text-[11px]">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleRemove(s.address)}
                      title="Remove suppression"
                      className="rounded p-1 text-brand-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-xs text-brand-500 font-sans">
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

"use client";

import React, { useState, useEffect } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import {
  ShieldAlert,
  Trash2,
  RefreshCw,
  Plus,
  Search,
  X,
  UserX,
  CheckCircle2,
} from "lucide-react";

export default function SuppressionsPage() {
  const { toast } = useToast();
  const [suppressions, setSuppressions] = useState<
    { address: string; reason?: string; created_at: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addAddresses, setAddAddresses] = useState("");
  const [addReason, setAddReason] = useState("manual");
  const [isAdding, setIsAdding] = useState(false);

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
    } catch (err: unknown) {
      toast.error("Failed to delete suppression: " + getErrorMessage(err));
    }
  };

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = addAddresses.trim();
    if (!raw) {
      toast.error("Please enter at least one email address.");
      return;
    }
    const lines = raw
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setIsAdding(true);
    try {
      const res = await api.createSuppression({
        addresses: lines,
        reason: addReason,
      });
      toast.success(`Added ${res.added} address(es) to suppressions.`);
      setIsAddOpen(false);
      setAddAddresses("");
      fetchSuppressions();
    } catch (err: any) {
      toast.error("Failed to add suppressions: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const filteredSuppressions = suppressions.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.address.toLowerCase().includes(q) ||
      (s.reason && s.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Blocked &amp; Bounced Emails
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <UserX className="w-2.5 h-2.5" /> Do-Not-Send List
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Emails that bounced or unsubscribed. Mailhost automatically stops sending to these addresses so your emails stay out of spam.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="btn-primary inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Block an Email</span>
          </button>
          <button
            onClick={fetchSuppressions}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Info & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email or reason..."
            className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Total Blocked:</span>
          <strong className="font-mono text-zinc-900 dark:text-white">{suppressions.length}</strong>
        </div>
      </div>

      {/* Suppressions Table */}
      {isLoading && suppressions.length === 0 ? (
        <TableSkeleton rows={5} cols={4} />
      ) : loadError && suppressions.length === 0 ? (
        <ErrorState message={loadError} onRetry={fetchSuppressions} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-surface-raised border-b border-surface-border text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Blocked Email Address</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Date Blocked</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredSuppressions.length > 0 ? (
                filteredSuppressions.map((s) => (
                  <tr key={s.address} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-zinc-900 dark:text-white font-medium">
                      {s.address}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 text-[11px] font-medium border border-rose-500/20 capitalize">
                        {s.reason || "Hard Bounce"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-zinc-500 dark:text-zinc-400">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(s.address)}
                        title="Remove from blocklist"
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
                    {searchQuery
                      ? "No matching blocked addresses found."
                      : "No blocked email addresses found. Your sending list is healthy!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Suppression */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <UserX className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Add Email to Blocklist
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Stop sending messages to specific email addresses
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSuppression} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Email Address(es)
                </label>
                <textarea
                  rows={4}
                  value={addAddresses}
                  onChange={(e) => setAddAddresses(e.target.value)}
                  placeholder="Enter email addresses (one per line or comma-separated)..."
                  className="w-full rounded-lg border border-surface-border bg-surface-raised p-2.5 font-mono text-[11px] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Reason for Blocking
                </label>
                <select
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="manual">Manual Block (Contact Request)</option>
                  <option value="bounced">Hard Bounce (Invalid Mailbox)</option>
                  <option value="complaint">Spam Complaint</option>
                  <option value="unsubscribed">Unsubscribed (Marketing Opt-Out)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-md border border-surface-border px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-surface-raised dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding || !addAddresses.trim()}
                  className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                >
                  {isAdding ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span>{isAdding ? "Adding..." : "Add to Suppressions"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

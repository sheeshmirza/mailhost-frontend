"use client";

import React, { useState, useEffect } from "react";
import { api, APIKeyView, DomainView } from "@/lib/api";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { TableSkeleton } from "@/components/ui/LoadingState";

export default function APIKeysPage() {
  const toast = useToast();
  const [keys, setKeys] = useState<APIKeyView[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [permission, setPermission] = useState<"full_access" | "sending_access">(
    "full_access"
  );
  const [selectedDomainId, setSelectedDomainId] = useState("");
  const [newKeyCreated, setNewKeyCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [keysRes, domainsRes] = await Promise.allSettled([
        api.listAPIKeys(),
        api.listDomains(),
      ]);
      const failures: string[] = [];
      if (keysRes.status === "fulfilled") {
        setKeys(keysRes.value.data || []);
      } else {
        failures.push("API keys");
      }
      if (domainsRes.status === "fulfilled") {
        setDomains(domainsRes.value.data || []);
      } else {
        failures.push("domains");
      }
      if (failures.length) setLoadError(`Could not load ${failures.join(" and ")}.`);
    } catch (err) {
      console.error("Failed to load API keys", err);
      setLoadError("Could not load API keys. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await api.createAPIKey(
        keyName.trim() || "Default Key",
        permission,
        selectedDomainId || undefined
      );
      setNewKeyCreated(res.api_key);
      toast.success("API key generated successfully!");
      setKeyName("");
      await fetchKeys();
    } catch (err) {
      toast.error("Failed to create API key: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (revokingId) return;
    if (!confirm("Are you sure you want to revoke this API key? This action is irreversible.")) return;
    setRevokingId(id);
    try {
      await api.deleteAPIKey(id);
      toast.success("API key revoked successfully");
      await fetchKeys();
    } catch (err) {
      toast.error("Failed to revoke API key: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setRevokingId(null);
    }
  };

  const copyKey = async () => {
    if (!newKeyCreated) return;
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard access is unavailable in this browser.");
      }
      await navigator.clipboard.writeText(newKeyCreated);
      setCopied(true);
      toast.success("API key copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Could not copy API key: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            API Keys
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage authentication credentials for your servers, CLI, and SDK integrations.
          </p>
        </div>

        <button
          onClick={() => {
            setNewKeyCreated(null);
            setIsCreateOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Create API Key</span>
        </button>
      </div>

      {loadError && keys.length > 0 && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          <span>{loadError}</span>
          <button onClick={fetchKeys} disabled={isLoading} className="btn-secondary shrink-0" title="Retry loading">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Keys Table */}
      {isLoading && keys.length === 0 ? (
        <TableSkeleton rows={5} cols={6} />
      ) : loadError && keys.length === 0 ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">API keys could not be loaded</p>
          <p className="mt-1 text-xs text-red-700 dark:text-red-400">{loadError}</p>
          <button onClick={fetchKeys} disabled={isLoading} className="btn-secondary mt-3">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Try again</span>
          </button>
        </div>
      ) : (
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs min-w-[550px]">
          <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Key Preview</th>
              <th className="px-5 py-3">Permission</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Last Used</th>
              <th className="px-5 py-3 text-right">Revoke</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border font-mono">
            {keys.length > 0 ? (
              keys.map((k) => (
                <tr key={k.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="px-5 py-3 font-sans font-medium text-zinc-900 dark:text-white">
                    {k.name}
                  </td>
                  <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400">
                    re_••••••••{k.last_four}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`badge ${
                        k.permission === "full_access"
                          ? "badge-neutral"
                          : "badge-info"
                      }`}
                    >
                      {k.permission === "full_access" ? "Full Access" : "Sending Only"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                    {new Date(k.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                    {k.last_used_at
                      ? new Date(k.last_used_at).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(k.id)}
                      title="Revoke key"
                      className="btn-danger p-1.5"
                      disabled={revokingId !== null}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  No API keys found. Create one to begin.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Create Key Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4 animate-slide-up">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Create API Key</h2>

            {newKeyCreated ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    Copy this key now. For your security, it will never be displayed again.
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white">
                  <span className="truncate mr-2">{newKeyCreated}</span>
                  <button
                    onClick={copyKey}
                    className="flex items-center gap-1 rounded bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 text-xs text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-500 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setIsCreateOpen(false);
                      setNewKeyCreated(null);
                    }}
                    className="btn-primary"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Production Server, Marketing Script, etc."
                    className="input-base"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Permission Scope
                  </label>
                  <select
                    value={permission}
                    onChange={(e) => setPermission(e.target.value as any)}
                    className="input-base"
                  >
                    <option value="full_access">Full Access (Send & Manage)</option>
                    <option value="sending_access">Sending Access Only</option>
                  </select>
                </div>

                {permission === "sending_access" && (
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Restrict to Domain (Optional)
                    </label>
                    <select
                      value={selectedDomainId}
                      onChange={(e) => setSelectedDomainId(e.target.value)}
                      className="input-base"
                    >
                      <option value="">All Domains</option>
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-border mt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isCreating}
                  >
                    {isCreating ? "Generating..." : "Generate API Key"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

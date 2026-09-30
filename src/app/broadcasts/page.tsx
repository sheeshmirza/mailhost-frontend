"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  BroadcastView,
  AudienceView,
} from "@/lib/api";
import {
  Radio,
  Plus,
  Send,
  Copy,
  Trash2,
  Pencil,
  Clock,
  CheckCircle2,
  RefreshCw,
  Users,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";

export default function BroadcastsPage() {
  const toast = useToast();
  const [broadcasts, setBroadcasts] = useState<BroadcastView[]>([]);
  const [audiences, setAudiences] = useState<AudienceView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [domains, setDomains] = useState<any[]>([]);

  // New broadcast modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingBroadcastId, setEditingBroadcastId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduledBroadcastId, setScheduledBroadcastId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<h1>Special Announcement</h1><p>Here is what is new this month.</p>");
  const [selectedAudienceId, setSelectedAudienceId] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [bcRes, audRes, domRes] = await Promise.allSettled([
        api.listBroadcasts(),
        api.listAudiences(),
        api.listDomains(),
      ]);
      const failedResources: string[] = [];
      if (bcRes.status === "fulfilled") {
        setBroadcasts(bcRes.value.data || []);
      } else {
        failedResources.push("broadcasts");
      }
      if (audRes.status === "fulfilled") {
        const auds = audRes.value.data || [];
        setAudiences(auds);
        if (auds.length > 0 && !selectedAudienceId) {
          setSelectedAudienceId(auds[0].id);
        }
      } else {
        failedResources.push("audiences");
      }
      if (domRes.status === "fulfilled") {
        const domList = domRes.value.data || [];
        setDomains(domList);
        if (domList.length > 0 && !from) {
          const verified = domList.find((d: any) => d.status === "verified") || domList[0];
          setFrom(`Acme <newsletter@${verified.name}>`);
        } else if (!from) {
          setFrom("Acme <newsletter@example.com>");
        }
      } else {
        failedResources.push("domains");
      }
      if (failedResources.length) {
        setLoadError(`Could not load ${failedResources.join(" and ")}.`);
      }
    } catch (err) {
      console.error("Failed to load broadcasts", err);
      setLoadError(err instanceof Error ? err.message : "Could not load broadcast data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        from: from.trim(),
        subject: subject.trim(),
        html,
        audience_id: selectedAudienceId || undefined,
      };
      if (editingBroadcastId) {
        await api.updateBroadcast(editingBroadcastId, payload);
        toast.success("Draft broadcast updated");
      } else {
        await api.createBroadcast(payload);
        toast.success("Broadcast campaign created!");
      }
      setIsOpen(false);
      setEditingBroadcastId(null);
      setName("");
      setSubject("");
      await fetchData();
    } catch (err: any) {
      toast.error(`${editingBroadcastId ? "Failed to update draft" : "Failed to create broadcast"}: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (broadcastId: string) => {
    try {
      const broadcast = await api.getBroadcast(broadcastId);
      if (broadcast.status !== "draft") {
        toast.error("Only draft broadcasts can be edited");
        return;
      }
      setEditingBroadcastId(broadcast.id);
      setName(broadcast.name);
      setFrom(broadcast.from);
      setSubject(broadcast.subject);
      setHtml(broadcast.html || "");
      setSelectedAudienceId(broadcast.audience_id || "");
      setIsOpen(true);
    } catch (err) {
      toast.error("Could not load draft: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleSend = async (id: string) => {
    setScheduledBroadcastId(id);
    setScheduledAt("");
  };

  const confirmSend = async (schedule = false) => {
    if (!scheduledBroadcastId || isSending) return;
    if (!confirm(schedule
      ? "Schedule this broadcast for the selected time?"
      : "Send this broadcast to all recipients now?")) return;
    setIsSending(true);
    try {
      const scheduledTime = schedule ? new Date(scheduledAt).toISOString() : undefined;
      await api.sendBroadcast(scheduledBroadcastId, scheduledTime);
      toast.success(schedule ? "Broadcast scheduled" : "Broadcast is sending to all recipients!");
      setScheduledBroadcastId(null);
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to send broadcast: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.duplicateBroadcast(id);
      toast.success("Broadcast duplicated");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to duplicate broadcast: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this broadcast?")) return;
    try {
      await api.deleteBroadcast(id);
      toast.success("Broadcast deleted");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to delete broadcast: " + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Broadcasts
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Send newsletters, product announcements, and bulk campaigns to your audience.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Broadcast</span>
        </button>
      </div>

      {loadError && broadcasts.length > 0 && (
        <ErrorState message={loadError} onRetry={fetchData} />
      )}

      {/* Broadcasts Table */}
      {isLoading && broadcasts.length === 0 ? (
        <TableSkeleton rows={5} cols={6} />
      ) : loadError && broadcasts.length === 0 ? (
        <ErrorState message={loadError} onRetry={fetchData} />
      ) : (
      <div className="rounded-xl border border-surface-border overflow-hidden bg-surface">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-surface-raised border-b border-surface-border">
            <tr>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Campaign Name</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Subject</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">From</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">Created</th>
              <th className="px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {broadcasts.length > 0 ? (
              broadcasts.map((b) => (
                <tr key={b.id} className="hover:bg-surface-raised/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white max-w-xs truncate">
                    {b.name}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                    {b.subject}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-500 dark:text-zinc-400 text-[11px] truncate">
                    {b.from}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        b.status === "sent"
                          ? "bg-emerald-50 text-emerald-700"
                          : b.status === "sending" || b.status === "queued"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {b.status === "sent" && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.status !== "sent" && (
                        <button
                          onClick={() => handleSend(b.id)}
                          title="Send broadcast now"
                          className="rounded p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-surface-raised"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                      {b.status === "draft" && (
                        <button
                          onClick={() => handleEdit(b.id)}
                          title="Edit draft"
                          className="rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-surface-raised"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(b.id)}
                        title="Duplicate broadcast"
                        className="rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-surface-raised"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        title="Delete broadcast"
                        className="rounded p-1 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-surface-raised"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-zinc-500">
                  No broadcasts found. Create your first campaign above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* New Broadcast Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {editingBroadcastId ? "Edit Draft Broadcast" : "Create Broadcast Campaign"}
            </h2>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Internal Campaign Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. October Product Launch"
                  required
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={selectedAudienceId}
                  onChange={(e) => setSelectedAudienceId(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
                >
                  <option value="">Select Audience...</option>
                  {audiences.map((aud) => (
                    <option key={aud.id} value={aud.id}>
                      {aud.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  From Address
                </label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Company <news@yourdomain.com>"
                  required
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Announcing Version 2.0!"
                  required
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  HTML Content
                </label>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-border mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingBroadcastId(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? "Saving..." : editingBroadcastId ? "Save Draft" : "Save Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduledBroadcastId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="broadcast-send-title" className="w-full max-w-md space-y-4 rounded-lg border border-surface-border bg-surface p-5 shadow-2xl">
            <div>
              <h2 id="broadcast-send-title" className="text-sm font-semibold text-content-primary">Send broadcast</h2>
              <p className="mt-1 text-xs text-content-muted">Send immediately, or choose a future delivery time.</p>
            </div>
            <label className="block text-xs font-medium text-content-secondary">
              Schedule time (optional)
              <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="input-base mt-1" />
            </label>
            <div className="flex flex-wrap justify-end gap-2 border-t border-surface-border pt-3">
              <button type="button" onClick={() => setScheduledBroadcastId(null)} className="btn-secondary">Cancel</button>
              <button type="button" disabled={isSending || !scheduledAt} onClick={() => confirmSend(true)} className="btn-secondary">{isSending && scheduledAt ? "Scheduling..." : "Schedule"}</button>
              <button type="button" disabled={isSending} onClick={() => confirmSend(false)} className="btn-primary">{isSending && !scheduledAt ? "Sending..." : "Send now"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

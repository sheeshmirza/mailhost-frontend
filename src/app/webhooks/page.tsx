"use client";

import React, { useState, useEffect } from "react";
import { api, WebhookView } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import {
  Webhook,
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Copy,
  Check,
  Shield,
  RefreshCw,
} from "lucide-react";

const availableEvents = [
  { id: "email.sent", label: "Email Sent" },
  { id: "email.delivered", label: "Email Delivered" },
  { id: "email.opened", label: "Email Opened" },
  { id: "email.clicked", label: "Email Clicked" },
  { id: "email.bounced", label: "Email Bounced" },
  { id: "email.complained", label: "Email Complained" },
];

export default function WebhooksPage() {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingWebhookId, setEditingWebhookId] = useState<string | null>(null);
  const [webhookStatus, setWebhookStatus] = useState<"active" | "disabled">("active");
  const [isSaving, setIsSaving] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "email.sent",
    "email.delivered",
    "email.bounced",
  ]);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);
  const [newSigningSecret, setNewSigningSecret] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.listWebhooks();
      setWebhooks(res.data || []);
    } catch (err: any) {
      console.error("Failed to load webhooks", err);
      setLoadError(err instanceof Error ? err.message : "Could not load webhooks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }
    setIsSaving(true);
    try {
      const payload = { url: url.trim(), events: selectedEvents, status: webhookStatus };
      if (editingWebhookId) {
        await api.updateWebhook(editingWebhookId, payload);
        toast.success("Webhook updated");
      } else {
        const created = await api.createWebhook(payload);
        setNewSigningSecret(created.signing_secret || null);
        toast.success("Webhook endpoint registered");
      }
      setIsOpen(false);
      setEditingWebhookId(null);
      setUrl("");
      setWebhookStatus("active");
      await fetchWebhooks();
    } catch (err: any) {
      toast.error(`${editingWebhookId ? "Failed to update webhook" : "Failed to create webhook"}: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (webhook: WebhookView) => {
    setEditingWebhookId(webhook.id);
    setUrl(webhook.url);
    setSelectedEvents(webhook.events || []);
    setWebhookStatus(webhook.status === "disabled" ? "disabled" : "active");
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteWebhook(id);
      toast.success("Webhook deleted");
      fetchWebhooks();
    } catch (err: any) {
      toast.error("Failed to delete webhook: " + (err.response?.data?.message || err.message));
    }
  };

  const toggleEvent = (ev: string) => {
    if (selectedEvents.includes(ev)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== ev));
    } else {
      setSelectedEvents([...selectedEvents, ev]);
    }
  };

  const copySecret = (sec: string, id: string) => {
    navigator.clipboard.writeText(sec);
    setCopiedSecret(id);
    toast.info("Signing secret copied to clipboard");
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Webhooks
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Receive real-time HTTP callbacks for email delivery, bounce, and engagement events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Webhook</span>
          </button>
          <button
            onClick={fetchWebhooks}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            title="Refresh webhooks"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Webhooks Table */}
      {isLoading && webhooks.length === 0 ? (
        <TableSkeleton rows={5} cols={5} />
      ) : loadError && webhooks.length === 0 ? (
        <ErrorState message={loadError} onRetry={fetchWebhooks} />
      ) : (
      <div className="rounded-xl border border-surface-border overflow-hidden bg-surface">
        <table className="w-full text-left">
          <thead className="bg-surface-raised border-b border-surface-border text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-3">Endpoint URL</th>
              <th className="px-4 py-3">Subscribed Events</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Signing Secret</th>
              <th className="px-4 py-3 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {webhooks.length > 0 ? (
              webhooks.map((wh) => (
                <tr key={wh.id} className="hover:bg-surface-raised/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-zinc-700 dark:text-zinc-300 max-w-xs truncate" title={wh.url}>
                    {wh.url}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {wh.events?.map((ev) => (
                        <span
                          key={ev}
                          className="rounded bg-surface-raised px-1.5 py-0.5 text-[11px] text-zinc-700 dark:text-zinc-300 border border-surface-border"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-sans">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        wh.status === "active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      {wh.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-zinc-700 dark:text-zinc-300">
                    {wh.signing_secret ? (
                      <button
                        onClick={() => copySecret(wh.signing_secret!, wh.id)}
                        className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        title="Click to copy secret"
                      >
                        <span>••••••••••••••••</span>
                        {copiedSecret === wh.id ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(wh)}
                      className="rounded-lg p-1.5 text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                      title="Edit webhook"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(wh.id)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      title="Delete webhook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-16 text-center text-sm text-zinc-500">
                  No webhook endpoints registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
      {loadError && webhooks.length > 0 && <ErrorState message={loadError} onRetry={fetchWebhooks} />}

      {newSigningSecret && (
        <section role="status" className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
          <div>
            <h2 className="text-[13px] font-semibold text-amber-950 dark:text-amber-200">Save your webhook signing secret</h2>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">It is only shown once. Store it securely and use it to verify webhook signatures.</p>
          </div>
          <div className="flex min-w-0 items-center gap-2 rounded-md border border-amber-200 bg-white px-3 py-2 dark:border-amber-900/50 dark:bg-black/20">
            <code className="min-w-0 flex-1 break-all font-mono text-xs text-zinc-900 dark:text-zinc-100">{newSigningSecret}</code>
            <button onClick={() => copySecret(newSigningSecret, "new-signing-secret")} className="btn-secondary shrink-0" aria-label="Copy signing secret">
              {copiedSecret === "new-signing-secret" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedSecret === "new-signing-secret" ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <button onClick={() => setNewSigningSecret(null)} className="text-xs font-medium text-amber-900 underline dark:text-amber-300">Dismiss</button>
        </section>
      )}

      {/* Add Webhook Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {editingWebhookId ? "Edit Webhook Endpoint" : "Add Webhook Endpoint"}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Configure the URL and events this endpoint receives.</p>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Endpoint URL (must be HTTPS)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="HTTPS endpoint URL"
                  required
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 font-mono text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Endpoint status</label>
                <select
                  value={webhookStatus}
                  onChange={(event) => setWebhookStatus(event.target.value as "active" | "disabled")}
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Select Events to Subscribe
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised p-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id)}
                        className="rounded border-surface-border bg-surface text-zinc-900 dark:text-white focus:ring-0"
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-border mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingWebhookId(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary">
                  {isSaving ? "Saving..." : editingWebhookId ? "Save Changes" : "Create Webhook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

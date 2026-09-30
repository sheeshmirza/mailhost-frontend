"use client";

import React, { useState, useEffect } from "react";
import { api, WebhookView } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import {
  Webhook,
  Plus,
  Trash2,
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
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "email.sent",
    "email.delivered",
    "email.bounced",
  ]);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    setIsLoading(true);
    try {
      const res = await api.listWebhooks();
      setWebhooks(res.data || []);
    } catch (err: any) {
      console.error("Failed to load webhooks", err);
      toast.error("Failed to load webhooks: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }
    try {
      await api.createWebhook({
        url: url.trim(),
        events: selectedEvents,
        status: "active",
      });
      toast.success("Webhook endpoint registered");
      setIsOpen(false);
      setUrl("");
      fetchWebhooks();
    } catch (err: any) {
      toast.error("Failed to create webhook: " + (err.response?.data?.message || err.message));
    }
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
                      className={`badge ${
                        wh.status === "active"
                          ? "badge-success"
                          : "badge-neutral"
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
                      onClick={() => handleDelete(wh.id)}
                      className="btn-danger p-1.5"
                      title="Delete webhook"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-16 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {isLoading
                    ? "Loading webhooks..."
                    : "No webhook endpoints registered yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Webhook Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4 animate-slide-up">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Add Webhook Endpoint</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Configure a new webhook URL to receive events.</p>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Endpoint URL (must be HTTPS)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks/resend"
                  required
                  className="input-base font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Select Events to Subscribe
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised/40 p-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id)}
                        className="rounded border-surface-border text-zinc-900 dark:text-white focus:ring-0"
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6 animate-fade-in">
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
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Webhook</span>
          </button>
          <button
            onClick={fetchWebhooks}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            title="Refresh webhooks"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Webhooks Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3">Endpoint URL</th>
              <th className="px-5 py-3">Subscribed Events</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Signing Secret</th>
              <th className="px-5 py-3 text-right">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border font-mono">
            {webhooks.length > 0 ? (
              webhooks.map((wh) => (
                <tr key={wh.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="px-5 py-3 text-zinc-900 dark:text-white max-w-xs truncate" title={wh.url}>
                    {wh.url}
                  </td>
                  <td className="px-5 py-3 font-sans">
                    <div className="flex flex-wrap gap-1">
                      {wh.events?.map((ev) => (
                        <span
                          key={ev}
                          className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-zinc-700 dark:text-zinc-300 border border-surface-border"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-sans">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        wh.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40"
                          : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                      }`}
                    >
                      {wh.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400">
                    {wh.signing_secret ? (
                      <button
                        onClick={() => copySecret(wh.signing_secret!, wh.id)}
                        className="flex items-center gap-1 text-[11px] hover:text-zinc-900 dark:hover:text-white transition-colors"
                        title="Click to copy secret"
                      >
                        <span>••••••••••••••••</span>
                        {copiedSecret === wh.id ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(wh.id)}
                      className="rounded p-1 text-zinc-400 hover:text-red-500 transition-colors"
                      title="Delete webhook"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Add Webhook Endpoint</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Endpoint URL (must be HTTPS)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks/resend"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-2">
                  Select Events to Subscribe
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2 rounded-md border border-surface-border bg-surface-raised p-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-surface-raised dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
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

"use client";

import React, { useState, useEffect } from "react";
import { api, WebhookView } from "@/lib/api";
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
    } catch (err) {
      console.error("Failed to load webhooks", err);
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
      alert("Please select at least one event");
      return;
    }
    try {
      await api.createWebhook({
        url: url.trim(),
        events: selectedEvents,
        status: "active",
      });
      setIsOpen(false);
      setUrl("");
      fetchWebhooks();
    } catch (err: any) {
      alert("Failed to create webhook: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;
    try {
      await api.deleteWebhook(id);
      fetchWebhooks();
    } catch (err: any) {
      alert("Failed to delete webhook: " + err.message);
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
    setTimeout(() => setCopiedSecret(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Webhooks
          </h1>
          <p className="text-xs text-brand-400 mt-1">
            Receive real-time HTTP callbacks for email delivery, bounce, and engagement events.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Webhook</span>
        </button>
      </div>

      {/* Webhooks Table */}
      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-brand-400">
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
                  <td className="px-5 py-3 text-white max-w-xs truncate" title={wh.url}>
                    {wh.url}
                  </td>
                  <td className="px-5 py-3 font-sans">
                    <div className="flex flex-wrap gap-1">
                      {wh.events?.map((ev) => (
                        <span
                          key={ev}
                          className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] text-brand-300 border border-surface-border"
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
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                          : "bg-zinc-800 text-brand-400 border-zinc-700"
                      }`}
                    >
                      {wh.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-400">
                    {wh.signing_secret ? (
                      <button
                        onClick={() => copySecret(wh.signing_secret!, wh.id)}
                        className="flex items-center gap-1 text-[11px] hover:text-white"
                      >
                        <span>••••••••••••••••</span>
                        {copiedSecret === wh.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
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
                      className="rounded p-1 text-brand-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-brand-500 font-sans">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-white">Add Webhook Endpoint</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Endpoint URL (must be HTTPS)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks/resend"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-brand-400 mb-2">
                  Select Events to Subscribe
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableEvents.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2 rounded border border-surface-border bg-surface-raised p-2 text-xs text-brand-200 cursor-pointer hover:border-brand-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id)}
                        className="rounded border-surface-border bg-surface text-black"
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
                  className="rounded px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
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

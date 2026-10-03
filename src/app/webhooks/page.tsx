"use client";

import React, { useState, useEffect } from "react";
import { api, WebhookView, WebhookTestResponse, WebhookDeliveryItem } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import {
  Plus,
  Trash2,
  Pencil,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCw,
  X,
} from "lucide-react";

const availableEvents = [
  { id: "email.sent", label: "Email Sent" },
  { id: "email.delivered", label: "Email Delivered" },
  { id: "email.opened", label: "Email Opened" },
  { id: "email.clicked", label: "Email Clicked" },
  { id: "email.bounced", label: "Email Bounced" },
  { id: "contact.created", label: "Contact Created" },
  { id: "contact.updated", label: "Contact Updated" },
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

  // Webhook Test State
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState<WebhookView | null>(null);
  const [testEventType, setTestEventType] = useState("email.delivered");
  const [testPayloadJson, setTestPayloadJson] = useState('{\n  "email_id": "em_test_98231",\n  "recipient": "user@example.com",\n  "subject": "Order Confirmation",\n  "event": "delivered"\n}');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<WebhookTestResponse | null>(null);

  // Webhook Deliveries Drawer State
  const [isDeliveriesOpen, setIsDeliveriesOpen] = useState(false);
  const [deliveriesWebhook, setDeliveriesWebhook] = useState<WebhookView | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryItem[]>([]);
  const [isDeliveriesLoading, setIsDeliveriesLoading] = useState(false);
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | null>(null);

  const handleTestWebhook = async () => {
    if (!testingWebhook) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      let payload = undefined;
      try {
        payload = JSON.parse(testPayloadJson);
      } catch {}
      const res = await api.testWebhook(testingWebhook.id, {
        event_type: testEventType,
        payload,
      });
      setTestResult(res);
      if (res.success) {
        toast.success(`Webhook responded with HTTP ${res.status_code} in ${res.latency_ms}ms!`);
      } else {
        toast.error(`Webhook test failed: ${res.error || `HTTP ${res.status_code}`}`);
      }
    } catch (err: any) {
      toast.error("Test failed: " + err.message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleOpenDeliveries = async (wh: WebhookView) => {
    setDeliveriesWebhook(wh);
    setIsDeliveriesOpen(true);
    setIsDeliveriesLoading(true);
    try {
      const res = await api.listWebhookDeliveries(wh.id);
      setDeliveries(res.data || []);
    } catch (err: any) {
      toast.error("Failed to load deliveries: " + err.message);
    } finally {
      setIsDeliveriesLoading(false);
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    if (!deliveriesWebhook) return;
    setRetryingDeliveryId(deliveryId);
    try {
      await api.retryWebhookDelivery(deliveriesWebhook.id, deliveryId);
      toast.success("Delivery re-queued for dispatch!");
      const res = await api.listWebhookDeliveries(deliveriesWebhook.id);
      setDeliveries(res.data || []);
    } catch (err: any) {
      toast.error("Retry failed: " + err.message);
    } finally {
      setRetryingDeliveryId(null);
    }
  };

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
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full min-w-[760px] text-left">
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
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setTestingWebhook(wh);
                          setTestResult(null);
                          setIsTestOpen(true);
                        }}
                        className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
                        title="Send Test Event"
                      >
                        <Zap className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void handleOpenDeliveries(wh)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                        title="View Deliveries History"
                      >
                        <Activity className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(wh)}
                        className="rounded-lg p-1.5 text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
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
                    </div>
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
          <div className="dialog-scroll relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
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

      {/* Modal: Live Webhook Test Dispatcher */}
      {isTestOpen && testingWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Dispatch Test Webhook Event
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-500 truncate max-w-xs">
                    {testingWebhook.url}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTestOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Event Type
                </label>
                <select
                  value={testEventType}
                  onChange={(e) => setTestEventType(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                >
                  <option value="email.delivered">email.delivered</option>
                  <option value="email.bounced">email.bounced</option>
                  <option value="email.opened">email.opened</option>
                  <option value="email.clicked">email.clicked</option>
                  <option value="contact.created">contact.created</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Payload Preview (JSON)
                </label>
                <textarea
                  rows={5}
                  value={testPayloadJson}
                  onChange={(e) => setTestPayloadJson(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-raised p-2.5 font-mono text-[11px] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {testResult && (
                <div
                  className={`rounded-xl border p-3.5 space-y-2 ${
                    testResult.success
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300"
                      : "border-rose-500/20 bg-rose-500/10 text-rose-900 dark:text-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs">
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                      )}
                      <span>
                        {testResult.success ? "HTTP " + testResult.status_code + " OK" : "Delivery Error"}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold">
                      {testResult.latency_ms} ms latency
                    </span>
                  </div>
                  {testResult.error && (
                    <p className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">
                      {testResult.error}
                    </p>
                  )}
                  {testResult.response_body && (
                    <div className="rounded bg-black/5 dark:bg-white/5 p-2 font-mono text-[10px] truncate">
                      Response: {testResult.response_body}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsTestOpen(false)}
                  className="rounded-md border border-surface-border px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-surface-raised dark:text-zinc-300"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => void handleTestWebhook()}
                  disabled={isTesting}
                  className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-xs"
                >
                  {isTesting ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  <span>{isTesting ? "Dispatching..." : "Send Test Event"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Webhook Deliveries Telemetry */}
      {isDeliveriesOpen && deliveriesWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 p-0 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg h-full bg-surface border-l border-surface-border p-6 shadow-2xl flex flex-col space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Webhook Deliveries Telemetry
                  </h3>
                  <p className="text-[11px] font-mono text-zinc-500 truncate max-w-xs">
                    {deliveriesWebhook.url}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeliveriesOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto text-xs">
              {isDeliveriesLoading ? (
                <div className="py-12 text-center text-zinc-500 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading recent delivery events...</span>
                </div>
              ) : deliveries.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  No recent deliveries logged for this endpoint.
                </div>
              ) : (
                deliveries.map((del) => {
                  const isDelivered = del.status === "delivered";
                  const isFailed = del.status === "failed";
                  return (
                    <div
                      key={del.id}
                      className="rounded-xl border border-surface-border bg-surface-raised p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">
                          {del.event_type}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isDelivered
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : isFailed
                              ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                              : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                          }`}
                        >
                          {del.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                        <span>Attempts: {del.attempts}</span>
                        <span>{new Date(del.created_at).toLocaleString()}</span>
                      </div>
                      {del.last_error && (
                        <p className="text-[10px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 p-1.5 rounded">
                          {del.last_error}
                        </p>
                      )}
                      {!isDelivered && (
                        <div className="pt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleRetryDelivery(del.id)}
                            disabled={retryingDeliveryId === del.id}
                            className="inline-flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                          >
                            <RotateCw className={`h-3 w-3 ${retryingDeliveryId === del.id ? "animate-spin" : ""}`} />
                            <span>Retry Dispatch</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-surface-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsDeliveriesOpen(false)}
                className="btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

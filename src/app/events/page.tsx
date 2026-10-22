"use client";

import React, { useState, useEffect, useRef } from "react";
import { api, CustomEvent, getErrorMessage } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { useCopy } from "@/lib/useCopy";
import { useCursorPagination } from "@/lib/useCursorPagination";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { CursorPagination } from "@/components/ui/CursorPagination";
import {
  Zap,
  RefreshCw,
  Copy,
  X,
} from "lucide-react";

export default function EventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CustomEvent | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const { copy, isCopied } = useCopy();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jsonData, setJsonData] = useState("{}");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const eventsLoadRevision = useRef(0);
  const onFetchSuccessRef = useRef<((currentBefore?: string, nextBefore?: string, reset?: boolean) => void) | null>(null);

  const fetchEvents = useCallback(async (before?: string, resetPage = true): Promise<boolean> => {
    const revision = ++eventsLoadRevision.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.listEvents(50, before);
      if (revision !== eventsLoadRevision.current) return false;
      setEvents(res.data || []);
      onFetchSuccessRef.current?.(before, res.next_before, resetPage);
      return true;
    } catch (err) {
      if (revision !== eventsLoadRevision.current) return false;
      console.error("Failed to load events", err);
      setLoadError(err instanceof Error ? err.message : "Could not load events.");
      return false;
    } finally {
      if (revision === eventsLoadRevision.current) setIsLoading(false);
    }
  }, []);

  const pagination = useCursorPagination(fetchEvents, isPageLoading);
  onFetchSuccessRef.current = pagination.onFetchSuccess;

  useEffect(() => {
    void fetchEvents();
    return () => {
      eventsLoadRevision.current += 1;
    };
  }, []);

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedData = jsonData ? JSON.parse(jsonData) : {};
      await api.triggerEvent({
        name: name.trim(),
        email: email.trim(),
        data: parsedData,
      });
      toast.success(`Event "${name}" triggered successfully`);
      setIsOpen(false);
      void fetchEvents();
    } catch (err: unknown) {
      toast.error("Failed to trigger event: " + getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectEvent = async (ev: CustomEvent) => {
    setLoadingDetailId(ev.id);
    try {
      const detailed = await api.getEvent(ev.id);
      setSelectedEvent(detailed);
    } catch {
      setSelectedEvent(ev);
    } finally {
      setLoadingDetailId(null);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Activity Events
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track customer activities (like signups, purchases, or page views) that trigger automated emails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="btn-primary"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Send Test Event</span>
          </button>
          <button
            onClick={() => {
              api.clearCache();
              void fetchEvents();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            title="Refresh events"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Events Table */}
      {isLoading && events.length === 0 ? (
        <TableSkeleton rows={5} cols={4} />
      ) : loadError && events.length === 0 ? (
        <ErrorState message={loadError} onRetry={fetchEvents} />
      ) : (
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs min-w-[650px]">
          <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3">Event Name</th>
              <th className="px-5 py-3">Contact Email</th>
              <th className="px-5 py-3">Event Details (Data)</th>
              <th className="px-5 py-3 text-right">Date & Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border font-mono">
            {events.length > 0 ? (
              events.map((ev) => (
                <tr
                  key={ev.id}
                  onClick={() => void handleSelectEvent(ev)}
                  className="hover:bg-surface-raised/60 cursor-pointer transition-colors"
                  title="Click to view full event payload"
                >
                  <td className="px-5 py-3 text-zinc-900 dark:text-white font-semibold flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300 shrink-0" />
                    <span>{ev.name}</span>
                    {loadingDetailId === ev.id && <RefreshCw className="h-3 w-3 animate-spin text-zinc-400" />}
                  </td>
                  <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300">{ev.contact_email}</td>
                  <td className="px-5 py-3 max-w-sm truncate text-zinc-500 dark:text-zinc-400">
                    {JSON.stringify(ev.data)}
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-400 dark:text-zinc-500 text-[11px]">
                    {new Date(ev.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  No events recorded yet. Click &apos;Send Test Event&apos; to test.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
      {(pagination.canGoNewer || pagination.canGoOlder) && (
        <CursorPagination
          page={pagination.page}
          canGoNewer={pagination.canGoNewer}
          canGoOlder={pagination.canGoOlder}
          isLoading={isPageLoading || isLoading}
          onNewer={() => void pagination.loadNewer()}
          onOlder={() => void pagination.loadOlder()}
        />
      )}
      {loadError && events.length > 0 && (
        <ErrorState message={loadError} onRetry={() => void fetchEvents()} />
      )}

      {/* Trigger Event Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-teal-600 dark:text-teal-300" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Send Test Event</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Simulate an event to test if your automated workflows and emails trigger correctly.
            </p>
            <form onSubmit={handleTrigger} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. order.completed, user.signup"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Recipient email address"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Event Details (JSON)
                </label>
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
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
                  disabled={isSubmitting}
                  className="btn-primary px-4 py-1.5 text-xs"
                >
                  {isSubmitting ? "Sending..." : "Send Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Event Details</h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 block mb-0.5">Event Name</span>
                  <span className="font-mono font-semibold text-zinc-900 dark:text-white">{selectedEvent.name}</span>
                </div>
                <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 block mb-0.5">Contact Email</span>
                  <span className="font-mono text-zinc-900 dark:text-white truncate block">{selectedEvent.contact_email}</span>
                </div>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400">Event ID</span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(selectedEvent.id);
                      setCopiedId(true);
                      setTimeout(() => setCopiedId(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-teal-600 hover:underline dark:text-teal-400"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedId ? "Copied!" : "Copy ID"}</span>
                  </button>
                </div>
                <span className="font-mono text-xs text-zinc-900 dark:text-zinc-200 mt-1 block select-all">{selectedEvent.id}</span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] uppercase font-semibold text-zinc-500 dark:text-zinc-400 block mb-0.5">Timestamp</span>
                <span className="font-mono text-zinc-900 dark:text-white">{new Date(selectedEvent.created_at).toLocaleString()}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">Payload Data</span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(JSON.stringify(selectedEvent.data, null, 2));
                      setCopiedData(true);
                      setTimeout(() => setCopiedData(false), 2000);
                    }}
                    className="flex items-center gap-1 text-[11px] text-teal-600 hover:underline dark:text-teal-400"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedData ? "Copied!" : "Copy JSON"}</span>
                  </button>
                </div>
                <pre className="rounded-lg border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedEvent.data, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="btn-secondary text-xs px-4 py-1.5"
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

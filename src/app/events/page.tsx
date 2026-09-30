"use client";

import React, { useState, useEffect, useRef } from "react";
import { api, CustomEvent } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { CursorPagination } from "@/components/ui/CursorPagination";
import {
  Zap,
  Plus,
  RefreshCw,
  Send,
  Code,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function EventsPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jsonData, setJsonData] = useState("{}");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventsBefore, setEventsBefore] = useState<string | undefined>();
  const [nextEventsBefore, setNextEventsBefore] = useState<string | undefined>();
  const [eventsPageHistory, setEventsPageHistory] = useState<(string | undefined)[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const eventsLoadRevision = useRef(0);

  const fetchEvents = async (before?: string, resetPage = true): Promise<boolean> => {
    const revision = ++eventsLoadRevision.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.listEvents(50, before);
      if (revision !== eventsLoadRevision.current) return false;
      setEvents(res.data || []);
      setEventsBefore(before);
      setNextEventsBefore(res.next_before);
      if (resetPage) setEventsPageHistory([]);
      return true;
    } catch (err) {
      if (revision !== eventsLoadRevision.current) return false;
      console.error("Failed to load events", err);
      setLoadError(err instanceof Error ? err.message : "Could not load events.");
      return false;
    } finally {
      if (revision === eventsLoadRevision.current) setIsLoading(false);
    }
  };

  const loadOlderEvents = async () => {
    if (!nextEventsBefore || isPageLoading) return;
    setIsPageLoading(true);
    const currentBefore = eventsBefore;
    try {
      if (await fetchEvents(nextEventsBefore, false)) {
        setEventsPageHistory((history) => [...history, currentBefore]);
      }
    } finally {
      setIsPageLoading(false);
    }
  };

  const loadNewerEvents = async () => {
    if (eventsPageHistory.length === 0 || isPageLoading) return;
    setIsPageLoading(true);
    const previousBefore = eventsPageHistory[eventsPageHistory.length - 1];
    try {
      if (await fetchEvents(previousBefore, false)) {
        setEventsPageHistory((history) => history.slice(0, -1));
      }
    } finally {
      setIsPageLoading(false);
    }
  };

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
    } catch (err: any) {
      toast.error("Failed to trigger event: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Custom Events & Telemetry
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Emit custom events to trigger automated journeys, sync user traits, and track product milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="btn-primary"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Trigger Event</span>
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
              <th className="px-5 py-3">Payload Data</th>
              <th className="px-5 py-3 text-right">Triggered At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border font-mono">
            {events.length > 0 ? (
              events.map((ev) => (
                <tr key={ev.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="px-5 py-3 text-zinc-900 dark:text-white font-semibold flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-purple-500" />
                    <span>{ev.name}</span>
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
                  No events recorded yet. Click 'Trigger Event' to test.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
      {(eventsPageHistory.length > 0 || nextEventsBefore) && (
        <CursorPagination
          page={eventsPageHistory.length + 1}
          canGoNewer={eventsPageHistory.length > 0}
          canGoOlder={Boolean(nextEventsBefore)}
          isLoading={isPageLoading || isLoading}
          onNewer={() => void loadNewerEvents()}
          onOlder={() => void loadOlderEvents()}
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
              <Zap className="h-4 w-4 text-purple-500" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Trigger Custom Event</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Emit an event to the backend. Matching automations will be triggered immediately.
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
                  Data Payload (JSON)
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
                  className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Triggering..." : "Fire Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

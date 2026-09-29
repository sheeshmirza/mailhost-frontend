"use client";

import React, { useState, useEffect } from "react";
import { api, CustomEvent } from "@/lib/api";
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
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Form fields
  const [name, setName] = useState("user.signup");
  const [email, setEmail] = useState("alice@example.com");
  const [jsonData, setJsonData] = useState(`{
  "plan": "pro",
  "source": "google_ads",
  "referrer": "twitter"
}`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.listEvents();
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
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
      setIsOpen(false);
      fetchEvents();
    } catch (err: any) {
      alert("Failed to trigger event: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Custom Events & Telemetry
          </h1>
          <p className="text-xs text-brand-400 mt-1">
            Emit custom events to trigger automated journeys, sync user traits, and track product milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Trigger Event</span>
          </button>
          <button
            onClick={fetchEvents}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-brand-400 hover:bg-surface-raised hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-brand-400">
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
                  <td className="px-5 py-3 text-white font-semibold flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-purple-400" />
                    <span>{ev.name}</span>
                  </td>
                  <td className="px-5 py-3 text-brand-300">{ev.contact_email}</td>
                  <td className="px-5 py-3 max-w-sm truncate text-brand-400">
                    {JSON.stringify(ev.data)}
                  </td>
                  <td className="px-5 py-3 text-right text-brand-500 text-[11px]">
                    {new Date(ev.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-xs text-brand-500 font-sans">
                  {isLoading
                    ? "Loading custom events..."
                    : "No events recorded yet. Click 'Trigger Event' to test."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Trigger Event Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Trigger Custom Event</h2>
            </div>
            <p className="text-xs text-brand-400">
              Emit an event to the backend. Matching automations will be triggered immediately.
            </p>

            <form onSubmit={handleTrigger} className="space-y-3">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. order.completed, user.signup"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Data Payload (JSON)
                </label>
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-white focus:outline-none"
                />
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
                  disabled={isSubmitting}
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
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

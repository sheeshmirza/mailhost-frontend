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
  Clock,
  CheckCircle2,
  RefreshCw,
  Users,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";

export default function BroadcastsPage() {
  const toast = useToast();
  const [broadcasts, setBroadcasts] = useState<BroadcastView[]>([]);
  const [audiences, setAudiences] = useState<AudienceView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [domains, setDomains] = useState<any[]>([]);

  // New broadcast modal
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("<h1>Special Announcement</h1><p>Here is what is new this month.</p>");
  const [selectedAudienceId, setSelectedAudienceId] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [bcRes, audRes, domRes] = await Promise.allSettled([
        api.listBroadcasts(),
        api.listAudiences(),
        api.listDomains(),
      ]);
      if (bcRes.status === "fulfilled") {
        setBroadcasts(bcRes.value.data || []);
      }
      if (audRes.status === "fulfilled") {
        const auds = audRes.value.data || [];
        setAudiences(auds);
        if (auds.length > 0 && !selectedAudienceId) {
          setSelectedAudienceId(auds[0].id);
        }
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
      }
    } catch (err) {
      console.error("Failed to load broadcasts", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBroadcast({
        name: name.trim(),
        from: from.trim(),
        subject: subject.trim(),
        html,
        audience_id: selectedAudienceId || undefined,
      });
      toast.success("Broadcast campaign created!");
      setIsOpen(false);
      setName("");
      setSubject("");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to create broadcast: " + err.message);
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm("Are you sure you want to send this broadcast to all recipients in the audience?")) return;
    try {
      await api.sendBroadcast(id);
      toast.success("Broadcast is sending to all recipients!");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to send broadcast: " + err.message);
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
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
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
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Broadcast</span>
        </button>
      </div>

      {/* Broadcasts Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3">Campaign Name</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">From</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {broadcasts.length > 0 ? (
              broadcasts.map((b) => (
                <tr key={b.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white max-w-xs truncate">
                    {b.name}
                  </td>
                  <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300 max-w-xs truncate">
                    {b.subject}
                  </td>
                  <td className="px-5 py-3 font-mono text-zinc-500 dark:text-zinc-400 text-[11px] truncate">
                    {b.from}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        b.status === "sent"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40"
                          : b.status === "sending" || b.status === "queued"
                          ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/40"
                          : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                      }`}
                    >
                      {b.status === "sent" && <CheckCircle2 className="h-2.5 w-2.5" />}
                      {b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-zinc-500 dark:text-zinc-400 text-[11px]">
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {b.status !== "sent" && (
                        <button
                          onClick={() => handleSend(b.id)}
                          title="Send broadcast now"
                          className="rounded p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-surface-raised"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDuplicate(b.id)}
                        title="Duplicate broadcast"
                        className="rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-surface-raised"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        title="Delete broadcast"
                        className="rounded p-1 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-surface-raised"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  {isLoading
                    ? "Loading broadcasts..."
                    : "No broadcasts found. Create your first campaign above."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New Broadcast Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Create Broadcast Campaign</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Internal Campaign Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. October Product Launch"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Target Audience
                </label>
                <select
                  value={selectedAudienceId}
                  onChange={(e) => setSelectedAudienceId(e.target.value)}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
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
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  From Address
                </label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Company <news@yourdomain.com>"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Announcing Version 2.0!"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  HTML Content
                </label>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
                >
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

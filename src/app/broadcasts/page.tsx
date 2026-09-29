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
      <div className="flex justify-between items-center border-b border-surface-border pb-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">
            Broadcasts
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Send newsletters, product announcements, and bulk campaigns to your audience.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Broadcast</span>
        </button>
      </div>

      {/* Broadcasts Table */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Create Broadcast Campaign</h2>
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

              <div className="flex justify-end gap-3 pt-4 border-t border-surface-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-surface-border px-4 py-2 text-sm font-medium hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm font-medium hover:bg-zinc-800"
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

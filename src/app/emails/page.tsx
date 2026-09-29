"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  api,
  EmailSummary,
  EmailDetail,
  SendEmailPayload,
} from "@/lib/api";
import {
  Send,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Layers,
  ChevronRight,
  RefreshCw,
  Ban,
  ArrowUpRight,
} from "lucide-react";
import SendEmailModal from "@/components/emails/SendEmailModal";

function EmailsPageContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchJson, setBatchJson] = useState(`[
  {
    "from": "Acme <newsletter@example.com>",
    "to": ["user1@example.com"],
    "subject": "Weekly Update #1",
    "html": "<p>Hello User 1!</p>"
  },
  {
    "from": "Acme <newsletter@example.com>",
    "to": ["user2@example.com"],
    "subject": "Weekly Update #2",
    "html": "<p>Hello User 2!</p>"
  }
]`);
  const [batchSending, setBatchSending] = useState(false);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const res = await api.listEmails(100);
      setEmails(res.data || []);
      if (initialId) {
        loadEmailDetail(initialId);
      }
    } catch (err) {
      console.error("Failed to fetch emails", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmailDetail = async (id: string) => {
    try {
      const detail = await api.getEmail(id);
      setSelectedEmail(detail);
    } catch (err) {
      console.error("Failed to load email detail", err);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [initialId]);

  const handleCancelEmail = async (id: string) => {
    try {
      await api.cancelEmail(id);
      if (selectedEmail && selectedEmail.id === id) {
        loadEmailDetail(id);
      }
      fetchEmails();
    } catch (err: any) {
      alert(err.message || "Failed to cancel email");
    }
  };

  const handleSendBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchSending(true);
    try {
      const parsed: SendEmailPayload[] = JSON.parse(batchJson);
      await api.sendBatch(parsed);
      setIsBatchOpen(false);
      fetchEmails();
    } catch (err: any) {
      alert("Invalid Batch JSON or send failed: " + err.message);
    } finally {
      setBatchSending(false);
    }
  };

  const filteredEmails = emails.filter((item) => {
    const matchesSearch =
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.from.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Emails
          </h1>
          <p className="text-xs text-brand-400 mt-1">
            Browse, inspect delivery events, and manage sent transactional messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsBatchOpen(true)}
            className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-brand-300 hover:bg-surface-raised hover:text-white transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-brand-400" />
            <span>Batch Send</span>
          </button>

          <button
            onClick={() => setIsSendOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Email</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject or sender..."
            className="w-full rounded-md border border-surface-border bg-surface pl-9 pr-3 py-1.5 text-xs text-white placeholder-brand-500 focus:border-brand-500 focus:outline-none"
          />
        </div>

        <button
          onClick={fetchEmails}
          className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-brand-400 hover:bg-surface-raised hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Emails Table */}
      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-surface-border bg-surface-raised/50 text-[11px] font-medium uppercase tracking-wider text-brand-400">
            <tr>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">From</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filteredEmails.length > 0 ? (
              filteredEmails.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => loadEmailDetail(item.id)}
                  className="group cursor-pointer hover:bg-surface-raised/40 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-white max-w-xs truncate">
                    {item.subject || "(no subject)"}
                  </td>
                  <td className="px-5 py-3 font-mono text-brand-400 max-w-xs truncate">
                    {item.from}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Delivered
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-400 font-mono text-[11px]">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-brand-500 group-hover:text-white transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-brand-500">
                  {isLoading ? "Loading emails..." : "No sent emails found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Email Detail Slide-over / Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="h-full w-full max-w-xl border-l border-surface-border bg-surface p-6 shadow-2xl flex flex-col space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-surface-border pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-500">
                  Email Details
                </span>
                <h2 className="text-base font-semibold text-white">
                  {selectedEmail.subject || "(no subject)"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedEmail(null)}
                className="rounded-md p-1 text-brand-400 hover:bg-surface-raised hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-brand-500 block uppercase">ID</span>
                <span className="font-mono text-brand-200 truncate block">
                  {selectedEmail.id}
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-brand-500 block uppercase">Created At</span>
                <span className="font-mono text-brand-200 block">
                  {new Date(selectedEmail.created_at).toLocaleString()}
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3 col-span-2">
                <span className="text-[10px] text-brand-500 block uppercase">From</span>
                <span className="font-mono text-brand-200 block truncate">
                  {selectedEmail.from}
                </span>
              </div>
              {selectedEmail.message_id && (
                <div className="rounded-lg border border-surface-border bg-surface-raised p-3 col-span-2">
                  <span className="text-[10px] text-brand-500 block uppercase">Message-ID</span>
                  <span className="font-mono text-brand-200 block truncate">
                    {selectedEmail.message_id}
                  </span>
                </div>
              )}
            </div>

            {/* Deliveries list */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Recipients & Deliveries
              </h3>
              <div className="rounded-lg border border-surface-border divide-y divide-surface-border bg-surface-raised">
                {selectedEmail.deliveries && selectedEmail.deliveries.length > 0 ? (
                  selectedEmail.deliveries.map((del) => (
                    <div
                      key={del.id}
                      className="flex items-center justify-between p-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-mono text-white block">{del.recipient}</span>
                        <span className="text-[10px] text-brand-500 block">
                          Attempts: {del.attempts} · Updated:{" "}
                          {new Date(del.updated_at).toLocaleTimeString()}
                        </span>
                        {del.last_error && (
                          <span className="text-[10px] text-red-400 block">
                            Error: {del.last_error}
                          </span>
                        )}
                      </div>
                      <span className="rounded-full bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        {del.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-brand-500">
                    No recipient delivery records.
                  </div>
                )}
              </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Event Activity
              </h3>
              <div className="space-y-2 border-l border-surface-border pl-4 ml-2">
                {selectedEmail.events && selectedEmail.events.length > 0 ? (
                  selectedEmail.events.map((ev, i) => (
                    <div key={i} className="relative space-y-0.5">
                      <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-brand-400 ring-4 ring-black" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase text-white font-mono">
                          {ev.type}
                        </span>
                        <span className="text-[10px] text-brand-500 font-mono">
                          {new Date(ev.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      {ev.detail && (
                        <p className="text-[11px] text-brand-400 font-mono">
                          {ev.detail}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-brand-500">
                    No webhook or delivery events recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Cancel Action (if applicable) */}
            <div className="pt-4 border-t border-surface-border">
              <button
                onClick={() => handleCancelEmail(selectedEmail.id)}
                className="flex items-center gap-1.5 rounded-md border border-red-900/40 bg-red-950/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/40 transition-colors"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Cancel Scheduled Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Send Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-xl rounded-xl border border-surface-border bg-surface shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h2 className="text-sm font-semibold text-white">Send Batch Emails</h2>
              <button
                onClick={() => setIsBatchOpen(false)}
                className="text-brand-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-brand-400">
              Provide an array of email objects (up to 100 messages) to send in a single high-throughput API batch.
            </p>

            <form onSubmit={handleSendBatch} className="space-y-4">
              <textarea
                value={batchJson}
                onChange={(e) => setBatchJson(e.target.value)}
                rows={10}
                className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchSending}
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
                >
                  {batchSending ? "Sending..." : "Enqueue Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        onSent={() => {
          setIsSendOpen(false);
          fetchEmails();
        }}
      />
    </div>
  );
}

export default function EmailsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-brand-500">Loading emails...</div>}>
      <EmailsPageContent />
    </Suspense>
  );
}


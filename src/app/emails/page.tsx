"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  api,
  EmailSummary,
  EmailDetail,
  SendEmailPayload,
  BulkEmailPayload,
  BatchStatusView,
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
  Users,
} from "lucide-react";
import SendEmailModal from "@/components/emails/SendEmailModal";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { CursorPagination } from "@/components/ui/CursorPagination";

function EmailsPageContent() {
  const toast = useToast();
  const searchParams = useSearchParams();
  const initialId = searchParams?.get("id") ?? null;

  const [emails, setEmails] = useState<EmailSummary[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetail | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [batchJson, setBatchJson] = useState("[]");
  const [batchSending, setBatchSending] = useState(false);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkFrom, setBulkFrom] = useState("");
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkHtml, setBulkHtml] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkReplyToJson, setBulkReplyToJson] = useState("[]");
  const [bulkHeadersJson, setBulkHeadersJson] = useState("{}");
  const [bulkAttachmentsJson, setBulkAttachmentsJson] = useState("[]");
  const [bulkRecipientsJson, setBulkRecipientsJson] = useState("[]");
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [batchStatus, setBatchStatus] = useState<BatchStatusView | null>(null);
  const [isCheckingBatch, setIsCheckingBatch] = useState(false);
  const [emailBefore, setEmailBefore] = useState<string | undefined>();
  const [nextEmailBefore, setNextEmailBefore] = useState<string | undefined>();
  const [emailPageHistory, setEmailPageHistory] = useState<(string | undefined)[]>([]);
  const emailListRevision = useRef(0);
  const emailDetailRevision = useRef(0);

  const fetchEmails = async (before?: string, resetPage = true): Promise<boolean> => {
    const revision = ++emailListRevision.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.listEmails(100, before, statusFilter);
      if (revision !== emailListRevision.current) return false;
      setEmails(res.data || []);
      setEmailBefore(before);
      setNextEmailBefore(res.next_before);
      if (resetPage) setEmailPageHistory([]);
      if (resetPage && initialId) {
        void loadEmailDetail(initialId);
      }
      return true;
    } catch (err) {
      if (revision !== emailListRevision.current) return false;
      console.error("Failed to fetch emails", err);
      setLoadError(err instanceof Error ? err.message : "Could not load emails.");
      return false;
    } finally {
      if (revision === emailListRevision.current) setIsLoading(false);
    }
  };

  const loadOlderEmails = async () => {
    if (!nextEmailBefore || isLoading) return;
    const currentBefore = emailBefore;
    if (await fetchEmails(nextEmailBefore, false)) {
      setEmailPageHistory((history) => [...history, currentBefore]);
    }
  };

  const loadNewerEmails = async () => {
    if (emailPageHistory.length === 0 || isLoading) return;
    const previousBefore = emailPageHistory[emailPageHistory.length - 1];
    if (await fetchEmails(previousBefore, false)) {
      setEmailPageHistory((history) => history.slice(0, -1));
    }
  };

  const loadEmailDetail = async (id: string) => {
    const revision = ++emailDetailRevision.current;
    try {
      const detail = await api.getEmail(id);
      if (revision === emailDetailRevision.current) setSelectedEmail(detail);
    } catch (err) {
      if (revision !== emailDetailRevision.current) return;
      console.error("Failed to load email detail", err);
      toast.error("Failed to load email details: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  useEffect(() => {
    void fetchEmails();
    return () => {
      emailListRevision.current += 1;
      emailDetailRevision.current += 1;
    };
  }, [initialId, statusFilter]);

  const handleCancelEmail = async (id: string) => {
    try {
      await api.cancelEmail(id);
      toast.success("Email cancelled successfully");
      if (selectedEmail && selectedEmail.id === id) {
        void loadEmailDetail(id);
      }
      void fetchEmails();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel email");
    }
  };

  const handleSendBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchSending(true);
    try {
      const parsed: SendEmailPayload[] = JSON.parse(batchJson);
      const result = await api.sendBatch(parsed);
      setLastBatchId(result.batch_id);
      setBatchStatus(null);
      toast.success("Batch enqueued successfully");
      setIsBatchOpen(false);
      fetchEmails();
    } catch (err: any) {
      toast.error("Invalid Batch JSON or send failed: " + err.message);
    } finally {
      setBatchSending(false);
    }
  };

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkSending(true);
    try {
      const recipients = JSON.parse(bulkRecipientsJson) as BulkEmailPayload["recipients"];
      const replyTo = JSON.parse(bulkReplyToJson) as string[];
      const headers = JSON.parse(bulkHeadersJson) as Record<string, string>;
      const attachments = JSON.parse(bulkAttachmentsJson) as NonNullable<BulkEmailPayload["attachments"]>;
      if (!Array.isArray(recipients) || recipients.length === 0) {
        throw new Error("Add at least one recipient with a valid email address.");
      }
      if (!Array.isArray(replyTo) || !Array.isArray(attachments) || !headers || Array.isArray(headers) || typeof headers !== "object") {
        throw new Error("Reply-to, headers, or attachment data has an invalid JSON shape.");
      }
      const result = await api.sendBulk({
        from: bulkFrom.trim(),
        reply_to: replyTo,
        subject: bulkSubject.trim(),
        html: bulkHtml,
        text: bulkText || undefined,
        headers,
        attachments,
        recipients,
      });
      setLastBatchId(result.batch_id);
      setBatchStatus(null);
      setIsBulkOpen(false);
      toast.success("Personalized bulk send queued", `${result.count} messages queued.`);
      await fetchEmails();
    } catch (err) {
      toast.error("Bulk send failed: " + (err instanceof Error ? err.message : "Invalid recipient data"));
    } finally {
      setBulkSending(false);
    }
  };

  const checkBatchStatus = async () => {
    if (!lastBatchId || isCheckingBatch) return;
    setIsCheckingBatch(true);
    try {
      setBatchStatus(await api.getBatch(lastBatchId));
    } catch (err) {
      toast.error("Could not load batch status: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsCheckingBatch(false);
    }
  };

  const renderStatusPill = (status?: string) => {
    const s = (status || "queued").toLowerCase();
    switch (s) {
      case "delivered":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/50 border border-emerald-200/50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Delivered
          </span>
        );
      case "bounced":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50/50 border border-red-200/50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Bounced
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50/50 border border-red-200/50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            Failed
          </span>
        );
      case "canceled":
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100/50 border border-zinc-200/50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800/50 dark:border-zinc-700/50 dark:text-zinc-400">
            <Ban className="h-3.5 w-3.5" />
            Canceled
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50/50 border border-sky-200/50 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400">
            <Clock className="h-3.5 w-3.5" />
            Sent
          </span>
        );
      case "queued":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/50 border border-amber-200/50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5" />
            Queued
          </span>
        );
    }
  };

  const filteredEmails = emails.filter((item) => {
    const matchesSearch =
      (item.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.from || "").toLowerCase().includes(searchQuery.toLowerCase());
    const itemStatus = (item.status || "queued").toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      itemStatus === statusFilter.toLowerCase() ||
      (statusFilter === "canceled" && itemStatus === "cancelled");
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Emails
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Browse, inspect delivery events, and manage sent transactional messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsBulkOpen(true)} className="btn-secondary">
            <Users className="h-3.5 w-3.5" />
            <span>Personalized Bulk</span>
          </button>
          <button
            onClick={() => setIsBatchOpen(true)}
            className="btn-secondary"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Batch Send</span>
          </button>

          <button
            onClick={() => setIsSendOpen(true)}
            className="btn-primary"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Email</span>
          </button>
        </div>
      </div>

      {lastBatchId && (
        <section aria-label="Latest email batch" className="flex flex-col gap-3 rounded-lg border border-surface-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-content-primary">Latest batch</p>
            <p className="mt-0.5 truncate font-mono text-[11px] text-content-muted">{lastBatchId}</p>
            {batchStatus && (
              <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                <span className="badge badge-neutral">{batchStatus.total} total</span>
                {Object.entries(batchStatus.statuses).map(([status, count]) => (
                  <span key={status} className="badge badge-info">{status}: {count}</span>
                ))}
              </div>
            )}
          </div>
          <button onClick={checkBatchStatus} disabled={isCheckingBatch} className="btn-secondary shrink-0">
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingBatch ? "animate-spin" : ""}`} />
            <span>{isCheckingBatch ? "Checking..." : "Check status"}</span>
          </button>
        </section>
      )}

      {/* Search and Status Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-surface-raised/50 p-1 rounded-lg">
          {[
            { key: "all", label: "All" },
            { key: "delivered", label: "Delivered" },
            { key: "queued", label: "Queued" },
            { key: "sent", label: "Sent" },
            { key: "bounced", label: "Bounced" },
            { key: "failed", label: "Failed" },
            { key: "canceled", label: "Canceled" },
          ].map((tab) => {
            const count =
              tab.key === "all"
                ? emails.length
                : emails.filter(
                    (e) =>
                      (e.status || "queued").toLowerCase() === tab.key ||
                      (tab.key === "canceled" && (e.status || "").toLowerCase() === "cancelled")
                  ).length;
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-surface shadow-sm text-zinc-900 dark:bg-zinc-800 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-white" : "bg-zinc-200/50 text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search subject or sender..."
              className="w-full h-9 rounded-lg border border-surface-border bg-surface pl-9 pr-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-shadow"
            />
          </div>

          <button
            onClick={() => {
              api.clearCache();
              void fetchEmails();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            title="Refresh emails"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Emails Table */}
      {isLoading && emails.length === 0 ? (
        <TableSkeleton rows={6} columns={5} />
      ) : loadError && emails.length === 0 ? (
        <ErrorState message={loadError} onRetry={() => void fetchEmails()} />
      ) : (
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead className="border-b border-surface-border bg-surface-raised/50 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3 w-1/3">Subject</th>
              <th className="px-5 py-3 w-1/4">From</th>
              <th className="px-5 py-3 w-[15%]">Status</th>
              <th className="px-5 py-3 w-[20%]">Created</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filteredEmails.length > 0 ? (
              filteredEmails.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => void loadEmailDetail(item.id)}
                  className="group cursor-pointer hover:bg-surface-raised/50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white max-w-xs truncate">
                    {item.subject || "(no subject)"}
                  </td>
                  <td className="px-5 py-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                    {item.from}
                  </td>
                  <td className="px-5 py-3">
                    {renderStatusPill(item.status)}
                  </td>
                  <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-zinc-400 group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-white transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised text-zinc-400">
                      {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                    </div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">
                      No emails found
                    </div>
                    {!isLoading && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                        No emails match your search criteria. Try adjusting your filters.
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
      {(emailPageHistory.length > 0 || nextEmailBefore) && (
        <CursorPagination
          page={emailPageHistory.length + 1}
          canGoNewer={emailPageHistory.length > 0}
          canGoOlder={Boolean(nextEmailBefore)}
          isLoading={isLoading}
          onNewer={() => void loadNewerEmails()}
          onOlder={() => void loadOlderEmails()}
        />
      )}
      {loadError && emails.length > 0 && <ErrorState message={loadError} onRetry={() => void fetchEmails()} />}

      {/* Email Detail Slide-over / Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="h-full w-full max-w-2xl border-l border-surface-border bg-surface p-8 shadow-2xl flex flex-col space-y-8 overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-surface-border pb-6">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Email Details
                </span>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {selectedEmail.subject || "(no subject)"}
                </h2>
              </div>
              <button
                onClick={() => {
                  emailDetailRevision.current += 1;
                  setSelectedEmail(null);
                }}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-surface-border bg-surface-raised/50 p-4 space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">ID</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 truncate block">
                  {selectedEmail.id}
                </span>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-raised/50 p-4 space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">Created At</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 block">
                  {new Date(selectedEmail.created_at).toLocaleString()}
                </span>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-raised/50 p-4 col-span-2 space-y-1.5">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">From</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 block truncate">
                  {selectedEmail.from}
                </span>
              </div>
              {selectedEmail.message_id && (
                <div className="rounded-xl border border-surface-border bg-surface-raised/50 p-4 col-span-2 space-y-1.5">
                  <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 block uppercase tracking-wider">Message-ID</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-200 block truncate">
                    {selectedEmail.message_id}
                  </span>
                </div>
              )}
            </div>

            {/* Deliveries list */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                Recipients & Deliveries
              </h3>
              <div className="rounded-xl border border-surface-border divide-y divide-surface-border bg-surface-raised/30 overflow-hidden">
                {selectedEmail.deliveries && selectedEmail.deliveries.length > 0 ? (
                  selectedEmail.deliveries.map((del) => (
                    <div
                      key={del.id}
                      className="flex items-center justify-between p-4 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-mono font-medium text-zinc-900 dark:text-white block">{del.recipient}</span>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                          Attempts: {del.attempts} <span className="mx-1">•</span> Updated:{" "}
                          {new Date(del.updated_at).toLocaleTimeString()}
                        </span>
                        {del.last_error && (
                          <span className="text-[11px] text-red-600 dark:text-red-400 block mt-1">
                            Error: {del.last_error}
                          </span>
                        )}
                      </div>
                      <div>
                        {renderStatusPill(del.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    No recipient delivery records.
                  </div>
                )}
              </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-4 flex-1">
              <h3 className="text-[11px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                Event Activity
              </h3>
              <div className="relative space-y-6 border-l-2 border-surface-border pl-5 ml-2.5 pb-4">
                {selectedEmail.events && selectedEmail.events.length > 0 ? (
                  selectedEmail.events.map((ev, i) => (
                    <div key={i} className="relative">
                      <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-600 ring-4 ring-surface" />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase text-zinc-900 dark:text-white font-mono">
                            {ev.type}
                          </span>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                            {new Date(ev.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        {ev.detail && (
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono mt-1 bg-surface-raised/50 p-2 rounded-md border border-surface-border inline-block max-w-full">
                            {ev.detail}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 relative">
                    <span className="absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full bg-surface-border ring-4 ring-surface" />
                    No webhook or delivery events recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Cancel Action (if applicable) */}
            <div className="pt-6 border-t border-surface-border mt-auto">
              <button
                onClick={() => handleCancelEmail(selectedEmail.id)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto rounded-lg border border-red-200/50 bg-red-50/50 text-red-700 px-4 py-2.5 text-sm font-medium hover:bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
              >
                <Ban className="h-4 w-4" />
                <span>Cancel Scheduled Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Send Modal */}
      {isBatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-xl rounded-xl border border-surface-border bg-surface shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Send Batch Emails</h2>
              <button
                onClick={() => setIsBatchOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Provide an array of email objects (up to 100 messages) to send in a single high-throughput API batch.
            </p>

            <form onSubmit={handleSendBatch} className="space-y-4">
              <textarea
                value={batchJson}
                onChange={(e) => setBatchJson(e.target.value)}
                rows={10}
                className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchOpen(false)}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchSending}
                  className="btn-primary px-4 py-1.5 text-xs"
                >
                  {batchSending ? "Sending..." : "Enqueue Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col space-y-4 overflow-y-auto rounded-lg border border-surface-border bg-surface p-5 shadow-2xl sm:p-6">
            <div>
              <h2 className="text-sm font-semibold text-content-primary">Personalized bulk send</h2>
              <p className="mt-1 text-xs text-content-muted">One shared message template, with variables rendered individually for each recipient.</p>
            </div>
            <form onSubmit={handleSendBulk} className="space-y-3">
              <label className="block text-xs font-medium text-content-secondary">
                From address
                <input value={bulkFrom} onChange={(event) => setBulkFrom(event.target.value)} required className="input-base mt-1" placeholder="Sender email address" />
              </label>
              <label className="block text-xs font-medium text-content-secondary">
                Subject
                <input value={bulkSubject} onChange={(event) => setBulkSubject(event.target.value)} required className="input-base mt-1" placeholder="Welcome, {{first_name}}" />
              </label>
              <label className="block text-xs font-medium text-content-secondary">
                HTML body
                <textarea value={bulkHtml} onChange={(event) => setBulkHtml(event.target.value)} rows={5} className="input-base mt-1 font-mono" />
              </label>
              <label className="block text-xs font-medium text-content-secondary">
                Plain-text body (optional)
                <textarea value={bulkText} onChange={(event) => setBulkText(event.target.value)} rows={3} className="input-base mt-1 font-mono" />
              </label>
              <label className="block text-xs font-medium text-content-secondary">
                Recipients and variables (JSON)
                <textarea value={bulkRecipientsJson} onChange={(event) => setBulkRecipientsJson(event.target.value)} required rows={7} className="input-base mt-1 font-mono" />
              </label>
              <details className="rounded-md border border-surface-border bg-surface-raised px-3 py-2">
                <summary className="cursor-pointer text-xs font-medium text-content-secondary">Advanced headers, reply-to, attachments</summary>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-medium text-content-secondary">Reply-to addresses (JSON array)
                    <textarea value={bulkReplyToJson} onChange={(event) => setBulkReplyToJson(event.target.value)} rows={2} className="input-base mt-1 font-mono" />
                  </label>
                  <label className="block text-xs font-medium text-content-secondary">Headers (JSON object)
                    <textarea value={bulkHeadersJson} onChange={(event) => setBulkHeadersJson(event.target.value)} rows={2} className="input-base mt-1 font-mono" />
                  </label>
                  <label className="block text-xs font-medium text-content-secondary">Attachments (base64 JSON array)
                    <textarea value={bulkAttachmentsJson} onChange={(event) => setBulkAttachmentsJson(event.target.value)} rows={3} className="input-base mt-1 font-mono" />
                  </label>
                </div>
              </details>
              <div className="flex justify-end gap-2 border-t border-surface-border pt-3">
                <button type="button" onClick={() => setIsBulkOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={bulkSending} className="btn-primary">
                  {bulkSending ? "Queueing..." : "Queue personalized send"}
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
    <Suspense fallback={<div className="p-8 text-xs text-zinc-500">Loading emails...</div>}>
      <EmailsPageContent />
    </Suspense>
  );
}


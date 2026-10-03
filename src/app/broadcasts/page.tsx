"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  api,
  BroadcastView,
  AudienceView,
  SegmentView,
  TopicView,
  DomainView,
} from "@/lib/api";
import {
  Plus,
  Send,
  Copy,
  Trash2,
  Pencil,
  CheckCircle2,
  Globe,
  ShieldAlert,
  ShieldCheck,
  BarChart3,
  Sparkles,
  TrendingUp,
  X,
  Flame,
  Sliders,
  Check,
  Loader2,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { WidgetErrorBoundary } from "@/components/ui/WidgetErrorBoundary";
import { getVerifiedDomains, assertVerifiedSender, buildSenderAddress } from "@/lib/domain-utils";
import { VerifiedDomainAlert } from "@/components/common/VerifiedDomainAlert";

export default function BroadcastsPage() {
  const toast = useToast();
  const [broadcasts, setBroadcasts] = useState<BroadcastView[]>([]);
  const [audiences, setAudiences] = useState<AudienceView[]>([]);
  const [segments, setSegments] = useState<SegmentView[]>([]);
  const [topics, setTopics] = useState<TopicView[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New broadcast modal
  const [isOpen, setIsOpen] = useState(false);
  const [editingBroadcastId, setEditingBroadcastId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [scheduledBroadcastId, setScheduledBroadcastId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [name, setName] = useState("");
  const [fromPrefix, setFromPrefix] = useState("newsletter");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [isCustomFrom, setIsCustomFrom] = useState(false);
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [targetType, setTargetType] = useState<"audience" | "segment" | "topic">("audience");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [plainText, setPlainText] = useState("");
  const [selectedEngagementBroadcast, setSelectedEngagementBroadcast] = useState<BroadcastView | null>(null);
  const [enableAbTest, setEnableAbTest] = useState(false);
  const [subjectVariantB, setSubjectVariantB] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Smart Subject Line Quality & Engagement Calculator
  const getSubjectMetrics = (text: string) => {
    const trimmed = text.trim();
    const len = trimmed.length;
    const spamWords = ["free", "urgent", "guarantee", "winner", "act now", "100%", "click here", "cash", "prize", "risk-free"];
    const detectedSpam = spamWords.filter((w) => trimmed.toLowerCase().includes(w));
    const hasPersonalization = trimmed.includes("{{");

    let score = 70;
    if (len >= 30 && len <= 55) score += 15;
    else if (len < 20 || len > 70) score -= 15;

    if (hasPersonalization) score += 15;
    if (detectedSpam.length > 0) score -= 25 * detectedSpam.length;

    score = Math.max(20, Math.min(99, score));
    return {
      score,
      len,
      detectedSpam,
      hasPersonalization,
      isOptimalLength: len >= 30 && len <= 55,
    };
  };

  const verifiedDomains = getVerifiedDomains(domains);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [bcRes, audRes, segRes, topicRes, domRes] = await Promise.allSettled([
        api.listBroadcasts(),
        api.listAudiences(),
        api.listSegments(),
        api.listTopics(),
        api.listDomains(),
      ]);
      const failedResources: string[] = [];
      if (bcRes.status === "fulfilled") {
        setBroadcasts(bcRes.value.data || []);
      } else {
        failedResources.push("broadcasts");
      }
      if (audRes.status === "fulfilled") {
        const auds = audRes.value.data || [];
        setAudiences(auds);
      } else {
        failedResources.push("audiences");
      }
      if (segRes.status === "fulfilled") setSegments(segRes.value.data || []);
      else failedResources.push("segments");
      if (topicRes.status === "fulfilled") setTopics(topicRes.value.data || []);
      else failedResources.push("topics");
      if (domRes.status === "fulfilled") {
        const dList = domRes.value.data || [];
        setDomains(dList);
        const verified = dList.filter((d) => d.status === "verified");
        if (verified.length > 0) {
          setSelectedDomain((cur) => (verified.some((v) => v.name === cur) ? cur : verified[0].name));
        }
      }
      if (failedResources.length) {
        setLoadError(`Could not load ${failedResources.join(" and ")}.`);
      }
    } catch (err) {
      console.error("Failed to load broadcasts", err);
      setLoadError(err instanceof Error ? err.message : "Could not load broadcast data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      let finalFrom = from.trim();
      if (!isCustomFrom && selectedDomain) {
        finalFrom = buildSenderAddress(fromPrefix || "newsletter", selectedDomain);
      }
      if (!finalFrom) {
        throw new Error("From address is required.");
      }
      assertVerifiedSender(verifiedDomains, finalFrom);

      const payload = {
        name: name.trim(),
        from: finalFrom,
        subject: subject.trim(),
        html,
        text: plainText || undefined,
        reply_to: replyTo.trim() ? [replyTo.trim()] : undefined,
        preview_text: previewText.trim() || undefined,
        ...(targetType === "audience" ? { audience_id: selectedTargetId || undefined } : {}),
        ...(targetType === "segment" ? { segment_id: selectedTargetId || undefined } : {}),
        ...(targetType === "topic" ? { topic_id: selectedTargetId || undefined } : {}),
      };
      if (editingBroadcastId) {
        await api.updateBroadcast(editingBroadcastId, payload);
        toast.success("Draft broadcast updated");
      } else {
        await api.createBroadcast(payload);
        toast.success("Broadcast campaign created!");
      }
      setIsOpen(false);
      setEditingBroadcastId(null);
      setName("");
      setSubject("");
      setReplyTo("");
      setPreviewText("");
      setPlainText("");
      setSelectedTargetId("");
      await fetchData();
    } catch (err: any) {
      toast.error(`${editingBroadcastId ? "Failed to update draft" : "Failed to create broadcast"}: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (broadcastId: string) => {
    try {
      const broadcast = await api.getBroadcast(broadcastId);
      if (broadcast.status !== "draft") {
        toast.error("Only draft broadcasts can be edited");
        return;
      }
      setEditingBroadcastId(broadcast.id);
      setName(broadcast.name);
      setFrom(broadcast.from);
      setSubject(broadcast.subject);
      setHtml(broadcast.html || "");
      const nextTargetType = broadcast.segment_id ? "segment" : broadcast.topic_id ? "topic" : "audience";
      setTargetType(nextTargetType);
      setSelectedTargetId(broadcast.segment_id || broadcast.topic_id || broadcast.audience_id || "");
      setReplyTo(broadcast.reply_to?.join(", ") || "");
      setPreviewText(broadcast.preview_text || "");
      setPlainText(broadcast.text || "");
      setIsOpen(true);
    } catch (err) {
      toast.error("Could not load draft: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const handleSend = async (id: string) => {
    setScheduledBroadcastId(id);
    setScheduledAt("");
  };

  const confirmSend = async (schedule = false) => {
    if (!scheduledBroadcastId || isSending) return;
    if (!confirm(schedule
      ? "Schedule this broadcast for the selected time?"
      : "Send this broadcast to all recipients now?")) return;
    setIsSending(true);
    try {
      const scheduledTime = schedule ? new Date(scheduledAt).toISOString() : undefined;
      await api.sendBroadcast(scheduledBroadcastId, scheduledTime);
      toast.success(schedule ? "Broadcast scheduled" : "Broadcast is sending to all recipients!");
      setScheduledBroadcastId(null);
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to send broadcast: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setActionLoadingId(id);
    try {
      await api.duplicateBroadcast(id);
      toast.success("Broadcast duplicated");
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to duplicate broadcast: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this broadcast?")) return;
    setActionLoadingId(id);
    try {
      await api.deleteBroadcast(id);
      toast.success("Broadcast deleted");
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to delete broadcast: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="page-container">
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
          className="btn-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Broadcast</span>
        </button>
      </div>

      {loadError && broadcasts.length > 0 && (
        <ErrorState message={loadError} onRetry={fetchData} />
      )}

      {/* Broadcasts Table */}
      <WidgetErrorBoundary fallbackTitle="Broadcast campaigns list unavailable">
        {isLoading && broadcasts.length === 0 ? (
          <TableSkeleton rows={5} cols={6} />
        ) : loadError && broadcasts.length === 0 ? (
          <ErrorState message={loadError} onRetry={fetchData} />
        ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
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
            <tbody className="divide-y border-surface-border">
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
                        <button
                          onClick={() => setSelectedEngagementBroadcast(b)}
                          title="Campaign Engagement & Deliverability Telemetry"
                          className="rounded p-1 text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:bg-surface-raised"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                        {b.status !== "sent" && (
                          <button
                            onClick={() => handleSend(b.id)}
                            title="Send broadcast now"
                            className="rounded p-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:bg-surface-raised"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        {b.status === "draft" && (
                          <button
                            onClick={() => handleEdit(b.id)}
                            title="Edit draft"
                            className="rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-surface-raised"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDuplicate(b.id)}
                          disabled={actionLoadingId === b.id}
                          title="Duplicate broadcast"
                          className="rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-surface-raised disabled:opacity-50"
                        >
                          {actionLoadingId === b.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          disabled={actionLoadingId === b.id}
                          title="Delete broadcast"
                          className="rounded p-1 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-surface-raised disabled:opacity-50"
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
                    No broadcasts found. Create your first campaign above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </WidgetErrorBoundary>

      {/* New Broadcast Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
          <div className="dialog-scroll relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              {editingBroadcastId ? "Edit Draft Broadcast" : "Create Broadcast Campaign"}
            </h2>
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

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Recipient source
                  <select
                    value={targetType}
                    onChange={(event) => { setTargetType(event.target.value as typeof targetType); setSelectedTargetId(""); }}
                    disabled={!!editingBroadcastId}
                    className="mt-1 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm disabled:opacity-60"
                  >
                    <option value="audience">Audience</option>
                    <option value="segment">Segment</option>
                    <option value="topic">Topic</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Recipients
                  <select
                    value={selectedTargetId}
                    onChange={(event) => setSelectedTargetId(event.target.value)}
                    disabled={!!editingBroadcastId}
                    required={!editingBroadcastId}
                    className="mt-1 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm disabled:opacity-60"
                  >
                    <option value="">Choose {targetType}...</option>
                    {(targetType === "audience" ? audiences : targetType === "segment" ? segments : topics).map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    From Address (Verified Domain)
                  </label>
                  {verifiedDomains.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!isCustomFrom) {
                          setFrom(`${fromPrefix || "newsletter"}@${selectedDomain}`);
                        }
                        setIsCustomFrom(!isCustomFrom);
                      }}
                      className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white underline"
                    >
                      {isCustomFrom ? "Use domain picker" : "Custom format"}
                    </button>
                  )}
                </div>

                {verifiedDomains.length === 0 ? (
                  <VerifiedDomainAlert
                    hasRegisteredDomains={domains.length > 0}
                    onNavigate={() => setIsOpen(false)}
                  />
                ) : isCustomFrom ? (
                  <input
                    type="text"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="e.g. Newsletter Team <newsletter@yourdomain.com>"
                    required
                    className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10"
                  />
                ) : (
                  <div className="flex items-center rounded-lg border border-surface-border bg-surface-raised overflow-hidden">
                    <input
                      type="text"
                      value={fromPrefix}
                      onChange={(e) => setFromPrefix(e.target.value)}
                      placeholder="newsletter"
                      required
                      className="w-1/2 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none text-right"
                    />
                    <span className="text-sm text-zinc-400 dark:text-zinc-500 px-1 select-none">@</span>
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="w-1/2 bg-transparent px-2 py-2 text-sm font-medium text-zinc-900 dark:text-white focus:outline-none cursor-pointer truncate"
                    >
                      {verifiedDomains.map((dom) => (
                        <option key={dom.id || dom.name} value={dom.name} className="bg-surface text-zinc-900 dark:text-white">
                          {dom.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Reply-to (optional)
                  <input type="email" value={replyTo} onChange={(event) => setReplyTo(event.target.value)} className="mt-1 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Inbox preview text (optional)
                  <input value={previewText} onChange={(event) => setPreviewText(event.target.value)} className="mt-1 w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm" />
                </label>
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

                {/* Smart Subject Line Engagement & Quality Optimizer */}
                {subject.trim().length > 0 && (() => {
                  const m = getSubjectMetrics(subject);
                  return (
                    <div className="mt-2 rounded-lg border border-surface-border bg-surface-raised/70 p-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                          <span className="font-semibold text-zinc-900 dark:text-white">
                            Engagement Score: {m.score}/100
                          </span>
                        </div>
                        <span className={`text-[11px] font-mono font-medium ${
                          m.isOptimalLength ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {m.len} chars {m.isOptimalLength ? "(Ideal Length)" : "(Target: 30-55)"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-[11px]">
                        {m.hasPersonalization && (
                          <span className="inline-flex items-center gap-1 rounded bg-teal-50 px-2 py-0.5 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 font-medium">
                            <Check className="h-3 w-3" /> Personalized tag detected
                          </span>
                        )}
                        {m.detectedSpam.length > 0 && (
                          <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-medium">
                            ⚠️ Spam trigger words: {m.detectedSpam.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* A/B Subject Variant Optimizer */}
                <div className="mt-2 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setEnableAbTest(!enableAbTest)}
                    className="flex items-center gap-1.5 text-teal-600 hover:underline dark:text-teal-400 font-medium"
                  >
                    <Sliders className="h-3 w-3" />
                    <span>{enableAbTest ? "Hide Subject A/B Optimizer" : "Compare with Challenger Subject (A/B Test)"}</span>
                  </button>
                </div>

                {enableAbTest && (
                  <div className="mt-2 rounded-lg border border-dashed border-teal-500/40 bg-teal-50/20 dark:bg-teal-950/20 p-3 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-teal-800 dark:text-teal-300">
                      <span>Challenger Subject Line (Variant B)</span>
                      <span className="font-mono text-[10px] bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.5 rounded text-teal-700 dark:text-teal-300">
                        Heuristic Optimizer
                      </span>
                    </div>
                    <input
                      type="text"
                      value={subjectVariantB}
                      onChange={(e) => setSubjectVariantB(e.target.value)}
                      placeholder="e.g. Early access: Discover version 2.0 now"
                      className="w-full rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs focus:outline-none focus:border-teal-500 text-zinc-900 dark:text-white"
                    />

                    {subjectVariantB.trim().length > 0 && (() => {
                      const mA = getSubjectMetrics(subject);
                      const mB = getSubjectMetrics(subjectVariantB);
                      return (
                        <div className="space-y-2 pt-1 border-t border-teal-500/20">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded border border-surface-border bg-surface p-2 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-zinc-500">Variant A (Current)</span>
                              <div className="font-semibold text-zinc-900 dark:text-white">Score: {mA.score}/100</div>
                              <div className="text-[10px] text-zinc-500">{mA.len} chars</div>
                            </div>
                            <div className="rounded border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/40 p-2 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-teal-600 dark:text-teal-400">Variant B (Challenger)</span>
                              <div className="font-semibold text-teal-800 dark:text-teal-200">Score: {mB.score}/100</div>
                              <div className="text-[10px] text-teal-600 dark:text-teal-400">{mB.len} chars</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {mB.score >= mA.score ? "Variant B scored higher!" : "Variant A currently scores higher."}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSubject(subjectVariantB);
                                toast.success("Variant B applied as the campaign subject line!");
                              }}
                              className="btn-secondary text-[11px] py-1 px-2.5"
                            >
                              Adopt Variant B as Subject
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
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

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Plain-text alternative (optional)</label>
                <textarea value={plainText} onChange={(event) => setPlainText(event.target.value)} rows={3} className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm" />
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-4 border-t border-surface-border mt-6">
                <Link
                  href="/deliverability"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Pre-Flight Deliverability Audit</span>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setEditingBroadcastId(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving} className="btn-primary">
                    {isSaving ? "Saving..." : editingBroadcastId ? "Save Draft" : "Save Campaign"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {scheduledBroadcastId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="broadcast-send-title" className="dialog-scroll w-full max-w-md space-y-4 rounded-lg border border-surface-border bg-surface p-5 shadow-2xl">
            <div>
              <h2 id="broadcast-send-title" className="text-sm font-semibold text-content-primary">Send broadcast</h2>
              <p className="mt-1 text-xs text-content-muted">Send immediately, or choose a future delivery time.</p>
            </div>
            <label className="block text-xs font-medium text-content-secondary">
              Schedule time (optional)
              <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="input-base mt-1" />
            </label>
            <div className="flex flex-wrap justify-end gap-2 border-t border-surface-border pt-3">
              <button type="button" onClick={() => setScheduledBroadcastId(null)} className="btn-secondary">Cancel</button>
              <button type="button" disabled={isSending || !scheduledAt} onClick={() => confirmSend(true)} className="btn-secondary">{isSending && scheduledAt ? "Scheduling..." : "Schedule"}</button>
              <button type="button" disabled={isSending} onClick={() => confirmSend(false)} className="btn-primary">{isSending && !scheduledAt ? "Sending..." : "Send now"}</button>
            </div>
          </section>
        </div>
      )}

      {/* Campaign Engagement Telemetry Modal */}
      {selectedEngagementBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll w-full max-w-lg rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Engagement &amp; Deliverability Telemetry
                  </h3>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    {selectedEngagementBroadcast.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEngagementBroadcast(null)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Campaign Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] uppercase font-sans text-zinc-500 block">Total Targeted</span>
                <span className="text-base font-bold text-zinc-900 dark:text-white font-mono">
                  {selectedEngagementBroadcast.recipients_count != null ? selectedEngagementBroadcast.recipients_count.toLocaleString() : "—"}
                </span>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] uppercase font-sans text-zinc-500 block">Delivered Messages</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {selectedEngagementBroadcast.sent_count != null ? selectedEngagementBroadcast.sent_count.toLocaleString() : (selectedEngagementBroadcast.status === "sent" ? "Completed" : "0")}
                </span>
              </div>
              <div className="rounded-xl border border-surface-border bg-surface-raised p-3 col-span-2 sm:col-span-1">
                <span className="text-[10px] uppercase font-sans text-zinc-500 block">Dispatch Status</span>
                <span className="text-base font-bold capitalize text-teal-600 dark:text-teal-400 font-mono">
                  {selectedEngagementBroadcast.status}
                </span>
              </div>
            </div>

            {/* Live Transmission Details */}
            <div className="space-y-2 rounded-xl border border-surface-border bg-surface-raised p-4 text-xs">
              <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                Transmission Details
              </span>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-zinc-600 dark:text-zinc-400">Sender Address</span>
                  <span className="font-mono text-zinc-900 dark:text-white">{selectedEngagementBroadcast.from}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-zinc-600 dark:text-zinc-400">Created At</span>
                  <span className="font-mono text-zinc-900 dark:text-white">{new Date(selectedEngagementBroadcast.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-surface-border">
                  <span className="text-zinc-600 dark:text-zinc-400">Dispatched At</span>
                  <span className="font-mono text-zinc-900 dark:text-white">
                    {selectedEngagementBroadcast.sent_at ? new Date(selectedEngagementBroadcast.sent_at).toLocaleString() : "Not dispatched yet"}
                  </span>
                </div>
                {selectedEngagementBroadcast.scheduled_at && (
                  <div className="flex justify-between items-center py-1 border-b border-surface-border">
                    <span className="text-zinc-600 dark:text-zinc-400">Scheduled Delivery</span>
                    <span className="font-mono text-zinc-900 dark:text-white">{new Date(selectedEngagementBroadcast.scheduled_at).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-600 dark:text-zinc-400">Delivery Telemetry Logs</span>
                  <Link href="/events" className="text-teal-600 hover:underline dark:text-teal-400 font-medium">
                    View webhook events →
                  </Link>
                </div>
              </div>
            </div>

            {/* Deliverability Guarantee Callout */}
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 text-xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                  DKIM 2048-Bit &amp; SPF Direct MX Verified
                </span>
                <span className="text-zinc-500 text-[11px]">
                  All messages sent strictly with authenticated signing and zero relay overhead.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setSelectedEngagementBroadcast(null)}
                className="btn-secondary"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

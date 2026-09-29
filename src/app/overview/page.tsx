"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  api,
  AnalyticsResponse,
  EmailSummary,
  DomainView,
} from "@/lib/api";
import {
  Send,
  CheckCircle2,
  Eye,
  MousePointer,
  AlertTriangle,
  ArrowRight,
  Globe,
  Key,
  Inbox,
  RefreshCw,
} from "lucide-react";
import CodeSnippet from "@/components/ui/CodeSnippet";
import SendEmailModal from "@/components/emails/SendEmailModal";

export default function OverviewPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [recentEmails, setRecentEmails] = useState<EmailSummary[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interval, setInterval] = useState<"hour" | "day" | "week" | "month">("day");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, emailsData, domainsData] = await Promise.allSettled([
        api.getAnalytics({ interval }),
        api.listEmails(8),
        api.listDomains(),
      ]);

      if (analyticsData.status === "fulfilled") {
        setAnalytics(analyticsData.value);
      }
      if (emailsData.status === "fulfilled") {
        setRecentEmails(emailsData.value.data || []);
      }
      if (domainsData.status === "fulfilled") {
        setDomains(domainsData.value.data || []);
      }
    } catch (err) {
      console.error("Failed to load overview data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to sent email event to auto-refresh
    const handleSent = () => loadData();
    window.addEventListener("mailhost_email_sent", handleSent);
    return () => window.removeEventListener("mailhost_email_sent", handleSent);
  }, [interval]);

  const totals = analytics?.totals || {
    sent: 0,
    delivered: 0,
    bounced: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
  };

  const rates = analytics?.rates || {
    delivery_rate: 0,
    bounce_rate: 0,
    failure_rate: 0,
    open_rate: 0,
    click_rate: 0,
  };

  // Compute maximum bucket count for chart scaling
  const maxSeriesCount = Math.max(
    ...(analytics?.series?.map((s) => s.sent) || [1]),
    1
  );

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Overview
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time delivery performance and account activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Interval selector */}
          <div className="flex rounded-md border border-surface-border bg-surface p-0.5">
            {(["hour", "day", "week", "month"] as const).map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  interval === int
                    ? "bg-surface-raised text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {int}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            title="Refresh analytics"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Email</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* Sent */}
        <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Sent</span>
            <Send className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {totals.sent.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500">All outbound messages</div>
        </div>

        {/* Delivered */}
        <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Delivered</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {totals.delivered.toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {(rates.delivery_rate * 100).toFixed(1)}% rate
          </div>
        </div>

        {/* Opened */}
        <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Opened</span>
            <Eye className="h-3.5 w-3.5 text-sky-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {totals.opened.toLocaleString()}
          </div>
          <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
            {(rates.open_rate * 100).toFixed(1)}% rate
          </div>
        </div>

        {/* Clicked */}
        <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Clicked</span>
            <MousePointer className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {totals.clicked.toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
            {(rates.click_rate * 100).toFixed(1)}% rate
          </div>
        </div>

        {/* Bounced / Failed */}
        <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-1 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
            <span>Bounced</span>
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          </div>
          <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
            {totals.bounced.toLocaleString()}
          </div>
          <div className="text-[11px] text-red-600 dark:text-red-400 font-medium">
            {(rates.bounce_rate * 100).toFixed(1)}% rate
          </div>
        </div>
      </div>

      {/* Activity Timeline Chart */}
      <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Email Volume</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Aggregated deliveries grouped by {interval}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-white" /> Sent
            </span>
            <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Delivered
            </span>
            <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Opened
            </span>
          </div>
        </div>

        {/* Bar representation */}
        <div className="h-44 w-full flex items-end gap-1.5 pt-6 border-b border-surface-border">
          {analytics?.series && analytics.series.length > 0 ? (
            analytics.series.map((bucket, i) => {
              const heightPct = Math.max(
                (bucket.sent / maxSeriesCount) * 100,
                bucket.sent > 0 ? 8 : 2
              );
              const dateLabel = new Date(bucket.bucket).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip */}
                  <div className="absolute -top-10 hidden group-hover:flex z-10 flex-col items-center bg-surface-raised border border-surface-border px-2 py-1 rounded text-[10px] text-zinc-700 dark:text-zinc-200 shadow-lg pointer-events-none whitespace-nowrap">
                    <span>{dateLabel}</span>
                    <span className="font-mono text-zinc-900 dark:text-white font-medium">
                      {bucket.sent} sent · {bucket.delivered} delivered
                    </span>
                  </div>

                  {/* Stacked bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-t bg-gradient-to-t from-zinc-300 to-zinc-800 dark:from-zinc-700 dark:to-white/90 group-hover:to-black dark:group-hover:to-white transition-all"
                  />
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
              No email volume recorded in this timeframe yet.
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Recent Activity & Quick SDK Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Emails */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Emails</h2>
            <Link
              href="/emails"
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-surface-border">
            {recentEmails.length > 0 ? (
              recentEmails.map((email) => (
                <Link
                  key={email.id}
                  href={`/emails?id=${email.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-surface-raised/40 px-2 rounded-md transition-colors"
                >
                  <div className="space-y-0.5 truncate max-w-[70%]">
                    <p className="text-xs font-medium text-zinc-900 dark:text-zinc-200 truncate">
                      {email.subject || "(no subject)"}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                      {email.from}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${
                      email.status === "delivered"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800/40 dark:text-emerald-400"
                        : email.status === "bounced"
                        ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/60 dark:border-red-800/40 dark:text-red-400"
                        : email.status === "failed"
                        ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800/40 dark:text-rose-400"
                        : email.status === "sent"
                        ? "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/60 dark:border-sky-800/40 dark:text-sky-400"
                        : email.status === "canceled"
                        ? "bg-zinc-100 border-zinc-200 text-zinc-600 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400"
                        : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/60 dark:border-amber-800/40 dark:text-amber-400"
                    }`}>
                      {email.status || "queued"}
                    </span>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">
                      {new Date(email.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No emails sent yet. Click "Send Email" to get started!
              </div>
            )}
          </div>
        </div>

        {/* Quick Send SDK Snippet */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">API Integration</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Send your first email with 3 lines of code.
              </p>
            </div>
            <Link
              href="/api-keys"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              Manage keys →
            </Link>
          </div>

          <CodeSnippet
            apiKey="re_live_..."
            domain={domains[0]?.name || "yourdomain.com"}
          />
        </div>
      </div>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSent={() => {
          setIsSendModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
}

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
    <div className="page-container">
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

        <div className="flex items-center gap-2.5">
          {/* Interval selector */}
          <div className="flex items-center rounded-lg border border-surface-border bg-surface p-0.5">
            {(["hour", "day", "week", "month"] as const).map((int) => (
              <button
                key={int}
                onClick={() => setInterval(int)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  interval === int
                    ? "bg-surface-raised text-zinc-900 dark:text-white font-medium shadow-sm border border-surface-border/50"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
              >
                {int}
              </button>
            ))}
          </div>

          <button
            onClick={loadData}
            title="Refresh analytics"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setIsSendModalOpen(true)}
            className="btn-primary"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Email</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Sent */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Sent</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Send className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              {totals.sent.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              All outbound messages
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Delivered</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              {totals.delivered.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              {(rates.delivery_rate * 100).toFixed(1)}% rate
            </div>
          </div>
        </div>

        {/* Opened */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Opened</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 dark:bg-sky-500/10">
              <Eye className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              {totals.opened.toLocaleString()}
            </div>
            <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-1">
              {(rates.open_rate * 100).toFixed(1)}% rate
            </div>
          </div>
        </div>

        {/* Clicked */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Clicked</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-500/10">
              <MousePointer className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              {totals.clicked.toLocaleString()}
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
              {(rates.click_rate * 100).toFixed(1)}% rate
            </div>
          </div>
        </div>

        {/* Bounced / Failed */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-3 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Bounced</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              {totals.bounced.toLocaleString()}
            </div>
            <div className="text-[11px] text-red-600 dark:text-red-400 font-medium mt-1">
              {(rates.bounce_rate * 100).toFixed(1)}% rate
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline Chart */}
      <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
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
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
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
                  className="flex items-center justify-between py-3 hover:bg-surface-raised/50 -mx-2 px-2 rounded-md transition-colors"
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
                    <span className={`badge capitalize ${
                      email.status === "delivered"
                        ? "badge-success"
                        : email.status === "bounced" || email.status === "failed"
                        ? "badge-error"
                        : email.status === "sent"
                        ? "badge-info"
                        : email.status === "canceled"
                        ? "badge-neutral"
                        : "badge-warning"
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
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">API Integration</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Send your first email with 3 lines of code.
              </p>
            </div>
            <Link
              href="/api-keys"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            >
              Manage keys →
            </Link>
          </div>

          <div className="pt-2">
            <CodeSnippet
              apiKey="re_live_..."
              domain={domains[0]?.name || "yourdomain.com"}
            />
          </div>
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

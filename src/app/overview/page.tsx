"use client";

import React, { useEffect, useRef, useState } from "react";
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
  RefreshCw,
  Radio,
  Users,
  GitBranch,
  FileText,
  Mail,
  Server,
  Inbox,
  ArrowRightLeft,
  Globe,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import CodeSnippet from "@/components/ui/CodeSnippet";
import { ErrorState } from "@/components/ui/ErrorState";
import { WidgetErrorBoundary } from "@/components/ui/WidgetErrorBoundary";

export default function OverviewPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [recentEmails, setRecentEmails] = useState<EmailSummary[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [interval, setInterval] = useState<"hour" | "day" | "week" | "month">("day");
  const loadRevision = useRef(0);

  const loadData = async () => {
    const revision = ++loadRevision.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [analyticsData, emailsData, domainsData] = await Promise.allSettled([
        api.getAnalytics({ interval }),
        api.listEmails(8),
        api.listDomains(),
      ]);
      if (revision !== loadRevision.current) return;

      const failedResources: string[] = [];
      if (analyticsData.status === "fulfilled") {
        setAnalytics(analyticsData.value);
      } else {
        failedResources.push("analytics");
      }
      if (emailsData.status === "fulfilled") {
        setRecentEmails(emailsData.value.data || []);
      } else {
        failedResources.push("recent emails");
      }
      if (domainsData.status === "fulfilled") {
        setDomains(domainsData.value.data || []);
      } else {
        failedResources.push("domains");
      }
      if (failedResources.length) {
        setLoadError(`Could not load ${failedResources.join(" and ")}.`);
      }
    } catch (err) {
      if (revision !== loadRevision.current) return;
      console.error("Failed to load overview data", err);
      setLoadError(err instanceof Error ? err.message : "Could not load overview data.");
    } finally {
      if (revision === loadRevision.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();

    // Listen to sent email event to auto-refresh
    const handleSent = () => {
      api.clearCache();
      void loadData();
    };
    window.addEventListener("mailhost_email_sent", handleSent);
    return () => {
      window.removeEventListener("mailhost_email_sent", handleSent);
      loadRevision.current += 1;
    };
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Overview
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              <Sparkles className="w-2.5 h-2.5" /> All-in-One Suite
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            One simple home for all your emails: send newsletters, automate customer journeys, and manage custom business mailboxes.
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
            onClick={() => {
              api.clearCache();
              void loadData();
            }}
            title="Refresh analytics"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>

        </div>
      </div>

      {loadError && <ErrorState message={loadError} onRetry={loadData} />}

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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/10">
              <Eye className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              {totals.opened.toLocaleString()}
            </div>
            <div className="text-[11px] text-teal-700 dark:text-teal-300 font-medium mt-1">
              {(rates.open_rate * 100).toFixed(1)}% rate
            </div>
          </div>
        </div>

        {/* Clicked */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Clicked</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/10">
              <MousePointer className="h-4 w-4 text-teal-700 dark:text-teal-300" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-white tracking-tight">
              {totals.clicked.toLocaleString()}
            </div>
            <div className="text-[11px] text-teal-700 dark:text-teal-300 font-medium mt-1">
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
      <WidgetErrorBoundary fallbackTitle="Email volume chart unavailable">
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Email Volume</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Emails delivered grouped by {interval}
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
                <span className="h-2 w-2 rounded-full bg-teal-600" /> Opened
              </span>
            </div>
          </div>

          {/* Bar representation */}
          <div
            role="img"
            aria-label={`Aggregated email delivery chart grouped by ${interval}`}
            className="h-44 w-full flex items-end gap-1.5 pt-6 border-b border-surface-border"
          >
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
      </WidgetErrorBoundary>

      {/* Platform Capabilities: Marketing & Mailbox Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pillar 1: Marketing & Growth */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Marketing & Campaigns</h2>
                <p className="text-[11px] text-zinc-500">Send newsletters, manage contacts, automate series & build templates</p>
              </div>
            </div>
            <span className="badge badge-info text-[10px]">Marketing Suite</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link
              href="/broadcasts"
              className="group rounded-lg border border-surface-border bg-surface-raised p-3 hover:border-teal-500/50 hover:bg-surface transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">Broadcasts</span>
                <Radio className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Send newsletters & announcements</p>
              <span className="mt-2 text-[10px] text-teal-600 dark:text-teal-400 font-medium group-hover:underline">Launch Campaign →</span>
            </Link>

            <Link
              href="/audiences"
              className="group rounded-lg border border-surface-border bg-surface-raised p-3 hover:border-teal-500/50 hover:bg-surface transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">Audiences</span>
                <Users className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Subscriber lists, contact details & user groups</p>
              <span className="mt-2 text-[10px] text-teal-600 dark:text-teal-400 font-medium group-hover:underline">Manage Contacts →</span>
            </Link>

            <Link
              href="/automations"
              className="group rounded-lg border border-surface-border bg-surface-raised p-3 hover:border-teal-500/50 hover:bg-surface transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">Automations</span>
                <GitBranch className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Welcome series, customer follow-ups & auto-replies</p>
              <span className="mt-2 text-[10px] text-teal-600 dark:text-teal-400 font-medium group-hover:underline">Build Workflow →</span>
            </Link>

            <Link
              href="/templates"
              className="group rounded-lg border border-surface-border bg-surface-raised p-3 hover:border-teal-500/50 hover:bg-surface transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">Templates</span>
                <FileText className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Reusable email designs with easy editing</p>
              <span className="mt-2 text-[10px] text-teal-600 dark:text-teal-400 font-medium group-hover:underline">Design Template →</span>
            </Link>
          </div>
        </div>

        {/* Pillar 2: Complete Mailboxes & Setup */}
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                <Server className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Mailboxes & Email Apps</h2>
                <p className="text-[11px] text-zinc-500">Mail app setup, incoming inbox & forwarding</p>
              </div>
            </div>
            <span className="badge badge-success text-[10px]">Mailbox Suite</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <Link
              href="/smtp"
              className="group rounded-lg border border-surface-border bg-surface-raised p-3 hover:border-blue-500/50 hover:bg-surface transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Mail Apps & Passwords</span>
                <Server className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Connect Apple Mail, Outlook, Thunderbird, or your phone</p>
              <span className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium group-hover:underline">View Setup Guide →</span>
            </Link>

            <Link
              href="/inbound"
              className="group rounded-lg border border-surface-border bg-surface-raised p-3 hover:border-blue-500/50 hover:bg-surface transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Incoming Mail</span>
                <Inbox className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Read incoming emails and customer replies</p>
              <span className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium group-hover:underline">Read Incoming Mail →</span>
            </Link>

            <Link
              href="/aliases"
              className="group rounded-lg border border-surface-border bg-surface-raised p-3 hover:border-blue-500/50 hover:bg-surface transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Forwarding Addresses</span>
                <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Forward emails to personal or team addresses</p>
              <span className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium group-hover:underline">Manage Forwarding →</span>
            </Link>

            <Link
              href="/domains"
              className="group rounded-lg border border-surface-border bg-surface-raised p-3 hover:border-blue-500/50 hover:bg-surface transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">Domains & Verification</span>
                <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Verify your domain so emails land in inboxes, not spam</p>
              <span className="mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-medium group-hover:underline">Verify Domains →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Recent Activity & Quick SDK Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Emails */}
        <WidgetErrorBoundary fallbackTitle="Recent emails list unavailable">
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
                  No emails sent yet. Click &quot;Send Email&quot; to get started!
                </div>
              )}
            </div>
          </div>
        </WidgetErrorBoundary>

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
              domain={domains[0]?.name}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

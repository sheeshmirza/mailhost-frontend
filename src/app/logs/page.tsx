"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  AuditLogView,
  DedicatedIPView,
} from "@/lib/api";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  ShieldAlert,
  Flame,
  RefreshCw,
} from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";

function formatAuditIP(ip?: string) {
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("172.") || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return "Authorized Client";
  }
  return ip;
}

export default function LogsHealthPage() {
  const [readiness, setReadiness] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogView[]>([]);
  const [dedicatedIPs, setDedicatedIPs] = useState<DedicatedIPView[]>([]);
  const [warmupSchedule, setWarmupSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null);

  const fetchHealthAndLogs = async () => {
    setIsLoading(true);
    setLoadError(null);
    setAuditLogsError(null);
    try {
      const [readyRes, logsRes, ipsRes, schedRes] = await Promise.allSettled([
        api.getReadiness(),
        api.listAuditLogs(),
        api.listDedicatedIPs(),
        api.getWarmingSchedule(),
      ]);

      const failedResources: string[] = [];
      if (readyRes.status === "fulfilled") {
        setReadiness(readyRes.value.status);
      } else {
        setReadiness("unavailable");
        failedResources.push("service availability");
      }
      if (logsRes.status === "fulfilled") {
        setAuditLogs(logsRes.value.data || []);
      } else {
        const message = logsRes.reason instanceof Error ? logsRes.reason.message : "Could not load audit logs.";
        setAuditLogsError(message);
        failedResources.push("audit logs");
      }
      if (ipsRes.status === "fulfilled") {
        setDedicatedIPs(ipsRes.value.data || []);
      } else {
        failedResources.push("dedicated IP data");
      }
      if (schedRes.status === "fulfilled") {
        setWarmupSchedule(schedRes.value.schedule || []);
      } else {
        failedResources.push("warmup schedule");
      }
      if (failedResources.length) {
        setLoadError(`Could not load ${failedResources.join(" and ")}.`);
      }
    } catch (err) {
      console.error("Failed to load health and logs", err);
      const message = err instanceof Error ? err.message : "Could not load logs and system health.";
      setLoadError(message);
      setAuditLogsError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndLogs();
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            System Health & Audit Logs
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Service availability, IP auto-warming schedules, and audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHealthAndLogs}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            title="Refresh system logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loadError && <ErrorState message={loadError} onRetry={fetchHealthAndLogs} />}

      {/* Platform Service Status */}
      <div className="flex flex-col gap-3 rounded-lg border border-surface-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-subtle text-content-muted">
            <Activity className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[13px] font-semibold text-content-primary">Service availability</h2>
            <p className="mt-0.5 text-xs text-content-muted">Current API readiness</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 text-[13px] font-medium ${readiness === "ready" ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
          {readiness === "ready" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {readiness === "ready" ? "Available" : readiness === "degraded" ? "Degraded" : "Unavailable"}
        </span>
      </div>

      {/* Dedicated IP Auto-Warming Schedule */}
      {dedicatedIPs.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Dedicated IP Auto-Warming Progression
              </h2>
            </div>
          </div>

          <div className="divide-y divide-surface-border">
            {dedicatedIPs.map((ip) => (
              <div key={ip.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <span className="font-mono text-zinc-900 dark:text-white font-semibold">{ip.ip_address}</span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">
                    Day {ip.warmup_day} · Quota: {ip.daily_quota} emails/day · Sent Today: {ip.sent_today}
                  </span>
                </div>
                <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:border-amber-800/40 px-2 py-0.5 text-[10px] dark:text-amber-400">
                  {ip.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Audit Log Activity</h2>
        {isLoading && auditLogs.length === 0 ? (
          <TableSkeleton rows={6} cols={5} />
        ) : auditLogsError && auditLogs.length === 0 ? (
          <ErrorState message={auditLogsError} onRetry={fetchHealthAndLogs} />
        ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Resource Type</th>
                <th className="px-5 py-3">Resource ID</th>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="px-5 py-3">
                      <span className="rounded bg-surface-raised px-2 py-0.5 text-[10px] text-zinc-900 dark:text-white border border-surface-border uppercase font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300 font-sans">{log.resource_type}</td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 max-w-xs truncate" title={log.resource_id}>
                      {log.resource_id}
                    </td>
                    <td className="px-5 py-3 text-zinc-400 dark:text-zinc-500 text-[11px]">
                      {formatAuditIP(log.ip_address)}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-400 dark:text-zinc-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                    No recent audit logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}

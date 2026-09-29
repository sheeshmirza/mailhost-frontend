"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  AuditLogView,
  DedicatedIPView,
} from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Server,
  ShieldAlert,
  Flame,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

export default function LogsHealthPage() {
  const { toast } = useToast();
  const [readiness, setReadiness] = useState<Record<string, string>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLogView[]>([]);
  const [dedicatedIPs, setDedicatedIPs] = useState<DedicatedIPView[]>([]);
  const [warmupSchedule, setWarmupSchedule] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHealthAndLogs = async () => {
    setIsLoading(true);
    try {
      const [readyRes, logsRes, ipsRes, schedRes] = await Promise.allSettled([
        api.getReadiness(),
        api.listAuditLogs(),
        api.listDedicatedIPs(),
        api.getWarmingSchedule(),
      ]);

      if (readyRes.status === "fulfilled") {
        setReadiness(readyRes.value.checks || {});
      }
      if (logsRes.status === "fulfilled") {
        setAuditLogs(logsRes.value.data || []);
      }
      if (ipsRes.status === "fulfilled") {
        setDedicatedIPs(ipsRes.value.data || []);
      }
      if (schedRes.status === "fulfilled") {
        setWarmupSchedule(schedRes.value.schedule || []);
      }
    } catch (err: any) {
      console.error("Failed to load health and logs", err);
      toast.error("Failed to load logs and system health: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndLogs();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            System Health & Audit Logs
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time backend dependency status, IP auto-warming schedules, and audit trail.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/backend/metrics"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
          >
            <span>Prometheus Metrics</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <button
            onClick={fetchHealthAndLogs}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            title="Refresh system logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Deep Dependency Health Checks */}
      <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
            Backend Dependency Readiness Checks (/readyz)
          </h2>
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Operational
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(readiness).map(([service, status]) => (
            <div
              key={service}
              className="rounded-lg border border-surface-border bg-surface-raised p-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                  {service.replace("_", " ")}
                </span>
                {status === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <span className="mt-1 block font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                {status}
              </span>
            </div>
          ))}
        </div>
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
                      {log.ip_address || "127.0.0.1"}
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
      </div>
    </div>
  );
}

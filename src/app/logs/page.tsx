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
  Flame,
  RefreshCw,
} from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { WidgetErrorBoundary } from "@/components/ui/WidgetErrorBoundary";
import { useToast } from "@/lib/toast-context";
import { useAuth } from "@/lib/auth-context";

function formatAuditIP(ip?: string) {
  return ip?.trim() || "—";
}

export default function LogsHealthPage() {
  const toast = useToast();
  const { account } = useAuth();
  const canManageDedicatedIPs = ["administrator", "admin", "owner"].includes((account?.role || "").toLowerCase());
  const [readiness, setReadiness] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogView[]>([]);
  const [dedicatedIPs, setDedicatedIPs] = useState<DedicatedIPView[]>([]);
  const [warmingSchedule, setWarmingSchedule] = useState<{ day?: number; daily_quota?: number; [key: string]: unknown }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [auditLogsError, setAuditLogsError] = useState<string | null>(null);
  const [editingIP, setEditingIP] = useState<DedicatedIPView | null>(null);
  const [ipStatus, setIPStatus] = useState<"warming" | "active" | "paused">("warming");
  const [ipWarmupDay, setIPWarmupDay] = useState(1);
  const [ipDailyQuota, setIPDailyQuota] = useState(0);
  const [isSavingIP, setIsSavingIP] = useState(false);

  const openIPEdit = (ip: DedicatedIPView) => {
    setEditingIP(ip);
    setIPStatus(ip.status === "active" || ip.status === "paused" ? ip.status : "warming");
    setIPWarmupDay(ip.warmup_day);
    setIPDailyQuota(ip.daily_quota);
  };

  const saveIPWarmup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingIP || isSavingIP) return;
    setIsSavingIP(true);
    try {
      await api.updateIPWarmup(editingIP.id, {
        status: ipStatus,
        warmup_day: ipWarmupDay,
        daily_quota: ipDailyQuota,
      });
      toast.success("Dedicated IP settings updated");
      setEditingIP(null);
      await fetchHealthAndLogs();
    } catch (err) {
      toast.error("Could not update dedicated IP: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsSavingIP(false);
    }
  };

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
        setWarmingSchedule(schedRes.value.schedule || []);
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
            System Status &amp; Account Activity
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Check service uptime, dedicated sender IP warmup, and recent account changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHealthAndLogs}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
            title="Refresh system status"
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
            <h2 className="text-[13px] font-semibold text-content-primary">System Status</h2>
            <p className="mt-0.5 text-xs text-content-muted">Current platform health</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 text-[13px] font-medium ${readiness === "ready" ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"}`}>
          {readiness === "ready" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {readiness === "ready" ? "Online & Healthy" : readiness === "degraded" ? "Partially Degraded" : "Temporarily Offline"}
        </span>
      </div>

      {/* Dedicated IP Auto-Warming Schedule */}
      <WidgetErrorBoundary fallbackTitle="Dedicated IP progression unavailable">
        {dedicatedIPs.length > 0 && (
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Dedicated Sending IP Warmup
                </h2>
              </div>
            </div>

            <div className="divide-y divide-surface-border">
              {dedicatedIPs.map((ip) => (
                <div key={ip.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono text-zinc-900 dark:text-white font-semibold">{ip.ip_address}</span>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 block">
                      Day {ip.warmup_day} · Daily limit: {ip.daily_quota.toLocaleString()} emails/day · Sent today: {ip.sent_today.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="badge badge-warning capitalize">{ip.status}</span>
                    {canManageDedicatedIPs && (
                      <button onClick={() => openIPEdit(ip)} className="btn-secondary min-h-8 px-2 py-1">Manage</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Warming Schedule Stages from Backend */}
            {warmingSchedule.length > 0 && (
              <div className="mt-4 pt-4 border-t border-surface-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Recommended Daily Sending Schedule (Protects Inbox Reputation)
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {warmingSchedule.length} Warmup Steps
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-center text-xs">
                  {warmingSchedule.slice(0, 6).map((stage, idx) => (
                    <div key={idx} className="rounded-lg border border-surface-border bg-surface-raised p-2 space-y-0.5">
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">
                        Day {stage.day ?? idx + 1}
                      </span>
                      <span className="font-semibold text-zinc-900 dark:text-white font-mono text-xs">
                        {stage.daily_quota ? stage.daily_quota.toLocaleString() : "—"}/day
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </WidgetErrorBoundary>

      {/* Audit Logs Table */}
      <WidgetErrorBoundary fallbackTitle="Audit logs table unavailable">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Recent Account Activity</h2>
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
                <th className="px-5 py-3">Item Type</th>
                <th className="px-5 py-3">Item ID</th>
                <th className="px-5 py-3">IP Address</th>
                <th className="px-5 py-3 text-right">Date &amp; Time</th>
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
      </WidgetErrorBoundary>

      {editingIP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="ip-warmup-title" className="dialog-scroll w-full max-w-md space-y-4 rounded-lg border border-surface-border bg-surface p-5 shadow-2xl sm:p-6">
            <div>
              <h2 id="ip-warmup-title" className="text-sm font-semibold text-content-primary">Manage dedicated IP</h2>
              <p className="mt-1 font-mono text-xs text-content-muted">{editingIP.ip_address}</p>
            </div>
            <form onSubmit={saveIPWarmup} className="space-y-4">
              <label className="block text-xs font-medium text-content-secondary">
                Warmup status
                <select value={ipStatus} onChange={(event) => setIPStatus(event.target.value as typeof ipStatus)} className="input-base mt-1">
                  <option value="warming">Warming</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-content-secondary">
                Warmup day
                <input type="number" min={1} value={ipWarmupDay} onChange={(event) => setIPWarmupDay(Number(event.target.value))} required className="input-base mt-1" />
              </label>
              <label className="block text-xs font-medium text-content-secondary">
                Daily quota
                <input type="number" min={0} value={ipDailyQuota} onChange={(event) => setIPDailyQuota(Number(event.target.value))} required className="input-base mt-1" />
              </label>
              <div className="flex justify-end gap-2 border-t border-surface-border pt-3">
                <button type="button" onClick={() => setEditingIP(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isSavingIP} className="btn-primary">{isSavingIP ? "Saving..." : "Save settings"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

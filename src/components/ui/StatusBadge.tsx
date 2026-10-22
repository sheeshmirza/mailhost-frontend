import React from "react";
import { CheckCircle2, AlertCircle, Clock, Ban } from "lucide-react";

export type StatusType =
  | "delivered"
  | "sent"
  | "bounced"
  | "failed"
  | "canceled"
  | "cancelled"
  | "queued"
  | "pending"
  | "active"
  | "disabled"
  | "verified"
  | "unverified"
  | "draft"
  | "published"
  | string;

export interface StatusBadgeProps {
  status?: StatusType;
  showIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
  label?: string;
}

export function StatusBadge({
  status = "queued",
  showIcon = true,
  size = "sm",
  className = "",
  label,
}: StatusBadgeProps) {
  const s = (status || "queued").toLowerCase().trim();

  let colorClasses = "bg-amber-50/50 border-amber-200/50 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400";
  let Icon = Clock;
  let displayLabel = label || s;

  switch (s) {
    case "delivered":
    case "verified":
    case "active":
    case "published":
      colorClasses = "bg-emerald-50/50 border-emerald-200/50 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400";
      Icon = CheckCircle2;
      displayLabel = label || (s === "delivered" ? "Delivered" : s === "verified" ? "Verified" : s === "active" ? "Active" : "Published");
      break;
    case "bounced":
      colorClasses = "bg-red-50/50 border-red-200/50 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400";
      Icon = AlertCircle;
      displayLabel = label || "Bounced";
      break;
    case "failed":
    case "rejected":
      colorClasses = "bg-red-50/50 border-red-200/50 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400";
      Icon = AlertCircle;
      displayLabel = label || "Failed";
      break;
    case "canceled":
    case "cancelled":
    case "disabled":
      colorClasses = "bg-zinc-100/50 border-zinc-200/50 text-zinc-700 dark:bg-zinc-800/50 dark:border-zinc-700/50 dark:text-zinc-400";
      Icon = Ban;
      displayLabel = label || (s === "disabled" ? "Disabled" : "Canceled");
      break;
    case "sent":
      colorClasses = "bg-sky-50/50 border-sky-200/50 text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/20 dark:text-sky-400";
      Icon = Clock;
      displayLabel = label || "Sent";
      break;
    case "draft":
      colorClasses = "bg-purple-50/50 border-purple-200/50 text-purple-700 dark:bg-purple-500/10 dark:border-purple-500/20 dark:text-purple-400";
      Icon = Clock;
      displayLabel = label || "Draft";
      break;
    case "unverified":
    case "pending":
    case "queued":
    default:
      colorClasses = "bg-amber-50/50 border-amber-200/50 text-amber-700 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400";
      Icon = Clock;
      displayLabel = label || (s.charAt(0).toUpperCase() + s.slice(1));
      break;
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium capitalize ${sizeClasses} ${colorClasses} ${className}`}
    >
      {showIcon && <Icon className={iconSize} aria-hidden="true" />}
      <span>{displayLabel}</span>
    </span>
  );
}

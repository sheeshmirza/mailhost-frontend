"use client";

import React from "react";
import { Loader2 } from "lucide-react";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-zinc-200/80 dark:bg-zinc-800/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  cols?: number;
  columnWidths?: string[];
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  cols,
  columnWidths,
}: TableSkeletonProps) {
  const colCount = cols ?? columns;
  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
      <table className="w-full text-left text-xs min-w-[600px]">
        <thead className="border-b border-surface-border bg-surface-raised/50">
          <tr>
            {Array.from({ length: colCount }).map((_, i) => (
              <th key={i} className="px-5 py-3">
                <Skeleton
                  className={`h-3 ${
                    columnWidths && columnWidths[i] ? columnWidths[i] : "w-16"
                  }`}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="animate-pulse">
              {Array.from({ length: colCount }).map((_, colIndex) => (
                <td key={colIndex} className="px-5 py-3.5">
                  <Skeleton
                    className={`h-3.5 ${
                      colIndex === 0
                        ? "w-36"
                        : colIndex === colCount - 1
                        ? "w-12 ml-auto"
                        : "w-24"
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-2.5 w-32" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
      <div className="h-48 flex items-end gap-3 pt-6 px-2">
        {Array.from({ length: 14 }).map((_, i) => {
          const heights = [
            "h-12", "h-24", "h-16", "h-32", "h-20", "h-40", "h-28",
            "h-36", "h-16", "h-24", "h-44", "h-32", "h-20", "h-36",
          ];
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className={`w-full rounded-t ${heights[i % heights.length]}`} />
              <Skeleton className="h-2.5 w-5" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FullPageLoaderProps {
  label?: string;
}

export function FullPageLoader({ label = "Loading..." }: FullPageLoaderProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="relative flex items-center justify-center mb-4">
        <div className="absolute h-12 w-12 rounded-full border border-zinc-200 dark:border-zinc-800 animate-ping opacity-25" />
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold text-sm shadow-md">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </div>
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 tracking-wide">
        {label}
      </p>
    </div>
  );
}

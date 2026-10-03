"use client";

import React from "react";
import Link from "next/link";
import { ShieldAlert, Globe } from "lucide-react";

interface VerifiedDomainAlertProps {
  hasRegisteredDomains?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function VerifiedDomainAlert({
  hasRegisteredDomains = false,
  onNavigate,
  className = "",
}: VerifiedDomainAlertProps) {
  return (
    <div
      className={`bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5 ${className}`}
    >
      <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold mb-0.5">
          {!hasRegisteredDomains ? "No domain added yet" : "Your domain is not verified yet"}
        </p>
        <p className="text-amber-700/90 dark:text-amber-300/90 mb-1.5 leading-relaxed">
          {!hasRegisteredDomains
            ? "To send emails, you need to add your domain name and verify ownership. It only takes a couple of minutes."
            : "Your domain is added, but hasn't completed verification yet. Please finish setting up your domain records so you can start sending emails."}
        </p>
        <Link
          href="/domains"
          onClick={onNavigate}
          className="inline-flex items-center gap-1 font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
        >
          <Globe className="h-3 w-3" />
          Go to Domains &rarr;
        </Link>
      </div>
    </div>
  );
}

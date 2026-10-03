"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  Globe,
  Key,
  Inbox,
  Users,
  Radio,
  GitBranch,
  Zap,
  FileText,
  Webhook,
  ShieldAlert,
  ShieldCheck,
  Server,
  Settings,
  Activity,
  Code2,
  ExternalLink,
  ArrowRightLeft,
} from "lucide-react";
import clsx from "clsx";
import { getConfiguredAPIBaseUrl } from "@/lib/api";

const navGroups = [
  {
    title: "Email Tools",
    items: [
      { label: "Overview", href: "/overview", icon: LayoutDashboard },
      { label: "Sent Emails", href: "/emails", icon: Mail },
      { label: "Email Delivery & Spam", href: "/deliverability", icon: ShieldCheck },
      { label: "Incoming Mail", href: "/inbound", icon: Inbox },
      { label: "Email Forwarding", href: "/aliases", icon: ArrowRightLeft },
      { label: "Domains", href: "/domains", icon: Globe },
    ],
  },
  {
    title: "Marketing & Growth",
    items: [
      { label: "Campaigns", href: "/broadcasts", icon: Radio },
      { label: "Contacts", href: "/audiences", icon: Users },
      { label: "Automations", href: "/automations", icon: GitBranch },
      { label: "Templates", href: "/templates", icon: FileText },
      { label: "Activity Events", href: "/events", icon: Zap },
    ],
  },
  {
    title: "Developer & Connect",
    items: [
      { label: "Mail Apps & Setup", href: "/smtp", icon: Server },
      { label: "API Keys", href: "/api-keys", icon: Key },
      { label: "Webhooks", href: "/webhooks", icon: Webhook },
    ],
  },
  {
    title: "Account & System",
    items: [
      { label: "Blocked & Bounced", href: "/suppressions", icon: ShieldAlert },
      { label: "Settings & Team", href: "/settings", icon: Settings },
      { label: "System Status", href: "/logs", icon: Activity },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname() || "/";

  // If on landing page, sidebar is hidden
  if (pathname === "/") return null;

  return (
    <aside className="hidden lg:flex fixed left-0 top-14 bottom-0 z-30 w-60 flex-col justify-between border-r border-surface-border bg-surface px-3 py-5 transition-colors overflow-y-auto">
      {/* Navigation Links */}
      <nav className="flex flex-col">
        {navGroups.map((group, groupIdx) => (
          <div key={group.title} className={groupIdx !== 0 ? "pt-5" : ""}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-content-subtle">
              {group.title}
            </div>
              <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/overview"
                    ? pathname === "/overview"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "group flex min-h-9 items-center gap-3 rounded-md border-l-2 px-3 text-[13px] font-medium transition-colors",
                      isActive
                        ? "border-teal-700 bg-teal-50/80 text-teal-900 dark:border-teal-300 dark:bg-teal-300/10 dark:text-teal-100"
                        : "border-transparent text-content-muted hover:bg-surface-raised hover:text-content-primary"
                    )}
                  >
                    <Icon
                      className={clsx(
                        "h-4 w-4 transition-colors",
                        isActive
                          ? "text-teal-800 dark:text-teal-200"
                          : "text-content-subtle group-hover:text-content-secondary"
                      )}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Documentation & Quick API Specs */}
      <div className="space-y-1 border-t border-surface-border pt-4">
        <Link
          href="/"
          className="flex min-h-9 items-center justify-between rounded-md px-3 text-[13px] font-medium text-content-muted transition-colors hover:bg-surface-raised hover:text-content-primary"
        >
          <span>Landing Page</span>
          <ExternalLink className="h-3 w-3 text-zinc-400" />
        </Link>
        <a
          href={`${getConfiguredAPIBaseUrl() || "https://api.buy4cashback.com"}/openapi.json`}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-9 items-center gap-2 rounded-md px-3 text-[13px] font-medium text-content-muted transition-colors hover:bg-surface-raised hover:text-content-primary"
        >
          <Code2 className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span>API Documentation</span>
        </a>
      </div>
    </aside>
  );
}

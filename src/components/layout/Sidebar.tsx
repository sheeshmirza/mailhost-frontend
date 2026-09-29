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
  Server,
  Settings,
  Activity,
  Code2,
} from "lucide-react";
import clsx from "clsx";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Emails", href: "/emails", icon: Mail },
  { label: "Domains", href: "/domains", icon: Globe },
  { label: "API Keys", href: "/api-keys", icon: Key },
  { label: "Inbound", href: "/inbound", icon: Inbox },
  { label: "Audiences", href: "/audiences", icon: Users },
  { label: "Broadcasts", href: "/broadcasts", icon: Radio },
  { label: "Automations", href: "/automations", icon: GitBranch },
  { label: "Events", href: "/events", icon: Zap },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Webhooks", href: "/webhooks", icon: Webhook },
  { label: "Suppressions", href: "/suppressions", icon: ShieldAlert },
  { label: "SMTP", href: "/smtp", icon: Server },
  { label: "Settings & Team", href: "/settings", icon: Settings },
  { label: "Logs & Health", href: "/logs", icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex fixed left-0 top-14 bottom-0 z-30 w-56 flex-col justify-between border-r border-surface-border bg-surface px-3 py-4 transition-colors">
      {/* Navigation Links */}
      <nav className="space-y-1">
        <div className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
          Platform
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-surface-raised text-zinc-900 dark:text-white font-semibold shadow-sm"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <Icon
                className={clsx(
                  "h-4 w-4 transition-colors",
                  isActive
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Documentation & Quick API Specs */}
      <div className="border-t border-surface-border pt-3">
        <a
          href="/backend/openapi.json"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <Code2 className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span>OpenAPI Spec</span>
        </a>
        <div className="px-2.5 pt-2 text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
          Mailhost v1.0.0 (Go)
        </div>
      </div>
    </aside>
  );
}

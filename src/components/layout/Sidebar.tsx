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
  FileText,
  Webhook,
  Server,
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
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Webhooks", href: "/webhooks", icon: Webhook },
  { label: "SMTP", href: "/smtp", icon: Server },
  { label: "Logs & Health", href: "/logs", icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-14 bottom-0 z-30 flex w-56 flex-col justify-between border-r border-surface-border bg-black px-3 py-4">
      {/* Navigation Links */}
      <nav className="space-y-1">
        <div className="px-2 pb-2 text-[10px] font-medium uppercase tracking-wider text-brand-500">
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
                  ? "bg-surface-raised text-white"
                  : "text-brand-400 hover:bg-surface hover:text-brand-200"
              )}
            >
              <Icon
                className={clsx(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-white" : "text-brand-500 group-hover:text-brand-300"
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
          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium text-brand-400 hover:bg-surface hover:text-brand-200 transition-colors"
        >
          <Code2 className="h-4 w-4 text-brand-500" />
          <span>OpenAPI Spec</span>
        </a>
        <div className="px-2.5 pt-2 text-[10px] text-brand-600 font-mono">
          Mailhost v1.0.0 (Go)
        </div>
      </div>
    </aside>
  );
}

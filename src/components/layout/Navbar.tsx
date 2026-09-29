"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import {
  Send,
  Building,
  Check,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
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
  ArrowRight,
} from "lucide-react";
import SendEmailModal from "../emails/SendEmailModal";
import clsx from "clsx";

const navItems = [
  { label: "Overview", href: "/overview", icon: LayoutDashboard },
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

export default function Navbar({ isLanding }: { isLanding?: boolean }) {
  const pathname = usePathname();
  const isHomepage = isLanding ?? pathname === "/";
  const { user, account, accounts, switchAccount, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-surface-border bg-background/85 px-4 sm:px-6 backdrop-blur-md transition-colors">
        {/* Left Section: Logo (+ Mobile Menu or Org Switcher) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {!isHomepage && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white lg:hidden transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold text-xs tracking-tighter group-hover:opacity-90 transition-opacity">
              R
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
              Resend
            </span>
          </Link>

          {!isHomepage && (
            <>
              <span className="text-zinc-400 dark:text-zinc-600">/</span>

              {/* Organization Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <Building className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="truncate max-w-[100px] sm:max-w-[140px]">
                    {account?.name || "Acme Corp"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-zinc-500" />
                </button>

                {showOrgDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowOrgDropdown(false)}
                    />
                    <div className="absolute left-0 mt-1.5 w-56 z-20 rounded-xl border border-surface-border bg-surface p-1 shadow-lg animate-fade-in">
                      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Teams & Accounts
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {accounts.length > 0 ? (
                          accounts.map((acct) => (
                            <button
                              key={acct.id}
                              onClick={() => {
                                switchAccount(acct.id);
                                setShowOrgDropdown(false);
                              }}
                              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-zinc-700 dark:text-zinc-200 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white"
                            >
                              <span className="truncate">{acct.name}</span>
                              {acct.id === account?.id && (
                                <Check className="h-3.5 w-3.5 text-zinc-900 dark:text-white" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                            {account?.name || "Default Team"}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center Section: Landing Page Links (only on homepage) */}
        {isHomepage && (
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#deliverability" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Deliverability
            </a>
            <a href="#code" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              SDKs
            </a>
            <a href="#playground" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Playground
            </a>
            <a
              href="/backend/openapi.json"
              target="_blank"
              rel="noreferrer"
              className="hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Docs
            </a>
          </nav>
        )}

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-surface-raised transition-colors"
            title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle Theme"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-zinc-600" />
            )}
          </button>

          {isHomepage ? (
            /* Public Landing Action Buttons */
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/overview"
                className="flex items-center gap-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 px-3.5 py-1.5 text-xs font-medium transition-all shadow-sm"
              >
                <span>Dashboard</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            /* Dashboard Action Buttons */
            <>
              {/* Live Status indicator */}
              <div className="hidden md:flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-raised/70 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">API: 8080</span>
              </div>

              {/* Quick Send Email Action */}
              <button
                onClick={() => setIsSendOpen(true)}
                className="flex items-center gap-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 active:scale-95 px-3 py-1.5 text-xs font-medium transition-all shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Send Email</span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-surface-border bg-surface-raised text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors"
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                </button>

                {showUserDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-56 z-20 rounded-xl border border-surface-border bg-surface p-1 shadow-lg animate-fade-in">
                      <div className="border-b border-surface-border px-3 py-2 mb-1">
                        <p className="text-xs font-medium text-zinc-900 dark:text-white truncate">
                          {user?.name || "Admin"}
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate font-mono mt-0.5">
                          {user?.email || "admin@resend.local"}
                        </p>
                      </div>

                      <div className="flex flex-col gap-0.5 py-1">
                        <Link
                          href="/"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white"
                        >
                          <Globe className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Homepage</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white"
                        >
                          <Settings className="h-3.5 w-3.5 text-zinc-400" />
                          <span>Account Settings</span>
                        </Link>
                        <Link
                          href="/api-keys"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white"
                        >
                          <Key className="h-3.5 w-3.5 text-zinc-400" />
                          <span>API Keys</span>
                        </Link>
                      </div>

                      <div className="border-t border-surface-border mt-1 pt-1">
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile Sidebar Navigation Drawer Overlay (for dashboard) */}
      {!isHomepage && mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="fixed inset-y-0 left-0 w-64 border-r border-surface-border bg-surface p-4 shadow-2xl flex flex-col justify-between overflow-y-auto animate-fade-in">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold text-xs">
                    R
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 dark:text-white">Resend</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-md p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/overview"
                      ? pathname === "/overview"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                        isActive
                          ? "bg-surface-raised text-zinc-900 dark:text-white font-semibold"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border flex items-center justify-between text-[11px] text-zinc-500">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
                View Landing Page
              </Link>
              <span>Go Engine</span>
            </div>
          </nav>
        </div>
      )}

      {/* Global Quick Send Email Modal */}
      <SendEmailModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        onSent={() => setIsSendOpen(false)}
      />
    </>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/lib/toast-context";
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
  ArrowRightLeft,
} from "lucide-react";
import SendEmailModal from "../emails/SendEmailModal";
import clsx from "clsx";

const navGroups = [
  {
    title: "Email",
    items: [
      { label: "Overview", href: "/overview", icon: LayoutDashboard },
      { label: "Emails", href: "/emails", icon: Mail },
      { label: "Domains", href: "/domains", icon: Globe },
      { label: "Aliases", href: "/aliases", icon: ArrowRightLeft },
      { label: "Inbound", href: "/inbound", icon: Inbox },
    ],
  },
  {
    title: "Engagement",
    items: [
      { label: "Audiences", href: "/audiences", icon: Users },
      { label: "Broadcasts", href: "/broadcasts", icon: Radio },
      { label: "Automations", href: "/automations", icon: GitBranch },
      { label: "Templates", href: "/templates", icon: FileText },
      { label: "Events", href: "/events", icon: Zap },
    ],
  },
  {
    title: "Developer",
    items: [
      { label: "API Keys", href: "/api-keys", icon: Key },
      { label: "Webhooks", href: "/webhooks", icon: Webhook },
      { label: "SMTP & Protocols", href: "/smtp", icon: Server },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Suppressions", href: "/suppressions", icon: ShieldAlert },
      { label: "Settings & Team", href: "/settings", icon: Settings },
      { label: "Logs & Health", href: "/logs", icon: Activity },
    ],
  },
];

export default function Navbar({
  isLanding,
  isLogin,
}: {
  isLanding?: boolean;
  isLogin?: boolean;
}) {
  const pathname = usePathname() || "/";
  const isHomepage = isLanding ?? pathname === "/";
  const isLoginPage = isLogin ?? (pathname === "/login" || pathname === "/login/");
  const { token, user, account, accounts, switchAccount, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const toast = useToast();

  const [isSendOpen, setIsSendOpen] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-surface-border bg-surface/95 px-4 shadow-sm backdrop-blur-md transition-colors sm:px-6">
        {/* Left Section: Logo (+ Mobile Menu or Org Switcher) */}
        <div className="flex items-center gap-3 sm:gap-4">
          {!isHomepage && !isLoginPage && (
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

          {!isHomepage && !isLoginPage && (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-zinc-400 dark:text-zinc-600">/</span>

              {/* Organization Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowOrgDropdown(!showOrgDropdown)}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <Building className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="truncate max-w-[100px] sm:max-w-[140px]">
                    {account?.name || "Account"}
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
                              onClick={async () => {
                                try {
                                  await switchAccount(acct.id);
                                  setShowOrgDropdown(false);
                                } catch (err) {
                                  toast.error("Could not switch account: " + (err instanceof Error ? err.message : "Unknown error"));
                                }
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
                            {account?.name || "No accounts available"}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
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

          {isLoginPage ? (
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
              >
                Back to Home
              </Link>
            </div>
          ) : isHomepage ? (
            /* Public Landing Action Buttons */
            <div className="flex items-center gap-2">
              {token && user ? (
                <Link
                  href="/overview"
                  className="btn-primary px-3.5 py-1.5 text-xs shadow-sm"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex rounded-md px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login"
                    className="btn-primary px-3.5 py-1.5 text-xs shadow-sm"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </>
              )}
            </div>
          ) : (
            /* Dashboard Action Buttons */
            <>
              {/* Quick Send Email Action */}
              <button
                onClick={() => setIsSendOpen(true)}
                className="btn-primary"
                aria-label="Send email"
                title="Send email"
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
                  {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
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
                          {user?.name || "Account"}
                        </p>
                        {user?.email && (
                          <p className="text-[11px] text-zinc-500 truncate font-mono mt-0.5">
                            {user.email}
                          </p>
                        )}
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
      {!isHomepage && !isLoginPage && mobileMenuOpen && (
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

              {accounts.length > 0 && (
                <section className="space-y-1 border-b border-surface-border pb-3">
                  <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                    Account
                  </p>
                  {accounts.map((acct) => (
                    <button
                      key={acct.id}
                      type="button"
                      onClick={async () => {
                        try {
                          await switchAccount(acct.id);
                          setMobileMenuOpen(false);
                        } catch (err) {
                          toast.error("Could not switch account: " + (err instanceof Error ? err.message : "Unknown error"));
                        }
                      }}
                      className="flex min-h-9 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-xs text-zinc-700 hover:bg-surface-raised dark:text-zinc-300 dark:hover:text-white"
                    >
                      <span className="min-w-0 truncate">{acct.name}</span>
                      {acct.id === account?.id && <Check className="h-3.5 w-3.5 shrink-0" />}
                    </button>
                  ))}
                </section>
              )}

              <div className="space-y-4">
                {navGroups.map((group) => (
                  <div key={group.title}>
                    <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                      {group.title}
                    </div>
                    <div className="flex flex-col gap-0.5">
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
                            onClick={() => setMobileMenuOpen(false)}
                            className={clsx(
                              "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors border-l-2",
                              isActive
                                ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white font-medium"
                                : "border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-surface-border text-[11px] text-zinc-500">
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:underline">
                View Landing Page
              </Link>
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

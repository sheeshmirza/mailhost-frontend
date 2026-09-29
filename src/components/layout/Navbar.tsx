"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Send,
  Building,
  Check,
  ChevronDown,
  LogOut,
  Key,
  Shield,
  ExternalLink,
} from "lucide-react";
import SendEmailModal from "../emails/SendEmailModal";

export default function Navbar() {
  const { user, account, accounts, switchAccount, logout, token } = useAuth();
  const [isSendOpen, setIsSendOpen] = useState(false);
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-surface-border bg-black/80 px-6 backdrop-blur-md">
        {/* Left Section: Logo & Account Switcher */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-black font-semibold text-xs tracking-tighter group-hover:opacity-90 transition-opacity">
              R
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              Resend
            </span>
          </Link>

          <span className="text-brand-700">/</span>

          {/* Organization Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowOrgDropdown(!showOrgDropdown)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-brand-300 hover:bg-surface-raised hover:text-white transition-colors"
            >
              <Building className="h-3.5 w-3.5 text-brand-500" />
              <span>{account?.name || "Acme Corp"}</span>
              <ChevronDown className="h-3 w-3 text-brand-500" />
            </button>

            {showOrgDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowOrgDropdown(false)}
                />
                <div className="absolute left-0 mt-1.5 w-52 z-20 rounded-lg border border-surface-border bg-surface p-1 shadow-xl animate-fade-in">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-500">
                    Teams & Accounts
                  </div>
                  {accounts.length > 0 ? (
                    accounts.map((acct) => (
                      <button
                        key={acct.id}
                        onClick={() => {
                          switchAccount(acct.id);
                          setShowOrgDropdown(false);
                        }}
                        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs text-brand-200 hover:bg-surface-raised hover:text-white"
                      >
                        <span className="truncate">{acct.name}</span>
                        {acct.id === account?.id && (
                          <Check className="h-3.5 w-3.5 text-white" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-xs text-brand-400">
                      {account?.name || "Default Team"}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Section: System status, Send Email, Profile */}
        <div className="flex items-center gap-3">
          {/* Live Status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-raised/60 px-2.5 py-1 text-[11px] text-brand-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[10px] text-brand-400">API: 8080</span>
          </div>

          {/* Quick Send Email Action */}
          <button
            onClick={() => setIsSendOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 active:scale-95 transition-all shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Email</span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-surface-border bg-surface-raised text-xs font-semibold text-brand-200 hover:border-brand-600 transition-colors"
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </button>

            {showUserDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="absolute right-0 mt-1.5 w-56 z-20 rounded-lg border border-surface-border bg-surface p-1 shadow-xl animate-fade-in">
                  <div className="border-b border-surface-border px-3 py-2">
                    <p className="text-xs font-medium text-white">
                      {user?.name || "Resend Admin"}
                    </p>
                    <p className="truncate text-[11px] text-brand-500 font-mono">
                      {user?.email || "admin@resend.local"}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/api-keys"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-brand-300 hover:bg-surface-raised hover:text-white"
                    >
                      <Key className="h-3.5 w-3.5 text-brand-500" />
                      <span>API Keys</span>
                    </Link>
                    <Link
                      href="/logs"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-brand-300 hover:bg-surface-raised hover:text-white"
                    >
                      <Shield className="h-3.5 w-3.5 text-brand-500" />
                      <span>Audit Logs & Health</span>
                    </Link>
                    <a
                      href="http://localhost:8025"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-md px-3 py-1.5 text-xs text-brand-300 hover:bg-surface-raised hover:text-white"
                    >
                      <span>Mailpit Web Inbox</span>
                      <ExternalLink className="h-3 w-3 text-brand-500" />
                    </a>
                  </div>

                  <div className="border-t border-surface-border pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-xs text-red-400 hover:bg-red-950/30 hover:text-red-300"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Global Send Email Modal */}
      <SendEmailModal
        isOpen={isSendOpen}
        onClose={() => setIsSendOpen(false)}
        onSent={() => {
          setIsSendOpen(false);
          // Optional trigger refresh
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("mailhost_email_sent"));
          }
        }}
      />
    </>
  );
}

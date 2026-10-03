"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api, SMTPCredView, DomainView } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getVerifiedDomains, assertVerifiedSender, buildSenderAddress } from "@/lib/domain-utils";
import { VerifiedDomainAlert } from "@/components/common/VerifiedDomainAlert";
import {
  Server,
  Mail,
  Inbox,
  FolderSync,
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  ShieldCheck,
  Terminal,
  Code2,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";

export default function SMTPProtocolsPage() {
  const { toast } = useToast();

  // Active protocol tab
  const [activeTab, setActiveTab] = useState<"smtp" | "imap" | "pop3" | "credentials" | "matrix">("smtp");
  const [activeCodeLang, setActiveCodeLang] = useState<"node" | "python" | "go" | "cli">("node");

  // Host configuration from env with safe fallback
  const hostName =
    process.env.NEXT_PUBLIC_SMTP_HOST?.trim() ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? `mail.${window.location.hostname}`
      : "mail.yourdomain.com");

  const [credentials, setCredentials] = useState<SMTPCredView[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New credential modal
  const [isOpen, setIsOpen] = useState(false);
  const [emailPrefix, setEmailPrefix] = useState("smtp");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [isCustomEmail, setIsCustomEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [credName, setCredName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedCreds, setGeneratedCreds] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const verifiedDomains = useMemo(() => getVerifiedDomains(domains), [domains]);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [credRes, domRes] = await Promise.allSettled([
        api.listSMTPCredentials(),
        api.listDomains(),
      ]);
      if (credRes.status === "fulfilled") {
        setCredentials(credRes.value.data || []);
      } else {
        setLoadError("Could not load application credentials.");
      }
      if (domRes.status === "fulfilled") {
        const dList = domRes.value.data || [];
        setDomains(dList);
        const verified = dList.filter((d) => d.status === "verified");
        if (verified.length > 0) {
          setSelectedDomain((cur) => (verified.some((v) => v.name === cur) ? cur : verified[0].name));
        }
      }
    } catch (err) {
      console.error("Failed to load SMTP & protocol credentials", err);
      setLoadError(err instanceof Error ? err.message : "Could not load protocol data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalEmail = email.trim();
      if (!isCustomEmail && selectedDomain) {
        finalEmail = buildSenderAddress(emailPrefix || "smtp", selectedDomain);
      }
      if (!finalEmail) {
        throw new Error("Sender email address is required.");
      }
      assertVerifiedSender(verifiedDomains, finalEmail);

      const res = await api.createSMTPCredential(finalEmail, credName.trim() || undefined);
      setGeneratedCreds({
        username: res.username,
        password: res.password,
      });
      toast.success("Mail application credential generated");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to generate credential: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this application password?")) return;
    try {
      await api.deleteSMTPCredential(id);
      toast.success("Credential revoked successfully");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to revoke credential: " + (err.response?.data?.message || err.message));
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.info(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyPassword = () => {
    if (!generatedCreds) return;
    navigator.clipboard.writeText(generatedCreds.password);
    setCopiedPass(true);
    toast.info("Password copied to clipboard");
    setTimeout(() => setCopiedPass(false), 2000);
  };

  // Sample credential for code examples
  const sampleUsername = credentials[0]?.username || (verifiedDomains[0] ? `notifications@${verifiedDomains[0].name}` : "user@yourdomain.com");

  return (
    <div className="page-container space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Mail Protocols & SMTP
            </h1>
            <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              RFC Standards
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Connect desktop clients, web servers, and automation bots via standard SMTP (Outbound), IMAP (Mailbox Sync), and POP3 (Download).
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedCreds(null);
            setIsOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Generate App Password</span>
        </button>
      </div>

      {verifiedDomains.length === 0 && !isLoading && (
        <VerifiedDomainAlert hasRegisteredDomains={domains.length > 0} />
      )}

      {/* Protocol Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-surface-border pb-px text-xs font-medium">
        <button
          onClick={() => setActiveTab("smtp")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 transition-colors ${
            activeTab === "smtp"
              ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          <span>SMTP (Outbound)</span>
        </button>

        <button
          onClick={() => setActiveTab("imap")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 transition-colors ${
            activeTab === "imap"
              ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <FolderSync className="h-3.5 w-3.5" />
          <span>IMAP (Mailbox Sync)</span>
        </button>

        <button
          onClick={() => setActiveTab("pop3")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 transition-colors ${
            activeTab === "pop3"
              ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <Inbox className="h-3.5 w-3.5" />
          <span>POP3 (Download)</span>
        </button>

        <button
          onClick={() => setActiveTab("credentials")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 transition-colors ${
            activeTab === "credentials"
              ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <Key className="h-3.5 w-3.5" />
          <span>App Passwords ({credentials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 border-b-2 px-3 py-2 transition-colors ${
            activeTab === "matrix"
              ? "border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300 font-semibold"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Protocol Matrix</span>
        </button>
      </div>

      {/* TAB 1: SMTP OUTBOUND */}
      {activeTab === "smtp" && (
        <div className="space-y-6">
          {/* Connection cards */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>SMTP Outbound Submission Settings</span>
              </h2>
              <span className="text-[11px] text-zinc-500">RFC 6409 / RFC 5321</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-sans">Host</span>
                  <button onClick={() => copyToClipboard(hostName, "Host")} className="text-zinc-400 hover:text-zinc-600">
                    {copiedField === "Host" ? <Check className="h-3 w-3 text-teal-500" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">{hostName}</span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Submission Port</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">
                  587 <span className="text-[10px] font-normal text-teal-600 dark:text-teal-400 font-sans">(STARTTLS - Recommended)</span>
                </span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Direct SSL Port</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">
                  465 <span className="text-[10px] font-normal text-zinc-500 font-sans">(Implicit SMTPS)</span>
                </span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Auth Methods</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">AUTH PLAIN / LOGIN</span>
              </div>
            </div>

            <div className="rounded-lg bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/50 dark:border-teal-800/30 p-3 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
              <div>
                <strong className="font-semibold">Strict Domain Verification Enforced:</strong> Outbound submission only accepts sender addresses (`MAIL FROM` &amp; `From:`) belonging to verified domains on your account. Every email sent via SMTP is automatically DKIM-signed.
              </div>
            </div>
          </div>

          {/* Code Integration Tabs */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-blue-500" />
                <span>Outbound Code Integration Examples</span>
              </h3>

              <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-lg border border-surface-border text-xs">
                <button
                  onClick={() => setActiveCodeLang("node")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCodeLang === "node" ? "bg-surface text-zinc-900 dark:text-white font-medium shadow-sm" : "text-zinc-500"
                  }`}
                >
                  Node.js
                </button>
                <button
                  onClick={() => setActiveCodeLang("python")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCodeLang === "python" ? "bg-surface text-zinc-900 dark:text-white font-medium shadow-sm" : "text-zinc-500"
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setActiveCodeLang("go")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCodeLang === "go" ? "bg-surface text-zinc-900 dark:text-white font-medium shadow-sm" : "text-zinc-500"
                  }`}
                >
                  Go
                </button>
                <button
                  onClick={() => setActiveCodeLang("cli")}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeCodeLang === "cli" ? "bg-surface text-zinc-900 dark:text-white font-medium shadow-sm" : "text-zinc-500"
                  }`}
                >
                  OpenSSL CLI
                </button>
              </div>
            </div>

            {activeCodeLang === "node" && (
              <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">
{`import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: '${hostName}',
  port: 587,
  secure: false, // true for port 465, false for port 587 (uses STARTTLS)
  auth: {
    user: '${sampleUsername}',
    pass: process.env.MAILHOST_APP_PASSWORD, // Generated below
  },
});

await transporter.sendMail({
  from: '"Operations" <${sampleUsername}>',
  to: 'customer@example.com',
  subject: 'Order Confirmation',
  text: 'Your order has shipped!',
  html: '<strong>Your order has shipped!</strong>',
});`}
              </pre>
            )}

            {activeCodeLang === "python" && (
              <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">
{`import smtplib
from email.message import EmailMessage

msg = EmailMessage()
msg['Subject'] = 'Transactional Notification'
msg['From'] = '${sampleUsername}'
msg['To'] = 'customer@example.com'
msg.set_content('Hello from Python standard library!')

# Connect securely using STARTTLS on Port 587
with smtplib.SMTP('${hostName}', 587) as server:
    server.starttls()
    server.login('${sampleUsername}', 'YOUR_APP_PASSWORD')
    server.send_message(msg)`}
              </pre>
            )}

            {activeCodeLang === "go" && (
              <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">
{`package main

import (
    "net/smtp"
)

func main() {
    auth := smtp.PlainAuth("", "${sampleUsername}", "YOUR_APP_PASSWORD", "${hostName}")
    to := []string{"customer@example.com"}
    msg := []byte("From: ${sampleUsername}\\r\\n" +
        "To: customer@example.com\\r\\n" +
        "Subject: Go SMTP Delivery\\r\\n" +
        "\\r\\n" +
        "High performance delivery from Go.\\r\\n")

    err := smtp.SendMail("${hostName}:587", auth, "${sampleUsername}", to, msg)
    if err != nil {
        panic(err)
    }
}`}
              </pre>
            )}

            {activeCodeLang === "cli" && (
              <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">
{`# Test SMTP STARTTLS handshake on port 587
openssl s_client -connect ${hostName}:587 -starttls smtp -crlf

# Test implicit TLS on port 465
openssl s_client -connect ${hostName}:465 -crlf`}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: IMAP MAILBOX SYNC */}
      {activeTab === "imap" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <FolderSync className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>IMAP Mailbox Synchronization Settings</span>
              </h2>
              <span className="text-[11px] text-zinc-500">RFC 3501 (IMAP4rev1)</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Host</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">{hostName}</span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Secure IMAPS Port</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">
                  993 <span className="text-[10px] font-normal text-teal-600 dark:text-teal-400 font-sans">(SSL/TLS - Recommended)</span>
                </span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Standard IMAP Port</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">
                  143 <span className="text-[10px] font-normal text-zinc-500 font-sans">(STARTTLS)</span>
                </span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Default Folders</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">INBOX, Sent, Drafts, Trash</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
              <p>
                <strong>What is IMAP?</strong> Internet Message Access Protocol provides real-time, two-way mailbox synchronization. When you read, flag, or organize messages into folders on Apple Mail or Thunderbird, the changes are instantly synchronized to all devices.
              </p>
            </div>
          </div>

          {/* Client Setup Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <AppleIcon className="h-4 w-4" />
                <span>Apple Mail (iOS &amp; macOS)</span>
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Add account &gt; Other Mail Account. Incoming Host: <code className="font-mono text-zinc-800 dark:text-zinc-200">{hostName}</code>, Port 993 (SSL). Outgoing Host: Port 587 (STARTTLS).
              </p>
            </div>

            <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <ThunderbirdIcon className="h-4 w-4" />
                <span>Mozilla Thunderbird</span>
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Account Settings &gt; Manual Config. Set Protocol to IMAP, Port 993, SSL/TLS, Normal Password. Set SMTP to Port 587, STARTTLS.
              </p>
            </div>

            <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-2">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <OutlookIcon className="h-4 w-4" />
                <span>Microsoft Outlook</span>
              </h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Add Account &gt; Advanced Options &gt; IMAP. Incoming: <code className="font-mono text-zinc-800 dark:text-zinc-200">{hostName}:993</code> (SSL/TLS). Outgoing: <code className="font-mono text-zinc-800 dark:text-zinc-200">{hostName}:587</code> (STARTTLS).
              </p>
            </div>
          </div>

          {/* IMAP Code Snippet */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-purple-500" />
              <span>Python IMAP Fetch Example</span>
            </h3>
            <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">
{`import imaplib

# Connect securely via IMAPS on Port 993
mail = imaplib.IMAP4_SSL('${hostName}', 993)
mail.login('${sampleUsername}', 'YOUR_APP_PASSWORD')

# Select INBOX and search for unread messages
mail.select('INBOX')
status, response = mail.search(None, 'UNSEEN')
message_ids = response[0].split()

print(f"Found {len(message_ids)} unread messages in INBOX")
mail.logout()`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: POP3 DOWNLOAD */}
      {activeTab === "pop3" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Inbox className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>POP3 Inbound Download Settings</span>
              </h2>
              <span className="text-[11px] text-zinc-500">RFC 1939</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Host</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">{hostName}</span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Secure POP3S Port</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">
                  995 <span className="text-[10px] font-normal text-teal-600 dark:text-teal-400 font-sans">(SSL/TLS - Recommended)</span>
                </span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Standard POP3 Port</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">
                  110 <span className="text-[10px] font-normal text-zinc-500 font-sans">(STARTTLS)</span>
                </span>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 uppercase font-sans">Supported Commands</span>
                <span className="text-zinc-900 dark:text-white font-semibold block mt-1">UIDL, RETR, STAT, DELE</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
              <p>
                <strong>What is POP3?</strong> Post Office Protocol downloads incoming emails from the server directly to a single local device. It is ideal for local archives, backup workers, and minimal legacy mail readers.
              </p>
            </div>
          </div>

          {/* POP3 Code Snippet */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-amber-500" />
              <span>Python POP3 Download Example</span>
            </h3>
            <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto leading-relaxed">
{`import poplib

# Connect securely via POP3S on Port 995
server = poplib.POP3_SSL('${hostName}', 995)
server.user('${sampleUsername}')
server.pass_('YOUR_APP_PASSWORD')

# Retrieve message count and mailbox size
msg_count, total_bytes = server.stat()
print(f"Mailbox contains {msg_count} messages ({total_bytes} bytes)")

server.quit()`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: APPLICATION CREDENTIALS TABLE */}
      {activeTab === "credentials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
              Generated Application Passwords
            </h2>
            <button
              onClick={() => {
                setGeneratedCreds(null);
                setIsOpen(true);
              }}
              className="btn-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Credential</span>
            </button>
          </div>

          {isLoading && credentials.length === 0 ? (
            <TableSkeleton rows={4} cols={5} />
          ) : loadError && credentials.length === 0 ? (
            <ErrorState message={loadError} onRetry={fetchData} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface shadow-sm">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3">Description</th>
                    <th className="px-5 py-3">Username / From Address</th>
                    <th className="px-5 py-3">Created</th>
                    <th className="px-5 py-3">Last Used</th>
                    <th className="px-5 py-3 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono">
                  {credentials.length > 0 ? (
                    credentials.map((cred) => (
                      <tr key={cred.id} className="hover:bg-surface-raised/40 transition-colors">
                        <td className="px-5 py-3 font-sans font-medium text-zinc-900 dark:text-white">
                          {cred.name || "App Password"}
                        </td>
                        <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300">
                          <div className="flex items-center gap-1.5">
                            <span>{cred.username}</span>
                            <button
                              onClick={() => copyToClipboard(cred.username, "Username")}
                              className="text-zinc-400 hover:text-zinc-600 transition-colors"
                              title="Copy username"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-zinc-400 dark:text-zinc-500 text-[11px]">
                          {new Date(cred.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 text-zinc-400 dark:text-zinc-500 text-[11px]">
                          {cred.last_used_at
                            ? new Date(cred.last_used_at).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(cred.id)}
                            className="rounded p-1 text-zinc-400 hover:text-red-500 transition-colors"
                            title="Revoke credential"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                        No application passwords generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PROTOCOL MATRIX & DIAGNOSTICS */}
      {activeTab === "matrix" && (
        <div className="space-y-6">
          {/* Comparison Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface shadow-sm">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3">Protocol</th>
                  <th className="px-5 py-3">Standard Port</th>
                  <th className="px-5 py-3">Secure Port</th>
                  <th className="px-5 py-3">Direction</th>
                  <th className="px-5 py-3">Multi-Device Sync</th>
                  <th className="px-5 py-3">Recommended Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                <tr className="hover:bg-surface-raised/40 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-teal-600" />
                      <span>SMTP (Submission)</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono">587 (STARTTLS)</td>
                  <td className="px-5 py-3.5 font-mono font-medium text-teal-600 dark:text-teal-400">
                    465 (SMTPS)
                  </td>
                  <td className="px-5 py-3.5">Outbound Send</td>
                  <td className="px-5 py-3.5 text-zinc-400">N/A (Sending)</td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-300">
                    Apps, APIs, notifications, transactional &amp; marketing emails
                  </td>
                </tr>

                <tr className="hover:bg-surface-raised/40 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <FolderSync className="h-4 w-4 text-purple-600" />
                      <span>IMAP (RFC 3501)</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono">143 (STARTTLS)</td>
                  <td className="px-5 py-3.5 font-mono font-medium text-teal-600 dark:text-teal-400">
                    993 (IMAPS)
                  </td>
                  <td className="px-5 py-3.5">Inbound Sync</td>
                  <td className="px-5 py-3.5 font-medium text-emerald-600">
                    Full Sync (2-Way)
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-300">
                    Smartphones, Apple Mail, Outlook, Thunderbird, multiple team readers
                  </td>
                </tr>

                <tr className="hover:bg-surface-raised/40 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-zinc-900 dark:text-white">
                    <div className="flex items-center gap-1.5">
                      <Inbox className="h-4 w-4 text-amber-600" />
                      <span>POP3 (RFC 1939)</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono">110 (STARTTLS)</td>
                  <td className="px-5 py-3.5 font-mono font-medium text-teal-600 dark:text-teal-400">
                    995 (POP3S)
                  </td>
                  <td className="px-5 py-3.5">Inbound Download</td>
                  <td className="px-5 py-3.5 text-amber-600">
                    Single Client Only
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-300">
                    Local archiving, offline bots, simple backup ingestion scripts
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Diagnostic Commands Card */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5 text-emerald-500" />
              <span>Network &amp; DNS Diagnostic Commands</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold">
                  Test Inbound MX Records
                </span>
                <p className="text-zinc-800 dark:text-zinc-200">
                  dig MX {domains[0]?.name || "yourdomain.com"} +short
                </p>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold">
                  Test SMTP STARTTLS Handshake
                </span>
                <p className="text-zinc-800 dark:text-zinc-200">
                  openssl s_client -connect {hostName}:587 -starttls smtp
                </p>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold">
                  Test IMAPS Port 993
                </span>
                <p className="text-zinc-800 dark:text-zinc-200">
                  openssl s_client -connect {hostName}:993 -crlf
                </p>
              </div>

              <div className="rounded-lg border border-surface-border bg-surface-raised p-3 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-sans font-semibold">
                  Test POP3S Port 995
                </span>
                <p className="text-zinc-800 dark:text-zinc-200">
                  openssl s_client -connect {hostName}:995 -crlf
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generate Credential Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Generate Application Credential</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Create an authentication credential for SMTP sending or IMAP/POP3 mailbox access scoped to a verified domain.
            </p>

            {!generatedCreds ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1 font-medium">
                    Credential Label / Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={credName}
                    onChange={(e) => setCredName(e.target.value)}
                    placeholder="e.g. Production Web App, Thunderbird"
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium">
                      Sender Address / Username
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomEmail(!isCustomEmail)}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      {isCustomEmail ? "Select from domain" : "Custom address"}
                    </button>
                  </div>

                  {!isCustomEmail ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={emailPrefix}
                        onChange={(e) => setEmailPrefix(e.target.value)}
                        placeholder="smtp"
                        required
                        className="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-teal-500 font-mono"
                      />
                      <span className="text-zinc-500 text-xs">@</span>
                      <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500"
                      >
                        {verifiedDomains.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alerts@yourverifieddomain.com"
                      required
                      className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-teal-500 font-mono"
                    />
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-md border border-surface-border px-3.5 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || verifiedDomains.length === 0}
                    className="btn-primary"
                  >
                    {isSubmitting ? "Generating..." : "Generate Password"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    Copy this password immediately. For security, it cannot be displayed again.
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Username</span>
                    <div className="mt-1 flex items-center justify-between rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-mono text-zinc-900 dark:text-white">
                      <span>{generatedCreds.username}</span>
                      <button
                        onClick={() => copyToClipboard(generatedCreds.username, "Username")}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Password</span>
                    <div className="mt-1 flex items-center justify-between rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-mono text-zinc-900 dark:text-white">
                      <span className="break-all">{generatedCreds.password}</span>
                      <button
                        onClick={copyPassword}
                        className="text-zinc-400 hover:text-zinc-600 shrink-0 ml-2"
                      >
                        {copiedPass ? <Check className="h-3.5 w-3.5 text-teal-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-primary w-full mt-4"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 1.3 0 2.25-1.06 3.75-1.06 1.45 0 2.45.9 3.25 1.06.6.12 1-.5 1-1.06 0-2.3-1.6-4.14-3.5-4.14-1.2 0-2.2.6-3 1.2-.8-.6-1.8-1.2-3-1.2-1.9 0-3.5 1.84-3.5 4.14 0 .56.4 1.18 1 1.06.8-.16 1.8-1.06 3.25-1.06z" />
      <path d="M12 2c0 2 1.5 3.5 3 3.5.2 0 .4 0 .5-.05-.2-2-1.8-3.45-3.5-3.45z" />
    </svg>
  );
}

function ThunderbirdIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.93 4.93 4.24 4.24" />
      <path d="m14.83 9.17 4.24-4.24" />
      <path d="M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
    </svg>
  );
}

function OutlookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m3 9 9 6 9-6" />
    </svg>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Shield,
  Code2,
  Mail,
  Users,
  Radio,
  Bot,
  ChevronRight,
  Sparkles,
  Server,
  ArrowRightLeft,
  Inbox,
  FolderSync,
  Workflow,
  AtSign,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";

type CodeLang = "nodejs" | "python" | "go" | "ruby" | "php" | "rust" | "curl";

const codeSnippets: Record<CodeLang, { lang: string; code: string }> = {
  nodejs: {
    lang: "typescript",
    code: `import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'SENDER_ADDRESS',
  to: ['RECIPIENT_ADDRESS'],
  subject: 'SUBJECT',
  html: '<p>MESSAGE_CONTENT</p>',
  tags: [
    { name: 'category', value: 'onboarding' },
  ],
});`,
  },
  python: {
    lang: "python",
    code: `import os
import resend

resend.api_key = os.environ["RESEND_API_KEY"]

params = {
    "from": "SENDER_ADDRESS",
    "to": ["RECIPIENT_ADDRESS"],
    "subject": "SUBJECT",
    "html": "<p>MESSAGE_CONTENT</p>",
}

email = resend.Emails.send(params)`,
  },
  go: {
    lang: "go",
    code: `package main

import (
	"context"
  "os"
	"github.com/resend/resend-go/v2"
)

func main() {
  client := resend.NewClient(os.Getenv("RESEND_API_KEY"))

	params := &resend.SendEmailRequest{
    From:    "SENDER_ADDRESS",
    To:      []string{"RECIPIENT_ADDRESS"},
    Subject: "SUBJECT",
    Html:    "<p>MESSAGE_CONTENT</p>",
	}

	sent, err := client.Emails.SendWithContext(context.TODO(), params)
}`,
  },
  ruby: {
    lang: "ruby",
    code: `require "resend"

Resend.api_key = ENV.fetch("RESEND_API_KEY")

params = {
  "from": "SENDER_ADDRESS",
  "to": ["RECIPIENT_ADDRESS"],
  "subject": "SUBJECT",
  "html": "<p>MESSAGE_CONTENT</p>"
}

Resend::Emails.send(params)`,
  },
  php: {
    lang: "php",
    code: `<?php

$resend = Resend::client(getenv('RESEND_API_KEY'));

$resend->emails->send([
  'from' => 'SENDER_ADDRESS',
  'to' => ['RECIPIENT_ADDRESS'],
  'subject' => 'SUBJECT',
  'html' => '<p>MESSAGE_CONTENT</p>',
]);`,
  },
  rust: {
    lang: "rust",
    code: `use resend_rs::types::CreateEmailBaseOptions;
use resend_rs::Resend;

#[tokio::main]
async fn main() {
    let resend = Resend::new(&std::env::var("RESEND_API_KEY").expect("RESEND_API_KEY required"));

    let email = CreateEmailBaseOptions::new(
        "SENDER_ADDRESS",
        vec!["RECIPIENT_ADDRESS"],
        "SUBJECT",
    )
    .with_html("<p>MESSAGE_CONTENT</p>");

    let _ = resend.emails.send(email).await;
}`,
  },
  curl: {
    lang: "bash",
    code: `curl -X POST "\${NEXT_PUBLIC_API_URL}/v1/emails" \\
  -H "Authorization: Bearer \${RESEND_API_KEY}" \\
  -H 'Content-Type: application/json' \\
  -d $'{
    "from": "SENDER_ADDRESS",
    "to": ["RECIPIENT_ADDRESS"],
    "subject": "SUBJECT",
    "html": "<p>MESSAGE_CONTENT</p>"
  }'`,
  },
};

export default function HomePage() {
  const { toast } = useToast();
  const [selectedLang, setSelectedLang] = useState<CodeLang>("nodejs");
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedLang].code);
    setCopied(true);
    toast.info("Code snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 dark:opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-400 via-transparent to-transparent -z-10 blur-3xl" />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20 sm:pb-24 text-center space-y-8 animate-fade-in">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-50/60 dark:bg-teal-950/30 px-3.5 py-1 text-xs text-teal-800 dark:text-teal-300 backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
          <span>One destination for powerful emailing · All in one suite</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.08]">
            One destination for powerful emailing.{" "}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-emerald-500 to-sky-600 dark:from-teal-400 dark:via-emerald-300 dark:to-sky-400">
              All in one suite.
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            The complete email platform: Send marketing newsletters, create automated email sequences, deliver instant notifications, and connect your favorite mail apps like Apple Mail and Outlook.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/overview"
            className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm shadow-md active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="/backend/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md border border-surface-border bg-surface px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
          >
            <Code2 className="h-4 w-4 text-zinc-400" />
            <span>API Documentation</span>
          </a>
        </div>

        {/* Hero Code Showcase & Live Preview (The Iconic Resend Hero) */}
        <div id="code" className="pt-8 sm:pt-12 text-left">
          <div className="rounded-lg border border-surface-border bg-surface shadow-2xl overflow-hidden">
            {/* Left: Code Snippet Panel */}
            <div className="flex flex-col justify-between bg-zinc-950 text-white">
              {/* Language Tabs */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 bg-zinc-900/60 overflow-x-auto">
                <div className="flex items-center gap-1">
                  {(["nodejs", "python", "go", "ruby", "php", "rust", "curl"] as CodeLang[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`rounded px-2.5 py-1 text-xs font-medium font-mono uppercase transition-colors ${
                        selectedLang === lang
                          ? "bg-zinc-800 text-white shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {lang === "nodejs" ? "Node.js" : lang}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-1 text-[11px] text-zinc-300 hover:text-white transition-colors"
                  title="Copy code snippet"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 font-sans">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span className="font-sans">Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Editor Body */}
              <pre className="w-full min-w-0 max-w-full overflow-x-auto p-5 font-mono text-xs text-zinc-200 leading-relaxed h-[320px]">
                <code className="block w-max">{codeSnippets[selectedLang].code}</code>
              </pre>

              {/* Code Footer */}
              <div className="border-t border-zinc-800/80 px-4 py-2.5 text-[11px] font-mono text-zinc-500">
                Example request. Configure the API base URL and credentials for your environment.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section: Two Pillars */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            All-in-One Email Platform
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Marketing Campaigns Meet Everyday Mailboxes
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            One simple platform to send newsletters, run automated campaigns, and manage custom domain email inboxes.
          </p>
        </div>

        {/* Pillar 1: Marketing & Growth */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold text-xs border border-teal-500/20">
              01
            </span>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Marketing &amp; Growth
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">— Subscribers, Newsletters &amp; Automations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Broadcast Campaigns & Engagement */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                <Radio className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Email Campaigns &amp; Newsletters
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Send beautiful newsletters, test two versions to see which performs better, get tips to keep your subject lines out of spam, and track opens and clicks in real time.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Comparison</span>
                  <span className="font-semibold text-teal-600 dark:text-teal-400">Test 2 Versions</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Results</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Opens &amp; Clicks</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/broadcasts"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline underline-offset-4"
                >
                  <span>Explore Campaigns</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Automated Workflows */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Workflow className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Automated Workflows
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Create step-by-step automatic emails for welcome series, abandoned carts, or re-engaging inactive subscribers with easy delays and branching rules.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Rules</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Delays &amp; Conditions</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Templates</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Welcome &amp; Sales</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/automations"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4"
                >
                  <span>Explore Automations</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Subscribers & Templates */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Subscribers &amp; Templates
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Manage your contacts, organize them into targeted groups, and design reusable email templates personalized with names and custom details.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Contacts</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Groups &amp; Tags</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Templates</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Personalized Tags</span>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <Link
                  href="/audiences"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
                >
                  <span>Contacts</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/templates"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                >
                  <span>Templates</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 2: Custom Inboxes & Mail Apps */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-xs border border-sky-500/20">
              02
            </span>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Custom Inboxes &amp; Mail Apps
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">— Mail Apps, Email Forwarding &amp; Incoming Mail</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 4: Connect to Mail Apps */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                <Server className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Connect to Mail Apps
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Use your custom domain email with apps like Apple Mail, Outlook, or Thunderbird. Send, receive, and sync emails easily on all your devices.
              </p>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1 text-center">
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Send</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">SMTP</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Sync</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">IMAP</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Download</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">POP3</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/smtp"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline underline-offset-4"
                >
                  <span>Mail App Setup Guide</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 5: Email Forwarding & Aliases */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <AtSign className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Email Forwarding &amp; Aliases
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Create extra email addresses for your domain that forward straight to your personal or team inbox, with catch-all support to receive mail sent to any address on your domain.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-center">
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Catch-All</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">*@yourdomain</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Forwarding</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Multiple Inboxes</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/aliases"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline underline-offset-4"
                >
                  <span>Manage Forwarding &amp; Aliases</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 6: Incoming Mail Viewer */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Inbox className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Incoming Mail Viewer
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Receive incoming emails directly, read messages and attachments in your browser, download original email files, or send notifications to your own server.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-center">
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Incoming Mail</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Direct Inbound</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Original File</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">Download .eml</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/inbound"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline underline-offset-4"
                >
                  <span>View Incoming Mail</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Infrastructure: Deliverability, Direct MX & AI MCP */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 7: Deliverability & Direct MX (Wide) */}
          <div
            id="deliverability"
            className="md:col-span-2 rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Email Delivery &amp; Spam Protection
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Protect your sender reputation with built-in domain security (DKIM, SPF, and DMARC) so your messages land in the inbox instead of the spam folder. Automatically blocks invalid addresses and unsubscribed contacts.
            </p>
            <div className="grid grid-cols-1 gap-3 pt-2 text-xs font-mono sm:grid-cols-3">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-sans">DKIM / SPF</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Security Verified</span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-sans">Fast Delivery</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Direct to Inbox</span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-sans">Bounce Protection</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Automatic Filter</span>
              </div>
            </div>
            <div className="pt-2 flex items-center gap-4">
              <Link
                href="/domains"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
              >
                <span>Verify Domains</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/suppressions"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <span>Blocked &amp; Bounced List</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 8: AI Remote MCP Server */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400">
              <Bot className="h-5 w-5" />
            </div>
            <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
              AI Assistant Integration
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Connect Mailhost to AI tools like Claude or Cursor. Let your AI assistant draft campaigns, check delivery reports, and help reply to emails for you.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-center">
              <div className="rounded border border-surface-border bg-surface-raised p-2">
                <span className="text-[10px] text-zinc-500 block font-sans">Protocol</span>
                <span className="font-semibold text-pink-600 dark:text-pink-400">Model Context Protocol</span>
              </div>
              <div className="rounded border border-surface-border bg-surface-raised p-2">
                <span className="text-[10px] text-zinc-500 block font-sans">Compatible Apps</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Claude &amp; Cursor</span>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-pink-600 dark:text-pink-400 hover:underline underline-offset-4"
              >
                <span>Set Up AI Assistant</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-Footer Call to Action */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-24">
        <div className="rounded-3xl border border-surface-border bg-surface p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              One destination for powerful emailing.
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Start sending notifications, automated sequences, and marketing newsletters in under two minutes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/overview"
              className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm shadow-md active:scale-95"
            >
              <span>Explore Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md border border-surface-border bg-surface px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Public Footer */}
      <footer className="border-t border-surface-border bg-surface py-12 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-600 text-white font-semibold text-xs">
                  M
                </div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">Mailhost</span>
              </div>
              <p className="text-zinc-500 max-w-sm">
                One simple home for all your emails: marketing campaigns, fast delivery, and custom domain mailboxes.
              </p>
              <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All systems operational</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-zinc-900 dark:text-white block">Email Suite</span>
              <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <li><Link href="/overview" className="hover:text-zinc-900 dark:hover:text-white">Overview</Link></li>
                <li><Link href="/emails" className="hover:text-zinc-900 dark:hover:text-white">Sent Emails</Link></li>
                <li><Link href="/inbound" className="hover:text-zinc-900 dark:hover:text-white">Incoming Mail</Link></li>
                <li><Link href="/aliases" className="hover:text-zinc-900 dark:hover:text-white">Email Forwarding</Link></li>
                <li><Link href="/domains" className="hover:text-zinc-900 dark:hover:text-white">Domains</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-zinc-900 dark:text-white block">Marketing</span>
              <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <li><Link href="/broadcasts" className="hover:text-zinc-900 dark:hover:text-white">Campaigns</Link></li>
                <li><Link href="/audiences" className="hover:text-zinc-900 dark:hover:text-white">Contacts</Link></li>
                <li><Link href="/automations" className="hover:text-zinc-900 dark:hover:text-white">Automations</Link></li>
                <li><Link href="/templates" className="hover:text-zinc-900 dark:hover:text-white">Templates</Link></li>
                <li><Link href="/events" className="hover:text-zinc-900 dark:hover:text-white">Activity Events</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-zinc-900 dark:text-white block">Protocols &amp; Dev</span>
              <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <li><Link href="/smtp" className="hover:text-zinc-900 dark:hover:text-white">Mail Apps &amp; Setup</Link></li>
                <li><Link href="/api-keys" className="hover:text-zinc-900 dark:hover:text-white">API Keys</Link></li>
                <li><Link href="/webhooks" className="hover:text-zinc-900 dark:hover:text-white">Webhooks</Link></li>
                <li><Link href="/logs" className="hover:text-zinc-900 dark:hover:text-white">System Status</Link></li>
                <li><Link href="/settings" className="hover:text-zinc-900 dark:hover:text-white">AI Assistant</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-[11px] gap-4">
            <p>© 2026 Mailhost Suite. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/overview" className="hover:text-zinc-900 dark:hover:text-white">Dashboard</Link>
              <Link href="/login" className="hover:text-zinc-900 dark:hover:text-white">Login</Link>
              <a href="/backend/openapi.json" target="_blank" rel="noreferrer" className="hover:text-zinc-900 dark:hover:text-white">API Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

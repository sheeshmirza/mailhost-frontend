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
          <span>Marketing Automation Engine + Complete Email Suite</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.08]">
            Marketing Platform &amp; Complete Email Suite
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            The all-in-one email solution: Launch targeted marketing broadcast campaigns, build automated customer drip journeys, deliver transactional emails with sub-second latency, and run full mailbox infrastructure over SMTP, IMAP, and POP3.
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
            <span>OpenAPI Documentation</span>
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
            Unified Dual-Engine Platform
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Marketing Automation meets Complete Mailbox Suite
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            A single infrastructure for sending marketing broadcasts, managing subscriber journeys, and hosting production email mailboxes over SMTP, IMAP, and POP3.
          </p>
        </div>

        {/* Pillar 1: Marketing & Growth Engine */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold text-xs border border-teal-500/20">
              01
            </span>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Marketing &amp; Growth Engine
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">— Audiences, Broadcasts &amp; Automations</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Broadcast Campaigns */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                <Radio className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Broadcast Campaigns
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Send visual newsletters and product announcements. Dispatch immediately or schedule for optimal timezone delivery with real-time open and click telemetry.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Delivery</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Scheduled / Now</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Telemetry</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Opens &amp; Clicks</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/broadcasts"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline underline-offset-4"
                >
                  <span>Create Broadcast Campaign</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: Multi-Step Automations */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Workflow className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Drip Automations
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Design automated lifecycle workflows. Trigger series on user signup, order placed, or segment entry with configurable delays, branching conditions, and email steps.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Triggers</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Event-driven</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Steps</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">Delays &amp; Branches</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/automations"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4"
                >
                  <span>Build Customer Journeys</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: Audiences, Segments & Templates */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Audiences &amp; Templates
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Sync contacts, record custom traits, build dynamic cohorts, and craft reusable templates with merge tags (<code className="font-mono text-zinc-700 dark:text-zinc-300">{"{{first_name}}"}</code>).
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Audiences</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Traits &amp; Topics</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2 text-center">
                  <span className="text-[10px] text-zinc-500 block font-sans">Templates</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Dynamic Tags</span>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <Link
                  href="/audiences"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4"
                >
                  <span>Audiences</span>
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

        {/* Pillar 2: Complete Email Suite & Mail Protocols */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold text-xs border border-sky-500/20">
              02
            </span>
            <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
              Complete Email Suite &amp; Protocols
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">— SMTP, IMAP, POP3, Inbound MTA &amp; Virtual Aliases</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 4: SMTP, IMAP & POP3 Protocols */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                <Server className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                SMTP, IMAP &amp; POP3 Protocols
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Connect Apple Mail, Thunderbird, Outlook, or background scripts with full RFC support: SMTP (587/465) for submission, IMAP (993/143) for sync, and POP3 (995/110) for download.
              </p>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pt-1 text-center">
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">SMTP</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">587 / 465</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">IMAP</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">993 / 143</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">POP3</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">995 / 110</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/smtp"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline underline-offset-4"
                >
                  <span>Protocol Credentials &amp; Guide</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 5: Virtual Aliases & Catch-All Routing */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                <AtSign className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Virtual Aliases &amp; Catch-All
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Configure unlimited virtual email aliases per domain. Forward inbound messages to multiple external addresses, enable wildcard catch-all (<code className="font-mono text-zinc-700 dark:text-zinc-300">*@domain.com</code>), and optionally preserve local mailbox copies.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-center">
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Catch-All</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">*@domain.com</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Forwarding</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Multi-Target</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/aliases"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline underline-offset-4"
                >
                  <span>Configure Email Aliases</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 6: Inbound MTA & Raw MIME Parsing */}
            <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Inbox className="h-5 w-5" />
              </div>
              <h4 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Inbound MTA &amp; Raw MIME
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Listen on Port 25 as a full Mail Transfer Agent. Parse multipart RFC-822 MIME mail, extract raw attachments, download original <code className="font-mono text-zinc-700 dark:text-zinc-300">.eml</code> files, and trigger downstream webhooks.
              </p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-center">
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">MTA Inbound</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Port 25 Direct</span>
                </div>
                <div className="rounded border border-surface-border bg-surface-raised p-2">
                  <span className="text-[10px] text-zinc-500 block font-sans">Raw Archive</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">.eml Download</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/inbound"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline underline-offset-4"
                >
                  <span>Inspect Inbound Messages</span>
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
              Direct MX Outbound &amp; Deliverability Protection
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Emails are sent strictly through registered, verified domains with automated 2048-bit DKIM key generation, SPF records, and DMARC compliance. Direct MX delivery connects directly to recipient mail servers with zero relay dependencies. Automatic suppression filters hard bounces and complaints in real-time.
            </p>
            <div className="grid grid-cols-1 gap-3 pt-2 text-xs font-mono sm:grid-cols-3">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-sans">DKIM / SPF</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">2048-bit Verified</span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-sans">Direct MX MTA</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Zero-Relay Direct</span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-sans">Auto-Suppression</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Real-time Filter</span>
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
                <span>Suppression List</span>
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
              Remote AI MCP Server
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Native Model Context Protocol integration. AI agents (Claude Desktop, Cursor, Antigravity) can draft campaigns, inspect delivery telemetry, and triage inbound emails autonomously over stdio or SSE.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 text-center">
              <div className="rounded border border-surface-border bg-surface-raised p-2">
                <span className="text-[10px] text-zinc-500 block font-sans">Protocol</span>
                <span className="font-semibold text-pink-600 dark:text-pink-400">MCP Standard</span>
              </div>
              <div className="rounded border border-surface-border bg-surface-raised p-2">
                <span className="text-[10px] text-zinc-500 block font-sans">Transport</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">stdio / SSE</span>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-pink-600 dark:text-pink-400 hover:underline underline-offset-4"
              >
                <span>View MCP Integration</span>
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
              Ready to send emails that actually reach the inbox?
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Start sending transactional emails and marketing broadcasts in under two minutes.
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
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold text-xs">
                  R
                </div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-white">Resend</span>
              </div>
              <p className="text-zinc-500 max-w-sm">
                Next-generation marketing automation engine and complete mailbox suite for modern developers.
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
                <li><Link href="/emails" className="hover:text-zinc-900 dark:hover:text-white">Emails API</Link></li>
                <li><Link href="/inbound" className="hover:text-zinc-900 dark:hover:text-white">Inbound MTA</Link></li>
                <li><Link href="/aliases" className="hover:text-zinc-900 dark:hover:text-white">Email Aliases</Link></li>
                <li><Link href="/domains" className="hover:text-zinc-900 dark:hover:text-white">Domains</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-zinc-900 dark:text-white block">Marketing</span>
              <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <li><Link href="/broadcasts" className="hover:text-zinc-900 dark:hover:text-white">Broadcasts</Link></li>
                <li><Link href="/audiences" className="hover:text-zinc-900 dark:hover:text-white">Audiences</Link></li>
                <li><Link href="/automations" className="hover:text-zinc-900 dark:hover:text-white">Automations</Link></li>
                <li><Link href="/templates" className="hover:text-zinc-900 dark:hover:text-white">Templates</Link></li>
                <li><Link href="/events" className="hover:text-zinc-900 dark:hover:text-white">Events</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-zinc-900 dark:text-white block">Protocols &amp; Dev</span>
              <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <li><Link href="/smtp" className="hover:text-zinc-900 dark:hover:text-white">SMTP, IMAP &amp; POP3</Link></li>
                <li><Link href="/api-keys" className="hover:text-zinc-900 dark:hover:text-white">API Keys</Link></li>
                <li><Link href="/webhooks" className="hover:text-zinc-900 dark:hover:text-white">Webhooks</Link></li>
                <li><Link href="/logs" className="hover:text-zinc-900 dark:hover:text-white">System Health</Link></li>
                <li><Link href="/settings" className="hover:text-zinc-900 dark:hover:text-white">MCP Server</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-[11px] gap-4">
            <p>© 2026 Resend Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/overview" className="hover:text-zinc-900 dark:hover:text-white">Dashboard</Link>
              <Link href="/login" className="hover:text-zinc-900 dark:hover:text-white">Login</Link>
              <a href="/backend/openapi.json" target="_blank" rel="noreferrer" className="hover:text-zinc-900 dark:hover:text-white">Docs</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

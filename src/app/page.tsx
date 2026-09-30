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
  GitBranch,
  Bot,
  ExternalLink,
  ChevronRight,
  Terminal,
  Server,
  Activity,
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
        {/* Hero Title */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-white leading-[1.08]">
            Email for developers
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The best way to reach humans instead of spam folders. Deliver transactional and marketing emails at scale with high deliverability, powerful SDKs, and developer-first APIs.
          </p>
        </div>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/overview"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all shadow-md active:scale-95"
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
              <pre className="p-5 font-mono text-xs text-zinc-200 overflow-x-auto leading-relaxed h-[320px]">
                <code>{codeSnippets[selectedLang].code}</code>
              </pre>

              {/* Code Footer */}
              <div className="border-t border-zinc-800/80 px-4 py-2.5 text-[11px] font-mono text-zinc-500">
                Example request. Configure the API base URL and credentials for your environment.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Engineered for High Deliverability
          </h2>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Everything you need to deliver emails at global scale
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            A unified email platform with clean APIs, deep deliverability telemetry, and full lifecycle automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Deliverability & Smart IP Warming */}
          <div
            id="deliverability"
            className="md:col-span-2 rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <Shield className="h-5 w-5 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Smart IP Warmup & Deliverability Protection
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Automatic SPF, DKIM, DMARC, and MX verification ensures your domain reputation remains pristine. Our intelligent warm-up engine safely ramps daily volume across dedicated IPs while automated suppression lists block known hard bounces and complaints.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-sans">SPF / DKIM</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Automated</span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-sans">DMARC Policy</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Policy controls</span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 block uppercase font-sans">Hard Bounce Filter</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Auto-Suppress</span>
              </div>
            </div>
          </div>

          {/* Card 2: Inbound Email Webhooks */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <Mail className="h-5 w-5 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Inbound Webhooks
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Parse raw RFC-822 MIME mail, extract attachments, download original <code className="text-zinc-800 dark:text-zinc-200 font-mono">.eml</code> archives, and stream webhooks directly into your application.
            </p>
            <div className="pt-2">
              <Link
                href="/inbound"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-white hover:underline underline-offset-4"
              >
                <span>Inspect Inbound Stream</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Audiences, Contacts & Cohort Segments */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <Users className="h-5 w-5 text-sky-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Audiences & Segments
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Store contact subscribers, customize topics preferences, and build dynamic segments by traits or lifecycle stages.
            </p>
            <div className="pt-2">
              <Link
                href="/audiences"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-white hover:underline underline-offset-4"
              >
                <span>Manage Audiences</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Broadcasts & Drip Automations */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <Radio className="h-5 w-5 text-amber-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Broadcast Campaigns
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Dispatch product updates, announcements, or newsletters. Target specific cohorts with instantaneous or scheduled delivery.
            </p>
            <div className="pt-2">
              <Link
                href="/broadcasts"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-white hover:underline underline-offset-4"
              >
                <span>Create Broadcast</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 5: AI Remote MCP Server */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 space-y-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <Bot className="h-5 w-5 text-pink-500" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
              Remote AI MCP Server
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Built-in Model Context Protocol server. AI agents (Claude Desktop, Cursor, Antigravity) can draft, dispatch, track, and inspect emails autonomously.
            </p>
            <div className="pt-2">
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 dark:text-white hover:underline underline-offset-4"
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all shadow-md active:scale-95"
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
                Next-generation transactional and marketing email engine for modern developers.
              </p>
              <div className="flex items-center gap-2 text-zinc-500 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All systems operational</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-zinc-900 dark:text-white block">Product</span>
              <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <li><Link href="/overview" className="hover:text-zinc-900 dark:hover:text-white">Overview</Link></li>
                <li><Link href="/emails" className="hover:text-zinc-900 dark:hover:text-white">Emails API</Link></li>
                <li><Link href="/domains" className="hover:text-zinc-900 dark:hover:text-white">Domains</Link></li>
                <li><Link href="/broadcasts" className="hover:text-zinc-900 dark:hover:text-white">Broadcasts</Link></li>
                <li><Link href="/automations" className="hover:text-zinc-900 dark:hover:text-white">Automations</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-zinc-900 dark:text-white block">Resources</span>
              <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <li><a href="/backend/openapi.json" target="_blank" rel="noreferrer" className="hover:text-zinc-900 dark:hover:text-white">OpenAPI Spec</a></li>
                <li><Link href="/templates" className="hover:text-zinc-900 dark:hover:text-white">Templates</Link></li>
                <li><Link href="/webhooks" className="hover:text-zinc-900 dark:hover:text-white">Webhooks</Link></li>
                <li><Link href="/inbound" className="hover:text-zinc-900 dark:hover:text-white">Inbound Routing</Link></li>
                <li><Link href="/smtp" className="hover:text-zinc-900 dark:hover:text-white">SMTP Relay</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-zinc-900 dark:text-white block">Developer</span>
              <ul className="space-y-1.5 text-zinc-500 dark:text-zinc-400">
                <li><Link href="/api-keys" className="hover:text-zinc-900 dark:hover:text-white">API Keys</Link></li>
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

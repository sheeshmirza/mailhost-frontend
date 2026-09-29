"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Zap,
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
  Sparkles,
  Server,
  Activity,
  Play,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";

type CodeLang = "nodejs" | "python" | "go" | "ruby" | "php" | "rust" | "curl";

const codeSnippets: Record<CodeLang, { lang: string; code: string }> = {
  nodejs: {
    lang: "typescript",
    code: `import { Resend } from 'resend';

const resend = new Resend('re_123456789');

await resend.emails.send({
  from: 'Acme <onboarding@resend.dev>',
  to: ['alex@example.com'],
  subject: 'Welcome to Acme!',
  html: '<strong>Welcome to the modern email platform!</strong>',
  tags: [
    { name: 'category', value: 'onboarding' },
  ],
});`,
  },
  python: {
    lang: "python",
    code: `import resend

resend.api_key = "re_123456789"

params = {
    "from": "Acme <onboarding@resend.dev>",
    "to": ["alex@example.com"],
    "subject": "Welcome to Acme!",
    "html": "<strong>Welcome to the modern email platform!</strong>",
}

email = resend.Emails.send(params)`,
  },
  go: {
    lang: "go",
    code: `package main

import (
	"context"
	"github.com/resend/resend-go/v2"
)

func main() {
	client := resend.NewClient("re_123456789")

	params := &resend.SendEmailRequest{
		From:    "Acme <onboarding@resend.dev>",
		To:      []string{"alex@example.com"},
		Subject: "Welcome to Acme!",
		Html:    "<strong>Welcome to the modern email platform!</strong>",
	}

	sent, err := client.Emails.SendWithContext(context.TODO(), params)
}`,
  },
  ruby: {
    lang: "ruby",
    code: `require "resend"

Resend.api_key = "re_123456789"

params = {
  "from": "Acme <onboarding@resend.dev>",
  "to": ["alex@example.com"],
  "subject": "Welcome to Acme!",
  "html": "<strong>Welcome to the modern email platform!</strong>"
}

Resend::Emails.send(params)`,
  },
  php: {
    lang: "php",
    code: `<?php

$resend = Resend::client('re_123456789');

$resend->emails->send([
  'from' => 'Acme <onboarding@resend.dev>',
  'to' => ['alex@example.com'],
  'subject' => 'Welcome to Acme!',
  'html' => '<strong>Welcome to the modern email platform!</strong>',
]);`,
  },
  rust: {
    lang: "rust",
    code: `use resend_rs::types::CreateEmailBaseOptions;
use resend_rs::Resend;

#[tokio::main]
async fn main() {
    let resend = Resend::new("re_123456789");

    let email = CreateEmailBaseOptions::new(
        "Acme <onboarding@resend.dev>",
        vec!["alex@example.com"],
        "Welcome to Acme!",
    )
    .with_html("<strong>Welcome to the modern email platform!</strong>");

    let _ = resend.emails.send(email).await;
}`,
  },
  curl: {
    lang: "bash",
    code: `curl -X POST 'http://localhost:8080/emails' \\
  -H 'Authorization: Bearer re_123456789' \\
  -H 'Content-Type: application/json' \\
  -d $'{
    "from": "Acme <onboarding@resend.dev>",
    "to": ["alex@example.com"],
    "subject": "Welcome to Acme!",
    "html": "<strong>Welcome to the modern email platform!</strong>"
  }'`,
  },
};

export default function HomePage() {
  const { toast } = useToast();
  const [selectedLang, setSelectedLang] = useState<CodeLang>("nodejs");
  const [copied, setCopied] = useState(false);

  // Playground state
  const [testEmail, setTestEmail] = useState("developer@example.com");
  const [testTemplate, setTestTemplate] = useState("welcome");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulateResult, setSimulateResult] = useState<any | null>(null);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[selectedLang].code);
    setCopied(true);
    toast.info("Code snippet copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    setSimulateResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      const generatedId = "email_" + Math.random().toString(36).substring(2, 11);
      setSimulateResult({
        id: generatedId,
        from: "Acme <onboarding@resend.dev>",
        to: [testEmail],
        status: "delivered",
        latency_ms: 38,
        spf: "pass",
        dkim: "pass",
        dmarc: "pass",
      });
      toast.success("Simulation dispatched: email delivered in 38ms!");
    }, 600);
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40 dark:opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-400 via-transparent to-transparent -z-10 blur-3xl" />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 pb-20 sm:pb-24 text-center space-y-8 animate-fade-in">
        {/* Announcement Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-surface px-3.5 py-1 text-xs text-zinc-600 dark:text-zinc-300 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span className="font-medium">Introducing Audiences & Automated Drip Journeys</span>
          <ArrowRight className="h-3 w-3 text-zinc-400" />
        </div>

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
          <a
            href="#playground"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <Play className="h-3.5 w-3.5" />
            <span>Try Live Playground</span>
          </a>
        </div>

        {/* Hero Code Showcase & Live Preview (The Iconic Resend Hero) */}
        <div id="code" className="pt-8 sm:pt-12 text-left">
          <div className="rounded-2xl border border-surface-border bg-surface shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-surface-border">
            {/* Left: Code Snippet Panel */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-950 text-white">
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
              <div className="border-t border-zinc-800/80 px-4 py-2.5 text-[11px] font-mono text-zinc-500 flex items-center justify-between">
                <span>SDK Response: 200 OK</span>
                <span className="text-emerald-400">P99: 38ms</span>
              </div>
            </div>

            {/* Right: Live Rendered Email Preview */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-surface-raised/40 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-zinc-400">
                  Rendered Email Preview
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40 px-2 py-0.5 text-[10px] font-medium font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  SPF/DKIM/DMARC Pass
                </span>
              </div>

              {/* Email Envelope Container */}
              <div className="rounded-xl border border-surface-border bg-surface p-5 shadow-sm space-y-4">
                <div className="border-b border-surface-border pb-3 text-xs space-y-1">
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>From:</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">
                      Acme &lt;onboarding@resend.dev&gt;
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>To:</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">alex@example.com</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Subject:</span>
                    <span className="font-medium text-zinc-900 dark:text-white">Welcome to Acme!</span>
                  </div>
                </div>

                {/* Rendered HTML Canvas */}
                <div className="space-y-3 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-black font-bold text-sm">
                    A
                  </div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                    Welcome to the future of email.
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    Thank you for signing up for Acme. Your account is ready. Verify your email below to start shipping features faster.
                  </p>
                  <div className="pt-2">
                    <span className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-black shadow-sm">
                      Confirm Email Address
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-border text-[10px] text-zinc-400 dark:text-zinc-500">
                  Acme Inc. · 100 Market St, San Francisco, CA · Unsubscribe
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 text-center font-mono">
                Delivered straight to Primary Inbox (No spam folder)
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Banner */}
      <section className="border-y border-surface-border bg-surface-raised/30 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
              99.99%
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Deliverability & Uptime SLA
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
              &lt; 50ms
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Global P99 Delivery Latency
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
              10M+
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Daily Email Engine Capacity
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
              100%
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Open-Source Go Engine
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
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Validated</span>
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

      {/* Interactive Live Playground Section */}
      <section id="playground" className="border-t border-surface-border bg-surface-raised/20 py-20 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Interactive Test Console
            </h2>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Test the delivery engine right now
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Simulate an API dispatch and inspect the real-time latency and HTTP response headers.
            </p>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface p-6 sm:p-8 shadow-xl max-w-2xl mx-auto space-y-6">
            <form onSubmit={handleSimulateSend} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Preset Template Scenario
                </label>
                <select
                  value={testTemplate}
                  onChange={(e) => setTestTemplate(e.target.value)}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="welcome">User Onboarding Series (Immediate + 24h follow-up)</option>
                  <option value="auth">Magic Link Passwordless Login</option>
                  <option value="invoice">Stripe Invoice Receipt #1042</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSimulating}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-zinc-900 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>{isSimulating ? "Simulating Delivery..." : "Dispatch Test Delivery"}</span>
              </button>
            </form>

            {simulateResult && (
              <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-2 animate-fade-in font-mono text-xs">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span>HTTP 200 OK</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Delivery time: {simulateResult.latency_ms}ms
                  </span>
                </div>
                <pre className="text-zinc-800 dark:text-zinc-200 overflow-x-auto text-[11px]">
                  <code>{JSON.stringify(simulateResult, null, 2)}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Developer Quotes / Testimonials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-24 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Built for modern engineering teams
          </h2>
          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Loved by developers worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
              &ldquo;Resend makes email feel like any modern developer API. We set up transactional receipts in 10 minutes and our deliverability jumped to 99.9%.&rdquo;
            </p>
            <div className="text-xs font-semibold text-zinc-900 dark:text-white">
              Sarah Jenkins
              <span className="block text-[11px] text-zinc-500 font-normal">CTO, HyperScale</span>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
              &ldquo;The React Email support combined with the Go engine speed is completely unmatched. We discarded our legacy SendGrid stack completely.&rdquo;
            </p>
            <div className="text-xs font-semibold text-zinc-900 dark:text-white">
              David Chen
              <span className="block text-[11px] text-zinc-500 font-normal">Staff Engineer, Vercel Eco</span>
            </div>
          </div>

          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
              &ldquo;The built-in MCP server lets our AI agents directly inspect bounced emails and trigger campaigns through natural language prompts. Mindblowing.&rdquo;
            </p>
            <div className="text-xs font-semibold text-zinc-900 dark:text-white">
              Elena Rostova
              <span className="block text-[11px] text-zinc-500 font-normal">Founder, Agentic AI</span>
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
                <li><a href="/backend/metrics" target="_blank" rel="noreferrer" className="hover:text-zinc-900 dark:hover:text-white">Prometheus Metrics</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-[11px] gap-4">
            <p>© 2026 Resend Inc. All rights reserved. Built with Next.js & Go.</p>
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

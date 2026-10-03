"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  DomainView,
  DeliverabilityInspectResponse,
} from "@/lib/api";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  RefreshCw,
  Mail,
  Globe,
  FileText,
  Inbox,
  ArrowRight,
  Info,
  Server,
  Layers,
  Check,
} from "lucide-react";
import { ErrorState } from "@/components/ui/ErrorState";

export default function DeliverabilityPage() {
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("");
  const [fromAddress, setFromAddress] = useState<string>("");
  const [subject, setSubject] = useState<string>("Important update regarding your account security");
  const [htmlContent, setHtmlContent] = useState<string>(
    "<p>Hello {{first_name}},</p><p>We have updated our terms and enhanced account security with multi-factor authentication. Please review your settings <a href=\"https://example.com/settings\">here</a>.</p><p><small>To unsubscribe, click <a href=\"https://example.com/unsubscribe\">here</a>.</small></p>"
  );
  const [textContent, setTextContent] = useState<string>(
    "Hello {{first_name}},\n\nWe have updated our terms and enhanced account security. Review your settings at https://example.com/settings.\n\nTo unsubscribe: https://example.com/unsubscribe"
  );
  const [includeUnsubHeader, setIncludeUnsubHeader] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<DeliverabilityInspectResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadDomains() {
      setIsLoading(true);
      try {
        const res = await api.listDomains();
        const verified = res.data?.filter((d) => d.status === "verified") || [];
        setDomains(res.data || []);
        if (verified.length > 0) {
          setSelectedDomain(verified[0].name);
          setFromAddress(`notifications@${verified[0].name}`);
        } else if (res.data && res.data.length > 0) {
          setSelectedDomain(res.data[0].name);
          setFromAddress(`notifications@${res.data[0].name}`);
        }
      } catch (err) {
        console.error("Failed to load domains", err);
      } finally {
        setIsLoading(false);
      }
    }
    void loadDomains();
  }, []);

  const runAudit = async () => {
    setIsAuditing(true);
    setErrorMessage(null);
    try {
      const headers: Record<string, string> = {};
      if (includeUnsubHeader && selectedDomain) {
        headers["List-Unsubscribe"] = `<mailto:unsubscribe@${selectedDomain}>, <https://${selectedDomain}/unsubscribe>`;
        headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
      }

      const res = await api.inspectDeliverability({
        domain: selectedDomain || undefined,
        from: fromAddress || undefined,
        subject,
        html: htmlContent,
        text: textContent,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });
      setAuditResult(res);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to run deliverability audit.");
    } finally {
      setIsAuditing(false);
    }
  };

  const loadSample = (type: "marketing" | "transactional" | "risky") => {
    if (type === "transactional") {
      setSubject("Your order confirmation #MH-8921");
      setHtmlContent(
        "<h2>Order Confirmed</h2><p>Thank you for your purchase. Your receipt and shipping tracking details are available <a href=\"https://example.com/orders\">here</a>.</p>"
      );
      setTextContent("Order Confirmed\n\nThank you for your purchase. View your receipt: https://example.com/orders");
      setIncludeUnsubHeader(false);
    } else if (type === "marketing") {
      setSubject("Introducing the next-generation automation suite");
      setHtmlContent(
        "<h1>Unlock Superpowered Workflows</h1><p>Hey {{first_name}}, explore our newly redesigned visual drag-and-drop automation builder. <a href=\"https://example.com/try\">Try it now</a>.</p><p><small><a href=\"https://example.com/unsub\">Unsubscribe</a></small></p>"
      );
      setTextContent("Unlock Superpowered Workflows\n\nExplore our newly redesigned builder: https://example.com/try\n\nUnsubscribe: https://example.com/unsub");
      setIncludeUnsubHeader(true);
    } else {
      setSubject("URGENT: YOU ARE OUR 100% FREE WINNER! CLAIM NOW $$$");
      setHtmlContent(
        "<h1>CONGRATULATIONS WINNER!</h1><p>You have won our exclusive jackpot! Click <a href=\"http://insecure-link.com/claim\">HERE</a> to claim your free reward immediately.</p>"
      );
      setTextContent("");
      setIncludeUnsubHeader(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 75) return "text-teal-500 border-teal-500/30 bg-teal-500/10";
    if (score >= 50) return "text-amber-500 border-amber-500/30 bg-amber-500/10";
    return "text-rose-500 border-rose-500/30 bg-rose-500/10";
  };

  return (
    <div className="page-container space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Deliverability &amp; Inbox Pre-Flight Hub
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> 100% Inbox Placement Engine
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Simulate mailbox provider algorithms, verify SPF, DKIM, and DMARC alignment, and audit email content against spam filters before launching campaigns.
          </p>
        </div>

        <button
          onClick={() => void runAudit()}
          disabled={isAuditing}
          className="btn-primary inline-flex items-center gap-2 text-xs px-4 py-2"
        >
          {isAuditing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>{isAuditing ? "Auditing Payload..." : "Run Pre-Flight Audit"}</span>
        </button>
      </div>

      {errorMessage && (
        <ErrorState
          title="Deliverability Audit Error"
          message={errorMessage}
          onRetry={() => void runAudit()}
        />
      )}

      {/* Main Grid: Input Form & Live Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Outbound Email Inspector Input Form (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-surface-border bg-surface p-5 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-border pb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
              <Mail className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Outbound Payload Inspector</span>
            </div>
            {/* Quick Samples */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => loadSample("marketing")}
                className="px-2 py-0.5 rounded border border-surface-border hover:bg-surface-raised text-zinc-600 dark:text-zinc-300"
              >
                Marketing
              </button>
              <button
                type="button"
                onClick={() => loadSample("transactional")}
                className="px-2 py-0.5 rounded border border-surface-border hover:bg-surface-raised text-zinc-600 dark:text-zinc-300"
              >
                Transactional
              </button>
              <button
                type="button"
                onClick={() => loadSample("risky")}
                className="px-2 py-0.5 rounded border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-medium"
              >
                Spam Test
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Domain selection */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Target Sender Domain
              </label>
              <div className="relative">
                {domains.length > 0 ? (
                  <select
                    value={selectedDomain}
                    onChange={(e) => {
                      setSelectedDomain(e.target.value);
                      setFromAddress(`notifications@${e.target.value}`);
                    }}
                    className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} {d.status === "verified" ? "✓ (Verified)" : "⚠ (Unverified)"}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    placeholder="e.g. example.com"
                    className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                )}
              </div>
            </div>

            {/* From address */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                From Address
              </label>
              <input
                type="email"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                placeholder="notifications@example.com"
                className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
              />
            </div>

            {/* Subject Line */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  Subject Line
                </label>
                <span className="text-[10px] text-zinc-400">
                  {subject.length} chars
                </span>
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject line..."
                className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* HTML Content */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                HTML Body
              </label>
              <textarea
                rows={5}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Enter HTML markup..."
                className="w-full rounded-lg border border-surface-border bg-surface-raised p-2.5 text-[11px] font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Plaintext Content */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Plaintext Body (Alternative)
              </label>
              <textarea
                rows={3}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter plaintext message..."
                className="w-full rounded-lg border border-surface-border bg-surface-raised p-2.5 text-[11px] font-mono text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Headers Toggle */}
            <div className="pt-2 border-t border-surface-border">
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeUnsubHeader}
                  onChange={(e) => setIncludeUnsubHeader(e.target.checked)}
                  className="rounded border-surface-border text-teal-600 focus:ring-teal-500"
                />
                <span>Include RFC 8058 One-Click <code className="font-mono text-teal-600 dark:text-teal-400">List-Unsubscribe</code> header</span>
              </label>
            </div>

            <button
              type="button"
              onClick={() => void runAudit()}
              disabled={isAuditing}
              className="btn-primary w-full py-2.5 text-xs shadow"
            >
              {isAuditing ? "Analyzing..." : "Audit Payload & Placement"}
            </button>
          </div>
        </div>

        {/* Right Column: Pre-Flight Audit Report & Deliverability Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {auditResult ? (
            <>
              {/* Scorecard & Verdict Banner */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-2xl font-bold tracking-tight ${getScoreColor(auditResult.score)}`}>
                      {auditResult.score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-zinc-900 dark:text-white">
                          Deliverability Score: {auditResult.score}/100
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getScoreColor(auditResult.score)}`}>
                          {auditResult.verdict}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Domain: <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">{auditResult.domain || "N/A"}</span>
                        {" · "}
                        RFC 8058: {auditResult.rfc8058_compliant ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Compliant ✓</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">Missing ⚠</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => void runAudit()}
                    disabled={isAuditing}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    <RefreshCw className={`h-3 w-3 ${isAuditing ? "animate-spin" : ""}`} />
                    <span>Re-evaluate</span>
                  </button>
                </div>

                {/* Inbox Placement Predictions */}
                <div className="mt-6 pt-5 border-t border-surface-border">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-3">
                    Predictive Inbox Placement by Mailbox Provider
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(auditResult.placement_forecast || {}).map(([provider, forecast]) => {
                      const isGood = forecast === "Inbox" || forecast === "Focused";
                      return (
                        <div
                          key={provider}
                          className="rounded-xl border border-surface-border bg-surface-raised p-3 text-center"
                        >
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block capitalize">
                            {provider.replace("_", " ")}
                          </span>
                          <span
                            className={`text-xs font-bold mt-1 block ${
                              isGood
                                ? "text-emerald-600 dark:text-emerald-400"
                                : forecast.includes("Spam") || forecast.includes("Junk")
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {forecast}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* DNS Authentication Matrix */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                      DNS Authentication &amp; Protocol Verification
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">RFC 7208 / 6376 / 7489</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(auditResult.dns_authentication || {}).map(([key, check]) => {
                    const isPass = check.status === "pass";
                    const isWarn = check.status === "warn";
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-3.5 space-y-2 ${
                          isPass
                            ? "border-emerald-500/20 bg-emerald-500/5"
                            : isWarn
                            ? "border-amber-500/20 bg-amber-500/5"
                            : "border-rose-500/20 bg-rose-500/5"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {isPass ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : isWarn ? (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-500" />
                            )}
                            <span className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                              {key}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              isPass
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : isWarn
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                : "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                            }`}
                          >
                            {check.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
                          {check.details}
                        </p>
                        {check.found_values && check.found_values.length > 0 && (
                          <div className="rounded bg-black/5 dark:bg-white/5 p-1.5 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 truncate">
                            {check.found_values[0]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spam Rule Findings & Content Quality */}
              <div className="rounded-2xl border border-surface-border bg-surface p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-surface-border pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                      Content Quality &amp; Spam Trigger Findings
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    {auditResult.spam_audit.length} issues detected
                  </span>
                </div>

                {auditResult.spam_audit.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">Pristine Content Health</p>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Zero spam trigger keywords, healthy text-to-HTML ratio, and secure HTTPS protocol links.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditResult.spam_audit.map((finding, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-surface-raised p-3 text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-semibold text-zinc-500">
                              {finding.rule}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                finding.severity === "high"
                                  ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                                  : finding.severity === "medium"
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                  : "bg-zinc-500/20 text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {finding.severity}
                            </span>
                          </div>
                          <p className="text-zinc-700 dark:text-zinc-300 text-[11px]">
                            {finding.description}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                          -{finding.penalty} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actionable Remediation Checklist */}
              {auditResult.recommendations && auditResult.recommendations.length > 0 && (
                <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold text-xs">
                    <Sparkles className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    <span>Actionable Recommendations for 100% Inbox Placement</span>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                    {auditResult.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            /* Empty state prompt */
            <div className="rounded-2xl border border-surface-border bg-surface p-12 text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Ready to audit deliverability
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select a domain or enter your email draft on the left, then click <strong>Run Pre-Flight Audit</strong> to inspect DNS authentication, placement predictions, and spam penalties.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void runAudit()}
                disabled={isAuditing}
                className="btn-primary text-xs px-5 py-2 inline-flex items-center gap-2 shadow"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Run First Audit</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

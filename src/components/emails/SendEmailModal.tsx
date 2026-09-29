"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Eye, Code, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { api, DomainView } from "@/lib/api";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: (emailId: string) => void;
}

export default function SendEmailModal({
  isOpen,
  onClose,
  onSent,
}: SendEmailModalProps) {
  const [from, setFrom] = useState("");
  const [toInput, setToInput] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState(
    `<div style="font-family: sans-serif; padding: 20px;">
  <h2>Welcome to Resend!</h2>
  <p>This is a transactional email sent directly via the Mailhost engine.</p>
  <a href="https://resend.com" style="display: inline-block; padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Get Started</a>
</div>`
  );
  const [textContent, setTextContent] = useState("");
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [activeTab, setActiveTab] = useState<"html" | "preview" | "text">("html");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  // Advanced toggles
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [replyTo, setReplyTo] = useState("");

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessId(null);
      // Fetch verified domains to populate sender
      api.listDomains().then((res) => {
        setDomains(res.data || []);
        if (res.data && res.data.length > 0) {
          const verified = res.data.find((d) => d.status === "verified") || res.data[0];
          setFrom(`Acme <onboarding@${verified.name}>`);
        } else {
          setFrom("Acme <onboarding@example.com>");
        }
      }).catch(() => {
        setFrom("Acme <onboarding@example.com>");
      });
    }
  }, [isOpen]);

  // Load preview when preview tab is clicked
  useEffect(() => {
    if (activeTab === "preview" && htmlContent) {
      api.renderEmail({ html: htmlContent, text: textContent })
        .then((res) => setPreviewHtml(res.html))
        .catch(() => setPreviewHtml(htmlContent));
    }
  }, [activeTab, htmlContent, textContent]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);

    try {
      const recipients = toInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (recipients.length === 0) {
        throw new Error("At least one recipient email is required");
      }

      const res = await api.sendEmail({
        from: from.trim(),
        to: recipients,
        subject: subject.trim(),
        html: htmlContent,
        text: textContent || undefined,
        cc: cc ? cc.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        bcc: bcc ? bcc.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        reply_to: replyTo ? [replyTo.trim()] : undefined,
      });

      setSuccessId(res.id);
      if (onSent) onSent(res.id);
    } catch (err: any) {
      setError(err.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-xl border border-surface-border bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-3.5 bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-white" />
            <h2 className="text-sm font-semibold text-white">Send Email</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-brand-400 hover:bg-surface-raised hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        {successId ? (
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">Email Enqueued Successfully!</h3>
              <p className="text-xs text-brand-400">
                The delivery worker is processing your message.
              </p>
            </div>
            <div className="rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-xs font-mono text-brand-300">
              ID: {successId}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setSuccessId(null);
                  setToInput("");
                  setSubject("");
                }}
                className="rounded-md border border-surface-border px-4 py-1.5 text-xs text-brand-300 hover:bg-surface-raised"
              >
                Send Another
              </button>
              <button
                onClick={onClose}
                className="rounded-md bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Sender and Recipient */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-brand-400 mb-1">
                  From
                </label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Acme <onboarding@yourdomain.com>"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white placeholder-brand-600 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-brand-400 mb-1">
                  To (comma separated)
                </label>
                <input
                  type="text"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  placeholder="user@example.com, test@domain.com"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white placeholder-brand-600 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-medium text-brand-400 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your Order Confirmation #1024"
                required
                className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white placeholder-brand-600 focus:border-brand-500 focus:outline-none"
              />
            </div>

            {/* Content Tabs (HTML, Plain Text, Preview) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-brand-400">
                  Message Content
                </label>
                <div className="flex rounded-md border border-surface-border bg-surface-raised p-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("html")}
                    className={`flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] transition-colors ${
                      activeTab === "html" ? "bg-surface text-white font-medium shadow-sm" : "text-brand-500 hover:text-brand-300"
                    }`}
                  >
                    <Code className="h-3 w-3" />
                    <span>HTML</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] transition-colors ${
                      activeTab === "preview" ? "bg-surface text-white font-medium shadow-sm" : "text-brand-500 hover:text-brand-300"
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("text")}
                    className={`rounded px-2.5 py-0.5 text-[11px] transition-colors ${
                      activeTab === "text" ? "bg-surface text-white font-medium shadow-sm" : "text-brand-500 hover:text-brand-300"
                    }`}
                  >
                    Text
                  </button>
                </div>
              </div>

              {activeTab === "html" && (
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={8}
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-white placeholder-brand-600 focus:border-brand-500 focus:outline-none leading-relaxed"
                />
              )}

              {activeTab === "text" && (
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  placeholder="Optional plain text fallback for email clients that do not render HTML..."
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-white placeholder-brand-600 focus:border-brand-500 focus:outline-none leading-relaxed"
                />
              )}

              {activeTab === "preview" && (
                <div className="h-64 overflow-y-auto rounded-md border border-surface-border bg-white p-4">
                  <div
                    dangerouslySetInnerHTML={{ __html: previewHtml || htmlContent }}
                    className="text-black"
                  />
                </div>
              )}
            </div>

            {/* Collapsible CC / BCC */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[11px] text-brand-500 hover:text-brand-300 underline"
              >
                {showAdvanced ? "Hide CC, BCC & Reply-To" : "+ Add CC, BCC, Reply-To"}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-3 gap-2 pt-2 animate-fade-in">
                  <div>
                    <label className="block text-[10px] text-brand-500 mb-0.5">CC</label>
                    <input
                      type="text"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com"
                      className="w-full rounded border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-500 mb-0.5">BCC</label>
                    <input
                      type="text"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="bcc@example.com"
                      className="w-full rounded border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-brand-500 mb-0.5">Reply-To</label>
                    <input
                      type="text"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="reply@example.com"
                      className="w-full rounded border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-brand-300 hover:bg-surface-raised hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-1.5 rounded-md bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSending ? "Sending..." : "Send Email"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

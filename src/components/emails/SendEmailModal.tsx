"use client";

import React, { useState, useEffect } from "react";
import { X, Send, Eye, Code, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { api, DomainView } from "@/lib/api";
import { useToast } from "@/lib/toast-context";

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
  const toast = useToast();
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
  const [scheduledAt, setScheduledAt] = useState("");
  const [templateRef, setTemplateRef] = useState("");
  const [templateVariablesJson, setTemplateVariablesJson] = useState("{}");
  const [tagsJson, setTagsJson] = useState("[]");
  const [attachments, setAttachments] = useState<{ filename: string; content: string; content_type: string }[]>([]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const added = await Promise.all(Array.from(files).map(async (file) => {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read attachment"));
          reader.onerror = () => reject(new Error("Could not read attachment"));
          reader.readAsDataURL(file);
        });
        return {
          filename: file.name,
          content: dataUrl.split(",", 2)[1] || "",
          content_type: file.type || "application/octet-stream",
        };
      }));
      setAttachments((current) => [...current, ...added]);
    } catch (err) {
      toast.error("Could not add attachment: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

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
      const tags = JSON.parse(tagsJson) as { name: string; value: string }[];
      const variables = JSON.parse(templateVariablesJson) as Record<string, unknown>;
      if (!Array.isArray(tags) || !variables || Array.isArray(variables) || typeof variables !== "object") {
        throw new Error("Tags must be a JSON array and template variables must be a JSON object.");
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
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        template: templateRef.trim() || undefined,
        variables,
        tags,
        attachments,
      });

      setSuccessId(res.id);
      toast.success("Email sent successfully!");
      if (onSent) onSent(res.id);
    } catch (err: any) {
      const msg = err.message || "Failed to send email";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-xl border border-surface-border bg-surface shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-surface-border px-5 py-3.5 bg-surface-raised/40">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-zinc-900 dark:text-white" />
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Send Email</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        {successId ? (
          <div className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Email Enqueued Successfully!</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                The delivery worker is processing your message.
              </p>
            </div>
            <div className="rounded-lg border border-surface-border bg-surface-raised px-4 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-200">
              ID: {successId}
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setSuccessId(null);
                  setToInput("");
                  setSubject("");
                }}
                className="btn-secondary"
              >
                Send Another
              </button>
              <button
                onClick={onClose}
                className="btn-primary"
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
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  From
                </label>
                <input
                  type="text"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  placeholder="Acme <onboarding@yourdomain.com>"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  To (comma separated)
                </label>
                <input
                  type="text"
                  value={toInput}
                  onChange={(e) => setToInput(e.target.value)}
                  placeholder="user@example.com, test@domain.com"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your Order Confirmation #1024"
                required
                className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
            </div>

            {/* Content Tabs (HTML, Plain Text, Preview) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                  Message Content
                </label>
                <div className="flex rounded-md border border-surface-border bg-surface-raised p-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("html")}
                    className={`flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] transition-colors ${
                      activeTab === "html" ? "bg-surface text-zinc-900 dark:text-white font-medium shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Code className="h-3 w-3" />
                    <span>HTML</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] transition-colors ${
                      activeTab === "preview" ? "bg-surface text-zinc-900 dark:text-white font-medium shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("text")}
                    className={`rounded px-2.5 py-0.5 text-[11px] transition-colors ${
                      activeTab === "text" ? "bg-surface text-zinc-900 dark:text-white font-medium shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
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
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-500 focus:outline-none leading-relaxed"
                />
              )}

              {activeTab === "text" && (
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  placeholder="Optional plain text fallback for email clients that do not render HTML..."
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:border-zinc-500 focus:outline-none leading-relaxed"
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
                className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline"
              >
                {showAdvanced ? "Hide advanced options" : "+ Add scheduling, templates, tags & attachments"}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-3 gap-2 pt-2 animate-fade-in">
                  <div>
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">CC</label>
                    <input
                      type="text"
                      value={cc}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="cc@example.com"
                      className="w-full rounded border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">BCC</label>
                    <input
                      type="text"
                      value={bcc}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="bcc@example.com"
                      className="w-full rounded border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-0.5">Reply-To</label>
                    <input
                      type="text"
                      value={replyTo}
                      onChange={(e) => setReplyTo(e.target.value)}
                      placeholder="reply@example.com"
                      className="w-full rounded border border-surface-border bg-surface-raised px-2.5 py-1 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600"
                    />
                  </div>
                </div>
              )}

              {showAdvanced && (
                <div className="mt-3 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                      Scheduled delivery (optional)
                      <input type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} className="input-base mt-1" />
                    </label>
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                      Published template ID or alias
                      <input value={templateRef} onChange={(event) => setTemplateRef(event.target.value)} placeholder="welcome-email" className="input-base mt-1 font-mono" />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                      Template variables (JSON object)
                      <textarea value={templateVariablesJson} onChange={(event) => setTemplateVariablesJson(event.target.value)} rows={3} className="input-base mt-1 font-mono" />
                    </label>
                    <label className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                      Tags (JSON array)
                      <textarea value={tagsJson} onChange={(event) => setTagsJson(event.target.value)} rows={3} className="input-base mt-1 font-mono" />
                    </label>
                  </div>
                  <label className="block text-[10px] text-zinc-500 dark:text-zinc-400">
                    Attachments
                    <input type="file" multiple onChange={(event) => { void handleFiles(event.target.files); event.currentTarget.value = ""; }} className="mt-1 block w-full text-xs text-content-secondary file:mr-3 file:rounded-md file:border file:border-surface-border file:bg-surface file:px-3 file:py-1.5 file:text-xs" />
                  </label>
                  {attachments.length > 0 && (
                    <ul className="space-y-1">
                      {attachments.map((attachment, index) => (
                        <li key={`${attachment.filename}-${index}`} className="flex items-center justify-between gap-2 rounded-md bg-surface-raised px-2.5 py-1.5 text-xs">
                          <span className="min-w-0 truncate text-content-secondary">{attachment.filename}</span>
                          <button type="button" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-red-600 hover:text-red-800 dark:text-red-300">Remove</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-surface-border">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="btn-primary"
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

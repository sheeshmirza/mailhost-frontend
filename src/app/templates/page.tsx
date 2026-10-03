"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  UploadCloud,
  RefreshCw,
  History,
  RotateCcw,
  Pencil,
  Sparkles,
  Send,
  Smartphone,
  Monitor,
  X,
  CheckCircle2,
} from "lucide-react";
import { api, TemplateView, TemplateVersion, getErrorMessage } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateView[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const templateListRevision = useRef(0);
  const versionsRevision = useRef(0);

  // Form fields
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [text, setText] = useState("");
  const [variablesJson, setVariablesJson] = useState("[]");

  // Playground & Test Send State
  const [isPlaygroundOpen, setIsPlaygroundOpen] = useState(false);
  const [playgroundVariables, setPlaygroundVariables] = useState(
    '{\n  "first_name": "Jane",\n  "company": "Acme Corp",\n  "invite_url": "https://example.com/join"\n}'
  );
  const [playgroundPreview, setPlaygroundPreview] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [playgroundDevice, setPlaygroundDevice] = useState<"desktop" | "mobile">("desktop");
  const [playgroundTo, setPlaygroundTo] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [playgroundResult, setPlaygroundResult] = useState<any>(null);

  const handleRunPreview = async (templateId: string, customVars?: Record<string, any>) => {
    try {
      let vars = customVars;
      if (!vars) {
        vars = JSON.parse(playgroundVariables);
      }
      const res = await api.previewTemplate(templateId, vars || {});
      setPlaygroundPreview({ subject: res.subject, html: res.html, text: res.text });
    } catch (err: any) {
      console.error("Preview failed", err);
    }
  };

  const handleTestSend = async () => {
    if (!selectedTemplate) return;
    if (!playgroundTo.trim()) {
      toast.error("Please enter a recipient email address for test delivery.");
      return;
    }
    setIsSendingTest(true);
    setPlaygroundResult(null);
    try {
      const vars = JSON.parse(playgroundVariables);
      const res = await api.testSendTemplate(selectedTemplate.id, {
        to: playgroundTo.trim(),
        variables: vars,
      });
      setPlaygroundResult(res);
      toast.success(`Test email queued for delivery to ${playgroundTo.trim()}!`);
    } catch (err: any) {
      toast.error("Test send failed: " + err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const fetchTemplates = async () => {
    const revision = ++templateListRevision.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.listTemplates();
      if (revision !== templateListRevision.current) return;
      const list = res.data || [];
      setTemplates(list);
      if (list.length > 0 && !selectedTemplate) {
        setSelectedTemplate(list[0]);
      }
    } catch (err) {
      if (revision !== templateListRevision.current) return;
      console.error("Failed to load templates", err);
      setLoadError(err instanceof Error ? err.message : "Could not load templates.");
    } finally {
      if (revision === templateListRevision.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTemplates();
    return () => {
      templateListRevision.current += 1;
    };
  }, []);

  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [isVersionsLoading, setIsVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);

  const loadVersions = async (templateId: string) => {
    const revision = ++versionsRevision.current;
    setIsVersionsLoading(true);
    setVersionsError(null);
    try {
      const res = await api.listTemplateVersions(templateId);
      if (revision === versionsRevision.current) setVersions(res.data || []);
    } catch (err) {
      if (revision === versionsRevision.current) {
        setVersions([]);
        setVersionsError(err instanceof Error ? err.message : "Could not load template history.");
      }
    } finally {
      if (revision === versionsRevision.current) setIsVersionsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTemplate?.id) {
      void loadVersions(selectedTemplate.id);
    } else {
      versionsRevision.current += 1;
      setVersions([]);
      setIsVersionsLoading(false);
    }
    return () => {
      versionsRevision.current += 1;
    };
  }, [selectedTemplate?.id]);

  const handleRollback = async (templateId: string, version: number) => {
    try {
      const res = await api.rollbackTemplate(templateId, version);
      setSelectedTemplate(res);
      toast.success(`Template rolled back to v${version}`);
      fetchTemplates();
      loadVersions(templateId);
    } catch (err: unknown) {
      toast.error("Rollback failed: " + getErrorMessage(err));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const variables = JSON.parse(variablesJson) as { key: string; type: string; fallback_value?: string }[];
      if (!Array.isArray(variables)) throw new Error("Template variables must be a JSON array.");
      const payload = {
        name: name.trim(),
        alias: alias.trim() || undefined,
        subject: subject.trim(),
        html,
        text,
        variables,
      };
      const savedTemplate = editingTemplateId
        ? await api.updateTemplate(editingTemplateId, payload)
        : await api.createTemplate(payload);
      toast.success(editingTemplateId ? `Template "${name}" updated` : `Template "${name}" created`);
      setIsOpen(false);
      setEditingTemplateId(null);
      setName("");
      setAlias("");
      setSubject("");
      setText("");
      setVariablesJson("[]");
      await fetchTemplates();
      setSelectedTemplate(savedTemplate);
    } catch (err: unknown) {
      toast.error(`${editingTemplateId ? "Failed to update template" : "Failed to create template"}: ${getErrorMessage(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (template: TemplateView) => {
    setEditingTemplateId(template.id);
    setName(template.name);
    setAlias(template.alias || "");
    setSubject(template.subject);
    setHtml(template.html || "");
    setText(template.text || "");
    setVariablesJson(JSON.stringify(template.variables || [], null, 2));
    setIsOpen(true);
  };

  const handlePublish = async (id: string) => {
    try {
      await api.publishTemplate(id);
      toast.success("Template published successfully");
      fetchTemplates();
    } catch (err: unknown) {
      toast.error("Failed to publish: " + getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTemplate(id);
      toast.success("Template deleted");
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err: unknown) {
      toast.error("Failed to delete template: " + getErrorMessage(err));
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Templates
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Create reusable email templates with personalized tags like recipient name or company.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTemplateId(null);
            setName("");
            setAlias("");
            setSubject("");
            setText("");
            setVariablesJson("[]");
            setHtml("");
            setIsOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Template</span>
        </button>
      </div>

      {/* Grid: Templates List & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Templates</span>
            <span className="font-mono">{templates.length}</span>
          </div>

          {isLoading && templates.length === 0 ? (
            <TableSkeleton rows={4} cols={1} />
          ) : loadError && templates.length === 0 ? (
            <ErrorState message={loadError} onRetry={fetchTemplates} />
          ) : (
          <div className="space-y-2">
            {templates.length > 0 ? (
              templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedTemplate?.id === tpl.id
                      ? "border-zinc-900/30 dark:border-white/30 bg-surface-raised shadow-md"
                      : "border-surface-border bg-surface hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                      {tpl.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        tpl.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40"
                          : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                      }`}
                    >
                      {tpl.status}
                    </span>
                  </div>
                  {tpl.alias && (
                    <div className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                      alias: {tpl.alias}
                    </div>
                  )}
                  <div className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                    Updated {new Date(tpl.updated_at).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-surface-border bg-surface p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                No templates created yet.
              </div>
            )}
          </div>
          )}
          {loadError && templates.length > 0 && <ErrorState message={loadError} onRetry={fetchTemplates} />}
        </div>

        {/* Right Column: Template Inspector & Live HTML Preview */}
        <div className="lg:col-span-2 space-y-4">
          {selectedTemplate ? (
            <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-surface-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                      {selectedTemplate.name}
                    </h2>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium border border-surface-border bg-surface-raised text-zinc-600 dark:text-zinc-300">
                      {selectedTemplate.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Subject: {selectedTemplate.subject}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPlaygroundTo("");
                      setPlaygroundResult(null);
                      setIsPlaygroundOpen(true);
                      void handleRunPreview(selectedTemplate.id);
                    }}
                    className="btn-secondary text-teal-600 dark:text-teal-400"
                    title="Live Playground & Test Send"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Playground &amp; Test</span>
                  </button>
                  <button
                    onClick={() => handleEdit(selectedTemplate)}
                    className="btn-secondary"
                    title="Edit template"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  {selectedTemplate.status !== "published" && (
                    <button
                      onClick={() => handlePublish(selectedTemplate.id)}
                      className="btn-primary"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>Publish</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedTemplate.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Template HTML Preview
                </span>
                <div className="rounded-lg border border-surface-border bg-white p-5 text-black min-h-[220px] overflow-auto">
                  <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html }} />
                </div>
              </div>

              {/* Version History & Rollback */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    Version History ({versions.length})
                  </span>
                  <button
                    onClick={() => loadVersions(selectedTemplate.id)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </button>
                </div>

                {versionsError ? (
                  <ErrorState message={versionsError} onRetry={() => loadVersions(selectedTemplate.id)} />
                ) : isVersionsLoading ? (
                  <div role="status" className="flex items-center gap-2 rounded-md bg-surface-raised px-3 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Loading version history...
                  </div>
                ) : versions.length === 0 ? (
                  <div className="rounded-lg border border-surface-border bg-surface-raised/50 p-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    No historical snapshots found. Snapshots are created on each update and publish.
                  </div>
                ) : (
                  <div className="divide-y divide-surface-border rounded-lg border border-surface-border bg-surface-raised overflow-hidden">
                    {versions.map((v) => (
                      <div
                        key={v.id || v.version}
                        className="flex items-center justify-between p-3 hover:bg-surface/50 transition-colors text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-medium text-zinc-900 dark:text-white px-1.5 py-0.5 rounded bg-surface border border-surface-border">
                              v{v.version}
                            </span>
                            <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[200px] sm:max-w-xs">{v.subject}</span>
                          </div>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">
                            {new Date(v.created_at).toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRollback(selectedTemplate.id, v.version)}
                          className="flex items-center gap-1 rounded-md border border-surface-border bg-surface px-2.5 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Rollback</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Code Payload reference */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Usage with API
                </span>
                <pre className="rounded-lg border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                  <code>{`// Send using this template:
await resend.emails.send({
  from: 'SENDER_ADDRESS',
  to: [process.env.RECIPIENT_ADDRESS],
  template: '${selectedTemplate.alias || selectedTemplate.id}',
  variables: {
    name: process.env.RECIPIENT_NAME,
    account_id: process.env.ACCOUNT_ID
  }
});`}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-surface-border bg-surface p-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Select or create a template to preview.
            </div>
          )}
        </div>
      </div>

      {/* New Template Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              {editingTemplateId ? "Edit Email Template" : "New Email Template"}
            </h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Welcome Email"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Template ID (Short identifier)
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="welcome-email"
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject line with {{name}} or other tags"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  HTML Body
                </label>
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">Plain-text alternative</label>
                <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white" />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">Template tags and sample values (JSON array)</label>
                <textarea value={variablesJson} onChange={(event) => setVariablesJson(event.target.value)} rows={4} spellCheck={false} className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white" />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-border mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setEditingTemplateId(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? "Saving..." : editingTemplateId ? "Save Changes" : "Create Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Interactive Template Playground & Test Send */}
      {isPlaygroundOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-surface-border bg-surface shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    Preview Template &amp; Send Test Email
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Template: <strong className="text-zinc-700 dark:text-zinc-300">{selectedTemplate.name}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Device preview toggles */}
                <div className="flex items-center rounded-lg border border-surface-border bg-surface-raised p-0.5">
                  <button
                    type="button"
                    onClick={() => setPlaygroundDevice("desktop")}
                    className={`rounded px-2 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${
                      playgroundDevice === "desktop"
                        ? "bg-surface text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <Monitor className="h-3 w-3" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlaygroundDevice("mobile")}
                    className={`rounded px-2 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${
                      playgroundDevice === "mobile"
                        ? "bg-surface text-zinc-900 dark:text-white shadow-sm"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    <Smartphone className="h-3 w-3" />
                    <span className="hidden sm:inline">Mobile (375px)</span>
                  </button>
                </div>

                <button
                  onClick={() => setIsPlaygroundOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-surface-border">
              {/* Left Column: Variables & Test Send Form (5 cols) */}
              <div className="md:col-span-5 p-5 space-y-5 overflow-y-auto max-h-[70vh]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Sample Values for Tags (JSON)
                    </label>
                    <button
                      type="button"
                      onClick={() => void handleRunPreview(selectedTemplate.id)}
                      className="text-[10px] text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Update Preview
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={playgroundVariables}
                    onChange={(e) => setPlaygroundVariables(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface-raised p-2.5 font-mono text-[11px] text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  <p className="text-[10px] text-zinc-400">
                    Fills in tags like <code className="font-mono text-teal-600">{"{{name}}"}</code> or <code className="font-mono text-teal-600">{"{{company}}"}</code> in your email.
                  </p>
                </div>

                {/* Instant Test Send Box */}
                <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-white">
                    <Send className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Send a Test Email to Your Inbox</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Sends a test email with your sample values filled in so you can see how it looks in your mail app.
                  </p>
                  <div>
                    <input
                      type="email"
                      value={playgroundTo}
                      onChange={(e) => setPlaygroundTo(e.target.value)}
                      placeholder="Enter recipient email (e.g. you@domain.com)..."
                      className="w-full rounded-lg border border-surface-border bg-surface px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleTestSend()}
                    disabled={isSendingTest || !playgroundTo.trim()}
                    className="btn-primary w-full py-2 text-xs"
                  >
                    {isSendingTest ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>{isSendingTest ? "Sending Test Email..." : "Send Test Email"}</span>
                  </button>

                  {playgroundResult && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                      <div className="flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Test Email Sent Successfully</span>
                      </div>
                      <p className="font-mono text-[10px] text-zinc-500 truncate">
                        ID: {playgroundResult.id} · Subject: {playgroundResult.subject}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live Rendered Output (7 cols) */}
              <div className="md:col-span-7 p-5 space-y-3 flex flex-col overflow-y-auto max-h-[70vh] bg-surface-raised/40">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                    Preview Subject
                  </span>
                  <div className="rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs font-semibold text-zinc-900 dark:text-white">
                    {playgroundPreview?.subject || selectedTemplate.subject}
                  </div>
                </div>

                <div className="flex-1 flex flex-col space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                    Email Preview ({playgroundDevice})
                  </span>
                  <div className="flex-1 flex justify-center items-start overflow-auto">
                    <div
                      style={{ width: playgroundDevice === "mobile" ? "375px" : "100%" }}
                      className="rounded-xl border border-surface-border bg-white text-black p-5 shadow-sm min-h-[300px] transition-all"
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: playgroundPreview?.html || selectedTemplate.html,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

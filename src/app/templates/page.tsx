"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Code,
  Eye,
  Send,
  UploadCloud,
  RefreshCw,
  History,
  RotateCcw,
} from "lucide-react";
import { api, TemplateView, TemplateVersion } from "@/lib/api";
import { useToast } from "@/lib/toast-context";

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateView[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateView | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState(`<h2>Welcome {{name}}!</h2>
<p>Thank you for signing up for our service.</p>
<p>Your account ID is: <code>{{account_id}}</code></p>`);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await api.listTemplates();
      const list = res.data || [];
      setTemplates(list);
      if (list.length > 0 && !selectedTemplate) {
        setSelectedTemplate(list[0]);
      }
    } catch (err: any) {
      console.error("Failed to load templates", err);
      toast.error("Failed to load templates: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const [versions, setVersions] = useState<TemplateVersion[]>([]);

  const loadVersions = async (templateId: string) => {
    try {
      const res = await api.listTemplateVersions(templateId);
      setVersions(res.data || []);
    } catch {
      setVersions([]);
    }
  };

  useEffect(() => {
    if (selectedTemplate?.id) {
      loadVersions(selectedTemplate.id);
    } else {
      setVersions([]);
    }
  }, [selectedTemplate?.id]);

  const handleRollback = async (templateId: string, version: number) => {
    try {
      const res = await api.rollbackTemplate(templateId, version);
      setSelectedTemplate(res);
      toast.success(`Template rolled back to v${version}`);
      fetchTemplates();
      loadVersions(templateId);
    } catch (err: any) {
      toast.error("Rollback failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTpl = await api.createTemplate({
        name: name.trim(),
        alias: alias.trim() || undefined,
        subject: subject.trim(),
        html,
      });
      toast.success(`Template "${name}" created`);
      setIsOpen(false);
      setName("");
      setAlias("");
      setSubject("");
      await fetchTemplates();
      setSelectedTemplate(newTpl);
    } catch (err: any) {
      toast.error("Failed to create template: " + (err.response?.data?.message || err.message));
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.publishTemplate(id);
      toast.success("Template published successfully");
      fetchTemplates();
    } catch (err: any) {
      toast.error("Failed to publish: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTemplate(id);
      toast.success("Template deleted");
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      toast.error("Failed to delete template: " + (err.response?.data?.message || err.message));
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
            Build reusable HTML email templates with dynamic variable interpolation.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
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
                {isLoading ? "Loading templates..." : "No templates created yet."}
              </div>
            )}
          </div>
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

                {versions.length === 0 ? (
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
  from: 'team@yourdomain.com',
  to: ['recipient@example.com'],
  template: '${selectedTemplate.alias || selectedTemplate.id}',
  variables: {
    name: 'Jane',
    account_id: 'acct_102'
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
          <div className="relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">New Email Template</h2>
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
                  Alias (Unique API identifier)
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
                  placeholder="Welcome to Acme, {{name}}!"
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

              <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

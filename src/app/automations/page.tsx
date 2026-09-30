"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  api,
  AutomationView,
  AutomationRun,
  AutomationRunDetail,
  AutomationStep,
  DomainView,
} from "@/lib/api";
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Filter,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";

export default function AutomationsPage() {
  const toast = useToast();
  const [automations, setAutomations] = useState<AutomationView[]>([]);
  const [selectedAuto, setSelectedAuto] = useState<AutomationView | null>(null);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<AutomationRunDetail | null>(null);
  const [runDetailLoading, setRunDetailLoading] = useState(false);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [activeTab, setActiveTab] = useState<"workflows" | "runs">("workflows");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);
  const automationListRevision = useRef(0);
  const runsRevision = useRef(0);
  const runDetailRevision = useRef(0);

  // New automation modal
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<string>("");
  const [eventName, setEventName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [emailHtml, setEmailHtml] = useState("");

  const fetchAutomations = async () => {
    const revision = ++automationListRevision.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [autoRes, domRes] = await Promise.allSettled([
        api.listAutomations(),
        api.listDomains(),
      ]);
      if (revision !== automationListRevision.current) return;
      const failedResources: string[] = [];
      if (autoRes.status === "fulfilled") {
        const list = autoRes.value.data || [];
        setAutomations(list);
        const nextAutomation =
          list.find((automation) => automation.id === selectedAuto?.id) || list[0] || null;
        setSelectedAuto(nextAutomation);
        if (nextAutomation) void loadRuns(nextAutomation.id);
        else {
          runsRevision.current += 1;
          setRuns([]);
          setRunsLoading(false);
        }
      } else {
        failedResources.push("automations");
      }
      if (domRes.status === "fulfilled") {
        const domList = domRes.value.data || [];
        setDomains(domList);
        if (domList.length > 0 && !emailFrom) {
          setEmailFrom("");
        }
      } else {
        failedResources.push("domains");
      }
      if (failedResources.length) {
        setLoadError(`Could not load ${failedResources.join(" and ")}.`);
      }
    } catch (err) {
      if (revision !== automationListRevision.current) return;
      console.error("Failed to load automations", err);
      setLoadError(err instanceof Error ? err.message : "Could not load automation data.");
    } finally {
      if (revision === automationListRevision.current) setIsLoading(false);
    }
  };

  const loadRuns = async (automationId: string) => {
    const revision = ++runsRevision.current;
    setRunsLoading(true);
    setRunsError(null);
    try {
      const res = await api.listAutomationRuns(automationId);
      if (revision === runsRevision.current) setRuns(res.data || []);
    } catch (err) {
      if (revision !== runsRevision.current) return;
      console.error("Failed to load automation runs", err);
      setRunsError(err instanceof Error ? err.message : "Could not load workflow runs.");
    } finally {
      if (revision === runsRevision.current) setRunsLoading(false);
    }
  };

  const loadRunDetail = async (runId: string) => {
    if (!selectedAuto) return;
    const revision = ++runDetailRevision.current;
    const automationId = selectedAuto.id;
    setRunDetailLoading(true);
    try {
      const detail = await api.getAutomationRun(automationId, runId);
      if (revision === runDetailRevision.current) setSelectedRun(detail);
    } catch (err) {
      if (revision === runDetailRevision.current) {
        toast.error("Could not load run details: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    } finally {
      if (revision === runDetailRevision.current) setRunDetailLoading(false);
    }
  };

  useEffect(() => {
    void fetchAutomations();
    return () => {
      automationListRevision.current += 1;
      runsRevision.current += 1;
      runDetailRevision.current += 1;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const steps: AutomationStep[] = [{
        id: crypto.randomUUID(),
        type: "send_email",
        config: {
          from: emailFrom.trim(),
          subject: emailSubject.trim(),
          html: emailHtml,
        },
      }];

      const newAuto = await api.createAutomation({
        name: name.trim(),
        status: "active",
        trigger: {
          type: triggerType,
          event_name: triggerType === "event" ? eventName.trim() : undefined,
        },
        steps,
      });

      toast.success("Automation workflow deployed!");
      setIsOpen(false);
      setName("");
      await fetchAutomations();
      setSelectedAuto(newAuto);
    } catch (err: any) {
      toast.error("Failed to create automation: " + err.message);
    }
  };

  const handleToggleStatus = async (auto: AutomationView) => {
    const nextStatus = auto.status === "active" ? "paused" : "active";
    try {
      await api.updateAutomation(auto.id, { status: nextStatus });
      toast.success(`Automation is now ${nextStatus}`);
      fetchAutomations();
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automation?")) return;
    try {
      await api.deleteAutomation(id);
      toast.success("Automation deleted");
      setSelectedAuto(null);
      fetchAutomations();
    } catch (err: any) {
      toast.error("Failed to delete automation: " + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Automations & Drip Workflows
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Build event-driven email journeys, onboarding drips, and behavioral automations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex items-center rounded-lg border border-surface-border bg-surface p-0.5">
            <button
              onClick={() => setActiveTab("workflows")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "workflows"
                  ? "bg-surface-raised text-zinc-900 dark:text-white font-medium shadow-sm border border-surface-border/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Workflows</span>
            </button>
            <button
              onClick={() => setActiveTab("runs")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "runs"
                  ? "bg-surface-raised text-zinc-900 dark:text-white font-medium shadow-sm border border-surface-border/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Runs & History</span>
            </button>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Automation</span>
          </button>

          <button
            onClick={fetchAutomations}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loadError && automations.length > 0 && (
        <ErrorState message={loadError} onRetry={fetchAutomations} />
      )}

      {/* Tab: Workflows */}
      {activeTab === "workflows" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Workflows List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
              <span>Automations</span>
              <span className="font-mono">{automations.length}</span>
            </div>

            {isLoading && automations.length === 0 ? (
              <TableSkeleton rows={4} cols={1} />
            ) : loadError && automations.length === 0 ? (
              <ErrorState message={loadError} onRetry={fetchAutomations} />
            ) : (
            <div className="space-y-2">
              {automations.length > 0 ? (
                automations.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedAuto(a);
                      void loadRuns(a.id);
                      runDetailRevision.current += 1;
                      setSelectedRun(null);
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      selectedAuto?.id === a.id
                        ? "border-zinc-900/30 dark:border-white/30 bg-surface-raised shadow-md"
                        : "border-surface-border bg-surface hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {a.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          a.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40"
                            : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                        }`}
                      >
                        {a.status === "active" ? (
                          <Play className="h-2 w-2" />
                        ) : (
                          <Pause className="h-2 w-2" />
                        )}
                        {a.status}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                      <Zap className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                      <span>{a.trigger?.type}</span>
                      {a.trigger?.event_name && (
                        <span>({a.trigger.event_name})</span>
                      )}
                    </div>

                    <div className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {a.steps?.length || 0} steps · Created{" "}
                      {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-surface-border bg-surface p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  No automations found. Create your first workflow above.
                </div>
              )}
            </div>
            )}
          </div>

          {/* Right: Visual Step Workflow Viewer */}
          <div className="lg:col-span-2 space-y-4">
            {selectedAuto ? (
              <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-surface-border pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                      {selectedAuto.name}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Trigger:{" "}
                      <code className="text-zinc-900 dark:text-white bg-surface-raised px-1 py-0.5 rounded font-mono border border-surface-border">
                        {selectedAuto.trigger?.type}
                        {selectedAuto.trigger?.event_name
                          ? `:${selectedAuto.trigger.event_name}`
                          : ""}
                      </code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(selectedAuto)}
                      className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      {selectedAuto.status === "active" ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedAuto.id)}
                      className="rounded border border-surface-border p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Workflow Diagram */}
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Workflow Sequence
                  </div>

                  {/* Trigger Node */}
                  <div className="flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 dark:border-teal-800/40 dark:bg-teal-950/20 p-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-teal-700 dark:text-teal-300 block font-semibold">
                        Trigger
                      </span>
                      <span className="text-xs font-medium text-zinc-900 dark:text-white">
                        When {selectedAuto.trigger?.type} occurs
                        {selectedAuto.trigger?.event_name
                          ? ` ("${selectedAuto.trigger.event_name}")`
                          : ""}
                      </span>
                    </div>
                  </div>

                  {/* Steps list */}
                  <div className="space-y-3 pl-4 border-l border-surface-border ml-4">
                    {selectedAuto.steps && selectedAuto.steps.length > 0 ? (
                      selectedAuto.steps.map((step, idx) => (
                        <div
                          key={step.id || idx}
                          className="relative flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised p-3.5"
                        >
                          <span className="absolute -left-[23px] top-4 h-2 w-2 rounded-full bg-zinc-900 dark:bg-white ring-4 ring-white dark:ring-black" />
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded bg-surface text-zinc-600 dark:text-zinc-300 border border-surface-border">
                              {step.type === "delay" ? (
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                              ) : step.type === "condition" ? (
                                <Filter className="h-3.5 w-3.5 text-teal-600 dark:text-teal-300" />
                              ) : (
                                <Mail className="h-3.5 w-3.5 text-zinc-900 dark:text-white" />
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400 block">
                                Step {idx + 1}: {step.type.replace("_", " ")}
                              </span>
                              <span className="text-xs font-medium text-zinc-900 dark:text-white">
                                {step.type === "delay"
                                  ? `Wait ${(step.config?.delay_seconds || 0) / 3600} hours`
                                  : step.config?.subject || "(email)"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">No steps defined.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-surface-border bg-surface p-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
                Select an automation to view workflow steps.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Runs */}
      {activeTab === "runs" && (
        runsError ? (
          <ErrorState
            message={runsError}
            onRetry={() => selectedAuto && void loadRuns(selectedAuto.id)}
          />
        ) : runsLoading && runs.length === 0 ? (
          <TableSkeleton rows={5} cols={5} />
        ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3">Run ID</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Current Step</th>
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3 text-right">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono">
              {runs.length > 0 ? (
                runs.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="px-5 py-3 text-zinc-900 dark:text-white truncate max-w-xs">
                      <button onClick={() => loadRunDetail(r.id)} className="font-mono text-left text-teal-800 hover:underline dark:text-teal-200">
                        {r.id.slice(0, 12)}…
                      </button>
                    </td>
                    <td className="px-5 py-3 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          r.status === "completed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40"
                            : r.status === "running" || r.status === "waiting"
                            ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-400 dark:border-sky-800/40"
                            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800/40"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-300 font-sans">{r.current_step || "—"}</td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {r.completed_at ? new Date(r.completed_at).toLocaleString() : "Active"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                    {selectedAuto ? "No runs recorded for this workflow yet." : "Select a workflow to view its runs."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )
      )}

      {(runDetailLoading || selectedRun) && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="run-detail-title" className="flex h-full w-full max-w-xl flex-col gap-5 overflow-y-auto border-l border-surface-border bg-surface p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between border-b border-surface-border pb-4">
              <div>
                <h2 id="run-detail-title" className="text-sm font-semibold text-content-primary">Automation run details</h2>
                {selectedRun && <p className="mt-1 font-mono text-xs text-content-muted">{selectedRun.id}</p>}
              </div>
              <button onClick={() => setSelectedRun(null)} className="btn-ghost" aria-label="Close run details">Close</button>
            </div>
            {runDetailLoading ? (
              <div role="status" className="flex items-center gap-2 text-xs text-content-muted"><RefreshCw className="h-4 w-4 animate-spin" />Loading run details...</div>
            ) : selectedRun && (
              <>
                <dl className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md bg-surface-raised p-3"><dt className="text-content-subtle">Status</dt><dd className="mt-1 font-medium capitalize text-content-primary">{selectedRun.status}</dd></div>
                  <div className="rounded-md bg-surface-raised p-3"><dt className="text-content-subtle">Current step</dt><dd className="mt-1 font-medium text-content-primary">{selectedRun.current_step_index + 1}</dd></div>
                  <div className="rounded-md bg-surface-raised p-3"><dt className="text-content-subtle">Contact</dt><dd className="mt-1 break-all font-medium text-content-primary">{selectedRun.contact_email}</dd></div>
                  <div className="rounded-md bg-surface-raised p-3"><dt className="text-content-subtle">Trigger</dt><dd className="mt-1 font-medium text-content-primary">{selectedRun.event_name}</dd></div>
                </dl>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-content-primary">Trigger data</h3>
                  <pre className="overflow-x-auto rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-content-secondary">{JSON.stringify(selectedRun.event_data, null, 2)}</pre>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-content-primary">Step results</h3>
                  <pre className="overflow-x-auto rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-content-secondary">{JSON.stringify(selectedRun.step_results, null, 2)}</pre>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {/* New Automation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Create Automated Drip Journey</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Automation Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Workflow name"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    Trigger Event
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    required
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="" disabled>Select a trigger...</option>
                    <option value="contact.created">Contact Created</option>
                    <option value="event">Custom Event Triggered</option>
                    <option value="email.opened">Email Opened</option>
                    <option value="email.clicked">Email Link Clicked</option>
                  </select>
                </div>

                {triggerType === "event" && (
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="Event identifier"
                      className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Initial Email Configuration */}
              <div className="pt-2 border-t border-surface-border space-y-2">
                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider block">
                  Step 1: Immediate Email
                </span>
                <input
                  type="email"
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                  placeholder="Sender email address"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject line"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
                <textarea
                  value={emailHtml}
                  onChange={(e) => setEmailHtml(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-surface-raised dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-4 py-1.5 text-xs"
                >
                  Deploy Automation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

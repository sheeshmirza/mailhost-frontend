"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  AutomationView,
  AutomationRun,
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

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationView[]>([]);
  const [selectedAuto, setSelectedAuto] = useState<AutomationView | null>(null);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [activeTab, setActiveTab] = useState<"workflows" | "runs">("workflows");
  const [isLoading, setIsLoading] = useState(true);

  // New automation modal
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<string>("contact.created");
  const [eventName, setEventName] = useState("user.signup");
  const [emailSubject, setEmailSubject] = useState("Welcome aboard!");
  const [emailFrom, setEmailFrom] = useState("Acme <welcome@example.com>");
  const [emailHtml, setEmailHtml] = useState("<h1>Welcome to Acme!</h1><p>We are excited to have you.</p>");
  const [delayHours, setDelayHours] = useState(24);

  const fetchAutomations = async () => {
    setIsLoading(true);
    try {
      const [autoRes, domRes] = await Promise.allSettled([
        api.listAutomations(),
        api.listDomains(),
      ]);
      if (autoRes.status === "fulfilled") {
        const list = autoRes.value.data || [];
        setAutomations(list);
        if (list.length > 0 && !selectedAuto) {
          setSelectedAuto(list[0]);
          loadRuns(list[0].id);
        } else if (selectedAuto) {
          loadRuns(selectedAuto.id);
        }
      }
      if (domRes.status === "fulfilled") {
        const domList = domRes.value.data || [];
        setDomains(domList);
        if (domList.length > 0) {
          const verified = domList.find((d: any) => d.status === "verified") || domList[0];
          setEmailFrom(`Acme <welcome@${verified.name}>`);
        }
      }
    } catch (err) {
      console.error("Failed to load automations", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRuns = async (automationId: string) => {
    try {
      const res = await api.listAutomationRuns(automationId);
      setRuns(res.data || []);
    } catch (err) {
      console.error("Failed to load automation runs", err);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const steps: AutomationStep[] = [
        {
          id: "step_1",
          type: "send_email",
          config: {
            from: emailFrom,
            subject: emailSubject,
            html: emailHtml,
          },
        },
        {
          id: "step_2",
          type: "delay",
          config: {
            delay_seconds: delayHours * 3600,
          },
        },
        {
          id: "step_3",
          type: "send_email",
          config: {
            from: emailFrom,
            subject: "Quick check-in: How are things going?",
            html: "<p>Just wanted to see if you have any questions so far!</p>",
          },
        },
      ];

      const newAuto = await api.createAutomation({
        name: name.trim(),
        status: "active",
        trigger: {
          type: triggerType,
          event_name: triggerType === "event" ? eventName.trim() : undefined,
        },
        steps,
      });

      setIsOpen(false);
      setName("");
      await fetchAutomations();
      setSelectedAuto(newAuto);
    } catch (err: any) {
      alert("Failed to create automation: " + err.message);
    }
  };

  const handleToggleStatus = async (auto: AutomationView) => {
    const nextStatus = auto.status === "active" ? "paused" : "active";
    try {
      await api.updateAutomation(auto.id, { status: nextStatus });
      fetchAutomations();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automation?")) return;
    try {
      await api.deleteAutomation(id);
      setSelectedAuto(null);
      fetchAutomations();
    } catch (err: any) {
      alert("Failed to delete automation: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Automations & Drip Workflows
          </h1>
          <p className="text-xs text-brand-400 mt-1">
            Build event-driven email journeys, onboarding drips, and behavioral automations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex rounded-md border border-surface-border bg-surface p-0.5">
            <button
              onClick={() => setActiveTab("workflows")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "workflows"
                  ? "bg-surface-raised text-white shadow-sm"
                  : "text-brand-500 hover:text-brand-300"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Workflows</span>
            </button>
            <button
              onClick={() => setActiveTab("runs")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "runs"
                  ? "bg-surface-raised text-white shadow-sm"
                  : "text-brand-500 hover:text-brand-300"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Runs & History</span>
            </button>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Automation</span>
          </button>

          <button
            onClick={fetchAutomations}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-surface-border bg-surface text-brand-400 hover:bg-surface-raised hover:text-white"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tab: Workflows */}
      {activeTab === "workflows" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Workflows List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-brand-400 font-medium">
              <span>Automations</span>
              <span className="font-mono">{automations.length}</span>
            </div>

            <div className="space-y-2">
              {automations.length > 0 ? (
                automations.map((a) => (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedAuto(a);
                      loadRuns(a.id);
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      selectedAuto?.id === a.id
                        ? "border-white/30 bg-surface-raised shadow-md"
                        : "border-surface-border bg-surface hover:border-brand-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate">
                        {a.name}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          a.status === "active"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                            : "bg-zinc-800 text-brand-400 border-zinc-700"
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

                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-400 font-mono">
                      <Zap className="h-3 w-3 text-brand-500" />
                      <span>{a.trigger?.type}</span>
                      {a.trigger?.event_name && (
                        <span>({a.trigger.event_name})</span>
                      )}
                    </div>

                    <div className="mt-2 text-[10px] text-brand-500 font-mono">
                      {a.steps?.length || 0} steps · Created{" "}
                      {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-surface-border bg-surface p-6 text-center text-xs text-brand-500">
                  {isLoading
                    ? "Loading automations..."
                    : "No automations found. Create your first workflow above."}
                </div>
              )}
            </div>
          </div>

          {/* Right: Visual Step Workflow Viewer */}
          <div className="lg:col-span-2 space-y-4">
            {selectedAuto ? (
              <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-surface-border pb-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">
                      {selectedAuto.name}
                    </h2>
                    <p className="text-xs text-brand-400 mt-0.5">
                      Trigger:{" "}
                      <code className="text-white bg-surface-raised px-1 py-0.5 rounded font-mono">
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
                      className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-brand-200 hover:text-white"
                    >
                      {selectedAuto.status === "active" ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedAuto.id)}
                      className="rounded border border-surface-border p-1.5 text-brand-500 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Workflow Diagram */}
                <div className="space-y-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-brand-500">
                    Workflow Sequence
                  </div>

                  {/* Trigger Node */}
                  <div className="flex items-center gap-3 rounded-lg border border-purple-800/40 bg-purple-950/20 p-3.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-purple-900/60 text-purple-300">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-purple-400 block font-semibold">
                        Trigger
                      </span>
                      <span className="text-xs font-medium text-white">
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
                          <span className="absolute -left-[23px] top-4 h-2 w-2 rounded-full bg-brand-400 ring-4 ring-black" />
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded bg-surface text-brand-300">
                              {step.type === "delay" ? (
                                <Clock className="h-3.5 w-3.5 text-amber-400" />
                              ) : step.type === "condition" ? (
                                <Filter className="h-3.5 w-3.5 text-sky-400" />
                              ) : (
                                <Mail className="h-3.5 w-3.5 text-white" />
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-mono text-brand-500 block">
                                Step {idx + 1}: {step.type.replace("_", " ")}
                              </span>
                              <span className="text-xs font-medium text-white">
                                {step.type === "delay"
                                  ? `Wait ${(step.config?.delay_seconds || 0) / 3600} hours`
                                  : step.config?.subject || "(email)"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-brand-500">No steps defined.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-surface-border bg-surface p-12 text-center text-xs text-brand-500">
                Select an automation to view workflow steps.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Runs */}
      {activeTab === "runs" && (
        <div className="overflow-hidden rounded-xl border border-surface-border bg-surface">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-brand-400">
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
                    <td className="px-5 py-3 text-white truncate max-w-xs">{r.id}</td>
                    <td className="px-5 py-3 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          r.status === "completed"
                            ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                            : r.status === "running" || r.status === "waiting"
                            ? "bg-sky-950/60 text-sky-400 border-sky-800/40"
                            : "bg-red-950/60 text-red-400 border-red-800/40"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-brand-400">{r.current_step || "—"}</td>
                    <td className="px-5 py-3 text-brand-500 text-[11px]">
                      {new Date(r.started_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right text-brand-500 text-[11px]">
                      {r.completed_at ? new Date(r.completed_at).toLocaleString() : "Active"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-brand-500 font-sans">
                    No runs recorded for this workflow yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* New Automation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-white">Create Automated Drip Journey</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Automation Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. User Onboarding Series"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-brand-400 mb-1">
                    Trigger Event
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="contact.created">Contact Created</option>
                    <option value="event">Custom Event Triggered</option>
                    <option value="email.opened">Email Opened</option>
                    <option value="email.clicked">Email Link Clicked</option>
                  </select>
                </div>

                {triggerType === "event" && (
                  <div>
                    <label className="block text-[11px] text-brand-400 mb-1">
                      Event Name
                    </label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="user.signup"
                      className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Initial Email Configuration */}
              <div className="pt-2 border-t border-surface-border space-y-2">
                <span className="text-[11px] font-semibold text-brand-300 uppercase tracking-wider block">
                  Step 1: Immediate Email
                </span>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject line"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
                <textarea
                  value={emailHtml}
                  onChange={(e) => setEmailHtml(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-surface-border bg-surface-raised p-3 font-mono text-xs text-white focus:outline-none"
                />
              </div>

              {/* Delay Configuration */}
              <div className="pt-2 border-t border-surface-border">
                <label className="block text-[11px] text-brand-400 mb-1">
                  Step 2: Wait Delay Before Follow-up (Hours)
                </label>
                <input
                  type="number"
                  value={delayHours}
                  onChange={(e) => setDelayHours(Number(e.target.value))}
                  min={1}
                  max={720}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
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

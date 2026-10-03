"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  api,
  AutomationView,
  AutomationRun,
  AutomationRunDetail,
  AutomationStep,
  DomainView,
  SegmentView,
  TemplateView,
} from "@/lib/api";
import {
  GitBranch,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  Mail,
  Filter,
  RefreshCw,
  Zap,
  Globe,
  ShieldAlert,
  Sparkles,
  Layers,
  Tag,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Copy,
  Pencil,
  Send,
  Eye,
  Sliders,
  Check,
  X,
  ArrowDown,
  Info,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { getVerifiedDomains, assertVerifiedSender, buildSenderAddress } from "@/lib/domain-utils";
import { VerifiedDomainAlert } from "@/components/common/VerifiedDomainAlert";

// --- Pre-Built Automation Blueprints ---
interface Blueprint {
  id: string;
  name: string;
  tagline: string;
  triggerType: string;
  eventName?: string;
  steps: AutomationStep[];
}

const BLUEPRINTS: Blueprint[] = [
  {
    id: "saas-onboarding",
    name: "SaaS Onboarding Journey",
    tagline: "Welcome series with conditional VIP pro tips and follow-up check-in",
    triggerType: "contact.created",
    steps: [
      {
        id: "step-1",
        type: "send_email",
        config: {
          subject: "Welcome to Mailhost! Let's get you set up",
          html: "<p>Welcome aboard! Here is your quickstart guide to high-deliverability email.</p>",
        },
      },
      {
        id: "step-2",
        type: "delay",
        config: {
          delay_seconds: 172800, // 48 hours
        },
      },
      {
        id: "step-3",
        type: "condition",
        config: {
          field: "plan",
          operator: "eq",
          value: "pro",
        },
        then_steps: [
          {
            id: "step-3-then",
            type: "send_email",
            config: {
              subject: "Pro Power Tips: Dedicated IPs & Wildcard Aliases",
              html: "<p>As a Pro user, here is how to configure unlimited virtual aliases and sub-second direct MX delivery.</p>",
            },
          },
        ],
        else_steps: [
          {
            id: "step-3-else",
            type: "send_email",
            config: {
              subject: "Unlock Pro Power: 500k monthly emails + Custom DKIM",
              html: "<p>Upgrade your plan today to unlock dedicated IP warming and unlimited team seats.</p>",
            },
          },
        ],
      },
      {
        id: "step-4",
        type: "delay",
        config: {
          delay_seconds: 259200, // 72 hours
        },
      },
      {
        id: "step-5",
        type: "send_email",
        config: {
          subject: "How is your deliverability? Let's connect",
          html: "<p>We'd love to hear how your sending experience has been so far. Hit reply to talk to our team.</p>",
        },
      },
    ],
  },
  {
    id: "cart-recovery",
    name: "E-Commerce Cart Recovery",
    tagline: "Recover abandoned checkouts with timed reminders and tiered incentives",
    triggerType: "event",
    eventName: "cart.abandoned",
    steps: [
      {
        id: "step-cart-1",
        type: "delay",
        config: {
          delay_seconds: 3600, // 1 hour
        },
      },
      {
        id: "step-cart-2",
        type: "send_email",
        config: {
          subject: "Did you leave something behind?",
          html: "<p>Your selected items are reserved in your cart. Complete checkout with one click.</p>",
        },
      },
      {
        id: "step-cart-3",
        type: "delay",
        config: {
          delay_seconds: 86400, // 24 hours
        },
      },
      {
        id: "step-cart-4",
        type: "condition",
        config: {
          field: "cart_total",
          operator: "gt",
          value: "100",
        },
        then_steps: [
          {
            id: "step-cart-vip",
            type: "send_email",
            config: {
              subject: "Exclusive: 15% VIP discount on your pending order",
              html: "<p>Use code <strong>SAVE15VIP</strong> at checkout to claim 15% off your high-value order.</p>",
            },
          },
        ],
        else_steps: [
          {
            id: "step-cart-standard",
            type: "send_email",
            config: {
              subject: "Enjoy Free Express Shipping on your order",
              html: "<p>Complete your purchase today and receive complimentary express delivery with code <strong>FREESHIP</strong>.</p>",
            },
          },
        ],
      },
    ],
  },
  {
    id: "lead-vip",
    name: "High-Value Lead Routing",
    tagline: "Instantly route demo requests, assign VIP segment, and dispatch case studies",
    triggerType: "event",
    eventName: "demo.requested",
    steps: [
      {
        id: "step-lead-1",
        type: "send_email",
        config: {
          subject: "Your Consultation is Confirmed — Calendar Link Inside",
          html: "<p>Thank you for requesting a demo. Select a slot that works best for your team.</p>",
        },
      },
      {
        id: "step-lead-2",
        type: "delay",
        config: {
          delay_seconds: 86400, // 24 hours
        },
      },
      {
        id: "step-lead-3",
        type: "send_email",
        config: {
          subject: "Case Study: Scaling to 10M Daily Emails with Zero Relays",
          html: "<p>Here is how modern engineering teams architect their email stack with Mailhost Direct MX.</p>",
        },
      },
    ],
  },
  {
    id: "re-engagement",
    name: "Subscriber Win-Back",
    tagline: "Re-engage dormant subscribers before automated list hygiene cleanup",
    triggerType: "event",
    eventName: "user.inactive",
    steps: [
      {
        id: "step-win-1",
        type: "send_email",
        config: {
          subject: "We miss you! Here is what is new on Mailhost",
          html: "<p>We've launched new features including SMTP/IMAP/POP3 Mailbox protocols and AI MCP server.</p>",
        },
      },
      {
        id: "step-win-2",
        type: "delay",
        config: {
          delay_seconds: 432000, // 5 days
        },
      },
      {
        id: "step-win-3",
        type: "condition",
        config: {
          field: "opened_recent",
          operator: "eq",
          value: "false",
        },
        then_steps: [
          {
            id: "step-win-final",
            type: "send_email",
            config: {
              subject: "Last chance: Special 50% comeback discount",
              html: "<p>Come back today with code <strong>WELCOMEBACK50</strong> for 50% off for 3 months.</p>",
            },
          },
        ],
        else_steps: [
          {
            id: "step-win-active",
            type: "send_email",
            config: {
              subject: "Great to have you back with us!",
              html: "<p>Thanks for checking back in. Let us know if you need any assistance getting started.</p>",
            },
          },
        ],
      },
    ],
  },
];

export default function AutomationsPage() {
  const toast = useToast();
  const [automations, setAutomations] = useState<AutomationView[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [segments, setSegments] = useState<SegmentView[]>([]);
  const [templates, setTemplates] = useState<TemplateView[]>([]);
  const [selectedAuto, setSelectedAuto] = useState<AutomationView | null>(null);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<AutomationRunDetail | null>(null);
  const [runDetailLoading, setRunDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"workflows" | "runs">("workflows");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState<string | null>(null);

  const automationListRevision = useRef(0);
  const runsRevision = useRef(0);
  const runDetailRevision = useRef(0);

  // New automation modal state
  const [isOpen, setIsOpen] = useState(false);
  const [blueprintChoice, setBlueprintChoice] = useState<string>("custom");
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<string>("contact.created");
  const [eventName, setEventName] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [fromPrefix, setFromPrefix] = useState("automations");
  const [isCustomFrom, setIsCustomFrom] = useState(false);
  const [customFrom, setCustomFrom] = useState("");

  // Step builder state inside modal
  const [steps, setSteps] = useState<AutomationStep[]>([
    {
      id: "step-init",
      type: "send_email",
      config: {
        subject: "Welcome to Mailhost!",
        html: "<p>Thank you for joining us. We are excited to support your journey.</p>",
      },
    },
  ]);

  // Simulation Drawer state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simEmail, setSimEmail] = useState("alex@example.com");
  const [simDataJson, setSimDataJson] = useState('{\n  "plan": "pro",\n  "cart_total": 125,\n  "country": "US"\n}');
  const [simResults, setSimResults] = useState<{
    evaluatedSteps: Array<{
      stepId: string;
      type: string;
      matched?: boolean;
      summary: string;
    }>;
    branchTaken?: "then" | "else" | null;
  } | null>(null);

  // In-Workflow Step Append Modal
  const [isAppendStepOpen, setIsAppendStepOpen] = useState(false);
  const [appendStepType, setAppendStepType] = useState<"send_email" | "delay" | "condition" | "add_to_segment">("send_email");
  const [appendSubject, setAppendSubject] = useState("");
  const [appendHtml, setAppendHtml] = useState("");
  const [appendDelayHours, setAppendDelayHours] = useState(24);
  const [appendCondField, setAppendCondField] = useState("plan");
  const [appendCondOp, setAppendCondOp] = useState("eq");
  const [appendCondVal, setAppendCondVal] = useState("pro");
  const [appendSegmentId, setAppendSegmentId] = useState("");
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);

  const verifiedDomains = getVerifiedDomains(domains);

  // Resolve active sender email address
  const getSenderAddress = () => {
    if (isCustomFrom && customFrom.trim()) {
      return customFrom.trim();
    }
    if (selectedDomain) {
      return buildSenderAddress(fromPrefix || "automations", selectedDomain);
    }
    return "";
  };

  const fetchData = async () => {
    const revision = ++automationListRevision.current;
    setIsLoading(true);
    setLoadError(null);
    try {
      const [listRes, domRes, segRes, tmplRes] = await Promise.allSettled([
        api.listAutomations(),
        api.listDomains(),
        api.listSegments(),
        api.listTemplates(),
      ]);

      if (revision !== automationListRevision.current) return;

      if (listRes.status === "fulfilled") {
        const list = listRes.value.data || [];
        setAutomations(list);
        const nextAuto = list.find((a) => a.id === selectedAuto?.id) || list[0] || null;
        setSelectedAuto(nextAuto);
        if (nextAuto) void loadRuns(nextAuto.id);
        else {
          runsRevision.current += 1;
          setRuns([]);
          setRunsLoading(false);
        }
      }

      if (domRes.status === "fulfilled") {
        const dList = domRes.value.data || [];
        setDomains(dList);
        const verified = dList.filter((d) => d.status === "verified");
        if (verified.length > 0) {
          setSelectedDomain((cur) => (verified.some((v) => v.name === cur) ? cur : verified[0].name));
        }
      }

      if (segRes.status === "fulfilled") {
        setSegments(segRes.value.data || []);
      }

      if (tmplRes.status === "fulfilled") {
        setTemplates(tmplRes.value.data || []);
      }
    } catch (err) {
      if (revision !== automationListRevision.current) return;
      console.error("Failed to load automation data", err);
      setLoadError(err instanceof Error ? err.message : "Could not load automations.");
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
    void fetchData();
    return () => {
      automationListRevision.current += 1;
      runsRevision.current += 1;
      runDetailRevision.current += 1;
    };
  }, []);

  // Blueprint Selection Handler
  const handleSelectBlueprint = (blueprintId: string) => {
    setBlueprintChoice(blueprintId);
    if (blueprintId === "custom") {
      setName("Custom Engagement Journey");
      setTriggerType("contact.created");
      setEventName("");
      setSteps([
        {
          id: crypto.randomUUID(),
          type: "send_email",
          config: {
            subject: "Welcome to Mailhost!",
            html: "<p>Thank you for subscribing. We are thrilled to have you here.</p>",
          },
        },
      ]);
      return;
    }

    const bp = BLUEPRINTS.find((b) => b.id === blueprintId);
    if (bp) {
      setName(bp.name);
      setTriggerType(bp.triggerType);
      setEventName(bp.eventName || "");
      // Clone steps deeply with fresh UUIDs
      const clonedSteps: AutomationStep[] = JSON.parse(JSON.stringify(bp.steps));
      setSteps(clonedSteps);
      toast.success(`Loaded "${bp.name}" Blueprint`);
    }
  };

  // Add Step inside Modal Builder
  const handleAddStepToModal = (type: "send_email" | "delay" | "condition" | "add_to_segment") => {
    const id = crypto.randomUUID();
    let newStep: AutomationStep;

    if (type === "delay") {
      newStep = {
        id,
        type: "delay",
        config: { delay_seconds: 86400 }, // default 1 day
      };
    } else if (type === "condition") {
      newStep = {
        id,
        type: "condition",
        config: { field: "plan", operator: "eq", value: "pro" },
        then_steps: [
          {
            id: crypto.randomUUID(),
            type: "send_email",
            config: {
              subject: "VIP Feature Guide",
              html: "<p>Exclusive features available on your account.</p>",
            },
          },
        ],
        else_steps: [
          {
            id: crypto.randomUUID(),
            type: "send_email",
            config: {
              subject: "Getting Started Guide",
              html: "<p>Here is how to get the most out of your current plan.</p>",
            },
          },
        ],
      };
    } else if (type === "add_to_segment") {
      newStep = {
        id,
        type: "add_to_segment",
        config: { segment_id: segments[0]?.id || "" },
      };
    } else {
      newStep = {
        id,
        type: "send_email",
        config: {
          subject: "Important update for your account",
          html: "<p>We wanted to reach out with helpful guidance.</p>",
        },
      };
    }

    setSteps((prev) => [...prev, newStep]);
  };

  const handleRemoveStepFromModal = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= steps.length) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);
    setSteps(reordered);
  };

  // Form Submit: Create Automation
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalSender = getSenderAddress();
      if (!finalSender) {
        throw new Error("A verified domain sender email address is required.");
      }
      assertVerifiedSender(verifiedDomains, finalSender);

      if (steps.length === 0) {
        throw new Error("At least one step is required in the workflow.");
      }

      // Populate sender on all email steps if missing
      const assignFrom = (stList: AutomationStep[]): AutomationStep[] => {
        return stList.map((st) => {
          const updated = { ...st };
          if (st.type === "send_email" || st.type === "email") {
            updated.config = {
              ...st.config,
              from: st.config.from?.trim() || finalSender,
            };
          }
          if (st.then_steps) updated.then_steps = assignFrom(st.then_steps);
          if (st.else_steps) updated.else_steps = assignFrom(st.else_steps);
          return updated;
        });
      };

      const finalSteps = assignFrom(steps);

      const newAuto = await api.createAutomation({
        name: name.trim(),
        status: "active",
        trigger: {
          type: triggerType,
          event_name: triggerType === "event" ? eventName.trim() : undefined,
        },
        steps: finalSteps,
      });

      toast.success("Next-Gen Automation workflow deployed!");
      setIsOpen(false);
      setName("");
      await fetchData();
      setSelectedAuto(newAuto);
    } catch (err: any) {
      toast.error("Failed to create automation: " + err.message);
    }
  };

  // Toggle Active / Paused
  const handleToggleStatus = async (auto: AutomationView) => {
    const nextStatus = auto.status === "active" ? "paused" : "active";
    try {
      await api.updateAutomation(auto.id, { status: nextStatus });
      toast.success(`Workflow is now ${nextStatus}`);
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  // Delete Automation
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this automation workflow?")) return;
    try {
      await api.deleteAutomation(id);
      toast.success("Automation workflow deleted");
      setSelectedAuto(null);
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to delete automation: " + err.message);
    }
  };

  // Append Step to existing Selected Workflow
  const handleAppendStepToSelected = async () => {
    if (!selectedAuto) return;
    setIsSavingWorkflow(true);
    try {
      const finalSender = getSenderAddress() || (selectedAuto.steps[0]?.config?.from) || "";
      if (finalSender) {
        assertVerifiedSender(verifiedDomains, finalSender);
      }

      const id = crypto.randomUUID();
      let newStep: AutomationStep;

      if (appendStepType === "delay") {
        newStep = {
          id,
          type: "delay",
          config: { delay_seconds: appendDelayHours * 3600 },
        };
      } else if (appendStepType === "condition") {
        newStep = {
          id,
          type: "condition",
          config: {
            field: appendCondField.trim() || "plan",
            operator: appendCondOp,
            value: appendCondVal.trim(),
          },
          then_steps: [
            {
              id: crypto.randomUUID(),
              type: "send_email",
              config: {
                from: finalSender,
                subject: `Matched condition: ${appendCondField}`,
                html: "<p>Triggered targeted message on condition match.</p>",
              },
            },
          ],
          else_steps: [
            {
              id: crypto.randomUUID(),
              type: "send_email",
              config: {
                from: finalSender,
                subject: "Fallback follow-up",
                html: "<p>Triggered fallback sequence.</p>",
              },
            },
          ],
        };
      } else if (appendStepType === "add_to_segment") {
        newStep = {
          id,
          type: "add_to_segment",
          config: { segment_id: appendSegmentId || segments[0]?.id || "" },
        };
      } else {
        if (!appendSubject.trim()) {
          throw new Error("Subject is required for email steps.");
        }
        newStep = {
          id,
          type: "send_email",
          config: {
            from: finalSender,
            subject: appendSubject.trim(),
            html: appendHtml || `<p>${appendSubject.trim()}</p>`,
          },
        };
      }

      const updatedSteps = [...(selectedAuto.steps || []), newStep];
      const res = await api.updateAutomation(selectedAuto.id, { steps: updatedSteps });
      setSelectedAuto(res);
      toast.success("New step appended to workflow!");
      setIsAppendStepOpen(false);
      setAppendSubject("");
      setAppendHtml("");
      await fetchData();
    } catch (err: any) {
      toast.error("Failed to append step: " + err.message);
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  // Run Local Condition & Journey Simulation
  const handleRunSimulation = () => {
    if (!selectedAuto) return;
    try {
      const data = simDataJson ? JSON.parse(simDataJson) : {};
      const evalList: Array<{
        stepId: string;
        type: string;
        matched?: boolean;
        summary: string;
      }> = [];

      let branchResult: "then" | "else" | null = null;

      for (const step of selectedAuto.steps) {
        if (step.type === "delay") {
          const hours = (step.config.delay_seconds || 0) / 3600;
          evalList.push({
            stepId: step.id,
            type: "delay",
            summary: `Pause workflow execution for ${hours >= 24 ? `${hours / 24} days` : `${hours} hours`}`,
          });
        } else if (step.type === "condition") {
          const fieldVal = data[step.config.field || ""];
          let isMatch = false;
          const targetVal = String(step.config.value);

          switch (step.config.operator) {
            case "eq":
              isMatch = String(fieldVal) === targetVal;
              break;
            case "neq":
              isMatch = String(fieldVal) !== targetVal;
              break;
            case "gt":
              isMatch = Number(fieldVal) > Number(targetVal);
              break;
            case "lt":
              isMatch = Number(fieldVal) < Number(targetVal);
              break;
            case "contains":
              isMatch = String(fieldVal || "").toLowerCase().includes(targetVal.toLowerCase());
              break;
            default:
              isMatch = false;
          }

          branchResult = isMatch ? "then" : "else";
          evalList.push({
            stepId: step.id,
            type: "condition",
            matched: isMatch,
            summary: `Evaluated field "${step.config.field}": value "${fieldVal ?? "null"}" ${step.config.operator} "${targetVal}" => ${isMatch ? "TRUE (Then lane executed)" : "FALSE (Else lane executed)"}`,
          });
        } else if (step.type === "add_to_segment") {
          evalList.push({
            stepId: step.id,
            type: "add_to_segment",
            summary: `Tagged recipient ${simEmail} into segment ID ${step.config.segment_id || "configured"}`,
          });
        } else {
          evalList.push({
            stepId: step.id,
            type: "send_email",
            summary: `Dispatched email: "${step.config.subject || "Untitled"}" to ${simEmail}`,
          });
        }
      }

      setSimResults({
        evaluatedSteps: evalList,
        branchTaken: branchResult,
      });
      toast.success("Journey simulation executed!");
    } catch (err: any) {
      toast.error("Simulation error: " + err.message);
    }
  };

  // Test Fire Event Live
  const handleTestFireLiveEvent = async () => {
    if (!selectedAuto || selectedAuto.trigger.type !== "event" || !selectedAuto.trigger.event_name) {
      toast.info("Only event-triggered workflows can be test-fired directly.");
      return;
    }
    try {
      const data = simDataJson ? JSON.parse(simDataJson) : {};
      await api.triggerEvent({
        name: selectedAuto.trigger.event_name,
        email: simEmail.trim() || "test@example.com",
        data,
      });
      toast.success(`Live event "${selectedAuto.trigger.event_name}" published! Matching automations started.`);
      setTimeout(() => loadRuns(selectedAuto.id), 1200);
    } catch (err: any) {
      toast.error("Failed to fire live event: " + err.message);
    }
  };

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Superpowered Automation Suite
            </h1>
            <span className="rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-500/30 px-2 py-0.5 text-[10px] font-medium text-teal-800 dark:text-teal-300">
              Next-Gen Engine
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Build multi-step customer journeys with time delays, conditional branching, segment tagging, and live simulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Workflows / Runs Tab Switcher */}
          <div className="flex items-center rounded-lg border border-surface-border bg-surface p-0.5 shadow-sm">
            <button
              onClick={() => setActiveTab("workflows")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "workflows"
                  ? "bg-surface-raised text-zinc-900 dark:text-white shadow-sm border border-surface-border/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Workflows ({automations.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("runs")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "runs"
                  ? "bg-surface-raised text-zinc-900 dark:text-white shadow-sm border border-surface-border/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Runs &amp; History ({runs.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              setIsOpen(true);
              handleSelectBlueprint("saas-onboarding");
            }}
            className="btn-primary"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Automation</span>
          </button>

          <button
            onClick={fetchData}
            title="Refresh Automations"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <VerifiedDomainAlert hasRegisteredDomains={domains.length > 0} />

      {loadError && automations.length > 0 && (
        <ErrorState message={loadError} onRetry={fetchData} />
      )}

      {/* Main Tab: Workflows View */}
      {activeTab === "workflows" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Workflows List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <span>Active Workflows</span>
              <span className="font-mono">{automations.length}</span>
            </div>

            {isLoading && automations.length === 0 ? (
              <TableSkeleton rows={4} cols={1} />
            ) : loadError && automations.length === 0 ? (
              <ErrorState message={loadError} onRetry={fetchData} />
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
                      className={`cursor-pointer rounded-xl border p-4 transition-all shadow-sm ${
                        selectedAuto?.id === a.id
                          ? "border-teal-500/50 bg-surface-raised ring-1 ring-teal-500/30"
                          : "border-surface-border bg-surface hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                          {a.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                            a.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40"
                              : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                          }`}
                        >
                          {a.status === "active" ? (
                            <Play className="h-2.5 w-2.5" />
                          ) : (
                            <Pause className="h-2.5 w-2.5" />
                          )}
                          <span className="capitalize">{a.status}</span>
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-300 font-mono">
                        <Zap className="h-3 w-3 text-teal-600 dark:text-teal-400" />
                        <span>{a.trigger?.type}</span>
                        {a.trigger?.event_name && (
                          <span className="text-zinc-400">({a.trigger.event_name})</span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                        <span>{a.steps?.length || 0} pipeline steps</span>
                        <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-surface-border bg-surface p-8 text-center space-y-3">
                    <Sparkles className="h-8 w-8 text-teal-600 dark:text-teal-400 mx-auto" />
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      No automations configured yet. Deploy a pre-built blueprint or create your custom drip pipeline.
                    </p>
                    <button
                      onClick={() => setIsOpen(true)}
                      className="btn-primary text-xs"
                    >
                      Browse Blueprints
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Two Columns: Interactive Visual Graph & Step Pipeline */}
          <div className="lg:col-span-2 space-y-4">
            {selectedAuto ? (
              <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-6 shadow-sm">
                {/* Header bar of selected automation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                        {selectedAuto.name}
                      </h2>
                      <span className="rounded bg-surface-raised border border-surface-border px-1.5 py-0.5 text-[10px] font-mono text-zinc-500">
                        {selectedAuto.id.slice(0, 8)}…
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                      <span>Trigger:</span>
                      <code className="text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.5 rounded font-mono border border-teal-500/20 font-semibold">
                        {selectedAuto.trigger?.type}
                        {selectedAuto.trigger?.event_name ? ` : ${selectedAuto.trigger.event_name}` : ""}
                      </code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsSimulatorOpen(true)}
                      className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-teal-800 hover:text-teal-900 dark:text-teal-300 hover:bg-surface transition-colors"
                      title="Simulate recipient passing through this pipeline"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Simulate Journey</span>
                    </button>

                    <button
                      onClick={() => setIsAppendStepOpen(true)}
                      className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Add Step</span>
                    </button>

                    <button
                      onClick={() => handleToggleStatus(selectedAuto)}
                      className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      {selectedAuto.status === "active" ? (
                        <>
                          <Pause className="h-3.5 w-3.5 text-amber-500" />
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
                      title="Delete automation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Visual Pipeline Graph */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    <span>Visual Workflow Canvas</span>
                    <span className="font-mono text-[11px] font-normal lowercase text-zinc-400">
                      {selectedAuto.steps.length} total sequential nodes
                    </span>
                  </div>

                  {/* Trigger Node Card */}
                  <div className="relative flex items-center gap-3.5 rounded-xl border border-teal-300 dark:border-teal-800/60 bg-teal-50/70 dark:bg-teal-950/20 p-4 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300 border border-teal-300 dark:border-teal-700">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-mono text-teal-700 dark:text-teal-300 font-bold">
                          Trigger Event
                        </span>
                        <span className="rounded bg-teal-200/60 dark:bg-teal-900/60 px-1.5 py-0.2 text-[9px] font-semibold text-teal-900 dark:text-teal-200">
                          ENTRY POINT
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white block mt-0.5">
                        When {selectedAuto.trigger?.type} occurs
                        {selectedAuto.trigger?.event_name ? ` ("${selectedAuto.trigger.event_name}")` : ""}
                      </span>
                    </div>

                    {selectedAuto.trigger.type === "event" && (
                      <button
                        onClick={handleTestFireLiveEvent}
                        className="rounded border border-teal-400/40 bg-white dark:bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950"
                      >
                        Fire Live Event
                      </button>
                    )}
                  </div>

                  {/* Sequential Steps with Connected Line */}
                  <div className="space-y-4 pl-5 border-l-2 border-teal-500/20 dark:border-teal-500/20 ml-5 pt-1">
                    {selectedAuto.steps && selectedAuto.steps.length > 0 ? (
                      selectedAuto.steps.map((step, idx) => (
                        <div key={step.id || idx} className="relative space-y-3">
                          {/* Flow Dot */}
                          <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full bg-teal-500 ring-4 ring-white dark:ring-zinc-950 shadow-sm" />

                          {/* Delay Step Card */}
                          {step.type === "delay" && (
                            <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                                  <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 font-bold block">
                                    Step {idx + 1} — Time Delay
                                  </span>
                                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                                    Wait {(step.config.delay_seconds || 0) / 3600 >= 24
                                      ? `${((step.config.delay_seconds || 0) / 86400).toFixed(1)} days`
                                      : `${((step.config.delay_seconds || 0) / 3600).toFixed(1)} hours`} ({step.config.delay_seconds}s)
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-900/40 px-2 py-0.5 rounded">
                                Non-blocking scheduler
                              </span>
                            </div>
                          )}

                          {/* Send Email Step Card */}
                          {(step.type === "send_email" || step.type === "email") && (
                            <div className="rounded-xl border border-surface-border bg-surface-raised p-4 space-y-2 shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border border-teal-500/20">
                                    <Mail className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-mono uppercase text-teal-700 dark:text-teal-300 font-bold block">
                                      Step {idx + 1} — Send Email
                                    </span>
                                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                      {step.config?.subject || "(Untitled email)"}
                                    </span>
                                  </div>
                                </div>

                                {step.config?.from && (
                                  <span className="text-[10px] font-mono text-zinc-500 bg-surface px-2 py-0.5 rounded border border-surface-border">
                                    From: {step.config.from}
                                  </span>
                                )}
                              </div>

                              {step.config?.html && (
                                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 bg-surface p-2.5 rounded border border-surface-border/50 font-mono">
                                  {step.config.html.replace(/<[^>]+>/g, " ").trim()}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Segment Action Card */}
                          {(step.type === "add_to_segment" || step.type === "remove_from_segment") && (
                            <div className="rounded-xl border border-purple-200 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-950/20 p-4 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                                  <Tag className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] font-mono uppercase text-purple-700 dark:text-purple-400 font-bold block">
                                    Step {idx + 1} — Audience Segment
                                  </span>
                                  <span className="text-xs font-semibold text-zinc-900 dark:text-white">
                                    {step.type === "add_to_segment" ? "Add to Segment" : "Remove from Segment"} (ID: {step.config.segment_id})
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Condition Branch Splitter Card */}
                          {step.type === "condition" && (
                            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-4 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                  <GitBranch className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-[10px] font-mono uppercase text-indigo-700 dark:text-indigo-400 font-bold block">
                                    Step {idx + 1} — Conditional Branch (If / Else)
                                  </span>
                                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                                    Rule: Check field <code className="text-indigo-600 dark:text-indigo-300 font-mono font-semibold">{step.config.field}</code> {step.config.operator} <code className="text-indigo-600 dark:text-indigo-300 font-mono font-semibold">&quot;{String(step.config.value)}&quot;</code>
                                  </span>
                                </div>
                              </div>

                              {/* Branch Lanes (Then vs Else) */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {/* THEN LANE */}
                                <div className="rounded-lg border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>THEN (Condition Matched)</span>
                                  </div>
                                  {step.then_steps && step.then_steps.length > 0 ? (
                                    step.then_steps.map((thenSt, tIdx) => (
                                      <div key={thenSt.id || tIdx} className="rounded border border-surface-border bg-surface p-2 text-xs">
                                        <span className="font-semibold text-zinc-900 dark:text-white block">
                                          {thenSt.config.subject || thenSt.type}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-zinc-500 italic">No specific steps</span>
                                  )}
                                </div>

                                {/* ELSE LANE */}
                                <div className="rounded-lg border border-orange-300 dark:border-orange-800/60 bg-orange-50/40 dark:bg-orange-950/20 p-3 space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-800 dark:text-orange-300">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    <span>ELSE (Condition Not Matched)</span>
                                  </div>
                                  {step.else_steps && step.else_steps.length > 0 ? (
                                    step.else_steps.map((elseSt, eIdx) => (
                                      <div key={elseSt.id || eIdx} className="rounded border border-surface-border bg-surface p-2 text-xs">
                                        <span className="font-semibold text-zinc-900 dark:text-white block">
                                          {elseSt.config.subject || elseSt.type}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-[11px] text-zinc-500 italic">No specific steps</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-zinc-500">No steps defined. Add a step using the button above.</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-surface-border bg-surface p-12 text-center text-xs text-zinc-500">
                Select an automation workflow on the left to inspect its pipeline.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Tab: Runs & History View */}
      {activeTab === "runs" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <span>Execution Runs History</span>
            <span className="font-mono text-[11px]">{runs.length} runs recorded</span>
          </div>

          {runsError ? (
            <ErrorState message={runsError} onRetry={() => selectedAuto && void loadRuns(selectedAuto.id)} />
          ) : runsLoading && runs.length === 0 ? (
            <TableSkeleton rows={5} cols={5} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface shadow-sm">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">Run ID</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Started</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono">
                  {runs.length > 0 ? (
                    runs.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-raised/40 transition-colors">
                        <td className="px-5 py-3 text-zinc-900 dark:text-white">
                          <button
                            onClick={() => loadRunDetail(r.id)}
                            className="font-mono text-left text-teal-800 hover:underline dark:text-teal-300 font-bold"
                          >
                            {r.id.slice(0, 12)}…
                          </button>
                        </td>
                        <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300 font-sans">
                          {r.contact_id || "Direct Event"}
                        </td>
                        <td className="px-5 py-3 font-sans">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                              r.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40"
                                : r.status === "waiting"
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/40"
                                : "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-500 text-[11px]">
                          {new Date(r.started_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right font-sans">
                          <button
                            onClick={() => loadRunDetail(r.id)}
                            className="text-teal-600 hover:underline dark:text-teal-400 text-xs font-medium"
                          >
                            Inspect Run
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-zinc-500 font-sans">
                        No automation runs have occurred yet. Fire an event or trigger a contact subscription to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal for Automation Run */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Run Telemetry: {selectedRun.id.slice(0, 10)}…
                </h3>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Recipient: {selectedRun.contact_email || "System"}
                </span>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded border border-surface-border bg-surface-raised p-2.5">
                <span className="text-[10px] text-zinc-500 uppercase block">Status</span>
                <span className="font-bold capitalize text-zinc-900 dark:text-white">{selectedRun.status}</span>
              </div>
              <div className="rounded border border-surface-border bg-surface-raised p-2.5">
                <span className="text-[10px] text-zinc-500 uppercase block">Current Step Index</span>
                <span className="font-mono font-bold text-zinc-900 dark:text-white">{selectedRun.current_step_index}</span>
              </div>
            </div>

            {/* Event Data Payload */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Event Context Payload</span>
              <pre className="rounded-lg border border-surface-border bg-zinc-950 text-emerald-400 p-3 font-mono text-xs overflow-x-auto">
                {JSON.stringify(selectedRun.event_data, null, 2)}
              </pre>
            </div>

            {/* Step Results */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Step Outputs &amp; Logs</span>
              <pre className="rounded-lg border border-surface-border bg-zinc-950 text-zinc-300 p-3 font-mono text-xs overflow-x-auto">
                {JSON.stringify(selectedRun.step_results, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll w-full max-w-xl rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Journey Condition Simulator
                </h3>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-500">
              Provide test recipient traits and mock event parameters. Mailhost will simulate how each condition branch evaluates in real-time.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={simEmail}
                  onChange={(e) => setSimEmail(e.target.value)}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Mock Event &amp; Traits JSON
                </label>
                <textarea
                  value={simDataJson}
                  onChange={(e) => setSimDataJson(e.target.value)}
                  rows={4}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  className="btn-primary"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Execute Simulation</span>
                </button>
              </div>

              {simResults && (
                <div className="space-y-3 pt-3 border-t border-surface-border">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                    Simulation Trajectory
                  </span>
                  <div className="space-y-2">
                    {simResults.evaluatedSteps.map((st, i) => (
                      <div
                        key={i}
                        className={`rounded-lg border p-3 text-xs space-y-1 ${
                          st.type === "condition"
                            ? st.matched
                              ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20"
                              : "border-orange-300 bg-orange-50/50 dark:bg-orange-950/20"
                            : "border-surface-border bg-surface-raised"
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
                          <span className="uppercase font-bold">{st.type}</span>
                          {st.matched !== undefined && (
                            <span className={st.matched ? "text-emerald-600 font-bold" : "text-orange-600 font-bold"}>
                              {st.matched ? "CONDITION MET" : "FALLBACK LANE"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-800 dark:text-zinc-200">{st.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Append Step Modal */}
      {isAppendStepOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Append Step to Workflow
              </h3>
              <button
                onClick={() => setIsAppendStepOpen(false)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Step Type
                </label>
                <select
                  value={appendStepType}
                  onChange={(e) => setAppendStepType(e.target.value as any)}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5"
                >
                  <option value="send_email">✉️ Send Email</option>
                  <option value="delay">⏱️ Time Delay</option>
                  <option value="condition">🔀 Conditional Branch (If / Else)</option>
                  <option value="add_to_segment">🏷️ Add to Segment</option>
                </select>
              </div>

              {appendStepType === "send_email" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={appendSubject}
                      onChange={(e) => setAppendSubject(e.target.value)}
                      placeholder="e.g. Pro User Deliverability Insights"
                      className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      HTML Content
                    </label>
                    <textarea
                      value={appendHtml}
                      onChange={(e) => setAppendHtml(e.target.value)}
                      rows={3}
                      placeholder="<p>Hello {{email}}, here is your tip!</p>"
                      className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 font-mono"
                    />
                  </div>
                </>
              )}

              {appendStepType === "delay" && (
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                    Delay Duration (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8760"
                    value={appendDelayHours}
                    onChange={(e) => setAppendDelayHours(Number(e.target.value))}
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 font-mono"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Equivalent to {appendDelayHours * 3600} seconds.
                  </span>
                </div>
              )}

              {appendStepType === "condition" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 block uppercase">Field</label>
                      <input
                        type="text"
                        value={appendCondField}
                        onChange={(e) => setAppendCondField(e.target.value)}
                        placeholder="plan"
                        className="w-full rounded-md border border-surface-border bg-surface-raised px-2 py-1 font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block uppercase">Operator</label>
                      <select
                        value={appendCondOp}
                        onChange={(e) => setAppendCondOp(e.target.value)}
                        className="w-full rounded-md border border-surface-border bg-surface-raised px-2 py-1 text-xs"
                      >
                        <option value="eq">== (Equals)</option>
                        <option value="neq">!= (Not Equals)</option>
                        <option value="gt">&gt; (Greater Than)</option>
                        <option value="lt">&lt; (Less Than)</option>
                        <option value="contains">Contains</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block uppercase">Value</label>
                      <input
                        type="text"
                        value={appendCondVal}
                        onChange={(e) => setAppendCondVal(e.target.value)}
                        placeholder="pro"
                        className="w-full rounded-md border border-surface-border bg-surface-raised px-2 py-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {appendStepType === "add_to_segment" && (
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                    Select Segment
                  </label>
                  <select
                    value={appendSegmentId}
                    onChange={(e) => setAppendSegmentId(e.target.value)}
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5"
                  >
                    <option value="">Choose segment...</option>
                    {segments.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setIsAppendStepOpen(false)}
                className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAppendStepToSelected}
                disabled={isSavingWorkflow}
                className="btn-primary"
              >
                {isSavingWorkflow ? "Saving..." : "Append Step"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Automation Modal with Blueprints */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll w-full max-w-2xl rounded-2xl border border-surface-border bg-surface p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                  Design Next-Gen Automation
                </h2>
                <p className="text-xs text-zinc-500">
                  Select a battle-tested blueprint or build a custom multi-step pipeline from scratch.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Blueprints Picker */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
                1. Select Blueprint Architecture
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BLUEPRINTS.map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => handleSelectBlueprint(bp.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      blueprintChoice === bp.id
                        ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 ring-1 ring-teal-500/50"
                        : "border-surface-border bg-surface-raised hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {bp.name}
                      </span>
                      {blueprintChoice === bp.id && (
                        <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">{bp.tagline}</p>
                    <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 mt-2 block">
                      {bp.steps.length} pre-configured steps
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-2 border-t border-surface-border">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
                  2. Campaign &amp; Sender Configuration
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      Workflow Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. VIP Customer Onboarding Journey"
                      required
                      className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      Trigger Type
                    </label>
                    <select
                      value={triggerType}
                      onChange={(e) => setTriggerType(e.target.value)}
                      className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs"
                    >
                      <option value="contact.created">🚀 Contact Subscribed (contact.created)</option>
                      <option value="event">⚡ Custom Event (event)</option>
                      <option value="email.opened">👁️ Email Opened (email.opened)</option>
                      <option value="email.clicked">🔗 Link Clicked (email.clicked)</option>
                    </select>
                  </div>
                </div>

                {triggerType === "event" && (
                  <div>
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                      Listening Event Name
                    </label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g. cart.abandoned or user.signup"
                      required
                      className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-xs font-mono"
                    />
                  </div>
                )}

                {/* Sender Address */}
                <div className="rounded-lg border border-surface-border bg-surface-raised p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Workflow Outbound Sender
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomFrom(!isCustomFrom)}
                      className="text-[11px] text-teal-600 hover:underline dark:text-teal-400 font-mono"
                    >
                      {isCustomFrom ? "Use Domain Selector" : "Custom Address"}
                    </button>
                  </div>

                  {!isCustomFrom ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={fromPrefix}
                        onChange={(e) => setFromPrefix(e.target.value)}
                        placeholder="automations"
                        className="w-32 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs font-mono"
                      />
                      <span className="text-zinc-400 font-bold">@</span>
                      <select
                        value={selectedDomain}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="flex-1 rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs font-mono"
                      >
                        {verifiedDomains.map((d) => (
                          <option key={d.id} value={d.name}>
                            {d.name} (Verified)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <input
                      type="email"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      placeholder="e.g. marketing@yourdomain.com"
                      className="w-full rounded-md border border-surface-border bg-surface px-3 py-1.5 text-xs font-mono"
                    />
                  )}
                  <span className="text-[10px] text-zinc-500 block">
                    All outbound emails in this automation will resolve strictly via verified domain MX.
                  </span>
                </div>
              </div>

              {/* Step Sequence Customizer */}
              <div className="space-y-3 pt-2 border-t border-surface-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    3. Sequence Steps ({steps.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddStepToModal("send_email")}
                      className="rounded border border-surface-border bg-surface-raised px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-surface"
                    >
                      + Email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStepToModal("delay")}
                      className="rounded border border-surface-border bg-surface-raised px-2 py-1 text-[11px] font-medium text-amber-600 hover:bg-surface"
                    >
                      + Delay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddStepToModal("condition")}
                      className="rounded border border-surface-border bg-surface-raised px-2 py-1 text-[11px] font-medium text-indigo-600 hover:bg-surface"
                    >
                      + If/Else
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {steps.map((st, i) => (
                    <div
                      key={st.id || i}
                      className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-bold text-zinc-400">#{i + 1}</span>
                        {st.type === "delay" ? (
                          <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Delay {(st.config.delay_seconds || 0) / 3600} hours</span>
                          </div>
                        ) : st.type === "condition" ? (
                          <div className="flex items-center gap-1.5 text-indigo-600 font-medium">
                            <GitBranch className="h-3.5 w-3.5" />
                            <span>If {st.config.field} {st.config.operator} &quot;{String(st.config.value)}&quot;</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-zinc-900 dark:text-white font-medium">
                            <Mail className="h-3.5 w-3.5 text-teal-600" />
                            <span className="truncate max-w-xs">{st.config.subject || "Email"}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(i, "up")}
                          disabled={i === 0}
                          className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5 rotate-180" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(i, "down")}
                          disabled={i === steps.length - 1}
                          className="p-1 text-zinc-400 hover:text-zinc-700 disabled:opacity-30"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStepFromModal(i)}
                          className="p-1 text-zinc-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-surface-border px-3.5 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Deploy Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

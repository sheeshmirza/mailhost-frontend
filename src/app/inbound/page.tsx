"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  InboundEmailSummary,
  InboundEmailDetail,
  AliasView,
  DomainView,
} from "@/lib/api";
import {
  Inbox,
  Forward,
  Plus,
  Trash2,
  FileDown,
  X,
  RefreshCw,
  ChevronRight,
  Mail,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";

export default function InboundPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"emails" | "aliases">("emails");
  const [inboundEmails, setInboundEmails] = useState<InboundEmailSummary[]>([]);
  const [selectedInbound, setSelectedInbound] = useState<InboundEmailDetail | null>(null);
  const [aliases, setAliases] = useState<AliasView[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New alias modal
  const [isAliasOpen, setIsAliasOpen] = useState(false);
  const [aliasPrefix, setAliasPrefix] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [forwardTo, setForwardTo] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [inboundRes, aliasesRes, domainsRes] = await Promise.allSettled([
        api.listInbound(),
        api.listAliases(),
        api.listDomains(),
      ]);
      if (inboundRes.status === "fulfilled") {
        setInboundEmails(inboundRes.value.data || []);
      }
      if (aliasesRes.status === "fulfilled") {
        setAliases(aliasesRes.value.data || []);
      }
      if (domainsRes.status === "fulfilled") {
        const domList = domainsRes.value.data || [];
        setDomains(domList);
        if (domList.length > 0 && !selectedDomain) {
          setSelectedDomain(domList[0].name);
        }
      }
    } catch (err) {
      console.error("Failed to load inbound data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const loadDetail = async (id: string) => {
    try {
      const detail = await api.getInbound(id);
      setSelectedInbound(detail);
    } catch (err) {
      console.error("Failed to fetch inbound detail", err);
    }
  };

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const domObj = domains.find((d) => d.name === selectedDomain || d.id === selectedDomain) || domains[0];
      if (!domObj) {
        toast.error("Please add and verify a domain first");
        return;
      }
      const destinations = forwardTo.split(",").map((s) => s.trim()).filter(Boolean);
      await api.createAlias({
        domain_id: domObj.id,
        name: aliasPrefix.trim(),
        destinations: destinations,
        store_copy: true,
      });
      toast.success("Alias created successfully");
      setIsAliasOpen(false);
      setAliasPrefix("");
      setForwardTo("");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to create alias: " + err.message);
    }
  };

  const handleDeleteAlias = async (id: string) => {
    if (!confirm("Are you sure you want to remove this alias?")) return;
    try {
      await api.deleteAlias(id);
      toast.success("Alias deleted successfully");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to delete alias: " + err.message);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Inbound & Receiving
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Capture incoming mail on Port 25, parse MIME messages, and set up forwarding aliases.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-surface-border bg-surface p-0.5">
            <button
              onClick={() => setActiveTab("emails")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "emails"
                  ? "bg-surface-raised text-zinc-900 dark:text-white font-medium shadow-sm border border-surface-border/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Inbox className="h-3.5 w-3.5" />
              <span>Received Mail</span>
            </button>
            <button
              onClick={() => setActiveTab("aliases")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeTab === "aliases"
                  ? "bg-surface-raised text-zinc-900 dark:text-white font-medium shadow-sm border border-surface-border/50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Forward className="h-3.5 w-3.5" />
              <span>Aliases & Routing</span>
            </button>
          </div>

          {activeTab === "aliases" && (
            <button
              onClick={() => setIsAliasOpen(true)}
              className="btn-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Alias</span>
            </button>
          )}

          <button
            onClick={fetchData}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tab: Received Emails */}
      {activeTab === "emails" && (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
          <table className="w-full text-left text-xs min-w-[650px]">
            <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">From</th>
                <th className="px-5 py-3">To (Recipient)</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Received At</th>
                <th className="px-5 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {inboundEmails.length > 0 ? (
                inboundEmails.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => loadDetail(item.id)}
                    className="cursor-pointer hover:bg-surface-raised/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-zinc-900 dark:text-white max-w-xs truncate">
                      {item.subject || "(no subject)"}
                    </td>
                    <td className="px-5 py-3 font-mono text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {item.mail_from || item.from}
                    </td>
                    <td className="px-5 py-3 font-mono text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                      {item.rcpt_to?.join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-zinc-500 dark:text-zinc-400">
                      {(item.size / 1024).toFixed(1)} KB
                    </td>
                    <td className="px-5 py-3 font-mono text-zinc-500 dark:text-zinc-400">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-zinc-400 dark:text-zinc-500 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
                    {isLoading
                      ? "Loading received emails..."
                      : "No inbound emails received yet. Configure MX records pointing to port 25 to receive mail."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Aliases */}
      {activeTab === "aliases" && (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3">Alias Address</th>
                <th className="px-5 py-3">Forward To</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-mono">
              {aliases.length > 0 ? (
                aliases.map((al) => (
                  <tr key={al.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="px-5 py-3 text-zinc-900 dark:text-white font-semibold">
                      {al.address || al.alias || al.name}
                    </td>
                    <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300">
                      {al.destinations && al.destinations.length > 0
                        ? al.destinations.join(", ")
                        : al.forward_to && al.forward_to.length > 0
                        ? al.forward_to.join(", ")
                        : al.store_copy
                        ? "Stored in Inbox"
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {new Date(al.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDeleteAlias(al.id)}
                        className="rounded p-1 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                    No forwarding aliases configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Inbound Email Detail Modal */}
      {selectedInbound && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="h-full w-full max-w-xl border-l border-surface-border bg-surface p-6 shadow-2xl flex flex-col space-y-6 overflow-y-auto">
            <div className="flex items-start justify-between border-b border-surface-border pb-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Inbound MIME Inspector
                </span>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {selectedInbound.subject || "(no subject)"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedInbound(null)}
                className="rounded-md p-1 text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3 col-span-2">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase">From</span>
                <span className="font-mono text-zinc-900 dark:text-white block truncate">
                  {selectedInbound.mail_from}
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3 col-span-2">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase">To</span>
                <span className="font-mono text-zinc-900 dark:text-white block truncate">
                  {selectedInbound.rcpt_to?.join(", ")}
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase">Size</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 block">
                  {(selectedInbound.size / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase">Received At</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 block">
                  {new Date(selectedInbound.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Email Body content */}
            <div className="space-y-2 flex-1">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                Email Body
              </h3>
              {selectedInbound.html ? (
                <div className="rounded-lg border border-surface-border bg-white p-4 text-black max-h-80 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: selectedInbound.html }} />
                </div>
              ) : selectedInbound.text ? (
                <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-zinc-800 dark:text-zinc-200 max-h-80 overflow-y-auto whitespace-pre-wrap">
                  {selectedInbound.text}
                </pre>
              ) : (
                <div className="text-xs text-zinc-500 dark:text-zinc-400">No body content available.</div>
              )}
            </div>

            {/* Raw MIME download */}
            <div className="pt-4 border-t border-surface-border flex justify-between items-center">
              <a
                href={`/backend/v1/inbound/${selectedInbound.id}/raw`}
                download={`${selectedInbound.id}.eml`}
                className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Download Raw RFC822 (.eml)</span>
              </a>
              <button
                onClick={() => setSelectedInbound(null)}
                className="rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Alias Modal */}
      {isAliasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4 animate-slide-up">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Create Inbound Alias</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Forward all emails received at this alias to one or more destination mailboxes.
            </p>

            <form onSubmit={handleCreateAlias} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Alias Address
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aliasPrefix}
                    onChange={(e) => setAliasPrefix(e.target.value)}
                    placeholder="support"
                    required
                    className="flex-1 input-base"
                  />
                  <span className="text-zinc-500 text-xs font-mono">@</span>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="input-base w-auto"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Forward To (comma separated)
                </label>
                <input
                  type="text"
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
                  placeholder="team@mycompany.com, alerts@mycompany.com"
                  required
                  className="input-base"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsAliasOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Alias
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

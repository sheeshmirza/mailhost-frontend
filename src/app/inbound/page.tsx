"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Pencil,
  FileDown,
  X,
  RefreshCw,
  ChevronRight,
  Mail,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CursorPagination } from "@/components/ui/CursorPagination";

export default function InboundPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"emails" | "aliases">("emails");
  const [inboundEmails, setInboundEmails] = useState<InboundEmailSummary[]>([]);
  const [selectedInbound, setSelectedInbound] = useState<InboundEmailDetail | null>(null);
  const [aliases, setAliases] = useState<AliasView[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloadingRaw, setIsDownloadingRaw] = useState(false);
  const [inboundBefore, setInboundBefore] = useState<string | undefined>();
  const [nextInboundBefore, setNextInboundBefore] = useState<string | undefined>();
  const [inboundPageHistory, setInboundPageHistory] = useState<(string | undefined)[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const dataLoadRevision = useRef(0);
  const detailLoadRevision = useRef(0);

  // New alias modal
  const [isAliasOpen, setIsAliasOpen] = useState(false);
  const [editingAliasId, setEditingAliasId] = useState<string | null>(null);
  const [aliasPrefix, setAliasPrefix] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [forwardTo, setForwardTo] = useState("");
  const [storeAliasCopy, setStoreAliasCopy] = useState(true);

  const fetchData = async (before?: string, resetPage = true): Promise<boolean> => {
    const revision = ++dataLoadRevision.current;
    setIsLoading(true);
    setError(null);
    try {
      const [inboundRes, aliasesRes, domainsRes] = await Promise.allSettled([
        api.listInbound(50, before),
        api.listAliases(),
        api.listDomains(),
      ]);
      if (revision !== dataLoadRevision.current) return false;
      let hasSuccess = false;
      if (inboundRes.status === "fulfilled") {
        setInboundEmails(inboundRes.value.data || []);
        setInboundBefore(before);
        setNextInboundBefore(inboundRes.value.next_before);
        if (resetPage) setInboundPageHistory([]);
        hasSuccess = true;
      }
      if (aliasesRes.status === "fulfilled") {
        setAliases(aliasesRes.value.data || []);
        hasSuccess = true;
      }
      if (domainsRes.status === "fulfilled") {
        const domList = domainsRes.value.data || [];
        setDomains(domList);
        if (domList.length > 0 && !selectedDomain) {
          setSelectedDomain(domList[0].name);
        }
        hasSuccess = true;
      }
      if (!hasSuccess && (inboundRes.status === "rejected" || aliasesRes.status === "rejected")) {
        const reason = (inboundRes.status === "rejected" ? (inboundRes as PromiseRejectedResult).reason : (aliasesRes as PromiseRejectedResult).reason)?.message || "Failed to load inbound data";
        setError(reason);
      }
      return hasSuccess;
    } catch (err: any) {
      if (revision !== dataLoadRevision.current) return false;
      console.error("Failed to load inbound data", err);
      setError(err?.message || "Failed to load inbound data");
      return false;
    } finally {
      if (revision === dataLoadRevision.current) setIsLoading(false);
    }
  };

  const loadOlderInbound = async () => {
    if (!nextInboundBefore || isPageLoading) return;
    const currentBefore = inboundBefore;
    setIsPageLoading(true);
    try {
      if (await fetchData(nextInboundBefore, false)) {
        setInboundPageHistory((history) => [...history, currentBefore]);
      }
    } finally {
      setIsPageLoading(false);
    }
  };

  const loadNewerInbound = async () => {
    if (inboundPageHistory.length === 0 || isPageLoading) return;
    const previousBefore = inboundPageHistory[inboundPageHistory.length - 1];
    setIsPageLoading(true);
    try {
      if (await fetchData(previousBefore, false)) {
        setInboundPageHistory((history) => history.slice(0, -1));
      }
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    return () => {
      dataLoadRevision.current += 1;
      detailLoadRevision.current += 1;
    };
  }, []);

  const loadDetail = async (id: string) => {
    const revision = ++detailLoadRevision.current;
    try {
      const detail = await api.getInbound(id);
      if (revision === detailLoadRevision.current) setSelectedInbound(detail);
    } catch (err) {
      if (revision !== detailLoadRevision.current) return;
      console.error("Failed to fetch inbound detail", err);
      toast.error("Could not load inbound message details: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const downloadRawMessage = async (id: string) => {
    if (isDownloadingRaw) return;
    setIsDownloadingRaw(true);
    try {
      const file = await api.getInboundRaw(id);
      const objectURL = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = objectURL;
      anchor.download = `${id}.eml`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
    } catch (err) {
      toast.error("Could not download raw message: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsDownloadingRaw(false);
    }
  };

  const handleCreateAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const destinations = forwardTo.split(",").map((s) => s.trim()).filter(Boolean);
      if (editingAliasId) {
        await api.updateAlias(editingAliasId, { destinations, store_copy: storeAliasCopy });
        toast.success("Alias routing updated");
      } else {
        const domObj = domains.find((d) => d.name === selectedDomain || d.id === selectedDomain) || domains[0];
        if (!domObj) {
          toast.error("Please add and verify a domain first");
          return;
        }
        await api.createAlias({
          domain_id: domObj.id,
          name: aliasPrefix.trim(),
          destinations,
          store_copy: storeAliasCopy,
        });
        toast.success("Alias created successfully");
      }
      setIsAliasOpen(false);
      setEditingAliasId(null);
      setAliasPrefix("");
      setForwardTo("");
      setStoreAliasCopy(true);
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
              onClick={() => {
                setEditingAliasId(null);
                setAliasPrefix("");
                setForwardTo("");
                setStoreAliasCopy(true);
                setIsAliasOpen(true);
              }}
              className="btn-primary"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Alias</span>
            </button>
          )}

          <button
            onClick={() => {
              api.clearCache();
              void fetchData();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : activeTab === "emails" ? (
        isLoading && inboundEmails.length === 0 ? (
          <TableSkeleton rows={5} cols={6} />
        ) : (
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
                      onClick={() => void loadDetail(item.id)}
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
                      No inbound emails received yet. Configure MX records pointing to port 25 to receive mail.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )
      ) : isLoading && aliases.length === 0 ? (
          <TableSkeleton rows={4} cols={4} />
        ) : (
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
                          onClick={() => {
                            setEditingAliasId(al.id);
                            setAliasPrefix(al.address || al.alias || al.name);
                            setSelectedDomain(al.domain_id);
                            setForwardTo((al.destinations?.length ? al.destinations : al.forward_to || []).join(", "));
                            setStoreAliasCopy(al.store_copy ?? true);
                            setIsAliasOpen(true);
                          }}
                          title="Edit alias routing"
                          className="rounded p-1 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
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
      {activeTab === "emails" && (inboundPageHistory.length > 0 || nextInboundBefore) && (
        <CursorPagination
          page={inboundPageHistory.length + 1}
          canGoNewer={inboundPageHistory.length > 0}
          canGoOlder={Boolean(nextInboundBefore)}
          isLoading={isPageLoading || isLoading}
          onNewer={() => void loadNewerInbound()}
          onOlder={() => void loadOlderInbound()}
        />
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

            {selectedInbound.attachments && selectedInbound.attachments.length > 0 && (
              <section className="space-y-2 border-t border-surface-border pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                  Attachments ({selectedInbound.attachments.length})
                </h3>
                <ul className="divide-y divide-surface-border rounded-md border border-surface-border">
                  {selectedInbound.attachments.map((attachment, index) => (
                    <li key={`${attachment.filename}-${index}`} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="break-all text-xs font-medium text-zinc-800 dark:text-zinc-200">{attachment.filename}</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {attachment.content_type} · {(attachment.size / 1024).toFixed(1)} KB
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Raw MIME download */}
            <div className="pt-4 border-t border-surface-border flex justify-between items-center">
              <button
                type="button"
                onClick={() => downloadRawMessage(selectedInbound.id)}
                disabled={isDownloadingRaw}
                className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-300 dark:hover:text-white transition-colors"
              >
                {isDownloadingRaw ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
                <span>{isDownloadingRaw ? "Downloading..." : "Download Raw RFC822 (.eml)"}</span>
              </button>
              <button
                onClick={() => setSelectedInbound(null)}
                className="btn-primary px-3.5 py-1.5 text-xs"
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
          <div className="dialog-scroll relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">{editingAliasId ? "Edit Alias Routing" : "Create Inbound Alias"}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Forward all emails received at this alias to one or more destination mailboxes.
            </p>

            <form onSubmit={handleCreateAlias} className="space-y-4">
              {!editingAliasId && <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Alias Address
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={aliasPrefix}
                    onChange={(e) => setAliasPrefix(e.target.value)}
                    placeholder="support"
                    required
                    className="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                  />
                  <span className="text-zinc-500 text-xs">@</span>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
                  >
                    {domains.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>}

              {editingAliasId && (
                <div className="rounded-md border border-surface-border bg-surface-raised px-3 py-2 text-xs">
                  <span className="block text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">Alias address</span>
                  <span className="mt-1 block font-mono text-zinc-900 dark:text-zinc-100">{aliasPrefix}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Forward To (comma separated)
                </label>
                <input
                  type="text"
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
                  placeholder="Forwarding email addresses, comma-separated"
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                <input type="checkbox" checked={storeAliasCopy} onChange={(event) => setStoreAliasCopy(event.target.checked)} />
                Keep a copy in the inbound mailbox
              </label>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-border mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAliasOpen(false);
                    setEditingAliasId(null);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingAliasId ? "Save Routing" : "Save Alias"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

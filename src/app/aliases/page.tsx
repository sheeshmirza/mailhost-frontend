"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  api,
  AliasView,
  DomainView,
  getErrorMessage,
} from "@/lib/api";
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  Pencil,
  Copy,
  Check,
  Search,
  Globe,
  Inbox,
  Forward,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { VerifiedDomainAlert } from "@/components/common/VerifiedDomainAlert";
import { getVerifiedDomains } from "@/lib/domain-utils";

export default function AliasesPage() {
  const toast = useToast();
  const [aliases, setAliases] = useState<AliasView[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");

  // Create / Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlias, setEditingAlias] = useState<AliasView | null>(null);
  const [aliasPrefix, setAliasPrefix] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [destinations, setDestinations] = useState<string[]>([]);
  const [storeCopy, setStoreCopy] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingAlias, setDeletingAlias] = useState<AliasView | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const verifiedDomains = useMemo(() => getVerifiedDomains(domains), [domains]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [aliasRes, domRes] = await Promise.allSettled([
        api.listAliases(),
        api.listDomains(),
      ]);

      if (aliasRes.status === "fulfilled") {
        setAliases(aliasRes.value.data || []);
      } else {
        setError("Failed to load email aliases.");
      }

      if (domRes.status === "fulfilled") {
        const domList = domRes.value.data || [];
        setDomains(domList);
        const verified = domList.filter((d) => d.status === "verified");
        if (verified.length > 0 && !selectedDomainId) {
          setSelectedDomainId(verified[0].id);
        }
      }
    } catch (err: any) {
      console.error("Failed to load aliases data", err);
      setError(err?.message || "Failed to load aliases");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingAlias(null);
    setAliasPrefix("");
    setDestinations([]);
    setDestinationInput("");
    setStoreCopy(true);
    if (verifiedDomains.length > 0 && !selectedDomainId) {
      setSelectedDomainId(verifiedDomains[0].id);
    }
    setIsModalOpen(true);
  };

  const openEditModal = (alias: AliasView) => {
    setEditingAlias(alias);
    setAliasPrefix(alias.name);
    setSelectedDomainId(alias.domain_id);
    setDestinations(alias.destinations || []);
    setDestinationInput("");
    setStoreCopy(alias.store_copy ?? true);
    setIsModalOpen(true);
  };

  const handleAddDestination = () => {
    const trimmed = destinationInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes("@") || trimmed.length < 5) {
      toast.error("Please enter a valid destination email address.");
      return;
    }
    if (destinations.includes(trimmed)) {
      toast.info("Destination already added.");
      return;
    }
    setDestinations([...destinations, trimmed]);
    setDestinationInput("");
  };

  const handleRemoveDestination = (emailToRemove: string) => {
    setDestinations(destinations.filter((d) => d !== emailToRemove));
  };

  const handleKeyDownDestination = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddDestination();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if input has unsaved email
    const pendingInput = destinationInput.trim().toLowerCase();
    let finalDests = [...destinations];
    if (pendingInput && pendingInput.includes("@")) {
      if (!finalDests.includes(pendingInput)) {
        finalDests.push(pendingInput);
      }
    }

    if (finalDests.length === 0 && !storeCopy) {
      toast.error("An alias must have at least one forwarding destination or store a copy in the mailbox.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAlias) {
        // Update existing alias
        await api.updateAlias(editingAlias.id, {
          destinations: finalDests,
          store_copy: storeCopy,
        });
        toast.success("Alias updated successfully");
      } else {
        // Create new alias
        if (!selectedDomainId) {
          throw new Error("Please select a verified domain");
        }
        const name = aliasPrefix.trim().toLowerCase();
        if (!name) {
          throw new Error("Alias name/local-part is required (e.g. support or *)");
        }

        await api.createAlias({
          domain_id: selectedDomainId,
          name: name,
          destinations: finalDests,
          store_copy: storeCopy,
        });
        toast.success("Alias created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to save alias"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAlias) return;
    setIsDeleting(true);
    try {
      await api.deleteAlias(deletingAlias.id);
      toast.success("Alias deleted successfully");
      setDeletingAlias(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete alias"));
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.info("Copied to clipboard: " + text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Aliases
  const filteredAliases = useMemo(() => {
    return aliases.filter((a) => {
      // Domain filter
      if (domainFilter !== "all" && a.domain_id !== domainFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullAddress = (a.address || `${a.name}@${a.domain_id}`).toLowerCase();
        const hasDest = (a.destinations || []).some((d) => d.toLowerCase().includes(q));
        return fullAddress.includes(q) || a.name.toLowerCase().includes(q) || hasDest;
      }
      return true;
    });
  }, [aliases, domainFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = aliases.length;
    const catchAllCount = aliases.filter((a) => a.name === "*").length;
    const storeCopyCount = aliases.filter((a) => a.store_copy).length;
    const totalDestinations = aliases.reduce((acc, a) => acc + (a.destinations?.length || 0), 0);
    return { total, catchAllCount, storeCopyCount, totalDestinations };
  }, [aliases]);

  const selectedDomainObj = useMemo(() => {
    return domains.find((d) => d.id === selectedDomainId);
  }, [domains, selectedDomainId]);

  return (
    <div className="page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
              Email Forwarding &amp; Aliases
            </h1>
            <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
              Email Forwarding
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Create friendly forwarding addresses (like support@ or sales@) that automatically send messages to your personal or team inboxes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/inbound"
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-surface-raised dark:text-zinc-300 transition-colors"
          >
            <Inbox className="h-3.5 w-3.5" />
            <span>Received Mail</span>
          </Link>
          <button
            onClick={openCreateModal}
            className="btn-primary"
            disabled={verifiedDomains.length === 0}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Forwarding Address</span>
          </button>
        </div>
      </div>

      {verifiedDomains.length === 0 && !isLoading && (
        <VerifiedDomainAlert hasRegisteredDomains={domains.length > 0} />
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Forwarding Rules
            </span>
            <ArrowRightLeft className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{stats.total}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Active forwarding rules</p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Destination Inboxes
            </span>
            <Forward className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{stats.totalDestinations}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">External inboxes receiving mail</p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Catch-All Addresses
            </span>
            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{stats.catchAllCount}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Catches any email to your domain</p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Saved in Inbox
            </span>
            <Inbox className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{stats.storeCopyCount}</p>
          <p className="mt-0.5 text-[11px] text-zinc-500">Keeps a copy in this mailbox</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by alias or destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface pl-9 pr-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Domain:</label>
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Domains ({domains.length})</option>
            {domains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} {d.status === "verified" ? "✓" : "(unverified)"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aliases Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface shadow-sm">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3">Alias Address</th>
                <th className="px-5 py-3">Routing & Forwarding</th>
                <th className="px-5 py-3">Store Copy</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredAliases.length > 0 ? (
                filteredAliases.map((alias) => {
                  const isWildcard = alias.name === "*";
                  const domainObj = domains.find((d) => d.id === alias.domain_id);
                  const displayAddress = alias.address || `${alias.name}@${domainObj?.name || alias.domain_id}`;

                  return (
                    <tr key={alias.id} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-zinc-900 dark:text-white">
                            {displayAddress}
                          </span>
                          <button
                            onClick={() => copyToClipboard(displayAddress, alias.id)}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                            title="Copy alias address"
                          >
                            {copiedId === alias.id ? (
                              <Check className="h-3.5 w-3.5 text-teal-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {isWildcard && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              <Sparkles className="h-3 w-3" /> Catch-All
                            </span>
                          )}
                        </div>
                        {domainObj && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500">
                            <Globe className="h-3 w-3" />
                            <span>{domainObj.name}</span>
                            {domainObj.status === "verified" ? (
                              <span className="text-teal-600 dark:text-teal-400 font-medium">✓ Verified</span>
                            ) : (
                              <span className="text-amber-600">Pending DNS</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        {alias.destinations && alias.destinations.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {alias.destinations.map((dest, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 border border-surface-border"
                              >
                                <Forward className="h-3 w-3 text-blue-500" />
                                {dest}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-zinc-400 italic">No external forwarding</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        {alias.store_copy ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                            <CheckCircle2 className="h-3 w-3" /> Kept in Inbox
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            Forward Only
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-zinc-500 text-[11px]">
                        {alias.created_at ? new Date(alias.created_at).toLocaleDateString() : "—"}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => openEditModal(alias)}
                            className="rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            title="Edit destinations"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingAlias(alias)}
                            className="rounded p-1 text-zinc-400 hover:text-red-500 transition-colors"
                            title="Delete alias"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <ArrowRightLeft className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                    <p className="mt-2 text-xs font-medium text-zinc-900 dark:text-white">
                      {searchQuery || domainFilter !== "all"
                        ? "No aliases match your filter criteria."
                        : "No email aliases created yet."}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Forward incoming emails for custom addresses to your real personal or team mailboxes.
                    </p>
                    {verifiedDomains.length > 0 && !searchQuery && (
                      <button
                        onClick={openCreateModal}
                        className="btn-primary mt-4 inline-flex"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Create First Alias</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Guide Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
            <Forward className="h-4 w-4 text-blue-500" />
            <span>Forward to Multiple People</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            One forwarding address can send to multiple personal or team inboxes at the same time (e.g. your team Gmail or Outlook).
          </p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Catch-All Email (*)</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Use `*` to catch any email sent to unconfigured addresses on your domain so you never miss an inquiry.
          </p>
        </div>

        <div className="rounded-xl border border-surface-border bg-surface p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
            <Inbox className="h-4 w-4 text-purple-500" />
            <span>Keep a Backup Copy</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Turn on &quot;Keep a copy&quot; to read messages right here in your webmail inbox as well as forwarding them.
          </p>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-lg rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                {editingAlias ? "Edit Forwarding Address" : "Create Forwarding Address"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Alias Address */}
              {!editingAlias ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Forwarding Address
                    </label>
                    <button
                      type="button"
                      onClick={() => setAliasPrefix("*")}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline"
                    >
                      Set as Catch-All (*)
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={aliasPrefix}
                      onChange={(e) => setAliasPrefix(e.target.value)}
                      placeholder="e.g. support, info, or *"
                      required
                      className="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-teal-500 font-mono"
                    />
                    <span className="text-zinc-500 text-sm font-semibold">@</span>
                    <select
                      value={selectedDomainId}
                      onChange={(e) => setSelectedDomainId(e.target.value)}
                      className="rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-teal-500"
                    >
                      {verifiedDomains.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Live address:{" "}
                    <span className="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      {aliasPrefix.trim() || "name"}@{selectedDomainObj?.name || "domain.com"}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                  <span className="text-[10px] text-zinc-500 uppercase block font-semibold">
                    Alias Address (Read Only)
                  </span>
                  <span className="text-xs font-mono font-medium text-zinc-900 dark:text-white">
                    {editingAlias.address || `${editingAlias.name}@${selectedDomainObj?.name || ""}`}
                  </span>
                </div>
              )}

              {/* Forwarding Destinations */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Forwarding Destinations
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={destinationInput}
                    onChange={(e) => setDestinationInput(e.target.value)}
                    onKeyDown={handleKeyDownDestination}
                    placeholder="e.g. team@yourcompany.com"
                    className="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddDestination}
                    className="rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-surface dark:text-zinc-300"
                  >
                    Add
                  </button>
                </div>

                {destinations.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {destinations.map((dest) => (
                      <span
                        key={dest}
                        className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs text-teal-800 dark:bg-teal-900/30 dark:text-teal-200 border border-teal-200 dark:border-teal-800"
                      >
                        {dest}
                        <button
                          type="button"
                          onClick={() => handleRemoveDestination(dest)}
                          className="hover:text-red-500 ml-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500">
                    Press Enter or click Add to add multiple destination addresses.
                  </p>
                )}
              </div>

              {/* Store Copy Toggle */}
              <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeCopy}
                    onChange={(e) => setStoreCopy(e.target.checked)}
                    className="mt-0.5 rounded border-surface-border text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs">
                    <span className="font-medium text-zinc-900 dark:text-white block">
                      Store local copy in Mailhost Inbox
                    </span>
                    <span className="text-zinc-500 text-[11px] block mt-0.5">
                      Retains the message in Mailhost for webmail viewing, IMAP/POP3 sync, and Inbound logs.
                    </span>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-surface-border px-3.5 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? "Saving..." : editingAlias ? "Update Alias" : "Create Alias"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAlias && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-xl border border-surface-border bg-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <h2 className="text-sm font-semibold">Delete Alias Rule</h2>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete alias{" "}
              <strong className="text-zinc-900 dark:text-white font-mono">
                {deletingAlias.address || deletingAlias.name}
              </strong>
              ? Incoming emails to this address will no longer be forwarded.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-border">
              <button
                type="button"
                onClick={() => setDeletingAlias(null)}
                className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Alias"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

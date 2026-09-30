"use client";

import React, { useState, useEffect } from "react";
import {
  api,
  DomainView,
  DNSRecord,
} from "@/lib/api";
import {
  Globe,
  Plus,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/lib/toast-context";

export default function DomainsPage() {
  const toast = useToast();
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<DomainView | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchDomains = async () => {
    setIsLoading(true);
    try {
      const res = await api.listDomains();
      const list = res.data || [];
      setDomains(list);
      if (list.length > 0 && !selectedDomain) {
        setSelectedDomain(list[0]);
      } else if (selectedDomain) {
        const updated = list.find((d) => d.id === selectedDomain.id);
        if (updated) setSelectedDomain(updated);
      }
    } catch (err) {
      console.error("Failed to fetch domains", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newDom = await api.createDomain(domainName.trim(), region);
      toast.success("Domain added successfully!");
      setIsAddOpen(false);
      setDomainName("");
      await fetchDomains();
      setSelectedDomain(newDom);
    } catch (err: any) {
      toast.error("Failed to add domain: " + err.message);
    }
  };

  const handleVerify = async (id: string) => {
    setIsVerifying(true);
    try {
      const res = await api.verifyDomain(id);
      setSelectedDomain(res);
      await fetchDomains();
      if (res.status === "verified") {
        toast.success("Domain verified successfully!");
      } else {
        toast.info("DNS records checked. Pending propagation.");
      }
    } catch (err: any) {
      toast.error("Verification check: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this domain?")) return;
    try {
      await api.deleteDomain(id);
      toast.success("Domain deleted successfully");
      setSelectedDomain(null);
      await fetchDomains();
    } catch (err: any) {
      toast.error("Failed to delete domain: " + err.message);
    }
  };

  const handleUpdateDomainConfig = async (patch: {
    open_tracking?: boolean;
    click_tracking?: boolean;
    tls?: string;
    inbound_webhook_url?: string | null;
  }) => {
    if (!selectedDomain) return;
    try {
      const updated = await api.updateDomain(selectedDomain.id, patch);
      setSelectedDomain(updated);
      toast.success("Domain settings updated");
      fetchDomains();
    } catch (err: any) {
      toast.error("Failed to update domain setting: " + err.message);
    }
  };

  const copyText = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Domains
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Configure DKIM, SPF, MX, and verify your sending identities.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="btn-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Domain</span>
        </button>
      </div>

      {/* Main Content Layout: Domains List & Active Domain DNS Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Domain List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 font-medium px-1">
            <span>Your Domains</span>
            <span className="font-mono text-xs">{domains.length}</span>
          </div>

          <div className="space-y-2">
            {domains.length > 0 ? (
              domains.map((dom) => (
                <div
                  key={dom.id}
                  onClick={() => setSelectedDomain(dom)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all focus:outline-none focus:ring-2 focus:ring-zinc-500 ${
                    selectedDomain?.id === dom.id
                      ? "border-zinc-300 bg-surface-raised shadow-sm dark:border-zinc-700"
                      : "border-transparent bg-surface hover:border-zinc-200 dark:hover:border-zinc-800"
                  }`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedDomain(dom);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      <span className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                        {dom.name}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                        dom.status === "verified"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30"
                      }`}
                    >
                      {dom.status === "verified" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" />
                          <span>Pending</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-mono bg-zinc-100 dark:bg-zinc-800/50 px-1.5 py-0.5 rounded text-[10px]">{dom.region}</span>
                    <span>{new Date(dom.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-surface p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {isLoading ? "Loading domains..." : "No domains registered yet."}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: DNS Records & Verification Inspector */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDomain ? (
            <div className="rounded-xl border border-surface-border bg-surface p-6 sm:p-8 space-y-8 shadow-sm">
              {/* Domain Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-surface-border pb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                      {selectedDomain.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                        selectedDomain.status === "verified"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/30"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30"
                      }`}
                    >
                      {selectedDomain.status.charAt(0).toUpperCase() + selectedDomain.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Region: <span className="font-mono text-xs">{selectedDomain.region}</span> · Created{" "}
                    {new Date(selectedDomain.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleVerify(selectedDomain.id)}
                    disabled={isVerifying}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 disabled:opacity-50 transition-colors shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 dark:focus:ring-white dark:focus:ring-offset-black"
                  >
                    <RefreshCw className={`h-4 w-4 text-zinc-500 dark:text-zinc-400 ${isVerifying ? "animate-spin" : ""}`} />
                    <span>{isVerifying ? "Verifying..." : "Verify"}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDomain.id)}
                    title="Delete domain"
                    className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400 dark:focus:ring-red-500 dark:focus:ring-offset-black"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* DNS Instruction Banner */}
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 space-y-1.5 shadow-sm">
                <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Required DNS Records for Deliverability</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                  Add the following records to your DNS provider (Cloudflare, AWS Route 53, Namecheap, etc.) to authenticate your domain with DKIM and SPF.
                </p>
              </div>

              {/* Records Table */}
              <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm dark:border-zinc-800 bg-white dark:bg-zinc-950">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                    <thead className="border-b border-zinc-200 bg-zinc-50/80 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Name / Host</th>
                        <th className="px-4 py-3 font-medium">Value</th>
                        <th className="px-4 py-3 font-medium">Purpose</th>
                        <th className="px-4 py-3 font-medium text-right">Copy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-[13px]">
                      {selectedDomain.records && selectedDomain.records.length > 0 ? (
                        selectedDomain.records.map((rec, i) => (
                          <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                            <td className="px-4 py-3.5 font-semibold text-zinc-900 dark:text-white">
                              <span className="rounded bg-zinc-100 px-1.5 py-0.5 border border-zinc-200 text-xs tracking-wide dark:bg-zinc-800 dark:border-zinc-700">
                                {rec.type}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300 max-w-[180px] truncate" title={rec.name}>
                              {rec.name}
                            </td>
                            <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400 max-w-[280px] truncate" title={rec.value}>
                              {rec.value}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-zinc-500 dark:text-zinc-400 capitalize font-sans">
                              {rec.purpose}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => copyText(rec.value, `${i}-val`)}
                                className="rounded-md p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                title="Copy record value"
                              >
                                {copiedKey === `${i}-val` ? (
                                  <Check className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500 text-sm font-sans">
                            No DNS records generated for this domain.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Domain Delivery & Tracking Settings */}
              <div className="space-y-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Deliverability & Tracking Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Open Tracking */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 transition-colors">
                    <div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white block mb-0.5">Open Tracking</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Inject 1x1 transparent tracking pixel</span>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateDomainConfig({
                          open_tracking: !selectedDomain.open_tracking,
                        })
                      }
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:focus:ring-white dark:focus:ring-offset-black ${
                        selectedDomain.open_tracking ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                      role="switch"
                      aria-checked={selectedDomain.open_tracking}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black shadow ring-0 transition duration-200 ease-in-out ${
                          selectedDomain.open_tracking ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Click Tracking */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 transition-colors">
                    <div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white block mb-0.5">Click Tracking</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Rewrite links to track CTR</span>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateDomainConfig({
                          click_tracking: !selectedDomain.click_tracking,
                        })
                      }
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:focus:ring-white dark:focus:ring-offset-black ${
                        selectedDomain.click_tracking ? "bg-zinc-900 dark:bg-white" : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                      role="switch"
                      aria-checked={selectedDomain.click_tracking}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black shadow ring-0 transition duration-200 ease-in-out ${
                          selectedDomain.click_tracking ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* TLS Mode */}
                  <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 transition-colors">
                    <div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-white block mb-0.5">TLS Mode</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Outbound encryption</span>
                    </div>
                    <div className="relative mt-auto">
                      <select
                        value={selectedDomain.tls || "opportunistic"}
                        onChange={(e) =>
                          handleUpdateDomainConfig({ tls: e.target.value })
                        }
                        className="w-full appearance-none rounded-md border border-zinc-300 bg-white px-3 py-1.5 pr-8 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:focus:border-white dark:focus:ring-white transition-colors"
                      >
                        <option value="opportunistic">Opportunistic</option>
                        <option value="enforced">Enforced</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-surface-border bg-surface p-12 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Select or add a domain to view configuration.
            </div>
          )}
        </div>
      </div>

      {/* Add Domain Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Add Sending Domain</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Enter your apex domain or subdomain to generate DKIM cryptographic keys.
            </p>

            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="example.com or mail.example.com"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="eu-west-1">EU West (Ireland)</option>
                  <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-md border border-surface-border px-3 py-1.5 text-xs text-zinc-700 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
                >
                  Add Domain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

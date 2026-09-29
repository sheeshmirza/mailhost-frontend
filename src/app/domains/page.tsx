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
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
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
          className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Domain</span>
        </button>
      </div>

      {/* Main Content Layout: Domains List & Active Domain DNS Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Domain List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Your Domains</span>
            <span className="font-mono">{domains.length}</span>
          </div>

          <div className="space-y-2">
            {domains.length > 0 ? (
              domains.map((dom) => (
                <div
                  key={dom.id}
                  onClick={() => setSelectedDomain(dom)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedDomain?.id === dom.id
                      ? "border-zinc-900 bg-surface-raised shadow-md dark:border-white/30"
                      : "border-surface-border bg-surface hover:border-zinc-400 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                        {dom.name}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        dom.status === "verified"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/40"
                      }`}
                    >
                      {dom.status === "verified" ? (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          <span>Verified</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-2.5 w-2.5" />
                          <span>Pending</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    <span>{dom.region}</span>
                    <span>{new Date(dom.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-surface-border bg-surface p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {isLoading ? "Loading domains..." : "No domains registered yet."}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: DNS Records & Verification Inspector */}
        <div className="lg:col-span-2 space-y-5">
          {selectedDomain ? (
            <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-6">
              {/* Domain Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                      {selectedDomain.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        selectedDomain.status === "verified"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/40"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/40"
                      }`}
                    >
                      {selectedDomain.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Region: {selectedDomain.region} · Created{" "}
                    {new Date(selectedDomain.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerify(selectedDomain.id)}
                    disabled={isVerifying}
                    className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-surface dark:text-white disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`h-3 w-3 ${isVerifying ? "animate-spin" : ""}`} />
                    <span>{isVerifying ? "Verifying..." : "Verify DNS Records"}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDomain.id)}
                    title="Delete domain"
                    className="rounded-md border border-surface-border p-1.5 text-zinc-500 hover:text-red-500 hover:border-red-300 dark:hover:text-red-400 dark:hover:border-red-900 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* DNS Instruction Banner */}
              <div className="rounded-lg border border-surface-border bg-surface-raised/40 p-4 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                <div className="font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Required DNS Records for Deliverability</span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400">
                  Add the following records to your DNS provider (Cloudflare, AWS Route 53, Namecheap, etc.) to authenticate your domain with DKIM and SPF.
                </p>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto rounded-lg border border-surface-border">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="border-b border-surface-border bg-surface-raised text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono">
                    <tr>
                      <th className="px-4 py-2.5">Type</th>
                      <th className="px-4 py-2.5">Name / Host</th>
                      <th className="px-4 py-2.5">Value</th>
                      <th className="px-4 py-2.5">Purpose</th>
                      <th className="px-4 py-2.5 text-right">Copy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border font-mono">
                    {selectedDomain.records && selectedDomain.records.length > 0 ? (
                      selectedDomain.records.map((rec, i) => (
                        <tr key={i} className="hover:bg-surface-raised/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-white">
                            <span className="rounded bg-surface-raised px-1.5 py-0.5 border border-surface-border">
                              {rec.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 max-w-[160px] truncate" title={rec.name}>
                            {rec.name}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-[240px] truncate" title={rec.value}>
                            {rec.value}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-zinc-500 capitalize">
                            {rec.purpose}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => copyText(rec.value, `${i}-val`)}
                              className="rounded p-1 text-zinc-500 hover:text-zinc-900 hover:bg-surface-raised dark:text-zinc-400 dark:hover:text-white transition-colors"
                              title="Copy record value"
                            >
                              {copiedKey === `${i}-val` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-brand-500">
                          No DNS records generated for this domain.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Domain Delivery & Tracking Settings */}
              <div className="space-y-3 pt-4 border-t border-surface-border">
                <h3 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                  Deliverability & Tracking Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Open Tracking */}
                  <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised p-3">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-white block">Open Tracking</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Inject 1x1 transparent tracking pixel</span>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateDomainConfig({
                          open_tracking: !selectedDomain.open_tracking,
                        })
                      }
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        selectedDomain.open_tracking ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black shadow ring-0 transition duration-200 ease-in-out ${
                          selectedDomain.open_tracking ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Click Tracking */}
                  <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised p-3">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-white block">Click Tracking</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Rewrite links to track CTR</span>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateDomainConfig({
                          click_tracking: !selectedDomain.click_tracking,
                        })
                      }
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        selectedDomain.click_tracking ? "bg-zinc-900 dark:bg-white" : "bg-zinc-300 dark:bg-zinc-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black shadow ring-0 transition duration-200 ease-in-out ${
                          selectedDomain.click_tracking ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* TLS Mode */}
                  <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised p-3">
                    <div>
                      <span className="font-medium text-zinc-900 dark:text-white block">TLS Mode</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Outbound encryption</span>
                    </div>
                    <select
                      value={selectedDomain.tls || "opportunistic"}
                      onChange={(e) =>
                        handleUpdateDomainConfig({ tls: e.target.value })
                      }
                      className="rounded border border-surface-border bg-surface-raised px-2 py-1 text-xs text-zinc-900 dark:text-white focus:outline-none font-mono"
                    >
                      <option value="opportunistic">Opportunistic</option>
                      <option value="enforced">Enforced</option>
                    </select>
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

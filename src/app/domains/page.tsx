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

export default function DomainsPage() {
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
      setIsAddOpen(false);
      setDomainName("");
      await fetchDomains();
      setSelectedDomain(newDom);
    } catch (err: any) {
      alert("Failed to add domain: " + err.message);
    }
  };

  const handleVerify = async (id: string) => {
    setIsVerifying(true);
    try {
      const res = await api.verifyDomain(id);
      setSelectedDomain(res);
      await fetchDomains();
    } catch (err: any) {
      alert("Verification check: " + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this domain?")) return;
    try {
      await api.deleteDomain(id);
      setSelectedDomain(null);
      await fetchDomains();
    } catch (err: any) {
      alert("Failed to delete domain: " + err.message);
    }
  };

  const copyText = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Domains
          </h1>
          <p className="text-xs text-brand-400 mt-1">
            Configure DKIM, SPF, MX, and verify your sending identities.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Domain</span>
        </button>
      </div>

      {/* Main Content Layout: Domains List & Active Domain DNS Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Domain List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-brand-400 font-medium">
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
                      ? "border-white/30 bg-surface-raised shadow-md"
                      : "border-surface-border bg-surface hover:border-brand-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-brand-400" />
                      <span className="text-xs font-semibold text-white truncate">
                        {dom.name}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        dom.status === "verified"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                          : "bg-amber-950/60 text-amber-400 border-amber-800/40"
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
                  <div className="mt-2 flex items-center justify-between text-[11px] text-brand-500 font-mono">
                    <span>{dom.region}</span>
                    <span>{new Date(dom.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-surface-border bg-surface p-6 text-center text-xs text-brand-500">
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
                    <h2 className="text-base font-semibold text-white">
                      {selectedDomain.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        selectedDomain.status === "verified"
                          ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/40"
                          : "bg-amber-950/60 text-amber-400 border-amber-800/40"
                      }`}
                    >
                      {selectedDomain.status}
                    </span>
                  </div>
                  <p className="text-xs text-brand-400 mt-0.5">
                    Region: {selectedDomain.region} · Created{" "}
                    {new Date(selectedDomain.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVerify(selectedDomain.id)}
                    disabled={isVerifying}
                    className="flex items-center gap-1.5 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs font-medium text-white hover:bg-surface-subtle disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`h-3 w-3 ${isVerifying ? "animate-spin" : ""}`} />
                    <span>{isVerifying ? "Verifying..." : "Verify DNS Records"}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDomain.id)}
                    title="Delete domain"
                    className="rounded-md border border-surface-border p-1.5 text-brand-500 hover:text-red-400 hover:border-red-900 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* DNS Instruction Banner */}
              <div className="rounded-lg border border-surface-border bg-surface-raised/40 p-4 text-xs text-brand-300 space-y-1">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Required DNS Records for Deliverability</span>
                </div>
                <p className="text-brand-400">
                  Add the following records to your DNS provider (Cloudflare, AWS Route 53, Namecheap, etc.) to authenticate your domain with DKIM and SPF.
                </p>
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto rounded-lg border border-surface-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-surface-border bg-surface-raised text-[10px] uppercase tracking-wider text-brand-400 font-mono">
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
                          <td className="px-4 py-3 font-semibold text-white">
                            <span className="rounded bg-surface-raised px-1.5 py-0.5 border border-surface-border">
                              {rec.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-brand-300 max-w-[160px] truncate" title={rec.name}>
                            {rec.name}
                          </td>
                          <td className="px-4 py-3 text-brand-400 max-w-[240px] truncate" title={rec.value}>
                            {rec.value}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-brand-500 capitalize">
                            {rec.purpose}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => copyText(rec.value, `${i}-val`)}
                              className="rounded p-1 text-brand-400 hover:text-white hover:bg-surface-raised transition-colors"
                              title="Copy record value"
                            >
                              {copiedKey === `${i}-val` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
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
            </div>
          ) : (
            <div className="rounded-xl border border-surface-border bg-surface p-12 text-center text-xs text-brand-500">
              Select or add a domain to view configuration.
            </div>
          )}
        </div>
      </div>

      {/* Add Domain Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-white">Add Sending Domain</h2>
            <p className="text-xs text-brand-400">
              Enter your apex domain or subdomain to generate DKIM cryptographic keys.
            </p>

            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="example.com or mail.example.com"
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
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
                  className="rounded px-3 py-1.5 text-xs text-brand-400 hover:bg-surface-raised"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
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

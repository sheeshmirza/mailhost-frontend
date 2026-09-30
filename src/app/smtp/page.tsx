"use client";

import React, { useState, useEffect } from "react";
import { api, SMTPCredView, DomainView } from "@/lib/api";
import { useToast } from "@/lib/toast-context";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/LoadingState";
import {
  Server,
  Plus,
  Trash2,
  Copy,
  Check,
  Shield,
  AlertTriangle,
  Code2,
} from "lucide-react";

export default function SMTPPage() {
  const { toast } = useToast();
  const smtpHost = process.env.NEXT_PUBLIC_SMTP_HOST?.trim() || "Not configured";
  const smtpPort = process.env.NEXT_PUBLIC_SMTP_PORT?.trim() || "Not configured";
  const smtpSecurity = process.env.NEXT_PUBLIC_SMTP_SECURITY?.trim() || "Not configured";
  const smtpAuthMechanism = process.env.NEXT_PUBLIC_SMTP_AUTH_MECHANISM?.trim() || "Not configured";
  const [credentials, setCredentials] = useState<SMTPCredView[]>([]);
  const [domains, setDomains] = useState<DomainView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // New credential modal
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [credName, setCredName] = useState("");
  const [generatedCreds, setGeneratedCreds] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [credsRes, domainsRes] = await Promise.allSettled([
        api.listSMTPCredentials(),
        api.listDomains(),
      ]);
      const failedResources: string[] = [];
      if (credsRes.status === "fulfilled") {
        setCredentials(credsRes.value.data || []);
      } else {
        failedResources.push("SMTP credentials");
      }
      if (domainsRes.status === "fulfilled") {
        const domList = domainsRes.value.data || [];
        setDomains(domList);
        if (domList.length > 0 && !email) {
          setEmail("");
        }
      } else {
        failedResources.push("domains");
      }
      if (failedResources.length) {
        setLoadError(`Could not load ${failedResources.join(" and ")}.`);
      }
    } catch (err) {
      console.error("Failed to load SMTP credentials", err);
      setLoadError(err instanceof Error ? err.message : "Could not load SMTP data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createSMTPCredential(email.trim(), credName.trim() || undefined);
      setGeneratedCreds({
        username: res.username,
        password: res.password,
      });
      toast.success("SMTP credential generated");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to generate SMTP credential: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSMTPCredential(id);
      toast.success("SMTP credential revoked");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to delete credential: " + (err.response?.data?.message || err.message));
    }
  };

  const copyPassword = () => {
    if (!generatedCreds) return;
    navigator.clipboard.writeText(generatedCreds.password);
    setCopiedPass(true);
    toast.info("SMTP password copied to clipboard");
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            SMTP Credentials
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Connect standard mail clients, legacy applications, and web frameworks via SMTP over STARTTLS.
          </p>
        </div>

        <button
          onClick={() => {
            setGeneratedCreds(null);
            setIsOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Generate Password</span>
        </button>
      </div>

      {loadError && credentials.length > 0 && (
        <ErrorState message={loadError} onRetry={fetchData} />
      )}

      {/* SMTP Connection Details Card */}
      <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4">
        <h2 className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
          SMTP Server Connection Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase font-sans">
              Hostname
            </span>
            <span className="text-zinc-900 dark:text-white font-semibold">{smtpHost}</span>
          </div>
          <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase font-sans">
              Port
            </span>
            <span className="text-zinc-900 dark:text-white font-semibold">{smtpPort}</span>
          </div>
          <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase font-sans">
              Security
            </span>
            <span className="text-zinc-900 dark:text-white font-semibold">{smtpSecurity}</span>
          </div>
          <div className="rounded-lg border border-surface-border bg-surface-raised p-3">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase font-sans">
              Auth Mechanism
            </span>
            <span className="text-zinc-900 dark:text-white font-semibold">{smtpAuthMechanism}</span>
          </div>
        </div>
      </div>

      {/* Credentials Table */}
      {isLoading && credentials.length === 0 ? (
        <TableSkeleton rows={4} cols={5} />
      ) : loadError && credentials.length === 0 ? (
        <ErrorState message={loadError} onRetry={fetchData} />
      ) : (
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="border-b border-surface-border bg-surface-raised text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Username / From Address</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Last Used</th>
              <th className="px-5 py-3 text-right">Revoke</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border font-mono">
            {credentials.length > 0 ? (
              credentials.map((cred) => (
                <tr key={cred.id} className="hover:bg-surface-raised/40 transition-colors">
                  <td className="px-5 py-3 font-sans font-medium text-zinc-900 dark:text-white">
                    {cred.name || "Default Key"}
                  </td>
                  <td className="px-5 py-3 text-zinc-700 dark:text-zinc-300">{cred.username}</td>
                  <td className="px-5 py-3 text-zinc-400 dark:text-zinc-500 text-[11px]">
                    {new Date(cred.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3 text-zinc-400 dark:text-zinc-500 text-[11px]">
                    {cred.last_used_at
                      ? new Date(cred.last_used_at).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(cred.id)}
                      className="rounded p-1 text-zinc-400 hover:text-red-500 transition-colors"
                      title="Revoke credential"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                  No SMTP application passwords generated yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Nodemailer / Python Example Snippet */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Nodemailer Quick Start</h2>
        <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
          <code>{`import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

await transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: process.env.RECIPIENT_EMAIL,
  subject: process.env.EMAIL_SUBJECT,
  html: process.env.EMAIL_HTML,
});`}</code>
        </pre>
      </div>

      {/* Generate Credential Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="dialog-scroll relative flex flex-col w-full max-w-md rounded-xl border border-surface-border bg-surface p-6 shadow-2xl space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Generate SMTP Password</h2>

            {generatedCreds ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    Copy this SMTP password immediately. It will not be shown again.
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="rounded-lg border border-surface-border bg-surface-raised p-2.5">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase block font-sans">
                      Username
                    </span>
                    <span className="text-zinc-900 dark:text-white">{generatedCreds.username}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised p-2.5">
                    <div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase block font-sans">
                        Password
                      </span>
                      <span className="text-zinc-900 dark:text-white truncate block max-w-[240px]">
                        {generatedCreds.password}
                      </span>
                    </div>
                    <button
                      onClick={copyPassword}
                      className="rounded border border-surface-border bg-surface px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-surface-raised hover:text-zinc-900 dark:hover:text-white transition-colors"
                      title="Copy password"
                    >
                      {copiedPass ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setGeneratedCreds(null);
                    }}
                    className="btn-primary px-4 py-1.5 text-xs"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    Sender Email Address (Must belong to verified domain)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Sender email address on a verified domain"
                    required
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    Credential Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={credName}
                    onChange={(e) => setCredName(e.target.value)}
                    placeholder="e.g. WordPress Mailer, Discourse Forum"
                    className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
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
                    Generate Credentials
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Key, Mail, Lock, Building, User, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, connectWithKey } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "apikey">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else if (mode === "register") {
        await register(email, password, name, orgName);
      } else {
        await connectWithKey(apiKey);
      }
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black font-bold text-lg shadow-md">
            R
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {mode === "login"
              ? "Sign in to Resend"
              : mode === "register"
              ? "Create your account"
              : "Connect with API Key"}
          </h1>
          <p className="text-xs text-brand-400">
            {mode === "apikey"
              ? "Enter your secret API key to access this dashboard."
              : "Next generation transactional email platform."}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg border border-surface-border bg-surface p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 rounded py-1 text-center font-medium transition-colors ${
              mode === "login"
                ? "bg-surface-raised text-white shadow-sm"
                : "text-brand-500 hover:text-brand-300"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`flex-1 rounded py-1 text-center font-medium transition-colors ${
              mode === "register"
                ? "bg-surface-raised text-white shadow-sm"
                : "text-brand-500 hover:text-brand-300"
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("apikey");
              setError(null);
            }}
            className={`flex-1 rounded py-1 text-center font-medium transition-colors ${
              mode === "apikey"
                ? "bg-surface-raised text-white shadow-sm"
                : "text-brand-500 hover:text-brand-300"
            }`}
          >
            API Key
          </button>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-surface-border bg-surface p-6 shadow-xl space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "apikey" ? (
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  API Key or Session Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-500" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="re_live_••••••••••••••••"
                    required
                    className="w-full rounded-md border border-surface-border bg-surface-raised pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>
            ) : (
              <>
                {mode === "register" && (
                  <>
                    <div>
                      <label className="block text-[11px] text-brand-400 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-500" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Alex Developer"
                          required
                          className="w-full rounded-md border border-surface-border bg-surface-raised pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-brand-400 mb-1">
                        Organization / Team Name
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-500" />
                        <input
                          type="text"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="Acme Corp"
                          required
                          className="w-full rounded-md border border-surface-border bg-surface-raised pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] text-brand-400 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@resend.local"
                      required
                      className="w-full rounded-md border border-surface-border bg-surface-raised pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-brand-400 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full rounded-md border border-surface-border bg-surface-raised pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-1.5 rounded-md bg-white py-2 text-xs font-semibold text-black hover:bg-zinc-200 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
            >
              <span>{loading ? "Authenticating..." : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Connect"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {mode === "login" && (
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@resend.local");
                    setPassword("Password1234!");
                  }}
                  className="text-[11px] text-brand-400 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Quick Fill Local Test Credentials
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="text-center text-[11px] text-brand-500">
          Mailhost Engine running on <code className="text-brand-300">localhost:8080</code>
        </div>
      </div>
    </div>
  );
}

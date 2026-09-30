"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Key, Mail, Lock, Building, User, AlertCircle, ArrowRight, Loader2, Eye, EyeOff, Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { token, user, isLoading, login, register, connectWithKey } = useAuth();

  const [mode, setMode] = useState<"login" | "register" | "apikey">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("session_expired") === "1") {
        setNotice("Your session has expired or was revoked. Please sign in again.");
      } else if (params.get("logout") === "1") {
        setNotice("You have been signed out successfully.");
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading && token && user) {
      router.replace("/overview");
    }
  }, [isLoading, token, user, router]);

  if (!isLoading && token && user) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

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
      router.push("/overview");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4 animate-fade-in bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100/50 via-surface to-surface dark:from-zinc-900/20 dark:via-surface dark:to-surface relative">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="w-full max-w-sm space-y-8 z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-black font-bold text-xl shadow-lg">
            R
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            {mode === "login"
              ? "Sign in to Resend"
              : mode === "register"
              ? "Create your account"
              : "Connect with API Key"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === "apikey"
              ? "Enter your secret API key to access this dashboard."
              : "Next generation transactional email platform."}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl border border-surface-border bg-surface p-1.5 text-xs gap-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex-1 rounded-lg py-2 text-center font-medium transition-all ${
              mode === "login"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50"
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
            className={`flex-1 rounded-lg py-2 text-center font-medium transition-all ${
              mode === "register"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50"
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
            className={`flex-1 rounded-lg py-2 text-center font-medium transition-all ${
              mode === "apikey"
                ? "bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50"
            }`}
          >
            API Key
          </button>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-surface-border bg-surface p-8 shadow-2xl space-y-6">
          {notice && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-4 text-xs text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4 flex-shrink-0 text-amber-500 mt-0.5" />
              <span className="leading-relaxed">{notice}</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "apikey" ? (
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  API Key or Session Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="re_live_••••••••••••••••"
                    required
                    className="w-full rounded-lg border border-surface-border bg-surface-raised pl-10 pr-10 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:border-zinc-500 dark:focus:ring-white/10 font-mono transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <>
                {mode === "register" && (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Alex Developer"
                          required
                          className="w-full rounded-lg border border-surface-border bg-surface-raised pl-10 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:border-zinc-500 dark:focus:ring-white/10 transition-shadow"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                        Organization / Team Name
                      </label>
                      <div className="relative">
                        <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                        <input
                          type="text"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="Acme Corp"
                          required
                          className="w-full rounded-lg border border-surface-border bg-surface-raised pl-10 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:border-zinc-500 dark:focus:ring-white/10 transition-shadow"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@resend.local"
                      required
                      className="w-full rounded-lg border border-surface-border bg-surface-raised pl-10 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:border-zinc-500 dark:focus:ring-white/10 transition-shadow"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full rounded-lg border border-surface-border bg-surface-raised pl-10 pr-10 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:border-zinc-500 dark:focus:ring-white/10 transition-shadow"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 transition-all shadow-md"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Authenticating..." : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Connect"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>

            {mode === "login" && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@resend.local");
                    setPassword("Password1234!");
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors hover:underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-4"
                >
                  Quick Fill Local Test Credentials
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Mailhost Engine running on <code className="text-zinc-700 dark:text-zinc-300 font-mono">localhost:8080</code>
        </div>
      </div>
    </div>
  );
}

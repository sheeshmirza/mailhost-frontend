"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Key, Mail, Lock, Building, User, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState<"forgot" | "reset" | "verify" | "resend" | null>(null);
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

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
        await login(email.trim(), password);
      } else if (mode === "register") {
        if (password.length < 8 || password.length > 72) {
          throw new Error("Password must be between 8 and 72 characters.");
        }
        if (name.trim().length > 100) {
          throw new Error("Full name must be at most 100 characters.");
        }
        if (orgName.trim().length > 200) {
          throw new Error("Organization name must be at most 200 characters.");
        }
        await register(email.trim(), password, name.trim(), orgName.trim());
      } else {
        await connectWithKey(apiKey);
      }
      router.push("/overview");
    } catch (err: any) {
      setError(err.message || "Sign-in failed. Please check your email and password and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryMode) return;
    setError(null);
    setRecoveryMessage(null);
    setLoading(true);
    try {
      if (recoveryMode === "forgot") {
        const result = await api.forgotPassword(email.trim());
        setRecoveryMessage(result.message);
      } else if (recoveryMode === "reset") {
        if (recoveryPassword.length < 8 || recoveryPassword.length > 72) {
          throw new Error("New password must be between 8 and 72 characters.");
        }
        const result = await api.resetPassword(recoveryToken.trim(), recoveryPassword);
        setRecoveryMessage(result.message);
        setRecoveryPassword("");
        setRecoveryToken("");
      } else if (recoveryMode === "verify") {
        const result = await api.verifyEmail(recoveryToken.trim());
        setRecoveryMessage(result.message);
        setRecoveryToken("");
      } else {
        const result = await api.resendVerification(email.trim());
        setRecoveryMessage(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "The requested account action could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/70 via-surface to-surface p-4 py-8 animate-fade-in dark:from-teal-950/20 dark:via-surface dark:to-surface sm:py-10">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="z-10 w-full max-w-[420px] space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-2.5 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-800 text-lg font-bold text-white shadow-sm dark:bg-teal-300 dark:text-teal-950">
            M
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            {mode === "login"
              ? "Sign in to Mailhost"
              : mode === "register"
              ? "Create your account"
              : "Connect with API Key"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {mode === "apikey"
              ? "Enter your secret API key to access this dashboard."
              : "One simple home for all your business and marketing emails."}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex gap-1 rounded-lg border border-surface-border bg-surface p-1 shadow-sm">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`flex min-h-10 flex-1 items-center justify-center rounded-md px-2 text-[13px] font-medium transition-all ${
              mode === "login"
                ? "bg-teal-800 text-white shadow-sm dark:bg-teal-300 dark:text-teal-950"
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
            className={`flex min-h-10 flex-1 items-center justify-center rounded-md px-2 text-[13px] font-medium transition-all ${
              mode === "register"
                ? "bg-teal-800 text-white shadow-sm dark:bg-teal-300 dark:text-teal-950"
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
            className={`flex min-h-10 flex-1 items-center justify-center rounded-md px-2 text-[13px] font-medium transition-all ${
              mode === "apikey"
                ? "bg-teal-800 text-white shadow-sm dark:bg-teal-300 dark:text-teal-950"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/50"
            }`}
          >
            API Key
          </button>
        </div>

        {/* Form Card */}
        <div className="space-y-5 rounded-lg border border-surface-border bg-surface p-5 shadow-lg sm:p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {recoveryMode ? (
            <form onSubmit={handleRecovery} className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-content-primary">
                  {recoveryMode === "forgot" ? "Reset your password" : recoveryMode === "reset" ? "Choose a new password" : recoveryMode === "verify" ? "Verify your email" : "Resend verification email"}
                </h2>
                <p className="mt-1 text-xs text-content-muted">
                  {recoveryMode === "forgot"
                    ? "We’ll send a reset link if an account exists for that address."
                    : recoveryMode === "reset"
                      ? "Enter the reset token from your email and a new password."
                      : recoveryMode === "verify"
                        ? "Paste the verification token from your email."
                        : "We’ll send a new verification link if your account needs one."}
                </p>
              </div>
              {(recoveryMode === "forgot" || recoveryMode === "resend") && (
                <label className="block text-xs font-medium text-content-secondary">
                  Email address
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="input-base mt-1" autoComplete="email" />
                </label>
              )}
              {(recoveryMode === "verify" || recoveryMode === "reset") && (
                <label className="block text-xs font-medium text-content-secondary">
                  {recoveryMode === "verify" ? "Verification token" : "Password reset token"}
                  <input value={recoveryToken} onChange={(event) => setRecoveryToken(event.target.value)} required className="input-base mt-1 font-mono" autoComplete="one-time-code" />
                </label>
              )}
              {recoveryMode === "reset" && (
                <label className="block text-xs font-medium text-content-secondary">
                  New password
                  <input type="password" value={recoveryPassword} onChange={(event) => setRecoveryPassword(event.target.value)} required minLength={8} maxLength={72} className="input-base mt-1" autoComplete="new-password" />
                </label>
              )}
              {recoveryMessage && <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">{recoveryMessage}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => { setRecoveryMode(null); setRecoveryMessage(null); setError(null); }} className="btn-secondary flex-1">Back to sign in</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? "Please wait..." : "Continue"}</button>
              </div>
            </form>
          ) : (
          <>
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "apikey" ? (
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  API Key or Session Token
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key or session token"
                    required
                    className="w-full rounded-lg border border-surface-border bg-surface-raised pl-10 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:border-zinc-500 dark:focus:ring-white/10 font-mono transition-shadow"
                  />
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
                          placeholder="Full name"
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
                          placeholder="Organization name"
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
                      placeholder="Email address"
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
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full rounded-lg border border-surface-border bg-surface-raised pl-10 pr-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:focus:border-zinc-500 dark:focus:ring-white/10 transition-shadow"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{loading ? "Signing in..." : mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Connect"}</span>
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
          {mode === "login" && (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-surface-border pt-4 text-xs">
              <button type="button" onClick={() => { setRecoveryMode("forgot"); setRecoveryMessage(null); }} className="text-content-muted hover:text-content-primary">Forgot password?</button>
              <button type="button" onClick={() => { setRecoveryMode("resend"); setRecoveryMessage(null); }} className="text-content-muted hover:text-content-primary">Resend verification</button>
              <button type="button" onClick={() => { setRecoveryMode("verify"); setRecoveryMessage(null); }} className="text-content-muted hover:text-content-primary">Verify email</button>
              <button type="button" onClick={() => { setRecoveryMode("reset"); setRecoveryMessage(null); }} className="text-content-muted hover:text-content-primary">Reset with code</button>
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}

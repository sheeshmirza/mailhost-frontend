"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import {
  api,
  OrgMemberView,
  UserSession,
} from "@/lib/api";
import {
  Settings,
  User,
  Users,
  Building,
  Key,
  Lock,
  Bot,
  Trash2,
  Plus,
  Shield,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { TableSkeleton } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";

const formatSessionTime = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
};

export default function SettingsPage() {
  const { user, account, accounts, credentialType, refresh, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "profile" | "team" | "sessions" | "mcp"
  >("profile");

  // Loading & Error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile fields
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSaved, setProfileSaved] = useState(false);

  // Email fields
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailSaved, setEmailSaved] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passSaved, setPassSaved] = useState(false);

  // Team fields
  const [members, setMembers] = useState<OrgMemberView[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("developer");
  const [newOrgName, setNewOrgName] = useState("");

  // Sessions
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);

  // MCP Snippet
  const [copiedMcp, setCopiedMcp] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    fetchTeamAndSessions();
  }, [user, credentialType]);

  const fetchTeamAndSessions = async () => {
    setIsLoading(true);
    setError(null);
    setSessionsError(null);
    try {
      const [membersRes, sessionsRes] = await Promise.allSettled([
        api.listMembers(),
        credentialType === "user"
          ? api.listSessions()
          : Promise.resolve({ data: [] as UserSession[] }),
      ]);
      let hasSuccess = false;
      if (membersRes.status === "fulfilled") {
        setMembers(membersRes.value.data || []);
        hasSuccess = true;
      }
      if (sessionsRes.status === "fulfilled") {
        setSessions(sessionsRes.value.data || []);
        hasSuccess = true;
      } else {
        setSessionsError(
          sessionsRes.reason instanceof Error
            ? sessionsRes.reason.message
            : "Could not load active sessions."
        );
      }
      if (!hasSuccess && (membersRes.status === "rejected" || sessionsRes.status === "rejected")) {
        const reason = (membersRes.status === "rejected" ? (membersRes as PromiseRejectedResult).reason : (sessionsRes as PromiseRejectedResult).reason)?.message || "Failed to load settings data";
        setError(reason);
      }
    } catch (err: any) {
      console.error("Failed to load settings data", err);
      setError(err?.message || "Failed to load settings data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateCurrentUser({ name: name.trim() });
      setProfileSaved(true);
      toast.success("Profile updated successfully");
      setTimeout(() => setProfileSaved(false), 2500);
      refresh();
    } catch (err: any) {
      toast.error("Failed to update profile: " + (err.response?.data?.message || err.message));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPassSaved(true);
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed successfully");
      setTimeout(() => setPassSaved(false), 2500);
      await fetchTeamAndSessions();
    } catch (err: any) {
      toast.error("Failed to change password: " + (err.response?.data?.message || err.message));
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.changeEmail(newEmail.trim(), emailPassword);
      setEmailSaved(true);
      setEmail(newEmail.trim());
      setNewEmail("");
      setEmailPassword("");
      toast.success("Email changed successfully");
      setTimeout(() => setEmailSaved(false), 2500);
      refresh();
    } catch (err: any) {
      toast.error("Failed to change email: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      await api.createAccount(newOrgName.trim());
      setNewOrgName("");
      refresh();
      toast.success(`Organization "${newOrgName.trim()}" created! You can switch to it from the top navbar.`);
    } catch (err: any) {
      toast.error("Failed to create organization: " + (err.response?.data?.message || err.message));
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addMember(newMemberEmail.trim(), newMemberRole);
      toast.success(`Member invited: ${newMemberEmail.trim()}`);
      setNewMemberEmail("");
      fetchTeamAndSessions();
    } catch (err: any) {
      toast.error("Failed to add member: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      await api.removeMember(id);
      toast.success("Member removed");
      fetchTeamAndSessions();
    } catch (err: any) {
      toast.error("Failed to remove member: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRevokeSession = async (id: string) => {
    if (revokingSessionId) return;
    const session = sessions.find((item) => item.id === id);
    if (!confirm(session?.is_current
      ? "This is your current session. Revoking it will sign you out. Continue?"
      : "Revoke this session? The device will need to sign in again.")) return;
    if (session?.is_current) {
      await logout();
      return;
    }
    setRevokingSessionId(id);
    try {
      await api.revokeSession(id);
      toast.success("Session revoked");
      await fetchTeamAndSessions();
    } catch (err) {
      toast.error("Failed to revoke session: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (isRevokingOthers || !confirm("Sign out all other devices? Your current session will remain active.")) return;
    setIsRevokingOthers(true);
    try {
      const result = await api.revokeAllOtherSessions();
      toast.success("Other sessions revoked", `${result.revoked} session${result.revoked === 1 ? "" : "s"} signed out.`);
      await fetchTeamAndSessions();
    } catch (err) {
      toast.error("Failed to revoke other sessions: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsRevokingOthers(false);
    }
  };

  const mcpConfig = `{
  "mcpServers": {
    "mailhost": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "https://api.resend.com/mcp"
      ],
      "env": {
        "AUTHORIZATION": "Bearer YOUR_API_KEY"
      }
    }
  }
}`;

  const copyMcpConfig = () => {
    navigator.clipboard.writeText(mcpConfig);
    setCopiedMcp(true);
    toast.info("MCP config copied to clipboard");
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Settings & Team
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your user account, organizations, teammates, and remote AI MCP server.
          </p>
        </div>
        <button
          onClick={fetchTeamAndSessions}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-500 hover:bg-surface-raised hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
          title="Refresh Settings"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tab switch */}
      <div className="flex gap-6 border-b border-surface-border">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "profile"
              ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <User className="h-4 w-4" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab("team")}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "team"
              ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Team</span>
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "sessions"
              ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <Lock className="h-4 w-4" />
          <span>Security</span>
        </button>
        <button
          onClick={() => setActiveTab("mcp")}
          className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "mcp"
              ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>AI MCP</span>
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-5">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Your Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-lg border border-surface-border bg-surface-raised/50 px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 focus:outline-none cursor-not-allowed"
                />
                <span className="text-xs text-zinc-500 mt-1.5 block">
                  Email is verified with primary account credentials.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {profileSaved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Update Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Change Email Address */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-5">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Change Email Address</h2>
            <form onSubmit={handleChangeEmail} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="newemail@example.com"
                  required
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Current Password (to confirm)
                </label>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {emailSaved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span>Email Changed!</span>
                    </>
                  ) : (
                    <span>Change Email</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Team & Organizations */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Active Org Info & Create Org */}
          <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Organizations & Teams</h2>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500 dark:text-zinc-400">Current Active Organization:</span>
              <span className="font-semibold text-zinc-900 dark:text-white font-mono bg-surface-raised px-2 py-0.5 rounded border border-surface-border">
                {account?.name || "Acme Corp"} ({account?.role || "administrator"})
              </span>
            </div>

            <form onSubmit={handleCreateOrg} className="pt-2 border-t border-surface-border flex gap-2">
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="New Organization Name (e.g. Staging Team)"
                className="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
              />
              <button
                type="submit"
                className="btn-primary"
              >
                Create Team
              </button>
            </form>
          </div>

          {/* Members Table */}
          <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Team Members</h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                {members.length} member(s)
              </span>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
              >
                <option value="administrator">Administrator</option>
                <option value="developer">Developer</option>
                <option value="user">User</option>
              </select>
              <button
                type="submit"
                className="btn-primary"
              >
                Invite Member
              </button>
            </form>

            {error ? (
              <ErrorState message={error} onRetry={fetchTeamAndSessions} />
            ) : isLoading && members.length === 0 ? (
              <TableSkeleton rows={3} cols={4} />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-surface-border">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="border-b border-surface-border bg-surface-raised text-[10px] uppercase font-mono text-zinc-500 dark:text-zinc-400">
                    <tr>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">Role</th>
                      <th className="px-4 py-2.5">Joined</th>
                      <th className="px-4 py-2.5 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border font-mono">
                    {members.length > 0 ? (
                      members.map((m) => (
                        <tr key={m.id} className="hover:bg-surface-raised/40 transition-colors">
                          <td className="px-4 py-2.5 text-zinc-900 dark:text-white">{m.email}</td>
                          <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300 capitalize font-sans">{m.role}</td>
                          <td className="px-4 py-2.5 text-zinc-400 dark:text-zinc-500 text-[11px]">
                            {new Date(m.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              className="text-zinc-400 hover:text-red-500 transition-colors"
                              title="Remove member"
                            >
                              <Trash2 className="h-3.5 w-3.5 ml-auto" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-xs text-zinc-500 dark:text-zinc-400 font-sans">
                          No team members found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Security & Sessions */}
      {activeTab === "sessions" && (
        credentialType === "api_key" ? (
          <div role="status" className="flex flex-col items-start gap-3 rounded-lg border border-surface-border bg-surface p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-white">
              <Key className="h-4 w-4 text-teal-700 dark:text-teal-300" />
              User sessions are unavailable for API-key access
            </div>
            <p className="max-w-2xl text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Sign in with your email and password to change your password or manage active browser sessions.
            </p>
            <button onClick={logout} className="btn-secondary">Sign out</button>
          </div>
        ) : (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
              >
                {passSaved ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Password Updated!</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          </div>

          {/* Active Sessions */}
          <div className="space-y-4 rounded-lg border border-surface-border bg-surface p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Active Sessions</h2>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Review signed-in devices and revoke access you no longer recognize.</p>
              </div>
              <button
                onClick={handleRevokeOtherSessions}
                disabled={isRevokingOthers || isLoading || !!sessionsError || !sessions.some((session) => !session.is_current)}
                className="btn-secondary shrink-0"
              >
                {isRevokingOthers ? "Revoking..." : "Sign out other devices"}
              </button>
            </div>
            {sessionsError ? (
              <ErrorState message={sessionsError} onRetry={fetchTeamAndSessions} />
            ) : isLoading && sessions.length === 0 ? (
              <TableSkeleton rows={3} cols={4} />
            ) : sessions.length === 0 ? (
              <div className="rounded-md bg-surface-raised px-4 py-8 text-center">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">No active sessions</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Sessions created by signing in will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {sessions.map((session) => (
                  <article key={session.id} className="grid gap-4 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(110px,1fr))_auto] sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-subtle text-content-muted">
                        <Shield className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13px] font-semibold text-content-primary">
                            {session.is_current ? "Current session" : "Other session"}
                          </span>
                          {session.is_current && <span className="badge badge-success">This device</span>}
                        </div>
                        <p title={session.id} className="mt-0.5 truncate font-mono text-[11px] text-content-subtle">
                          ID ending {session.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:contents">
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-content-subtle">Created</p>
                        <p className="mt-1 text-xs text-content-secondary">{formatSessionTime(session.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-content-subtle">Last active</p>
                        <p className="mt-1 text-xs text-content-secondary">{formatSessionTime(session.last_used_at)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase text-content-subtle">Expires</p>
                        <p className="mt-1 text-xs text-content-secondary">{formatSessionTime(session.expires_at)}</p>
                      </div>
                    </div>
                    <div className="flex justify-end sm:pl-2">
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={revokingSessionId !== null}
                        className="btn-danger min-h-8 px-2 py-1"
                      >
                        {revokingSessionId === session.id ? "Revoking..." : session.is_current ? "Sign out" : "Revoke"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
        )
      )}

      {/* Tab 4: AI & MCP Server */}
      {activeTab === "mcp" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Remote Model Context Protocol (MCP)</h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Mailhost provides a built-in remote MCP server at <code className="text-zinc-900 dark:text-white font-mono bg-surface-raised px-1 py-0.5 rounded border border-surface-border">https://api.resend.com/mcp</code>. AI agents (like Claude Desktop, Antigravity, and Cursor) can directly draft, dispatch, track, and inspect emails autonomously.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase font-mono text-zinc-500 dark:text-zinc-400">
                  Claude Desktop Configuration (claude_desktop_config.json)
                </span>
                <button
                  onClick={copyMcpConfig}
                  className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                >
                  {copiedMcp ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Config</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto">
                <code>{mcpConfig}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

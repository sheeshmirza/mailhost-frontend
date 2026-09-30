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

export default function SettingsPage() {
  const { user, account, accounts, refresh } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "profile" | "team" | "sessions" | "mcp"
  >("profile");

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

  // MCP Snippet
  const [copiedMcp, setCopiedMcp] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
    fetchTeamAndSessions();
  }, [user]);

  const fetchTeamAndSessions = async () => {
    try {
      const [membersRes, sessionsRes] = await Promise.allSettled([
        api.listMembers(),
        api.listSessions(),
      ]);
      if (membersRes.status === "fulfilled") {
        setMembers(membersRes.value.data || []);
      }
      if (sessionsRes.status === "fulfilled") {
        setSessions(sessionsRes.value.data || []);
      }
    } catch (err: any) {
      console.error("Failed to load settings data", err);
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
    try {
      await api.revokeSession(id);
      toast.success("Session revoked");
      fetchTeamAndSessions();
    } catch (err: any) {
      toast.error("Failed to revoke session: " + (err.response?.data?.message || err.message));
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
                  {members.map((m) => (
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Sessions */}
      {activeTab === "sessions" && (
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
          <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Active Sessions</h2>
            <div className="overflow-x-auto rounded-lg border border-surface-border">
              <table className="w-full text-left text-xs font-mono min-w-[500px]">
                <thead className="border-b border-surface-border bg-surface-raised text-[10px] uppercase text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-2.5">Session ID</th>
                    <th className="px-4 py-2.5">Created</th>
                    <th className="px-4 py-2.5">Expires</th>
                    <th className="px-4 py-2.5 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="px-4 py-2.5 text-zinc-900 dark:text-white truncate max-w-xs">{s.id}</td>
                      <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400 text-[11px]">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-400 dark:text-zinc-500 text-[11px]">
                        {new Date(s.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          className="text-zinc-500 hover:text-red-500 font-sans transition-colors"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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

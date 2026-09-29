"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
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

  const [activeTab, setActiveTab] = useState<
    "profile" | "team" | "sessions" | "mcp"
  >("profile");

  // Profile fields
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileSaved, setProfileSaved] = useState(false);

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
    } catch (err) {
      console.error("Failed to load settings data", err);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateCurrentUser({ name: name.trim() });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      refresh();
    } catch (err: any) {
      alert("Failed to update profile: " + err.message);
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
      setTimeout(() => setPassSaved(false), 2500);
    } catch (err: any) {
      alert("Failed to change password: " + err.message);
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      await api.createAccount(newOrgName.trim());
      setNewOrgName("");
      refresh();
      alert("Organization created successfully! You can switch to it from the top navbar.");
    } catch (err: any) {
      alert("Failed to create organization: " + err.message);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addMember(newMemberEmail.trim(), newMemberRole);
      setNewMemberEmail("");
      fetchTeamAndSessions();
    } catch (err: any) {
      alert("Failed to add member: " + err.message);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    try {
      await api.removeMember(id);
      fetchTeamAndSessions();
    } catch (err: any) {
      alert("Failed to remove member: " + err.message);
    }
  };

  const handleRevokeSession = async (id: string) => {
    try {
      await api.revokeSession(id);
      fetchTeamAndSessions();
    } catch (err: any) {
      alert("Failed to revoke session: " + err.message);
    }
  };

  const mcpConfig = `{
  "mcpServers": {
    "mailhost": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-fetch",
        "http://localhost:8080/mcp"
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
    setTimeout(() => setCopiedMcp(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Settings & Team
          </h1>
          <p className="text-xs text-brand-400 mt-1">
            Manage your user account, organizations, teammates, and remote AI MCP server.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-md border border-surface-border bg-surface p-0.5">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-surface-raised text-white shadow-sm"
                : "text-brand-500 hover:text-brand-300"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "team"
                ? "bg-surface-raised text-white shadow-sm"
                : "text-brand-500 hover:text-brand-300"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Team</span>
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "sessions"
                ? "bg-surface-raised text-white shadow-sm"
                : "text-brand-500 hover:text-brand-300"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Security</span>
          </button>
          <button
            onClick={() => setActiveTab("mcp")}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === "mcp"
                ? "bg-surface-raised text-white shadow-sm"
                : "text-brand-500 hover:text-brand-300"
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>AI MCP</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">Your Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-md border border-surface-border bg-surface-raised/50 px-3 py-1.5 text-xs text-brand-400 focus:outline-none cursor-not-allowed"
                />
                <span className="text-[10px] text-brand-500 mt-1 block">
                  Email is verified with primary account credentials.
                </span>
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
              >
                {profileSaved ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Update Profile</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Team & Organizations */}
      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Active Org Info & Create Org */}
          <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">Organizations & Teams</h2>
            <div className="flex items-center justify-between text-xs">
              <span className="text-brand-400">Current Active Organization:</span>
              <span className="font-semibold text-white font-mono bg-surface-raised px-2 py-0.5 rounded border border-surface-border">
                {account?.name || "Acme Corp"} ({account?.role || "administrator"})
              </span>
            </div>

            <form onSubmit={handleCreateOrg} className="pt-2 border-t border-surface-border flex gap-2">
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="New Organization Name (e.g. Staging Team)"
                className="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <button
                type="submit"
                className="rounded bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
              >
                Create Team
              </button>
            </form>
          </div>

          {/* Members Table */}
          <div className="rounded-xl border border-surface-border bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Team Members</h2>
              <span className="text-xs text-brand-500 font-mono">
                {members.length} member(s)
              </span>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleAddMember} className="flex gap-2">
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                className="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="administrator">Administrator</option>
                <option value="developer">Developer</option>
                <option value="user">User</option>
              </select>
              <button
                type="submit"
                className="rounded bg-white px-3.5 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
              >
                Invite Member
              </button>
            </form>

            <div className="overflow-hidden rounded-lg border border-surface-border">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-surface-border bg-surface-raised text-[10px] uppercase font-mono text-brand-400">
                  <tr>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5">Joined</th>
                    <th className="px-4 py-2.5 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border font-mono">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-surface-raised/40">
                      <td className="px-4 py-2.5 text-white">{m.email}</td>
                      <td className="px-4 py-2.5 text-brand-300 capitalize font-sans">{m.role}</td>
                      <td className="px-4 py-2.5 text-brand-500 text-[11px]">
                        {new Date(m.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="text-brand-500 hover:text-red-400"
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
            <h2 className="text-sm font-semibold text-white">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-brand-400 mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="flex items-center gap-1.5 rounded bg-white px-4 py-1.5 text-xs font-medium text-black hover:bg-zinc-200"
              >
                {passSaved ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
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
            <h2 className="text-sm font-semibold text-white">Active Sessions</h2>
            <div className="overflow-hidden rounded-lg border border-surface-border">
              <table className="w-full text-left text-xs font-mono">
                <thead className="border-b border-surface-border bg-surface-raised text-[10px] uppercase text-brand-400">
                  <tr>
                    <th className="px-4 py-2.5">Session ID</th>
                    <th className="px-4 py-2.5">Created</th>
                    <th className="px-4 py-2.5">Expires</th>
                    <th className="px-4 py-2.5 text-right">Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-surface-raised/40">
                      <td className="px-4 py-2.5 text-white truncate max-w-xs">{s.id}</td>
                      <td className="px-4 py-2.5 text-brand-400 text-[11px]">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-brand-500 text-[11px]">
                        {new Date(s.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleRevokeSession(s.id)}
                          className="text-brand-500 hover:text-red-400 font-sans"
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
              <Bot className="h-5 w-5 text-purple-400" />
              <h2 className="text-base font-semibold text-white">Remote Model Context Protocol (MCP)</h2>
            </div>
            <p className="text-xs text-brand-400 leading-relaxed">
              Mailhost exposes a built-in remote MCP server at <code className="text-white font-mono bg-surface-raised px-1 py-0.5 rounded">http://localhost:8080/mcp</code>. AI agents (like Claude Desktop, Antigravity, and Cursor) can directly draft, dispatch, track, and inspect emails autonomously.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase font-mono text-brand-400">
                  Claude Desktop Configuration (claude_desktop_config.json)
                </span>
                <button
                  onClick={copyMcpConfig}
                  className="flex items-center gap-1 text-xs text-brand-400 hover:text-white"
                >
                  {copiedMcp ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Config</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="rounded-lg border border-surface-border bg-surface-raised p-4 font-mono text-xs text-brand-200 overflow-x-auto">
                <code>{mcpConfig}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  LogOut,
  Database,
  Building,
  Download,
  Users,
  FileText,
  X,
  Check,
  Trash2,
  UserPlus,
} from "lucide-react";
import CommandCenter from "./components/CommandCenter";
import BusinessMetrics from "./components/BusinessMetrics";
import SocialMediaHub from "./components/SocialMediaHub";
import MetaAdsManager from "./components/MetaAdsManager";
import Subscriptions from "./components/Subscriptions";
import SupportCenter from "./components/SupportCenter";
import NexoraVoiceBridge from "./components/NexoraVoiceBridge";
import { StatusDot } from "./components/ui";

type CurrentUser = {
  user: { id: string; email: string; name: string | null };
  organization: { id: string; name: string };
  role: string;
};

type TeamMember = {
  membershipId: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  joinedAt: string;
};

type BriefingData = {
  headline: string;
  generatedAt: string;
  kpis: {
    mrr: string;
    mrrDelta: string;
    arr: string;
    activeUsers: string;
    activeSubscribers: string;
    churnRate: string;
    adSpend: string;
    adRoas: string;
  };
  criticalAttention: {
    urgentTicketsCount: number;
    urgentTickets: Array<{ id: string; subject: string; requester: string }>;
    broadcastsReady: number;
    topPerformingCampaign: string;
  };
  recommendedActions: string[];
  markdownText: string;
};

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Team & RBAC Modal State
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"ADMIN" | "MANAGER" | "VIEWER">("VIEWER");
  const [invitingMember, setInvitingMember] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);

  // Executive Briefing Modal State
  const [showBriefingModal, setShowBriefingModal] = useState(false);
  const [briefingData, setBriefingData] = useState<BriefingData | null>(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [briefingCopied, setBriefingCopied] = useState(false);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTeamMembers(json.data.members);
        }
      }
    } catch (err) {
      console.error("Failed to load team members", err);
    }
  }, []);

  const fetchBriefing = useCallback(async () => {
    try {
      setLoadingBriefing(true);
      const res = await fetch("/api/reports/briefing");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setBriefingData(json.data.briefing);
        }
      }
    } catch (err) {
      console.error("Failed to load briefing", err);
    } finally {
      setLoadingBriefing(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCurrentUser(json.data);
        }
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleSeedDemoData() {
    setSeeding(true);
    setNotification(null);
    try {
      const res = await fetch("/api/auth/demo-seed", { method: "POST" });
      if (res.ok) {
        setNotification("Verified sample business records synced to your database.");
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      console.error("Seeding error", err);
    } finally {
      setSeeding(false);
    }
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      const res = await fetch("/api/export/csv");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `jarvis-executive-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error", err);
    } finally {
      setExporting(false);
    }
  }

  async function handleInviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newMemberEmail.trim() || invitingMember) return;
    setInvitingMember(true);
    setTeamError(null);

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          role: newMemberRole,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to invite member");

      setNewMemberEmail("");
      await fetchTeamMembers();
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : "Failed to invite member");
    } finally {
      setInvitingMember(false);
    }
  }

  async function handleRemoveMember(membershipId: string) {
    try {
      const res = await fetch(`/api/team/${membershipId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTeamMembers();
      }
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  }

  async function handleChangeRole(membershipId: string, role: string) {
    try {
      const res = await fetch(`/api/team/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        await fetchTeamMembers();
      }
    } catch (err) {
      console.error("Failed to change role", err);
    }
  }

  function handleCopyBriefing() {
    if (!briefingData?.markdownText) return;
    navigator.clipboard.writeText(briefingData.markdownText);
    setBriefingCopied(true);
    setTimeout(() => setBriefingCopied(false), 2000);
  }

  return (
    <main className="relative min-h-screen">
      <div className="ambient-glow" />
      <div className="hud-grid" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-slate-100">
                  JARVIS <span className="text-slate-500">/ lite</span>
                </h1>
                {currentUser?.organization && (
                  <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-slate-300">
                    <Building className="h-3 w-3 text-cyan-400" />
                    {currentUser.organization.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {currentUser?.user?.email
                  ? `Authenticated as ${currentUser.user.name || currentUser.user.email} (${currentUser.role})`
                  : "Production Executive Command Center"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5" />
              {seeding ? "Syncing DB..." : "Seed Starter DB Records"}
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting}
              title="Download full business report CSV"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-cyan-300 disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5 text-cyan-400" />
              {exporting ? "Generating CSV..." : "Export CSV"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowBriefingModal(true);
                fetchBriefing();
              }}
              title="View Executive Morning Briefing"
              className="flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-400/10 px-3.5 py-1.5 text-xs font-medium text-violet-300 transition hover:bg-violet-400/20"
            >
              <FileText className="h-3.5 w-3.5" />
              Executive Briefing
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTeamModal(true);
                fetchTeamMembers();
              }}
              title="Manage Organization Team & Roles"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-cyan-300"
            >
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              Team & RBAC
            </button>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-xl">
              <StatusDot tone="emerald" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300">
                DB CONNECTED
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-slate-200 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {notification && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
            {notification}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
          <div className="md:col-span-2 lg:col-span-12">
            <NexoraVoiceBridge />
          </div>

          <div className="md:col-span-2 lg:col-span-7">
            <CommandCenter />
          </div>
          <div className="md:col-span-2 lg:col-span-5">
            <BusinessMetrics />
          </div>

          <div className="lg:col-span-6">
            <SocialMediaHub />
          </div>
          <div className="lg:col-span-6">
            <MetaAdsManager />
          </div>

          <div className="lg:col-span-6">
            <Subscriptions />
          </div>
          <div className="lg:col-span-6">
            <SupportCenter />
          </div>
        </div>

        <footer className="mt-8 text-center font-mono text-[11px] text-slate-600">
          Jarvis Lite Executive Operating System — Connected to Prisma SQLite Database.
        </footer>
      </div>

      {/* Team & RBAC Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Team Members & Access Control (RBAC)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {teamError && (
              <div className="mb-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
                {teamError}
              </div>
            )}

            {/* Invite Form */}
            <form onSubmit={handleInviteMember} className="mb-5 flex gap-2">
              <input
                type="email"
                required
                placeholder="colleague@company.io"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value as "ADMIN" | "MANAGER" | "VIEWER")}
                className="rounded-xl border border-white/10 bg-slate-900 px-2 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                type="submit"
                disabled={invitingMember || !newMemberEmail.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40 transition"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {invitingMember ? "Inviting..." : "Invite"}
              </button>
            </form>

            {/* Member List */}
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {teamMembers.map((member) => (
                <div
                  key={member.membershipId}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-200">{member.name}</p>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                          member.role === "OWNER"
                            ? "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                            : member.role === "ADMIN"
                            ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20"
                            : member.role === "MANAGER"
                            ? "bg-violet-400/10 text-violet-300 border border-violet-400/20"
                            : "bg-slate-400/10 text-slate-400 border border-white/10"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-500">{member.email}</p>
                  </div>

                  {member.role !== "OWNER" && (
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.membershipId, e.target.value)}
                        className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.membershipId)}
                        title="Remove member"
                        className="rounded p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowTeamModal(false)}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Executive Morning Briefing Modal */}
      {showBriefingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-slate-100">
                  Executive Morning Intelligence Briefing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBriefingModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingBriefing ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Compiling multi-channel operational intelligence...
              </div>
            ) : briefingData ? (
              <div className="space-y-4">
                {/* KPI Highlights */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
                    <p className="text-[10px] text-slate-500">MRR</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-slate-100">
                      {briefingData.kpis.mrr}
                    </p>
                    <p className="text-[10px] text-emerald-400">{briefingData.kpis.mrrDelta}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
                    <p className="text-[10px] text-slate-500">Active Users</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-slate-100">
                      {briefingData.kpis.activeUsers}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
                    <p className="text-[10px] text-slate-500">Ad ROAS</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-cyan-300">
                      {briefingData.kpis.adRoas}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-center">
                    <p className="text-[10px] text-slate-500">Churn</p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-slate-300">
                      {briefingData.kpis.churnRate}
                    </p>
                  </div>
                </div>

                {/* Strategic Actions */}
                <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
                  <p className="mb-2 text-xs font-semibold text-violet-300">
                    Recommended Strategic Priorities Today:
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {briefingData.recommendedActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-violet-400 font-bold">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Critical Attention Details */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-400 space-y-1">
                  <p>
                    <strong className="text-slate-300">Critical Tickets:</strong>{" "}
                    {briefingData.criticalAttention.urgentTicketsCount} open{" "}
                    {briefingData.criticalAttention.urgentTickets.map((t) => t.id).join(", ")}
                  </p>
                  <p>
                    <strong className="text-slate-300">Social Queue:</strong>{" "}
                    {briefingData.criticalAttention.broadcastsReady} broadcast(s) ready
                  </p>
                  <p>
                    <strong className="text-slate-300">Top Performing Ad:</strong>{" "}
                    {briefingData.criticalAttention.topPerformingCampaign}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleCopyBriefing}
                    className="flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition"
                  >
                    {briefingCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5" />
                        Copy Executive Summary
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBriefingModal(false)}
                    className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/10"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}

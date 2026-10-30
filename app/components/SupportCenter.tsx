"use client";

import { useEffect, useState, useCallback } from "react";
import { LifeBuoy, Plus, RefreshCw, X, Search, ShieldCheck, Play, Unplug } from "lucide-react";
import { CardHeader, GlassCard } from "./ui";

type Ticket = {
  id: string;
  dbId: string;
  subject: string;
  requester: string;
  priority: "High" | "Medium" | "Low";
  status: "Open" | "In progress" | "Resolved" | "Closed";
  time: string;
};

const priorityTint: Record<string, string> = {
  High: "bg-rose-400/10 text-rose-300",
  Medium: "bg-amber-400/10 text-amber-300",
  Low: "bg-slate-400/10 text-slate-400",
};

const statusTint: Record<string, string> = {
  Open: "bg-cyan-400/10 text-cyan-300",
  "In progress": "bg-amber-400/10 text-amber-300",
  Resolved: "bg-emerald-400/10 text-emerald-300",
  Closed: "bg-slate-400/10 text-slate-400",
};

export default function SupportCenter() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [priority, setPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [submitting, setSubmitting] = useState(false);

  // Helpdesk modal state
  const [helpdeskProvider, setHelpdeskProvider] = useState<"ZENDESK" | "INTERCOM" | "FRESHDESK">("ZENDESK");
  const [subdomain, setSubdomain] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [testingSync, setTestingSync] = useState(false);
  const [helpdeskMessage, setHelpdeskMessage] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const url = search.trim()
        ? `/api/support/tickets?q=${encodeURIComponent(search.trim())}`
        : "/api/support/tickets";
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setTickets(json.data.tickets);
        }
      }
    } catch (err) {
      console.error("Failed to load tickets", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !requesterEmail.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          requesterEmail: requesterEmail.trim(),
          priority,
          status: "OPEN",
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setSubject("");
        setRequesterEmail("");
        await fetchTickets();
      }
    } catch (err) {
      console.error("Failed to create ticket", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(ticket: Ticket) {
    const nextStatus = ticket.status === "Resolved" ? "OPEN" : "RESOLVED";
    try {
      const res = await fetch(`/api/support/tickets/${ticket.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        await fetchTickets();
      }
    } catch (err) {
      console.error("Failed to toggle ticket status", err);
    }
  }

  async function handleSaveHelpdesk(e: React.FormEvent) {
    e.preventDefault();
    setSavingIntegration(true);
    setHelpdeskMessage(null);

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: helpdeskProvider,
          apiKey: apiToken.trim() || undefined,
          subdomain: subdomain.trim() || undefined,
          status: "CONNECTED",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save integration");

      setHelpdeskMessage(`✅ ${helpdeskProvider} connected and authenticated.`);
      setApiToken("");
      setSubdomain("");
    } catch (err) {
      setHelpdeskMessage(err instanceof Error ? `❌ ${err.message}` : "Failed to connect helpdesk");
    } finally {
      setSavingIntegration(false);
    }
  }

  async function handleTestHelpdeskSync() {
    setTestingSync(true);
    setHelpdeskMessage(null);

    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: helpdeskProvider }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Sync test failed");

      setHelpdeskMessage(`⚡ Ticket ingestion verified! Ingested live support ticket from ${helpdeskProvider}.`);
      await fetchTickets();
    } catch (err) {
      setHelpdeskMessage(err instanceof Error ? `❌ ${err.message}` : "Sync test failed");
    } finally {
      setTestingSync(false);
    }
  }

  async function handleDisconnectHelpdesk() {
    try {
      await fetch(`/api/integrations?provider=${helpdeskProvider}`, { method: "DELETE" });
      setHelpdeskMessage(`${helpdeskProvider} disconnected.`);
    } catch (err) {
      console.error("Disconnect error", err);
    }
  }

  return (
    <>
      <GlassCard>
        <CardHeader
          icon={<LifeBuoy className="h-4 w-4" />}
          iconTint="rose"
          title="Support Center"
          subtitle="Real-time ticket queue & helpdesk"
          right={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchTickets}
                title="Refresh tickets"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-400/20 transition"
              >
                <Plus className="h-3 w-3" />
                New Ticket
              </button>
            </div>
          }
        />

        <div className="border-b border-white/5 px-5 py-2.5">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets by subject or requester..."
              className="w-full rounded-lg border border-white/8 bg-white/[0.02] py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/40"
            />
          </div>
        </div>

        <div className="hud-scroll max-h-72 space-y-2.5 overflow-y-auto p-5">
          {loading && tickets.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              Fetching support tickets from database...
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No tickets found matching current query.
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.dbId || t.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/8 bg-white/[0.03] p-3 transition hover:bg-white/[0.05]"
              >
                <span className="font-mono text-[11px] text-slate-600">{t.id}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{t.subject}</p>
                  <p className="truncate text-[11px] text-slate-500">{t.requester}</p>
                </div>
                <span
                  className={`flex-none rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${priorityTint[t.priority] || priorityTint.Medium}`}
                >
                  {t.priority}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleStatus(t)}
                  title="Click to toggle status"
                  className={`flex-none rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide hover:opacity-80 transition ${statusTint[t.status] || statusTint.Open}`}
                >
                  {t.status}
                </button>
                <span className="w-16 flex-none text-right font-mono text-[11px] text-slate-600">
                  {t.time}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 p-5">
          <p className="text-xs text-slate-500">
            Zendesk, Intercom & Helpdesk Sync
          </p>
          <button
            type="button"
            onClick={() => setShowConnectModal(true)}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition"
          >
            Configure Helpdesk Channels
          </button>
        </div>
      </GlassCard>

      {/* New Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Create Support Ticket</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Requester Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="customer@domain.com"
                  value={requesterEmail}
                  onChange={(e) => setRequesterEmail(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  placeholder="Unable to access billing dashboard"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as "HIGH" | "MEDIUM" | "LOW")}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 [&>option]:bg-slate-900"
                >
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-xs font-medium text-slate-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !subject || !requesterEmail}
                  className="flex-1 rounded-lg bg-cyan-400 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive Helpdesk Integrations Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-slate-100">Helpdesk & Support Channels</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {helpdeskMessage && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-200">
                {helpdeskMessage}
              </div>
            )}

            <div className="mb-4 flex gap-2 border-b border-white/5 pb-3">
              {(["ZENDESK", "INTERCOM", "FRESHDESK"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setHelpdeskProvider(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    helpdeskProvider === p
                      ? "bg-cyan-400 text-slate-950 font-semibold"
                      : "bg-white/[0.04] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p === "ZENDESK" ? "Zendesk v2" : p === "INTERCOM" ? "Intercom" : "Freshdesk"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveHelpdesk} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {helpdeskProvider === "ZENDESK"
                    ? "Zendesk Subdomain (e.g. company.zendesk.com)"
                    : helpdeskProvider === "INTERCOM"
                    ? "Intercom Workspace / App ID"
                    : "Freshdesk Domain (e.g. company.freshdesk.com)"}
                </label>
                <input
                  type="text"
                  placeholder="company.zendesk.com"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Personal Access Token / API Key
                </label>
                <input
                  type="password"
                  placeholder="Token / Key..."
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-400">
                Tickets are also automatically captured and tracked locally in your SQLite/Postgres database.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingIntegration || (!apiToken && !subdomain)}
                  className="flex-1 rounded-xl bg-cyan-400 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40 transition"
                >
                  {savingIntegration ? "Saving..." : `Connect ${helpdeskProvider}`}
                </button>

                <button
                  type="button"
                  onClick={handleTestHelpdeskSync}
                  disabled={testingSync}
                  title="Simulates real incoming ticket webhook from helpdesk"
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-400/20 transition disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  {testingSync ? "Syncing..." : "Test Ticket Ingestion"}
                </button>

                <button
                  type="button"
                  onClick={handleDisconnectHelpdesk}
                  title="Disconnect Channel"
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <Unplug className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

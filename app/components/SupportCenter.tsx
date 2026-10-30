"use client";

import { useEffect, useState, useCallback } from "react";
import { LifeBuoy, Plus, RefreshCw, X, Search, CheckCircle2 } from "lucide-react";
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
            Manage Support Inbox
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

      {/* Support Inbox Connection Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Helpdesk Integrations</h3>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3.5 text-cyan-200">
                <CheckCircle2 className="h-4 w-4 flex-none mt-0.5 text-cyan-400" />
                <p>
                  Local database ticketing system is fully active and persistent. All created tickets are stored with priority, status tracking, and requester records.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-200 mb-1">Supported External Ticketing Channels:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>Zendesk Support API v2</li>
                  <li>Intercom Conversations API</li>
                  <li>Freshdesk Tickets API</li>
                </ul>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1 rounded-lg bg-cyan-400 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

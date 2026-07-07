import { LifeBuoy } from "lucide-react";
import { CardHeader, ConnectButton, DemoBadge, GlassCard } from "./ui";

const tickets = [
  {
    id: "#1042",
    subject: "Unable to update billing address",
    requester: "morgan@brightloop.io",
    priority: "High",
    status: "Open",
    time: "12m ago",
  },
  {
    id: "#1041",
    subject: "Question about annual plan discount",
    requester: "dana@fieldwork.co",
    priority: "Low",
    status: "Open",
    time: "48m ago",
  },
  {
    id: "#1039",
    subject: "Export feature returning empty CSV",
    requester: "priya@northstar.dev",
    priority: "Medium",
    status: "In progress",
    time: "2h ago",
  },
  {
    id: "#1035",
    subject: "Feature request: dark mode for reports",
    requester: "leo@vantage.app",
    priority: "Low",
    status: "Resolved",
    time: "1d ago",
  },
];

const priorityTint: Record<string, string> = {
  High: "bg-rose-400/10 text-rose-300",
  Medium: "bg-amber-400/10 text-amber-300",
  Low: "bg-slate-400/10 text-slate-400",
};

const statusTint: Record<string, string> = {
  Open: "bg-cyan-400/10 text-cyan-300",
  "In progress": "bg-amber-400/10 text-amber-300",
  Resolved: "bg-emerald-400/10 text-emerald-300",
};

export default function SupportCenter() {
  return (
    <GlassCard>
      <CardHeader
        icon={<LifeBuoy className="h-4 w-4" />}
        iconTint="rose"
        title="Support Center"
        subtitle="Open conversations across channels"
        right={<DemoBadge />}
      />

      <div className="hud-scroll max-h-72 space-y-2.5 overflow-y-auto p-5">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/8 bg-white/[0.03] p-3"
          >
            <span className="font-mono text-[11px] text-slate-600">{t.id}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-200">{t.subject}</p>
              <p className="truncate text-[11px] text-slate-500">
                {t.requester}
              </p>
            </div>
            <span
              className={`flex-none rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${priorityTint[t.priority]}`}
            >
              {t.priority}
            </span>
            <span
              className={`flex-none rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${statusTint[t.status]}`}
            >
              {t.status}
            </span>
            <span className="w-16 flex-none text-right font-mono text-[11px] text-slate-600">
              {t.time}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 p-5">
        <p className="text-xs text-slate-500">
          Connect your support inbox to manage tickets from here.
        </p>
        <ConnectButton label="Connect support inbox" />
      </div>
    </GlassCard>
  );
}

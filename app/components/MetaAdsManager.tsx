import { Megaphone } from "lucide-react";
import { CardHeader, ConnectButton, DemoBadge, GlassCard } from "./ui";

const campaigns = [
  {
    name: "Retargeting — Cart Abandoners",
    status: "Active",
    spend: "$96.40",
    ctr: "3.8%",
    roas: "4.8x",
  },
  {
    name: "Prospecting — Lookalike 1%",
    status: "Active",
    spend: "$132.10",
    ctr: "1.9%",
    roas: "2.6x",
  },
  {
    name: "Brand Awareness — Reels",
    status: "Paused",
    spend: "$55.70",
    ctr: "2.4%",
    roas: "1.9x",
  },
];

export default function MetaAdsManager() {
  return (
    <GlassCard>
      <CardHeader
        icon={<Megaphone className="h-4 w-4" />}
        iconTint="violet"
        title="Meta Ads Manager"
        subtitle="Campaign performance overview"
        right={<DemoBadge />}
      />

      <div className="grid grid-cols-3 gap-3 border-b border-white/5 p-5">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] text-slate-500">Total spend</p>
          <p className="mt-1 font-mono text-base font-medium text-slate-100">
            $284.20
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] text-slate-500">Avg. CTR</p>
          <p className="mt-1 font-mono text-base font-medium text-slate-100">
            2.7%
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
          <p className="text-[11px] text-slate-500">Blended ROAS</p>
          <p className="mt-1 font-mono text-base font-medium text-emerald-300">
            3.1x
          </p>
        </div>
      </div>

      <div className="space-y-2.5 p-5">
        {campaigns.map((c) => (
          <div
            key={c.name}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/8 bg-white/[0.03] p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-200">{c.name}</p>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                  c.status === "Active"
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-slate-400/10 text-slate-400"
                }`}
              >
                {c.status}
              </span>
            </div>
            <div className="flex flex-none gap-4 font-mono text-xs text-slate-400">
              <div>
                <p className="text-[10px] text-slate-600">Spend</p>
                <p className="text-slate-200">{c.spend}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-600">CTR</p>
                <p className="text-slate-200">{c.ctr}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-600">ROAS</p>
                <p className="text-slate-200">{c.roas}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 p-5">
        <p className="text-xs text-slate-500">
          Connect your Meta Ads account to see live data.
        </p>
        <ConnectButton label="Connect Meta Ads" />
      </div>
    </GlassCard>
  );
}

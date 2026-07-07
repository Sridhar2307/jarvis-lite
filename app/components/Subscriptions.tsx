import { CreditCard } from "lucide-react";
import { CardHeader, ConnectButton, DemoBadge, GlassCard, TrendPill } from "./ui";

const stats = [
  { label: "MRR", value: "$48,200", delta: 4.2 },
  { label: "Active subscribers", value: "1,842", delta: 3.4 },
  { label: "Churn rate", value: "2.1%", delta: -0.4 },
];

const plans = [
  { name: "Starter", subscribers: 1024, share: "56%" },
  { name: "Pro", subscribers: 612, share: "33%" },
  { name: "Enterprise", subscribers: 206, share: "11%" },
];

export default function Subscriptions() {
  return (
    <GlassCard>
      <CardHeader
        icon={<CreditCard className="h-4 w-4" />}
        iconTint="emerald"
        title="Subscriptions"
        subtitle="Recurring revenue at a glance"
        right={<DemoBadge />}
      />

      <div className="grid grid-cols-3 gap-3 border-b border-white/5 p-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/8 bg-white/[0.03] p-3"
          >
            <p className="text-[11px] text-slate-500">{s.label}</p>
            <p className="mt-1 font-mono text-base font-medium text-slate-100">
              {s.value}
            </p>
            <div className="mt-1.5">
              <TrendPill value={s.delta} />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5 p-5">
        <p className="text-xs text-slate-500">Subscribers by plan</p>
        {plans.map((p) => (
          <div key={p.name} className="flex items-center gap-3">
            <span className="w-20 flex-none text-sm text-slate-300">
              {p.name}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400/70 to-cyan-400/70"
                style={{ width: p.share }}
              />
            </div>
            <span className="w-10 flex-none text-right font-mono text-xs text-slate-500">
              {p.share}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-white/5 p-5">
        <p className="text-xs text-slate-500">
          Connect RevenueCat to sync subscription data.
        </p>
        <ConnectButton label="Connect RevenueCat" />
      </div>
    </GlassCard>
  );
}

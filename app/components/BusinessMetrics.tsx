import { LineChart } from "lucide-react";
import { CardHeader, DemoBadge, GlassCard, TrendPill } from "./ui";

const metrics = [
  { label: "MRR", value: "$48,200", delta: 4.2 },
  { label: "ARR", value: "$578,400", delta: 4.2 },
  { label: "Active Users", value: "12,480", delta: 2.8 },
  { label: "Revenue (MTD)", value: "$61,900", delta: 6.1 },
];

export default function BusinessMetrics() {
  return (
    <GlassCard>
      <CardHeader
        icon={<LineChart className="h-4 w-4" />}
        title="Business Metrics"
        subtitle="Snapshot across all revenue streams"
        right={<DemoBadge />}
      />
      <div className="grid grid-cols-2 gap-3 p-5">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-white/8 bg-white/[0.03] p-4"
          >
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className="mt-1.5 font-mono text-xl font-medium text-slate-100">
              {m.value}
            </p>
            <div className="mt-2">
              <TrendPill value={m.delta} />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

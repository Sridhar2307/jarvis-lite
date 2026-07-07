import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-glass backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  icon,
  iconTint = "cyan",
  title,
  subtitle,
  right,
}: {
  icon: ReactNode;
  iconTint?: "cyan" | "violet" | "amber" | "emerald" | "rose";
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  const tints: Record<string, string> = {
    cyan: "bg-cyan-400/10 text-cyan-300 ring-cyan-400/20",
    violet: "bg-violet-400/10 text-violet-300 ring-violet-400/20",
    amber: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
    emerald: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
    rose: "bg-rose-400/10 text-rose-300 ring-rose-400/20",
  };

  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ring-1 ${tints[iconTint]}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold tracking-wide text-slate-100">
            {title}
          </h2>
          {subtitle && (
            <p className="truncate text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {right && <div className="flex flex-none items-center gap-2">{right}</div>}
    </div>
  );
}

export function DemoBadge({ label = "Demo data" }: { label?: string }) {
  return (
    <span className="inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-300">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse-dot" />
      {label}
    </span>
  );
}

export function StatusDot({
  tone = "emerald",
}: {
  tone?: "emerald" | "amber" | "rose" | "cyan" | "slate";
}) {
  const tones: Record<string, string> = {
    emerald: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
    amber: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]",
    rose: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]",
    cyan: "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]",
    slate: "bg-slate-500",
  };
  return (
    <span className={`inline-block h-1.5 w-1.5 rounded-full ${tones[tone]}`} />
  );
}

export function ConnectButton({ label }: { label: string }) {
  return (
    <div className="group/tooltip relative inline-flex flex-none">
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="cursor-not-allowed whitespace-nowrap rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-500"
      >
        {label}
      </button>
      <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 group-hover/tooltip:opacity-100">
        Coming soon
        <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </div>
    </div>
  );
}

export function TrendPill({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] ${
        positive
          ? "bg-emerald-400/10 text-emerald-300"
          : "bg-rose-400/10 text-rose-300"
      }`}
    >
      {positive ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

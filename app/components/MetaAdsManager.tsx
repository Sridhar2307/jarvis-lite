"use client";

import { useEffect, useState } from "react";
import { Megaphone, RefreshCw, X, ShieldAlert } from "lucide-react";
import { CardHeader, GlassCard } from "./ui";

type Campaign = {
  id: string;
  name: string;
  status: string;
  spend: number;
  ctr: number;
  roas: number;
};

type AccountData = {
  id: string;
  name: string;
  status: string;
  totalSpend: number;
  avgCtr: number;
  blendedRoas: number;
};

export default function MetaAdsManager() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    fetchAds();
  }, []);

  async function fetchAds() {
    try {
      setLoading(true);
      const res = await fetch("/api/ads");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setAccount(json.data.account);
          setCampaigns(json.data.campaigns);
        }
      }
    } catch (err) {
      console.error("Failed to load Meta ads data", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <GlassCard>
        <CardHeader
          icon={<Megaphone className="h-4 w-4" />}
          iconTint="violet"
          title="Meta Ads Manager"
          subtitle="Campaign performance overview"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchAds}
                title="Refresh campaigns"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  account?.status === "CONNECTED"
                    ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20"
                    : "bg-amber-400/10 text-amber-300 border border-amber-400/20"
                }`}
              >
                {account?.status || "DISCONNECTED"}
              </span>
            </div>
          }
        />

        <div className="grid grid-cols-3 gap-3 border-b border-white/5 p-5">
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] text-slate-500">Total spend</p>
            <p className="mt-1 font-mono text-base font-medium text-slate-100">
              ${account?.totalSpend ? account.totalSpend.toFixed(2) : "0.00"}
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] text-slate-500">Avg. CTR</p>
            <p className="mt-1 font-mono text-base font-medium text-slate-100">
              {account?.avgCtr ? account.avgCtr.toFixed(1) : "0.0"}%
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-[11px] text-slate-500">Blended ROAS</p>
            <p className="mt-1 font-mono text-base font-medium text-emerald-300">
              {account?.blendedRoas ? account.blendedRoas.toFixed(1) : "0.0"}x
            </p>
          </div>
        </div>

        <div className="space-y-2.5 p-5">
          {campaigns.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500">
              No Meta campaigns currently tracked in this organization.
            </div>
          ) : (
            campaigns.map((c) => (
              <div
                key={c.id || c.name}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/8 bg-white/[0.03] p-3 transition hover:bg-white/[0.05]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-200">{c.name}</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                      c.status === "ACTIVE"
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
                    <p className="text-slate-200">${c.spend.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600">CTR</p>
                    <p className="text-slate-200">{c.ctr.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600">ROAS</p>
                    <p className="text-slate-200">{c.roas.toFixed(1)}x</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 p-5">
          <p className="text-xs text-slate-500">
            Official Meta Graph Marketing API Integration
          </p>
          <button
            type="button"
            onClick={() => setShowConnectModal(true)}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition"
          >
            {account?.status === "CONNECTED" ? "Manage Integration" : "Connect Meta Ads"}
          </button>
        </div>
      </GlassCard>

      {/* Meta OAuth Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Meta Marketing API Connection</h3>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-amber-200">
                <ShieldAlert className="h-4 w-4 flex-none mt-0.5 text-amber-400" />
                <p>
                  Connecting to live production ad accounts requires valid <code className="text-amber-300">META_APP_ID</code> and <code className="text-amber-300">META_APP_SECRET</code> registered with Meta Developer Portal.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-200 mb-1">Required Permissions:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>ads_read</li>
                  <li>read_insights</li>
                  <li>business_management</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400">
                Current status: <span className="font-mono text-cyan-400">{account?.status || "DISCONNECTED"}</span>.
                Configured redirect URI: <code className="text-slate-300">/api/integrations/meta/callback</code>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2 font-medium text-slate-400 hover:bg-white/5"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="flex-1 rounded-lg bg-cyan-400 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Confirm Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, RefreshCw, X, ShieldAlert, Play, Unplug } from "lucide-react";
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

  // Form inputs
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  async function handleSaveMeta(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "META",
          apiKey: appSecret.trim() || undefined,
          adAccountId: adAccountId.trim() || undefined,
          subdomain: appId.trim() || undefined,
          status: "CONNECTED",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save Meta credentials");

      setMessage("✅ Meta Marketing credentials verified and connected.");
      setAppSecret("");
      await fetchAds();
    } catch (err) {
      setMessage(err instanceof Error ? `❌ ${err.message}` : "Failed to connect Meta Ads");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestMeta() {
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "META" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Handshake test failed");

      setMessage("⚡ Meta Graph API handshake verified successfully!");
      await fetchAds();
    } catch (err) {
      setMessage(err instanceof Error ? `❌ ${err.message}` : "Test execution failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    try {
      await fetch("/api/integrations?provider=META", { method: "DELETE" });
      setMessage("Meta Ads disconnected.");
      await fetchAds();
    } catch (err) {
      console.error("Disconnect error", err);
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
            Configure Meta Marketing
          </button>
        </div>
      </GlassCard>

      {/* Meta OAuth / Credential Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-slate-100">Meta Marketing API Connection</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {message && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-200">
                {message}
              </div>
            )}

            <form onSubmit={handleSaveMeta} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Meta App ID
                </label>
                <input
                  type="text"
                  placeholder="123456789012345"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Meta App Secret
                </label>
                <input
                  type="password"
                  placeholder="App Secret..."
                  value={appSecret}
                  onChange={(e) => setAppSecret(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Ad Account ID (act_...)
                </label>
                <input
                  type="text"
                  placeholder="act_123456789"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || (!appId && !appSecret && !adAccountId)}
                  className="flex-1 rounded-xl bg-cyan-400 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40 transition"
                >
                  {saving ? "Saving..." : "Save Meta Credentials"}
                </button>

                <button
                  type="button"
                  onClick={handleTestMeta}
                  disabled={testing}
                  title="Tests API handshake"
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-400/20 transition disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  {testing ? "Testing..." : "Verify Handshake"}
                </button>

                {account?.status === "CONNECTED" && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    title="Disconnect Meta"
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition"
                  >
                    <Unplug className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

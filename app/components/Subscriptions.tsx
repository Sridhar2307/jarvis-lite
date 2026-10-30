"use client";

import { useEffect, useState, useCallback } from "react";
import { CreditCard, RefreshCw, X, ShieldCheck, Copy, Check, Play, Unplug } from "lucide-react";
import { CardHeader, GlassCard, TrendPill } from "./ui";

type Stat = {
  label: string;
  value: string;
  raw: number;
  delta: number;
};

type Plan = {
  id?: string;
  name: string;
  subscribers: number;
  share: string;
};

type IntegrationStatus = {
  status: string;
  apiKeyMasked: string | null;
};

export default function Subscriptions() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Modal integration state
  const [provider, setProvider] = useState<"STRIPE" | "REVENUECAT">("STRIPE");
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [stripeStatus, setStripeStatus] = useState<IntegrationStatus>({ status: "NOT_CONFIGURED", apiKeyMasked: null });

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/subscriptions");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data.stats);
          setPlans(json.data.plans);
        }
      }
    } catch (err) {
      console.error("Failed to load subscriptions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIntegrationStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.integrations?.STRIPE) {
          setStripeStatus(json.data.integrations.STRIPE);
        }
      }
    } catch (err) {
      console.error("Failed to load integration status", err);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
    fetchIntegrationStatus();
  }, [fetchSubscriptions, fetchIntegrationStatus]);

  async function handleSaveIntegration(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim() || undefined,
          webhookSecret: webhookSecret.trim() || undefined,
          status: "CONNECTED",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update integration");

      setStatusMessage(`✅ ${provider} configuration saved and verified.`);
      setApiKey("");
      setWebhookSecret("");
      await fetchIntegrationStatus();
      await fetchSubscriptions();
    } catch (err) {
      setStatusMessage(err instanceof Error ? `❌ ${err.message}` : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestWebhook() {
    setTesting(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "STRIPE" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Test webhook failed");

      setStatusMessage("⚡ Webhook test verified! Received simulated payment and logged transaction.");
      await fetchSubscriptions();
    } catch (err) {
      setStatusMessage(err instanceof Error ? `❌ ${err.message}` : "Test execution failed");
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    try {
      await fetch(`/api/integrations?provider=${provider}`, { method: "DELETE" });
      setStatusMessage(`${provider} disconnected.`);
      await fetchIntegrationStatus();
    } catch (err) {
      console.error("Failed to disconnect", err);
    }
  }

  function handleCopyWebhookUrl() {
    const url = `${window.location.origin}/api/webhooks/stripe`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <GlassCard>
        <CardHeader
          icon={<CreditCard className="h-4 w-4" />}
          iconTint="emerald"
          title="Subscriptions"
          subtitle="Recurring revenue at a glance"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchSubscriptions}
                title="Refresh subscriptions"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <span
                className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  stripeStatus.status === "CONNECTED"
                    ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20"
                    : "bg-slate-400/10 text-slate-400 border border-white/10"
                }`}
              >
                {stripeStatus.status === "CONNECTED" ? "Stripe Live" : "Stripe Sync"}
              </span>
            </div>
          }
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
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400/70 to-cyan-400/70 transition-all duration-500"
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
            Stripe & RevenueCat Webhooks Sync
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition"
          >
            Configure Billing Integrations
          </button>
        </div>
      </GlassCard>

      {/* Interactive Billing & Webhooks Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">Billing & Webhook Integration Manager</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {statusMessage && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-200">
                {statusMessage}
              </div>
            )}

            <div className="mb-4 flex gap-2 border-b border-white/5 pb-3">
              <button
                type="button"
                onClick={() => setProvider("STRIPE")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  provider === "STRIPE"
                    ? "bg-cyan-400 text-slate-950 font-semibold"
                    : "bg-white/[0.04] text-slate-400 hover:text-slate-200"
                }`}
              >
                Stripe (Webhooks & API)
              </button>
              <button
                type="button"
                onClick={() => setProvider("REVENUECAT")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  provider === "REVENUECAT"
                    ? "bg-cyan-400 text-slate-950 font-semibold"
                    : "bg-white/[0.04] text-slate-400 hover:text-slate-200"
                }`}
              >
                RevenueCat (In-App Subscriptions)
              </button>
            </div>

            <form onSubmit={handleSaveIntegration} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {provider === "STRIPE" ? "Stripe Secret Key (sk_test / sk_live)" : "RevenueCat V2 Secret API Key"}
                </label>
                <input
                  type="password"
                  placeholder={
                    stripeStatus.apiKeyMasked
                      ? `Stored: ${stripeStatus.apiKeyMasked}`
                      : provider === "STRIPE"
                      ? "sk_test_51Mz..."
                      : "appl_sec_..."
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {provider === "STRIPE" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">
                    Stripe Webhook Signing Secret (whsec_...)
                  </label>
                  <input
                    type="password"
                    placeholder="whsec_1234567890abcdef..."
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              {/* Webhook Endpoint Display */}
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs">
                <p className="font-medium text-slate-300 mb-1">Your Live Webhook Endpoint URL:</p>
                <div className="flex items-center justify-between rounded-lg bg-black/40 px-2.5 py-1.5 font-mono text-[11px] text-cyan-300">
                  <span className="truncate">
                    {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/stripe` : "/api/webhooks/stripe"}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWebhookUrl}
                    className="ml-2 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-slate-200"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving || (!apiKey && !webhookSecret)}
                  className="flex-1 rounded-xl bg-cyan-400 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40 transition"
                >
                  {saving ? "Saving..." : "Save Credentials"}
                </button>

                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={testing}
                  title="Simulates an incoming Stripe invoice.payment_succeeded event and verifies DB logging"
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-400/20 transition disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  {testing ? "Testing..." : "Test Webhook Ingestion"}
                </button>

                {stripeStatus.status === "CONNECTED" && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    title="Disconnect Stripe"
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

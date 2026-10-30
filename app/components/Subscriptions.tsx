"use client";

import { useEffect, useState } from "react";
import { CreditCard, RefreshCw, X, ShieldCheck } from "lucide-react";
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

export default function Subscriptions() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
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
            <button
              type="button"
              onClick={fetchSubscriptions}
              title="Refresh subscriptions"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
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
            Manage Billing Integrations
          </button>
        </div>
      </GlassCard>

      {/* Integration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Billing & Webhook Integration</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-200">
                <ShieldCheck className="h-4 w-4 flex-none mt-0.5 text-emerald-400" />
                <p>
                  Stripe Webhook handler is implemented at <code className="text-emerald-300">/api/webhooks/stripe</code> with cryptographic HMAC-SHA256 signature verification.
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-200 mb-1">Supported Webhook Events:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono text-[11px]">
                  <li>invoice.payment_succeeded</li>
                  <li>customer.subscription.created</li>
                  <li>customer.subscription.deleted</li>
                </ul>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-[11px] text-slate-400">
                To link production Stripe webhooks, add <code className="text-slate-300">STRIPE_SECRET_KEY</code> and <code className="text-slate-300">STRIPE_WEBHOOK_SECRET</code> in <code className="text-slate-300">.env</code>.
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2 font-medium text-slate-400 hover:bg-white/5"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg bg-cyan-400 py-2 font-semibold text-slate-950 hover:bg-cyan-300"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

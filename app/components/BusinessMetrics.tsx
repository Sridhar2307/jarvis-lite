"use client";

import { useEffect, useState } from "react";
import { LineChart, Plus, RefreshCw, X } from "lucide-react";
import { CardHeader, GlassCard, TrendPill } from "./ui";

type MetricItem = {
  label: string;
  value: string;
  raw: number;
  delta: number;
};

export default function BusinessMetrics() {
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New record form state
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("SUBSCRIPTION");
  const [source, setSource] = useState("MANUAL");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    try {
      setLoading(true);
      const res = await fetch("/api/metrics");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMetrics(json.data.metrics);
          setHasData(json.data.hasData);
        }
      }
    } catch (err) {
      console.error("Failed to fetch metrics", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddRevenue(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsedAmount,
          category,
          source,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setAmount("");
        setNotes("");
        await fetchMetrics();
      }
    } catch (err) {
      console.error("Failed to add revenue record", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <GlassCard>
        <CardHeader
          icon={<LineChart className="h-4 w-4" />}
          title="Business Metrics"
          subtitle="Real-time verified revenue streams"
          right={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fetchMetrics}
                title="Refresh metrics"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1 rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-400/20 transition"
              >
                <Plus className="h-3 w-3" />
                Add Record
              </button>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-3 p-5">
          {loading && metrics.length === 0 ? (
            <div className="col-span-2 py-8 text-center text-xs text-slate-500">
              Querying live database revenue records...
            </div>
          ) : !hasData && metrics.length === 0 ? (
            <div className="col-span-2 py-8 text-center">
              <p className="text-xs text-slate-400">No revenue records logged yet</p>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="mt-2 text-xs text-cyan-400 hover:underline"
              >
                + Log your first revenue entry
              </button>
            </div>
          ) : (
            metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-white/8 bg-white/[0.03] p-4 transition hover:bg-white/[0.05]"
              >
                <p className="text-xs text-slate-500">{m.label}</p>
                <p className="mt-1.5 font-mono text-xl font-medium text-slate-100">
                  {m.value}
                </p>
                <div className="mt-2">
                  <TrendPill value={m.delta} />
                </div>
              </div>
            ))
          )}
        </div>
      </GlassCard>

      {/* Add Revenue Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Record Real Revenue</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddRevenue} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="2500.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 [&>option]:bg-slate-900"
                >
                  <option value="SUBSCRIPTION">Recurring Subscription</option>
                  <option value="ONE_TIME">One-Time Service / License</option>
                  <option value="AD_REVENUE">Advertising / Affiliate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Source Channel
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 [&>option]:bg-slate-900"
                >
                  <option value="STRIPE">Stripe Payment</option>
                  <option value="REVENUECAT">RevenueCat In-App</option>
                  <option value="MANUAL">Direct Bank Wire / Invoice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Q4 Enterprise Contract"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-xs font-medium text-slate-400 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !amount}
                  className="flex-1 rounded-lg bg-cyan-400 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

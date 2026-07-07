import { Zap } from "lucide-react";
import CommandCenter from "./components/CommandCenter";
import BusinessMetrics from "./components/BusinessMetrics";
import SocialMediaHub from "./components/SocialMediaHub";
import MetaAdsManager from "./components/MetaAdsManager";
import Subscriptions from "./components/Subscriptions";
import SupportCenter from "./components/SupportCenter";
import { StatusDot } from "./components/ui";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div className="ambient-glow" />
      <div className="hud-grid" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-100">
                JARVIS <span className="text-slate-500">/ lite</span>
              </h1>
              <p className="text-xs text-slate-500">
                Your business, in one command center
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-xl">
            <StatusDot tone="emerald" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
              All systems nominal
            </span>
            <span className="mx-1 h-3 w-px bg-white/10" />
            <span className="rounded-full bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-300">
              Demo mode
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
          <div className="md:col-span-2 lg:col-span-7">
            <CommandCenter />
          </div>
          <div className="md:col-span-2 lg:col-span-5">
            <BusinessMetrics />
          </div>

          <div className="lg:col-span-6">
            <SocialMediaHub />
          </div>
          <div className="lg:col-span-6">
            <MetaAdsManager />
          </div>

          <div className="lg:col-span-6">
            <Subscriptions />
          </div>
          <div className="lg:col-span-6">
            <SupportCenter />
          </div>
        </div>

        <footer className="mt-8 text-center font-mono text-[11px] text-slate-600">
          Jarvis Lite — all figures on this page are placeholder demo data.
        </footer>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Zap, LogOut, Database, Building } from "lucide-react";
import CommandCenter from "./components/CommandCenter";
import BusinessMetrics from "./components/BusinessMetrics";
import SocialMediaHub from "./components/SocialMediaHub";
import MetaAdsManager from "./components/MetaAdsManager";
import Subscriptions from "./components/Subscriptions";
import SupportCenter from "./components/SupportCenter";
import { StatusDot } from "./components/ui";

type CurrentUser = {
  user: { id: string; email: string; name: string | null };
  organization: { id: string; name: string };
  role: string;
};

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCurrentUser(json.data);
        }
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function handleSeedDemoData() {
    setSeeding(true);
    setNotification(null);
    try {
      const res = await fetch("/api/auth/demo-seed", { method: "POST" });
      if (res.ok) {
        setNotification("Verified sample business records synced to your database.");
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      console.error("Seeding error", err);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <main className="relative min-h-screen">
      <div className="ambient-glow" />
      <div className="hud-grid" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-slate-100">
                  JARVIS <span className="text-slate-500">/ lite</span>
                </h1>
                {currentUser?.organization && (
                  <span className="flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium text-slate-300">
                    <Building className="h-3 w-3 text-cyan-400" />
                    {currentUser.organization.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {currentUser?.user?.email
                  ? `Authenticated as ${currentUser.user.name || currentUser.user.email} (${currentUser.role})`
                  : "Production Executive Command Center"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={seeding}
              className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
            >
              <Database className="h-3.5 w-3.5" />
              {seeding ? "Syncing DB..." : "Seed Starter DB Records"}
            </button>

            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-xl">
              <StatusDot tone="emerald" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300">
                DB CONNECTED
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-white/10 hover:text-slate-200 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </header>

        {notification && (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300">
            {notification}
          </div>
        )}

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
          Jarvis Lite Executive Operating System — Connected to Prisma SQLite Database.
        </footer>
      </div>
    </main>
  );
}

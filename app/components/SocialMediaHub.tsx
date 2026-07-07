"use client";

import { useState } from "react";
import { Share2, Camera, Briefcase, AtSign } from "lucide-react";
import { CardHeader, DemoBadge, GlassCard } from "./ui";

type Platform = "Instagram" | "X" | "LinkedIn";

type Post = {
  id: string;
  platform: Platform;
  content: string;
  scheduledFor: string;
  status: "Scheduled" | "Draft";
};

const platformIcons: Record<Platform, React.ReactNode> = {
  Instagram: <Camera className="h-3.5 w-3.5" />,
  X: <AtSign className="h-3.5 w-3.5" />,
  LinkedIn: <Briefcase className="h-3.5 w-3.5" />,
};

const platformTint: Record<Platform, string> = {
  Instagram: "bg-fuchsia-400/10 text-fuchsia-300 ring-fuchsia-400/20",
  X: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  LinkedIn: "bg-blue-400/10 text-blue-300 ring-blue-400/20",
};

const seedPosts: Post[] = [
  {
    id: "p1",
    platform: "Instagram",
    content: "Behind the scenes of how we ship features every week 👀",
    scheduledFor: "Today, 2:00 PM",
    status: "Scheduled",
  },
  {
    id: "p2",
    platform: "LinkedIn",
    content: "We just rebuilt our onboarding flow — here's what changed and why.",
    scheduledFor: "Tomorrow, 9:00 AM",
    status: "Scheduled",
  },
  {
    id: "p3",
    platform: "X",
    content: "Small teams move fast. Here's how we automate the busywork.",
    scheduledFor: "Thu, 11:30 AM",
    status: "Draft",
  },
];

export default function SocialMediaHub() {
  const [posts, setPosts] = useState<Post[]>(seedPosts);
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [when, setWhen] = useState("");

  function handleSchedule() {
    if (!content.trim()) return;
    const newPost: Post = {
      id: crypto.randomUUID(),
      platform,
      content: content.trim(),
      scheduledFor: when.trim() || "Not yet set",
      status: "Scheduled",
    };
    setPosts((prev) => [newPost, ...prev]);
    setContent("");
    setWhen("");
  }

  return (
    <GlassCard>
      <CardHeader
        icon={<Share2 className="h-4 w-4" />}
        title="Social Media Hub"
        subtitle="Scheduled posts across your channels"
        right={<DemoBadge />}
      />

      <div className="space-y-3 border-b border-white/5 p-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="What do you want to post?"
          className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400/40 focus:outline-none [&>option]:bg-slate-900"
          >
            <option>Instagram</option>
            <option>X</option>
            <option>LinkedIn</option>
          </select>
          <input
            type="text"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            placeholder="e.g. Fri, 10:00 AM"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSchedule}
            disabled={!content.trim()}
            className="ml-auto rounded-lg bg-cyan-400/90 px-3.5 py-1.5 text-xs font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
          >
            Schedule post
          </button>
        </div>
        <p className="font-mono text-[10px] text-slate-600">{content.length}/280</p>
      </div>

      <div className="hud-scroll max-h-64 flex-1 space-y-2.5 overflow-y-auto p-5">
        {posts.map((p) => (
          <div
            key={p.id}
            className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3"
          >
            <div
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-md ring-1 ${platformTint[p.platform]}`}
            >
              {platformIcons[p.platform]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-200">{p.content}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-500">
                {p.scheduledFor}
              </p>
            </div>
            <span
              className={`flex-none rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                p.status === "Scheduled"
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-slate-400/10 text-slate-400"
              }`}
            >
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

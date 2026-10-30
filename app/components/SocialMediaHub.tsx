"use client";

import { useEffect, useState } from "react";
import { Share2, Camera, Briefcase, AtSign, Trash2, RefreshCw } from "lucide-react";
import { CardHeader, GlassCard } from "./ui";

type Platform = "Instagram" | "X" | "LinkedIn";

type Post = {
  id: string;
  platform: Platform;
  content: string;
  scheduledTimeString: string;
  status: "SCHEDULED" | "DRAFT" | "PUBLISHED" | "FAILED";
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

export default function SocialMediaHub() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [when, setWhen] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      setLoading(true);
      const res = await fetch("/api/social/posts");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPosts(json.data.posts);
        }
      }
    } catch (err) {
      console.error("Failed to load social posts", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSchedule() {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          content: content.trim(),
          scheduledTimeString: when.trim() || "Not yet set",
          status: "SCHEDULED",
        }),
      });

      if (res.ok) {
        setContent("");
        setWhen("");
        await fetchPosts();
      }
    } catch (err) {
      console.error("Failed to create post", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/social/posts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  }

  return (
    <GlassCard>
      <CardHeader
        icon={<Share2 className="h-4 w-4" />}
        title="Social Media Hub"
        subtitle="Database-backed cross-channel queue"
        right={
          <button
            type="button"
            onClick={fetchPosts}
            title="Refresh queue"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        }
      />

      <div className="space-y-3 border-b border-white/5 p-5">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          maxLength={280}
          placeholder="What do you want to broadcast across channels?"
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
            disabled={!content.trim() || submitting}
            className="ml-auto rounded-lg bg-cyan-400/90 px-3.5 py-1.5 text-xs font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
          >
            {submitting ? "Saving..." : "Schedule Post"}
          </button>
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
          <span>{content.length}/280</span>
          <span>Verified DB Queue</span>
        </div>
      </div>

      <div className="hud-scroll max-h-64 flex-1 space-y-2.5 overflow-y-auto p-5">
        {loading && posts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            Querying scheduled posts from database...
          </div>
        ) : posts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No scheduled or drafted posts in database.
          </div>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3 transition hover:bg-white/[0.05]"
            >
              <div
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-md ring-1 ${platformTint[p.platform]}`}
              >
                {platformIcons[p.platform]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-200">{p.content}</p>
                <p className="mt-1 font-mono text-[11px] text-slate-500">
                  {p.scheduledTimeString}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`flex-none rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                    p.status === "SCHEDULED"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-slate-400/10 text-slate-400"
                  }`}
                >
                  {p.status}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  title="Delete post"
                  className="rounded p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}

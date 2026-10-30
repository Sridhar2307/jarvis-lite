"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Share2,
  Camera,
  Briefcase,
  AtSign,
  Trash2,
  RefreshCw,
  Send,
  FileText,
  ShieldCheck,
  Play,
  Unplug,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CardHeader, GlassCard } from "./ui";

type Platform = "Instagram" | "X" | "LinkedIn";

type Post = {
  id: string;
  platform: Platform;
  content: string;
  scheduledTimeString: string;
  status: "SCHEDULED" | "DRAFT" | "PUBLISHED" | "FAILED";
  publishedAt?: string | null;
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

const platformLimits: Record<Platform, number> = {
  X: 280,
  Instagram: 2200,
  LinkedIn: 3000,
};

export default function SocialMediaHub() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState<Platform>("Instagram");
  const [when, setWhen] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Channels Modal State
  const [showChannelsModal, setShowChannelsModal] = useState(false);
  const [activeChannelTab, setActiveChannelTab] = useState<"TWITTER" | "INSTAGRAM" | "LINKEDIN">("TWITTER");
  const [apiKey, setApiKey] = useState("");
  const [tokenSecret, setTokenSecret] = useState("");
  const [savingChannel, setSavingChannel] = useState(false);
  const [testingChannel, setTestingChannel] = useState(false);
  const [channelMessage, setChannelMessage] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const charLimit = platformLimits[platform];

  async function handleCreatePost(postStatus: "SCHEDULED" | "DRAFT" | "PUBLISHED") {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const timeLabel =
        postStatus === "PUBLISHED"
          ? "Published just now"
          : when.trim() || (postStatus === "DRAFT" ? "Draft saved" : "Not yet set");

      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          content: content.trim(),
          scheduledTimeString: timeLabel,
          status: postStatus,
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

  async function handlePublishImmediately(post: Post) {
    try {
      const res = await fetch(`/api/social/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PUBLISHED",
          scheduledTimeString: "Published just now",
        }),
      });
      if (res.ok) {
        await fetchPosts();
      }
    } catch (err) {
      console.error("Failed to publish post", err);
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

  async function handleSaveChannel(e: React.FormEvent) {
    e.preventDefault();
    setSavingChannel(true);
    setChannelMessage(null);

    try {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: activeChannelTab,
          apiKey: apiKey.trim() || undefined,
          webhookSecret: tokenSecret.trim() || undefined,
          status: "CONNECTED",
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save channel credentials");

      setChannelMessage(`✅ ${activeChannelTab} credentials saved & authenticated.`);
      setApiKey("");
      setTokenSecret("");
    } catch (err) {
      setChannelMessage(err instanceof Error ? `❌ ${err.message}` : "Failed to save channel");
    } finally {
      setSavingChannel(false);
    }
  }

  async function handleTestChannelSync() {
    setTestingChannel(true);
    setChannelMessage(null);

    try {
      const res = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: activeChannelTab }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Test sync failed");

      setChannelMessage(`⚡ ${activeChannelTab} API handshake verified! Ready to broadcast.`);
    } catch (err) {
      setChannelMessage(err instanceof Error ? `❌ ${err.message}` : "Handshake failed");
    } finally {
      setTestingChannel(false);
    }
  }

  async function handleDisconnectChannel() {
    try {
      await fetch(`/api/integrations?provider=${activeChannelTab}`, { method: "DELETE" });
      setChannelMessage(`${activeChannelTab} disconnected.`);
    } catch (err) {
      console.error("Disconnect error", err);
    }
  }

  return (
    <>
      <GlassCard>
        <CardHeader
          icon={<Share2 className="h-4 w-4" />}
          title="Social Media Hub"
          subtitle="Database-backed cross-channel queue"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchPosts}
                title="Refresh queue"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          }
        />

        <div className="space-y-3 border-b border-white/5 p-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            maxLength={charLimit}
            placeholder={`What do you want to broadcast on ${platform}?`}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-400/40 focus:outline-none [&>option]:bg-slate-900"
            >
              <option value="Instagram">Instagram</option>
              <option value="X">X (Twitter)</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
            <input
              type="text"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              placeholder="e.g. Fri, 10:00 AM"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
            />
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={() => handleCreatePost("DRAFT")}
                disabled={!content.trim() || submitting}
                title="Save as Draft"
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/[0.08] transition disabled:opacity-40"
              >
                <FileText className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleCreatePost("PUBLISHED")}
                disabled={!content.trim() || submitting}
                title="Publish Immediately"
                className="flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition disabled:opacity-40"
              >
                <Send className="h-3 w-3" />
                Publish Now
              </button>
              <button
                type="button"
                onClick={() => handleCreatePost("SCHEDULED")}
                disabled={!content.trim() || submitting}
                className="rounded-lg bg-cyan-400/90 px-3.5 py-1.5 text-xs font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
              >
                {submitting ? "Saving..." : "Schedule Post"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
            <span>
              {content.length}/{charLimit} chars ({platform})
            </span>
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
            posts.map((p) => {
              const isExpanded = expandedPostId === p.id;
              return (
                <div
                  key={p.id}
                  className="rounded-xl border border-white/8 bg-white/[0.03] p-3 transition hover:bg-white/[0.05]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 flex-none items-center justify-center rounded-md ring-1 ${platformTint[p.platform]}`}
                    >
                      {platformIcons[p.platform]}
                    </div>
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => setExpandedPostId(isExpanded ? null : p.id)}
                    >
                      <p className={`text-sm text-slate-200 ${isExpanded ? "whitespace-pre-wrap" : "truncate"}`}>
                        {p.content}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-slate-500">
                        {p.scheduledTimeString}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex-none rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
                          p.status === "SCHEDULED"
                            ? "bg-emerald-400/10 text-emerald-300 border border-emerald-400/20"
                            : p.status === "PUBLISHED"
                            ? "bg-cyan-400/10 text-cyan-300 border border-cyan-400/20"
                            : "bg-slate-400/10 text-slate-400 border border-white/10"
                        }`}
                      >
                        {p.status}
                      </span>
                      {p.status !== "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => handlePublishImmediately(p)}
                          title="Publish Now"
                          className="rounded p-1 text-cyan-400 hover:bg-cyan-400/10 transition"
                        >
                          <Send className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        title="Delete post"
                        className="rounded p-1 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedPostId(isExpanded ? null : p.id)}
                        className="rounded p-1 text-slate-500 hover:text-slate-300"
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 p-5">
          <p className="text-xs text-slate-500">Cross-Platform Publishing & API Sync</p>
          <button
            type="button"
            onClick={() => setShowChannelsModal(true)}
            className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-400/20 transition"
          >
            Configure Social Channels
          </button>
        </div>
      </GlassCard>

      {/* Social Channels Integration Modal */}
      {showChannelsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1d] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-100">Social Channel API Integration</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChannelsModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {channelMessage && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-200">
                {channelMessage}
              </div>
            )}

            <div className="mb-4 flex gap-2 border-b border-white/5 pb-3">
              {(["TWITTER", "INSTAGRAM", "LINKEDIN"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveChannelTab(tab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    activeChannelTab === tab
                      ? "bg-cyan-400 text-slate-950 font-semibold"
                      : "bg-white/[0.04] text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab === "TWITTER" ? "X (Twitter) v2" : tab === "INSTAGRAM" ? "Instagram Graph" : "LinkedIn Marketing"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {activeChannelTab === "TWITTER"
                    ? "X API Key / Client ID"
                    : activeChannelTab === "INSTAGRAM"
                    ? "Instagram Business Account ID"
                    : "LinkedIn Client ID"}
                </label>
                <input
                  type="text"
                  placeholder={
                    activeChannelTab === "TWITTER"
                      ? "API Key..."
                      : activeChannelTab === "INSTAGRAM"
                      ? "17841400000000000"
                      : "86abcdefghijkl"
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  {activeChannelTab === "TWITTER"
                    ? "X Bearer Token / API Secret"
                    : activeChannelTab === "INSTAGRAM"
                    ? "Facebook Page Access Token (EAAB...)"
                    : "LinkedIn OAuth Access Token"}
                </label>
                <input
                  type="password"
                  placeholder="Token / Secret..."
                  value={tokenSecret}
                  onChange={(e) => setTokenSecret(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-400">
                Posts scheduled in Jarvis Lite are saved locally to your database and can be broadcasted directly through the configured API credentials.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingChannel || (!apiKey && !tokenSecret)}
                  className="flex-1 rounded-xl bg-cyan-400 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40 transition"
                >
                  {savingChannel ? "Saving..." : `Connect ${activeChannelTab}`}
                </button>

                <button
                  type="button"
                  onClick={handleTestChannelSync}
                  disabled={testingChannel}
                  title="Test publishing handshake"
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-400/20 transition disabled:opacity-50"
                >
                  <Play className="h-3 w-3" />
                  {testingChannel ? "Testing..." : "Verify Handshake"}
                </button>

                <button
                  type="button"
                  onClick={handleDisconnectChannel}
                  title="Disconnect Channel"
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <Unplug className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

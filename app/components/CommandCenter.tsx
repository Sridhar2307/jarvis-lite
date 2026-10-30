"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp, RefreshCw, AlertCircle } from "lucide-react";
import { CardHeader, GlassCard, StatusDot } from "./ui";

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
  time: string;
};

export default function CommandCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  async function fetchHistory() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ai/chat");
      if (!res.ok) {
        throw new Error("Unable to connect to AI command channel");
      }
      const data = await res.json();
      if (data.success && data.data?.messages) {
        setMessages(data.data.messages);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to load conversation history");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || thinking) return;

    const optimisticId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `opt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    // Optimistically show user message
    const optimisticUserMsg: Message = {
      id: optimisticId,
      role: "user",
      text: trimmed,
      time: now,
    };

    setMessages((prev) => [...prev, optimisticUserMsg]);
    setInput("");
    setThinking(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to receive AI intelligence");
      }

      const aiMsg = json.data.aiMessage;
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticId),
        json.data.userMessage,
        aiMsg,
      ]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error querying AI engine";
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `err-${Date.now()}`,
          role: "ai",
          text: `⚠️ System Notice: ${errMsg}. Check database connectivity or API keys.`,
          time: now,
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  return (
    <GlassCard className="h-[560px]">
      <div className="relative overflow-hidden">
        <CardHeader
          icon={<Sparkles className="h-4 w-4" />}
          title="AI Command Center"
          subtitle="Grounded co-pilot backed by database intelligence"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchHistory}
                title="Reload history"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300 sm:inline-flex">
                <StatusDot tone="emerald" />
                Live Co-Pilot
              </span>
            </div>
          }
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
          <div className="h-px w-1/3 animate-scan bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="hud-scroll flex-1 space-y-4 overflow-y-auto px-5 py-5"
      >
        {loading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            Establishing secure encrypted neural link...
          </div>
        ) : null}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-cyan-400/15 text-slate-100 ring-1 ring-cyan-400/20"
                  : "rounded-bl-sm bg-white/[0.05] text-slate-300 ring-1 ring-white/10"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              <p
                className={`mt-1.5 font-mono text-[10px] tracking-wide ${
                  m.role === "user" ? "text-cyan-200/50" : "text-slate-500"
                }`}
              >
                {m.time}
              </p>
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm bg-white/[0.05] px-4 py-3 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-cyan-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-cyan-400 [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-cyan-400 [animation-delay:400ms]" />
              <span className="ml-1 text-[11px] text-slate-400 font-mono">Analyzing DB metrics...</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
          <AlertCircle className="h-3.5 w-3.5 flex-none" />
          <span className="truncate">{error}</span>
        </div>
      )}

      <div className="border-t border-white/5 p-4">
        <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2 focus-within:border-cyan-400/40 focus-within:ring-1 focus-within:ring-cyan-400/30">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={1}
            placeholder="Ask Jarvis about verified MRR, tickets, ad ROAS, or operations..."
            className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || thinking}
            aria-label="Send message"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-cyan-400/90 text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

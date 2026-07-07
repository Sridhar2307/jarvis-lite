"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowUp } from "lucide-react";
import { CardHeader, GlassCard, StatusDot } from "./ui";

type Message = {
  id: string;
  role: "user" | "ai";
  text: string;
  time: string;
};

const seedMessages: Message[] = [
  {
    id: "m1",
    role: "ai",
    text: "Morning briefing: MRR is up 4.2% week-over-week, 3 support tickets need attention, and your 2:00 PM Instagram post is queued and ready.",
    time: "8:02 AM",
  },
  {
    id: "m2",
    role: "user",
    text: "How did the ad campaigns perform yesterday?",
    time: "8:05 AM",
  },
  {
    id: "m3",
    role: "ai",
    text: "Meta Ads spent $284 across 3 campaigns with a blended ROAS of 3.1x. \"Retargeting — Cart Abandoners\" was the top performer at 4.8x.",
    time: "8:05 AM",
  },
  {
    id: "m4",
    role: "user",
    text: "Draft a LinkedIn post about our new onboarding flow.",
    time: "8:11 AM",
  },
  {
    id: "m5",
    role: "ai",
    text: "Drafted and added to your Social Media Hub as a scheduled post for tomorrow at 9:00 AM. Want me to adjust the tone?",
    time: "8:11 AM",
  },
];

const cannedReplies = [
  "Got it — I've logged that and will factor it into today's briefing.",
  "Noted. I'll keep an eye on that and flag anything unusual.",
  "Done. You can review the details in the relevant panel above.",
  "Understood. I'll pull the latest numbers and follow up shortly.",
];

export default function CommandCenter() {
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyIndex = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, thinking]);

  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
      time: timeNow(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    window.setTimeout(() => {
      const reply = cannedReplies[replyIndex.current % cannedReplies.length];
      replyIndex.current += 1;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "ai",
          text: reply,
          time: timeNow(),
        },
      ]);
      setThinking(false);
    }, 1100);
  }

  return (
    <GlassCard className="h-[560px]">
      <div className="relative overflow-hidden">
        <CardHeader
          icon={<Sparkles className="h-4 w-4" />}
          title="AI Command Center"
          subtitle="Ask Jarvis anything about your business"
          right={
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-emerald-300 sm:inline-flex">
              <StatusDot tone="emerald" />
              Online
            </span>
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
              <p>{m.text}</p>
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
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/[0.05] px-4 py-3 ring-1 ring-white/10">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-slate-400 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-slate-400 [animation-delay:200ms]" />
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-slate-400 [animation-delay:400ms]" />
            </div>
          </div>
        )}
      </div>

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
            placeholder="Message Jarvis…"
            className="max-h-28 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
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

"use client";

import { Radio } from "lucide-react";
import { Modal } from "./ui";

export interface LiveEventItem {
  id: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export default function RealtimeTimelineModal({
  isOpen,
  onClose,
  events,
  isConnected,
  onClear,
}: {
  isOpen: boolean;
  onClose: () => void;
  events: LiveEventItem[];
  isConnected: boolean;
  onClear: () => void;
}) {
  const getEventBadge = (type: string) => {
    switch (type) {
      case "METRIC_UPDATED":
        return { label: "METRICS", bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
      case "TICKET_CREATED":
      case "TICKET_UPDATED":
        return { label: "SUPPORT", bg: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
      case "SOCIAL_POST_PUBLISHED":
      case "SOCIAL_POST_CREATED":
        return { label: "SOCIAL", bg: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
      case "DEVICE_PAIRED":
      case "DEVICE_HEARTBEAT":
        return { label: "DEVICE", bg: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" };
      case "TASK_COMPLETED":
        return { label: "TASK", bg: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
      case "VISION_ANALYZED":
        return { label: "VISION", bg: "bg-pink-500/20 text-pink-400 border-pink-500/30" };
      default:
        return { label: type.slice(0, 8), bg: "bg-white/10 text-slate-300 border-white/20" };
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enterprise Real-Time Event Gateway">
      <div className="space-y-4">
        {/* Connection Status Bar */}
        <div className="p-3 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isConnected ? "bg-emerald-500" : "bg-red-500"
                }`}
              ></span>
            </span>
            <span className="text-xs font-medium text-slate-300">
              {isConnected
                ? "Server-Sent Events (SSE) Stream Active"
                : "Reconnecting to Event Gateway..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              {events.length} events captured
            </span>
            {events.length > 0 && (
              <button
                onClick={onClear}
                className="text-[11px] text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Events Timeline */}
        <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {events.length === 0 ? (
            <div className="p-10 text-center border border-white/5 rounded-xl bg-white/[0.02]">
              <Radio className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-pulse" />
              <p className="text-xs text-slate-400 font-medium">
                Listening for real-time events...
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Business mutations, Nexora tool executions, and vision sessions will stream here instantly.
              </p>
            </div>
          ) : (
            events.map((evt) => {
              const badge = getEventBadge(evt.eventType);
              return (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded border ${badge.bg}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs font-semibold text-white">
                        {evt.eventType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(evt.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 bg-black/40 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap border border-white/5">
                    {JSON.stringify(evt.payload, null, 2)}
                  </pre>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Eye, RefreshCw, Monitor, Sparkles, FileText } from "lucide-react";
import { Modal } from "./ui";

interface VisionSession {
  id: string;
  title: string;
  ocrText: string | null;
  analysis: string | null;
  status: string;
  createdAt: string;
  device?: { deviceName: string; platform: string };
}

export default function ScreenIntelligenceModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [sessions, setSessions] = useState<VisionSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<VisionSession | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/vision");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        if (data.sessions && data.sessions.length > 0 && !selectedSession) {
          setSelectedSession(data.sessions[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load vision sessions", err);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen, loadSessions]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Multimodal Screen Intelligence">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-300">
              Desktop Visual Sessions ({sessions.length})
            </span>
          </div>
          <button
            onClick={loadSessions}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="p-10 text-center border border-white/5 rounded-xl bg-white/[0.02]">
            <Monitor className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No screen captures recorded yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Ask Nexora by voice: &quot;Analyze my screen&quot; or &quot;What is on my display right now?&quot; to trigger visual intelligence.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Session List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {sessions.map((s) => {
                const isSelected = selectedSession?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-cyan-500/10 border-cyan-500/40 text-white"
                        : "bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                    }`}
                  >
                    <div className="text-xs font-medium truncate">{s.title}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center justify-between">
                      <span>{s.device?.deviceName || "Workstation"}</span>
                      <span>{new Date(s.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Session Detail */}
            <div className="md:col-span-2 p-4 rounded-xl border border-white/10 bg-black/40 max-h-[360px] overflow-y-auto">
              {selectedSession ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {selectedSession.title}
                    </h4>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Captured at {new Date(selectedSession.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {selectedSession.ocrText && (
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-white/5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1">
                        <FileText className="w-3 h-3 text-cyan-400" />
                        OCR & Context
                      </span>
                      <p className="text-xs text-slate-300 font-mono">
                        {selectedSession.ocrText}
                      </p>
                    </div>
                  )}

                  {selectedSession.analysis && (
                    <div className="p-3.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        Gemini Multimodal Insights
                      </span>
                      <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {selectedSession.analysis}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Select a session to view details.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, Radio, Terminal, Sparkles, AlertCircle } from "lucide-react";
import { GlassCard, CardHeader, StatusDot } from "./ui";

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: { resultIndex: number; results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
}

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

export default function NexoraVoiceBridge() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reference for SpeechRecognition instance
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const speechWin = window as unknown as SpeechRecognitionWindow;
      const SpeechRecognition =
        speechWin.SpeechRecognition || speechWin.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          setTranscript(text);
        };

        recognition.onerror = (event) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error !== "no-speech") {
            setError(`Microphone error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  const handleProcessVoiceCommand = useCallback(async (commandText: string) => {
    if (!commandText.trim()) return;
    setProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: commandText }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to process voice command");
      }

      const reply = json.data?.aiMessage?.text || "Command processed successfully.";
      setResponse(reply);

      // Speak response aloud via SpeechSynthesis
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reply.slice(0, 300));
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Voice command processing failed");
    } finally {
      setProcessing(false);
    }
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (transcript) {
        handleProcessVoiceCommand(transcript);
      }
    } else {
      setTranscript("");
      setResponse(null);
      setError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Recognition start error", err);
      }
    }
  }

  return (
    <GlassCard className="relative overflow-hidden">
      <CardHeader
        icon={<Radio className="h-4 w-4" />}
        iconTint="cyan"
        title="Nexora Voice & OS Bridge"
        subtitle="Multimodal Voice AI & Windows Desktop Automation"
        right={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan-300">
              <StatusDot tone="cyan" />
              {isListening ? "Listening..." : processing ? "Thinking..." : "Voice Ready"}
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5">
        {/* Radar & Voice Controls */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl border border-white/5 bg-white/[0.02]">
          <div className="relative flex items-center justify-center mb-4">
            {/* Animated Radar Circles */}
            <div
              className={`absolute h-28 w-28 rounded-full border border-cyan-400/30 ${
                isListening ? "animate-ping" : "animate-pulse"
              }`}
            />
            <div className="absolute h-36 w-36 rounded-full border border-dashed border-white/10 animate-spin [animation-duration:12s]" />

            {/* Central Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full shadow-[0_0_25px_rgba(34,211,238,0.3)] transition-all ${
                isListening
                  ? "bg-rose-500 text-white ring-4 ring-rose-500/30 scale-105"
                  : "bg-cyan-400 text-slate-950 hover:bg-cyan-300 hover:scale-105"
              }`}
              title={isListening ? "Stop Listening & Send" : "Click to Speak"}
            >
              {isListening ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
            </button>
          </div>

          <p className="font-mono text-xs font-semibold text-slate-200">
            {isListening ? "Listening to your voice..." : "Click to Talk to Jarvis & Nexora"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 text-center">
            Speaks back through browser audio & controls Windows PC
          </p>

          <div className="mt-4 flex w-full items-center justify-between border-t border-white/5 pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <Terminal className="h-3 w-3 text-cyan-400" />
              Desktop Agent:
            </span>
            <span className="font-mono text-cyan-300">python nexora/main.py</span>
          </div>
        </div>

        {/* Live Interaction & Transcript Output */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-3">
          <div className="flex-1 rounded-xl border border-white/8 bg-white/[0.03] p-4 text-xs">
            <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mb-2">
              Live Voice Stream
            </p>

            {transcript ? (
              <p className="text-slate-100 font-medium text-sm leading-relaxed">
                &ldquo;{transcript}&rdquo;
              </p>
            ) : (
              <p className="text-slate-600 italic">
                {speechSupported
                  ? "Click the microphone and say: 'What is our MRR?' or 'Give me the morning briefing'..."
                  : "Web Speech recognition is not supported in this browser. Use Chrome/Edge or run the Python Desktop HUD."}
              </p>
            )}

            {response && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400 mb-1">
                  <Volume2 className="h-3 w-3" />
                  Nexora Answer:
                </div>
                <p className="text-slate-300 leading-relaxed max-h-24 overflow-y-auto">{response}</p>
              </div>
            )}

            {error && (
              <div className="mt-3 flex items-center gap-1.5 text-rose-300 text-[11px]">
                <AlertCircle className="h-3.5 w-3.5 flex-none" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Quick Voice Command Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              "What is our MRR?",
              "Give me the morning briefing",
              "Who are our top customers?",
              "What support tickets are open?",
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setTranscript(chip);
                  handleProcessVoiceCommand(chip);
                }}
                className="flex items-center gap-1 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1 text-[11px] text-slate-400 hover:bg-white/10 hover:text-cyan-300 transition"
              >
                <Sparkles className="h-3 w-3 text-cyan-400" />
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

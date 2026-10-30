"use client";

import { useState, useEffect } from "react";
import { Monitor, Key, RefreshCw, Trash2, Check, Copy } from "lucide-react";
import { Modal } from "./ui";

interface PairedDevice {
  id: string;
  deviceName: string;
  platform: string;
  osVersion: string | null;
  ipAddress: string | null;
  status: string;
  lastSeenAt: string;
  permissions: Array<{ scope: string; granted: boolean }>;
  stats: { taskCount: number; visionSessionCount: number };
}

interface PairingCodeData {
  code: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export default function DeviceManagerModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [pairingCodeData, setPairingCodeData] = useState<PairingCodeData | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch (err) {
      console.error("Failed to load devices", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const handleGeneratePairingCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch("/api/agent/pair", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPairingCodeData({
          code: data.code,
          expiresAt: data.expiresAt,
          expiresInSeconds: data.expiresInSeconds,
        });
      }
    } catch (err) {
      console.error("Pairing code error", err);
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleRevokeDevice = async (deviceId: string) => {
    if (!confirm("Are you sure you want to revoke this desktop device? It will be disconnected immediately.")) {
      return;
    }
    try {
      const res = await fetch(`/api/agent/devices/${deviceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setNotification("Device revoked successfully.");
        setTimeout(() => setNotification(null), 3000);
        loadDevices();
      }
    } catch (err) {
      console.error("Revocation error", err);
    }
  };

  const copyPairingCode = () => {
    if (!pairingCodeData) return;
    navigator.clipboard.writeText(pairingCodeData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connected Desktop & Device Management">
      <div className="space-y-6">
        {notification && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            {notification}
          </div>
        )}

        {/* Pairing Code Generator Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 to-slate-900 border border-cyan-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                Pair Nexora Desktop Assistant
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Link this Windows workstation to access business tools, voice automation, and screen intelligence.
              </p>
            </div>
            <button
              onClick={handleGeneratePairingCode}
              disabled={generatingCode}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-medium rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {generatingCode ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Key className="w-3.5 h-3.5" />
              )}
              Generate Pairing Code
            </button>
          </div>

          {pairingCodeData && (
            <div className="mt-4 p-4 rounded-lg bg-black/60 border border-cyan-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
              <div>
                <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-wider">
                  Single-Use Pairing Code (Valid 10 mins)
                </span>
                <div className="text-2xl font-mono font-bold tracking-widest text-cyan-200 mt-0.5">
                  {pairingCodeData.code}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Run command in terminal: <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">run-nexora.bat --pair {pairingCodeData.code}</code>
                </p>
              </div>
              <button
                onClick={copyPairingCode}
                className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy Code"}
              </button>
            </div>
          )}
        </div>

        {/* Paired Devices List */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              Authorized Workstations ({devices.length})
            </h4>
            <button
              onClick={loadDevices}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="p-8 text-center border border-white/5 rounded-xl bg-white/[0.02]">
              <Monitor className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-medium">No desktop devices paired yet.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Generate a pairing code above and run Nexora on your Windows desktop to connect.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((device) => {
                const isOnline = device.status === "ONLINE";
                const isRevoked = device.status === "REVOKED";
                return (
                  <div
                    key={device.id}
                    className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-white/20 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">
                            {device.deviceName}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                              isRevoked
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : isOnline
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {device.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-3 font-mono">
                          <span>OS: {device.osVersion || "Windows 11"}</span>
                          <span>IP: {device.ipAddress || "127.0.0.1"}</span>
                          <span>Last active: {new Date(device.lastSeenAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {device.permissions.slice(0, 4).map((p) => (
                            <span
                              key={p.scope}
                              className="px-1.5 py-0.5 text-[9px] font-mono bg-white/5 border border-white/10 text-slate-300 rounded"
                            >
                              {p.scope}
                            </span>
                          ))}
                          {device.permissions.length > 4 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono text-slate-500">
                              +{device.permissions.length - 4} scopes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isRevoked && (
                      <button
                        onClick={() => handleRevokeDevice(device.id)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Revoke Access
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

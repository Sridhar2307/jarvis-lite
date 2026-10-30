"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Check, X, RefreshCw, ShieldAlert } from "lucide-react";
import { Modal } from "./ui";

interface TaskStep {
  id: string;
  stepNumber: number;
  toolName: string;
  status: string;
  parametersJson: string | null;
  outputJson: string | null;
  error: string | null;
}

interface AgentTask {
  id: string;
  title: string;
  goal: string;
  status: string;
  priority: string;
  riskLevel: string;
  confirmed: boolean;
  result: string | null;
  error: string | null;
  createdAt: string;
  steps: TaskStep[];
  device?: { deviceName: string; platform: string };
}

export default function AutonomousTaskModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen]);

  const handleConfirmTask = async (taskId: string) => {
    setActionInProgress(taskId);
    try {
      const res = await fetch(`/api/agent/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true, status: "RUNNING" }),
      });
      if (res.ok) {
        loadTasks();
      }
    } catch (err) {
      console.error("Confirmation error", err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    setActionInProgress(taskId);
    try {
      const res = await fetch(`/api/agent/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (res.ok) {
        loadTasks();
      }
    } catch (err) {
      console.error("Cancellation error", err);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Autonomous Task & Workflow Inspector">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-slate-300">
              Active Task Queue ({tasks.length})
            </span>
          </div>
          <button
            onClick={loadTasks}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="p-10 text-center border border-white/5 rounded-xl bg-white/[0.02]">
            <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No automated tasks in progress.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Autonomous workflows initiated via the Command Center or Nexora voice commands will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {tasks.map((task) => {
              const isWaiting = task.status === "WAITING_CONFIRMATION";
              const isCompleted = task.status === "COMPLETED";
              const isFailed = task.status === "FAILED";

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isWaiting
                      ? "bg-amber-500/[0.04] border-amber-500/40"
                      : "bg-white/[0.02] border-white/10"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          {task.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                            isWaiting
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : isCompleted
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : isFailed
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {task.status}
                        </span>
                        {task.riskLevel === "HIGH" && (
                          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/30 rounded flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            HIGH RISK
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{task.goal}</p>
                    </div>

                    {isWaiting && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmTask(task.id)}
                          disabled={actionInProgress === task.id}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve Execution
                        </button>
                        <button
                          onClick={() => handleCancelTask(task.id)}
                          disabled={actionInProgress === task.id}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Steps List */}
                  {task.steps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                      <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                        Execution Plan ({task.steps.length} steps)
                      </span>
                      {task.steps.map((step) => (
                        <div
                          key={step.id}
                          className="p-2 rounded-lg bg-black/30 border border-white/5 flex items-center justify-between text-xs font-mono"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500">#{step.stepNumber}</span>
                            <span className="text-cyan-300">{step.toolName}</span>
                          </div>
                          <span
                            className={`text-[10px] ${
                              step.status === "COMPLETED"
                                ? "text-emerald-400"
                                : step.status === "RUNNING"
                                ? "text-cyan-400 animate-pulse"
                                : "text-slate-500"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

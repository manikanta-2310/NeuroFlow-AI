import React, { useState } from 'react';
import {
  Compass,
  Search,
  Cpu,
  FileCode,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export function TraceViewer({ trace = [] }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const stageIcons = {
    Planner: Compass,
    Retriever: Search,
    Task: Cpu,
    Writer: FileCode,
    Evaluator: ShieldCheck,
  };

  if (!trace || trace.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-dark-900/40">
        No execution trace recorded for this run.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-dark-900/60 backdrop-blur-xl p-6 shadow-glass space-y-4 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          5-Stage Pipeline Execution Trace
        </h4>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {trace.length} stages recorded
        </span>
      </div>

      <div className="space-y-3">
        {trace.map((step, idx) => {
          const Icon = stageIcons[step.stage] || Cpu;
          const isExpanded = expandedIndex === idx;
          const isSuccess = step.status === 'completed';

          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-dark-950/60 overflow-hidden transition-all shadow-xs"
            >
              {/* Stage Header */}
              <button
                type="button"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-100/70 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg border ${
                      isSuccess
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                        0{idx + 1}.
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {step.stage} Agent
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 shadow-xs">
                    {step.durationMs || 0}ms
                  </span>
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>

              {/* Stage Payload Details */}
              {isExpanded && step.details && (
                <div className="p-4 border-t border-slate-200/80 dark:border-white/5 bg-slate-100/60 dark:bg-dark-950/80">
                  <pre className="text-xs font-mono text-slate-800 dark:text-slate-300 bg-white dark:bg-dark-900 p-3 rounded-lg border border-slate-200 dark:border-white/5 overflow-x-auto whitespace-pre-wrap shadow-xs">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

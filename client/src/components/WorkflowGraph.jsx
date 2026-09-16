import React from 'react';
import {
  Compass,
  Search,
  Cpu,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export function WorkflowGraph({ workspace, documents = [], runs = [] }) {
  const isPlannerActive = !!workspace;
  const isRetrieverActive = documents.some((d) => d.status === 'ready');
  const isTaskActive = runs.length > 0;
  const isWriterActive = runs.some((r) => r.status === 'completed' && r.output);
  const isEvaluatorActive = runs.some((r) => r.status === 'completed' && r.evaluation);

  const readyDocsCount = documents.filter((d) => d.status === 'ready').length;

  const stages = [
    {
      id: 'planner',
      number: '01',
      name: 'Planner Agent',
      icon: Compass,
      active: isPlannerActive,
      desc: 'Intent parsing, query synthesis, and document candidate selection',
      metric: 'Ready',
    },
    {
      id: 'retriever',
      number: '02',
      name: 'Retriever Agent',
      icon: Search,
      active: isRetrieverActive,
      desc: 'Vector cosine similarity & BM25 hybrid ranking over document chunks',
      metric: `${readyDocsCount} Ready Docs`,
    },
    {
      id: 'task',
      number: '03',
      name: 'Task Agent',
      icon: Cpu,
      active: isTaskActive,
      desc: 'Domain reasoning: Summarize, Compare, Action Items, Research Brief',
      metric: `${runs.length} Runs`,
    },
    {
      id: 'writer',
      number: '04',
      name: 'Writer Agent',
      icon: FileCode,
      active: isWriterActive,
      desc: 'Strict JSON schema formatting and output structured payload creation',
      metric: isWriterActive ? 'Verified' : 'Pending',
    },
    {
      id: 'evaluator',
      number: '05',
      name: 'Evaluator Agent',
      icon: ShieldCheck,
      active: isEvaluatorActive,
      desc: 'Grounded citation verification, confidence scoring, and trace analysis',
      metric: isEvaluatorActive ? 'Grounded' : 'Pending',
    },
  ];

  return (
    <div className="w-full rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-dark-900/70 backdrop-blur-xl p-6 shadow-glass relative overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
              5-Stage Agentic Pipeline
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Sequential reasoning pipeline reflecting workspace index readiness and run trace telemetry
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Stage
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-500 border border-slate-200 dark:border-white/[0.06] text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-600" /> Awaiting State
          </span>
        </div>
      </div>

      {/* Pipeline Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          return (
            <div key={stage.id} className="relative flex flex-col group">
              {/* Connector line on desktop */}
              {idx < stages.length - 1 && (
                <div
                  className={`hidden md:block absolute top-6 -right-2 w-3.5 h-[1px] z-10 transition-colors duration-300 ${
                    stage.active && stages[idx + 1].active
                      ? 'bg-indigo-500/80 shadow-[0_0_6px_#6366f1]'
                      : 'bg-slate-200 dark:bg-white/[0.08]'
                  }`}
                />
              )}

              {/* Node Card */}
              <div
                className={`relative flex flex-col p-4 rounded-xl border transition-all duration-200 h-full ${
                  stage.active
                    ? 'border-indigo-300 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-[#121520] shadow-sm'
                    : 'border-slate-200/80 dark:border-white/[0.04] bg-slate-50/80 dark:bg-[#090b10]/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono border ${
                      stage.active
                        ? 'bg-indigo-600/10 dark:bg-indigo-600/20 border-indigo-300 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-300'
                        : 'bg-slate-200/50 dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-zinc-500'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase">
                    Stage {stage.number}
                  </span>
                </div>

                <div className="flex flex-col flex-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                    {stage.name}
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                    {stage.desc}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200/80 dark:border-white/[0.05] flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      stage.active
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20'
                        : 'bg-slate-100 dark:bg-white/[0.02] text-slate-400 dark:text-zinc-600'
                    }`}
                  >
                    {stage.metric}
                  </span>

                  {stage.active ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-400 dark:text-zinc-600" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

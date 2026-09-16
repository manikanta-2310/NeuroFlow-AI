import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import {
  ArrowLeft,
  Quote,
  ShieldCheck,
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { OutputCard } from '../components/OutputCard';
import { TraceViewer } from '../components/TraceViewer';

export function RunDetailsPage() {
  const { runId } = useParams();
  const [activeCitation, setActiveCitation] = useState(null);

  const { data: run, isLoading, error } = useQuery({
    queryKey: ['run', runId],
    queryFn: () => api.runs.getById(runId),
  });

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Retrieving multi-stage run execution trace..." />;
  }

  if (error || !run) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <EmptyState
          title="Run Not Found"
          description={error?.message || 'Workflow execution details not available.'}
          action={
            <Link
              to="/workspaces"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Back to Workspaces
            </Link>
          }
        />
      </div>
    );
  }

  const citations = run.citations || [];
  const evaluation = run.evaluation;
  const scorePercent = Math.round((evaluation?.score || 0.9) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to={`/workspaces/${run.workspaceId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {run.workspaceName || 'Workspace'}
        </Link>
        <span className="text-xs font-mono text-slate-400 dark:text-slate-500">Run ID: {run.id}</span>
      </div>

      {/* Execution Hero Header */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-sm space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: run.workspaceColor || '#6366f1' }}
              />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {run.workspaceName} • Type: {run.type}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {run.title}
            </h1>
          </div>

          <StatusBadge status={run.status} type="run" />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-slate-600 dark:text-slate-300">
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase block">Started At</span>
            <span className="text-slate-900 dark:text-white font-semibold block mt-0.5">
              {new Date(run.createdAt).toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase block">Total Duration</span>
            <span className="text-slate-900 dark:text-white font-semibold block mt-0.5">
              {evaluation?.latencyMs ? `${evaluation.latencyMs}ms` : '320ms'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase block">Grounded Citations</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold block mt-0.5">
              {citations.length} Verified Sources
            </span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 uppercase block">Evaluator Confidence</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
              {evaluation?.confidence || 'High'} ({scorePercent}%)
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Structured Output & Citations (Left), Trace & Evaluator (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Structured Output & Citations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <OutputCard type={run.type} output={run.output} title={run.title} />

          {/* Citations Box */}
          {citations.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Quote className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Grounded Citations & Source Evidence ({citations.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Click any citation snippet to view the original chunk text and similarity score.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {citations.map((c, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveCitation(c)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0b0f19] hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-slate-100 dark:hover:bg-[#1f2937] cursor-pointer transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-indigo-600 dark:text-indigo-300 font-bold flex items-center gap-1.5">
                        <Quote className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        {c.documentName}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Match Score: {Math.round((c.score || 0) * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed line-clamp-3">
                      "{c.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Evaluator Score Gauge & 5-Stage Execution Trace (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Evaluator Analysis Gauge Card */}
          {evaluation && (
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Evaluator Agent Assessment
                </h4>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono border border-emerald-200 dark:border-emerald-500/20">
                  {evaluation.confidence} Confidence
                </span>
              </div>

              {/* Radial Progress Score Banner */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/5 flex items-center gap-5 shadow-xs">
                <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      stroke="currentColor"
                      strokeWidth="5"
                      className="text-slate-200 dark:text-white/10"
                      fill="transparent"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      stroke="currentColor"
                      strokeWidth="5"
                      strokeDasharray={163.36}
                      strokeDashoffset={163.36 - (163.36 * scorePercent) / 100}
                      className="text-emerald-500 transition-all duration-1000"
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <span className="absolute text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    {scorePercent}%
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Groundedness Verification
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
                    {evaluation.groundedness}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/5 space-y-2 text-xs">
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  {evaluation.notes}
                </div>
              </div>
            </div>
          )}

          {/* 5-Stage Execution Trace Inspector */}
          <TraceViewer trace={run.trace} />
        </div>
      </div>

      {/* Citation Deep-Dive Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                Source Document: {activeCitation.documentName}
              </h4>
              <button
                onClick={() => setActiveCitation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/5 font-mono text-xs text-slate-800 dark:text-slate-300 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap">
              {activeCitation.snippet || activeCitation.text}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-white/5">
              <span>Similarity Score: {Math.round((activeCitation.score || 0) * 100)}%</span>
              <button
                onClick={() => setActiveCitation(null)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/15 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

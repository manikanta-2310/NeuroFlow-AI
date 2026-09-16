import React from 'react';

export function StatusBadge({ status, type = 'document' }) {
  const normalized = (status || '').toLowerCase();

  const configMap = {
    // Document statuses
    ready: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
      dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
      label: 'Ready',
    },
    processing: {
      bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
      dot: 'bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-ping',
      label: 'Processing',
    },
    uploaded: {
      bg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30',
      dot: 'bg-indigo-500 shadow-[0_0_8px_#6366f1]',
      label: 'Uploaded',
    },
    failed: {
      bg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
      dot: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
      label: 'Failed',
    },

    // Workflow Run statuses
    completed: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30',
      dot: 'bg-emerald-500 shadow-[0_0_8px_#10b981]',
      label: 'Completed',
    },
    running: {
      bg: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/30',
      dot: 'bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-pulse',
      label: 'Running',
    },
    queued: {
      bg: 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30',
      dot: 'bg-slate-400',
      label: 'Queued',
    },
  };

  const current = configMap[normalized] || {
    bg: 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/30',
    dot: 'bg-slate-400',
    label: status || 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

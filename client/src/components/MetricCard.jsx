import React from 'react';

export function MetricCard({ title, value, icon: Icon, color = 'indigo', subtitle }) {
  const colorMap = {
    indigo: {
      border: 'hover:border-indigo-500/40',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.15)]',
    },
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(6,182,212,0.15)]',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(16,185,129,0.15)]',
    },
    violet: {
      border: 'hover:border-violet-500/40',
      iconBg: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(139,92,246,0.15)]',
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`group relative rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-dark-900/60 backdrop-blur-xl p-6 transition-all duration-300 shadow-glass ${scheme.border} ${scheme.glow}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
          {value}
        </span>
        {subtitle && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md', text = 'Processing agent pipeline...' }) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size] || 'w-8 h-8 border-3';

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div
        className={`${sizeClass} rounded-full border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-400 animate-spin`}
      />
      {text && <span className="text-xs font-medium text-slate-500 dark:text-slate-400 animate-pulse">{text}</span>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-dark-900/30">
      {Icon && (
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 mb-4 shadow-xs">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>
      )}
      {action && action}
    </div>
  );
}

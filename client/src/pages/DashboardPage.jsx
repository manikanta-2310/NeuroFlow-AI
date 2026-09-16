import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  FolderKanban,
  FileText,
  Play,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  Cpu,
  Database,
  FileSpreadsheet,
  Image as ImageIcon,
} from 'lucide-react';
import { MetricCard, LoadingSpinner, EmptyState } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsColor, setNewWsColor] = useState('#6366f1');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.dashboard.get(),
  });

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    try {
      const ws = await api.workspaces.create({
        name: newWsName.trim(),
        description: newWsDesc.trim(),
        color: newWsColor,
      });
      setIsCreateModalOpen(false);
      setNewWsName('');
      setNewWsDesc('');
      refetch();
      navigate(`/workspaces/${ws.id}`);
    } catch (err) {
      alert(`Error creating workspace: ${err.message}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner size="lg" text="Synthesizing document intelligence metrics..." />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <EmptyState
          title="Failed to Load Dashboard"
          description={error.message}
          action={
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const recentWorkspaces = data?.recentWorkspaces || [];
  const recentRuns = data?.recentRuns || [];
  const recentDocs = data?.recentDocuments || [];
  const systemStatus = data?.systemStatus || {};

  const getDocIcon = (fileType) => {
    if (fileType === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (fileType === 'docx') return <FileText className="w-4 h-4 text-blue-500" />;
    if (fileType === 'csv') return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (fileType === 'image') return <ImageIcon className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-indigo-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-8 shadow-sm overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Multi-Stage Agentic Intelligence Active</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
              Workspace Overview & Operations
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Synthesizing documents, indexing vector chunks, and executing structured reasoning pipelines with verifiable citations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> New Workspace
            </button>
          </div>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Repository Engine</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Storage: <strong className="text-indigo-600 dark:text-indigo-300 uppercase">{systemStatus.storageMode || 'Memory'}</strong> Mode
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 text-xs font-mono">
            Active
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">AI Inference Stack</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {systemStatus.ollamaConnected ? (
                  <>LLaMA 3.1 & nomic-embed-text (Local Ollama)</>
                ) : (
                  <>Deterministic Fallback Engine (Offline Mode)</>
                )}
              </span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono border ${
              systemStatus.ollamaConnected
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
            }`}
          >
            {systemStatus.ollamaConnected ? 'Ollama Online' : 'Fallback Active'}
          </span>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Active Workspaces"
          value={metrics.workspacesCount || 0}
          icon={FolderKanban}
          color="indigo"
          subtitle="isolated domains"
        />
        <MetricCard
          title="Ingested Documents"
          value={metrics.documentsCount || 0}
          icon={FileText}
          color="cyan"
          subtitle="PDF, DOCX, CSV, MD"
        />
        <MetricCard
          title="Searchable Chunks"
          value={metrics.chunksCount || 0}
          icon={Layers}
          color="emerald"
          subtitle="vector indexed"
        />
        <MetricCard
          title="Workflow Executions"
          value={metrics.runsCount || 0}
          icon={Play}
          color="violet"
          subtitle="5-stage runs"
        />
      </div>

      {/* Main Content Grid: Workspaces & Recent Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Workspaces List (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Active Workspaces</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Jump directly into your document workspaces</p>
            </div>
            <Link
              to="/workspaces"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentWorkspaces.length === 0 ? (
            <EmptyState
              icon={FolderKanban}
              title="No Workspaces Created"
              description="Create your first workspace to start uploading documents and running AI workflows."
              action={
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs"
                >
                  Create Workspace
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentWorkspaces.map((ws) => (
                <Link
                  key={ws.id}
                  to={`/workspaces/${ws.id}`}
                  className="group rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-5 hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-[#1f2937] transition-all duration-300 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                        style={{ backgroundColor: ws.color || '#6366f1' }}
                      />
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                        {new Date(ws.updatedAt || ws.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                      {ws.name}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {ws.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>Open Workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 text-indigo-600 dark:text-indigo-400 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Recent Ingested Documents List */}
          <div className="pt-4 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Ingested Documents</h3>
            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-white/5 overflow-hidden shadow-sm">
              {recentDocs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                  No documents uploaded yet.
                </div>
              ) : (
                recentDocs.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                        {getDocIcon(doc.fileType)}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                          {doc.originalName}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {(doc.size / 1024).toFixed(1)} KB • {doc.fileType?.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <StatusBadge status={doc.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Workflow Runs Timeline */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Recent Executions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live agent pipeline outputs</p>
            </div>
          </div>

          <div className="space-y-3">
            {recentRuns.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827]">
                No workflow runs recorded yet.
              </div>
            ) : (
              recentRuns.map((run) => (
                <Link
                  key={run.id}
                  to={`/runs/${run.id}`}
                  className="block p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-[#1f2937] transition-all shadow-sm group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-semibold truncate max-w-[160px]"
                      style={{ color: run.workspaceColor || '#6366f1' }}
                    >
                      {run.workspaceName}
                    </span>
                    <StatusBadge status={run.status} type="run" />
                  </div>

                  <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {run.title}
                  </h5>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      {new Date(run.createdAt).toLocaleTimeString()}
                    </span>

                    {run.evaluation && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {(run.evaluation.score * 100).toFixed(0)}% Confidence
                      </span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-dark-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-900 p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Legal & Contract Intelligence"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-950/70 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  rows={2}
                  placeholder="Workspace scope and intelligence focus..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-950/70 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Workspace Accent Color
                </label>
                <div className="flex items-center gap-3">
                  {['#6366f1', '#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e'].map(
                    (c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setNewWsColor(c)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          newWsColor === c ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

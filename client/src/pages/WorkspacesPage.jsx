import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
  FolderKanban,
  Plus,
  Search,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../components/MetricCard';

export function WorkspacesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.workspaces.list(),
  });

  const createMutation = useMutation({
    mutationFn: (newWs) => api.workspaces.create(newWs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsModalOpen(false);
      setName('');
      setDescription('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.workspaces.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description: description.trim(), color });
  };

  const handleDelete = (e, id, wsName) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete workspace "${wsName}"? All associated documents and runs will be deleted.`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredWorkspaces = workspaces.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.description && w.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Workspaces</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your document domains and multi-stage intelligence workspaces
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Workspace
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search workspaces by name or topic..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors shadow-sm"
        />
      </div>

      {/* Workspaces Grid */}
      {isLoading ? (
        <LoadingSpinner size="lg" text="Loading intelligence workspaces..." />
      ) : filteredWorkspaces.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={searchTerm ? 'No matching workspaces found' : 'No workspaces yet'}
          description={
            searchTerm
              ? 'Try modifying your search term.'
              : 'Create your first workspace to organize and reason over your documents.'
          }
          action={
            !searchTerm && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
              >
                Create Workspace
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((ws) => (
            <Link
              key={ws.id}
              to={`/workspaces/${ws.id}`}
              className="group rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-slate-50 dark:hover:bg-[#1f2937] transition-all duration-300 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: ws.color || '#6366f1' }}
                    />
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Workspace</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, ws.id, ws.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Workspace"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                  {ws.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {ws.description || 'No description provided.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {ws.documentsCount || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Docs</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {ws.chunksCount || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Chunks</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {ws.runsCount || 0}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">Runs</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold pt-1">
                  <span>Open Hub</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Financial Reports & Audit"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Workspace objectives and knowledge assets..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
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
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full transition-transform ${
                          color === c ? 'scale-125 ring-2 ring-indigo-500' : 'opacity-70 hover:opacity-100'
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
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

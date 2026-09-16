import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import {
  FolderKanban,
  FileText,
  UploadCloud,
  Play,
  Sparkles,
  Layers,
  RotateCw,
  Trash2,
  Eye,
  GitCompare,
  ListTodo,
  BookOpen,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Image as ImageIcon,
  Search,
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { WorkflowGraph } from '../components/WorkflowGraph';
import { WorkflowModal } from '../components/WorkflowModal';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { ChatPanel } from '../components/ChatPanel';

export function WorkspaceDetailsPage() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [docSearch, setDocSearch] = useState('');
  const [activeFormatFilter, setActiveFormatFilter] = useState('all'); // 'all' | 'pdf' | 'docx' | 'csv' | 'txt' | 'image'
  const [isPageDragging, setIsPageDragging] = useState(false);

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [inspectingDoc, setInspectingDoc] = useState(null);

  // Queries
  const { data: workspace, isLoading: wsLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => api.workspaces.getById(workspaceId),
  });

  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents', workspaceId],
    queryFn: () => api.documents.listByWorkspace(workspaceId),
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.some((d) => d.status === 'processing');
      return hasProcessing ? 2000 : false;
    },
  });

  const { data: runs = [], isLoading: runsLoading } = useQuery({
    queryKey: ['runs', workspaceId],
    queryFn: () => api.runs.listByWorkspace(workspaceId),
  });

  // Upload Mutation
  const uploadMutation = useMutation({
    mutationFn: (formData) => api.documents.upload(workspaceId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsUploadOpen(false);
    },
    onError: (err) => {
      alert(`Upload error: ${err.message}`);
    },
  });

  // Reprocess Mutation
  const reprocessMutation = useMutation({
    mutationFn: (docId) => api.documents.reprocess(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', workspaceId] });
    },
  });

  // Delete Doc Mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId) => api.documents.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Workflow Execution Mutation
  const workflowMutation = useMutation({
    mutationFn: async ({ type, payload }) => {
      if (type === 'summarize') return api.runs.summarize(workspaceId, payload);
      if (type === 'compare') return api.runs.compare(workspaceId, payload);
      if (type === 'meeting_action_items') return api.runs.meetingActionItems(workspaceId, payload);
      if (type === 'research_brief') return api.runs.researchBrief(workspaceId, payload);
    },
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: ['runs', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setSelectedWorkflow(null);
      if (run?.id) {
        navigate(`/runs/${run.id}`);
      }
    },
    onError: (err) => {
      alert(`Workflow execution error: ${err.message}`);
    },
  });

  const handleInspectDoc = async (docId) => {
    try {
      const doc = await api.documents.getById(docId);
      setInspectingDoc(doc);
    } catch (err) {
      alert(`Error fetching document details: ${err.message}`);
    }
  };

  const handlePageDragOver = (e) => {
    e.preventDefault();
    setIsPageDragging(true);
  };

  const handlePageDragLeave = (e) => {
    e.preventDefault();
    setIsPageDragging(false);
  };

  const handlePageDrop = (e) => {
    e.preventDefault();
    setIsPageDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const formData = new FormData();
      formData.append('file', file);
      uploadMutation.mutate(formData);
    }
  };

  const getDocIcon = (fileType) => {
    if (fileType === 'pdf') return <FileText className="w-4 h-4 text-rose-500" />;
    if (fileType === 'docx') return <FileText className="w-4 h-4 text-blue-500" />;
    if (fileType === 'csv') return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
    if (fileType === 'image') return <ImageIcon className="w-4 h-4 text-amber-500" />;
    return <FileText className="w-4 h-4 text-indigo-500" />;
  };

  if (wsLoading) {
    return <LoadingSpinner size="lg" text="Loading intelligence workspace..." />;
  }

  if (!workspace) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <EmptyState
          title="Workspace Not Found"
          description="The requested workspace does not exist or has been removed."
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

  const readyDocs = documents.filter((d) => d.status === 'ready');

  const filteredDocs = documents.filter((d) => {
    const matchesQuery =
      d.originalName?.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.fileType?.toLowerCase().includes(docSearch.toLowerCase());

    if (!matchesQuery) return false;
    if (activeFormatFilter === 'all') return true;
    if (activeFormatFilter === 'txt') return d.fileType === 'txt' || d.fileType === 'md';
    return d.fileType === activeFormatFilter;
  });

  return (
    <div
      onDragOver={handlePageDragOver}
      onDragLeave={handlePageDragLeave}
      onDrop={handlePageDrop}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in"
    >
      {/* Whole-page drag-over overlay */}
      {isPageDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-md border-4 border-dashed border-indigo-500 animate-fade-in pointer-events-none">
          <div className="flex flex-col items-center text-center p-8">
            <div className="p-6 rounded-3xl bg-indigo-500/20 text-indigo-500 mb-4 animate-bounce">
              <UploadCloud className="w-16 h-16" />
            </div>
            <h2 className="text-2xl font-bold text-white">Drop File to Ingest</h2>
            <p className="text-sm text-slate-200 mt-2">
              Automatically extracts text, partitions chunks, and creates vector embeddings
            </p>
          </div>
        </div>
      )}

      {/* Workspace Header & Actions */}
      <div className="relative rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-sm overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shadow-sm"
                style={{ backgroundColor: workspace.color || '#6366f1' }}
              />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Intelligence Hub
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
              {workspace.name}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {workspace.description || 'No description configured for this workspace.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-md transition-all"
            >
              <UploadCloud className="w-4 h-4" /> Upload Document
            </button>
          </div>
        </div>

        {/* Workspace Quick Stats Row */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/5">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Documents</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white block mt-0.5">
              {documents.length}{' '}
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-normal">
                ({readyDocs.length} ready)
              </span>
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/5">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Vector Chunks</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white block mt-0.5">
              {workspace.chunksCount || 0}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/5">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Total Runs</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white block mt-0.5">
              {runs.length}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200/80 dark:border-white/5">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase">Grounded Citations</span>
            <span className="text-xl font-bold text-cyan-600 dark:text-cyan-300 block mt-0.5">
              Enabled
            </span>
          </div>
        </div>
      </div>

      {/* 5-Stage Visual Workflow Graph */}
      <WorkflowGraph workspace={workspace} documents={documents} runs={runs} />

      {/* Workflow Action Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Trigger Agentic Workflows
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Execute reasoning agents across ready documents in this workspace
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedWorkflow('summarize')}
            disabled={readyDocs.length === 0}
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b0f19] hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 text-left transition-all group disabled:opacity-40"
          >
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                Summarize
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
                Executive overview & main points
              </span>
            </div>
          </button>

          <button
            onClick={() => setSelectedWorkflow('compare')}
            disabled={readyDocs.length < 2}
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b0f19] hover:border-cyan-400 dark:hover:border-cyan-500/40 hover:bg-cyan-50/60 dark:hover:bg-cyan-950/20 text-left transition-all group disabled:opacity-40"
          >
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 group-hover:scale-105 transition-transform">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
                Compare Docs
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
                Cross-document differential analysis (2+ docs)
              </span>
            </div>
          </button>

          <button
            onClick={() => setSelectedWorkflow('meeting_action_items')}
            disabled={readyDocs.length === 0}
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b0f19] hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20 text-left transition-all group disabled:opacity-40"
          >
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 group-hover:scale-105 transition-transform">
              <ListTodo className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                Action Items
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
                Extract tasks, owners, and priorities
              </span>
            </div>
          </button>

          <button
            onClick={() => setSelectedWorkflow('research_brief')}
            disabled={readyDocs.length === 0}
            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0b0f19] hover:border-violet-400 dark:hover:border-violet-500/40 hover:bg-violet-50/60 dark:hover:bg-violet-950/20 text-left transition-all group disabled:opacity-40"
          >
            <div className="p-2 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 dark:text-white block group-hover:text-violet-600 dark:group-hover:text-violet-300">
                Research Brief
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-tight">
                Themed intelligence briefing
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Two-Column Hub: Document Manager & Interactive Grounded Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Documents List & Run History (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Document Management Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Ingested Documents ({documents.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Extracted, paragraph-chunked, and indexed for semantic search
                </p>
              </div>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 transition-colors"
              >
                + Add File
              </button>
            </div>

            {/* Document Search & Filter Tabs */}
            {documents.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Search documents by name..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'all', label: `All (${documents.length})` },
                    { id: 'pdf', label: 'PDF' },
                    { id: 'docx', label: 'DOCX' },
                    { id: 'csv', label: 'CSV' },
                    { id: 'txt', label: 'Text/MD' },
                    { id: 'image', label: 'Images' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFormatFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                        activeFormatFilter === tab.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-white/5'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredDocs.length === 0 ? (
              <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-[#0b0f19]/40">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                  {docSearch || activeFormatFilter !== 'all'
                    ? 'No matching documents found'
                    : 'No documents uploaded'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">
                  {docSearch
                    ? 'Try adjusting your search query or format filter.'
                    : 'Drag and drop any file onto this page or click Upload.'}
                </span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-xl border border-slate-200/80 dark:border-white/5 overflow-hidden bg-slate-50/50 dark:bg-[#0b0f19] max-h-[380px] overflow-y-auto">
                {filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/60 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 mt-0.5 shadow-xs">
                        {getDocIcon(doc.fileType)}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900 dark:text-white block leading-tight">
                          {doc.originalName}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                          <span>{(doc.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>{doc.fileType?.toUpperCase()}</span>
                          {doc.pageCount && (
                            <>
                              <span>•</span>
                              <span>{doc.pageCount} pgs</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <StatusBadge status={doc.status} />

                      <button
                        onClick={() => handleInspectDoc(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10"
                        title="Inspect Text & Chunks"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => reprocessMutation.mutate(doc.id)}
                        disabled={reprocessMutation.isPending}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
                        title="Reprocess & Generate Embeddings"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Delete "${doc.originalName}"?`)) {
                            deleteDocMutation.mutate(doc.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Runs History for this Workspace */}
          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Workflow Execution History ({runs.length})
            </h3>

            {runs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No runs executed yet in this workspace.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {runs.map((run) => (
                  <Link
                    key={run.id}
                    to={`/runs/${run.id}`}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/5 bg-slate-50 dark:bg-[#0b0f19] hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:bg-slate-100/70 dark:hover:bg-[#1f2937] flex items-center justify-between gap-4 transition-all group"
                  >
                    <div>
                      <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors block">
                        {run.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block">
                        Type: {run.type} • {new Date(run.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={run.status} type="run" />
                      <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:translate-x-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Grounded Workspace Chat (5 cols) */}
        <div className="lg:col-span-5">
          <ChatPanel workspaceId={workspaceId} documents={documents} />
        </div>
      </div>

      {/* Workflow Execution Trigger Modal */}
      {selectedWorkflow && (
        <WorkflowModal
          isOpen={!!selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          workflowType={selectedWorkflow}
          documents={documents}
          onSubmit={(payload) =>
            workflowMutation.mutate({ type: selectedWorkflow, payload })
          }
          isLoading={workflowMutation.isPending}
        />
      )}

      {/* Document Upload Modal */}
      {isUploadOpen && (
        <DocumentUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUpload={(formData) => uploadMutation.mutate(formData)}
          isUploading={uploadMutation.isPending}
        />
      )}

      {/* Document Text & Chunk Inspector Modal */}
      {inspectingDoc && (
        <DocumentPreviewModal
          isOpen={!!inspectingDoc}
          onClose={() => setInspectingDoc(null)}
          document={inspectingDoc}
        />
      )}
    </div>
  );
}

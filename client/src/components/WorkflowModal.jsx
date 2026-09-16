import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FileText,
  GitCompare,
  ListTodo,
  BookOpen,
  Check,
  AlertCircle,
} from 'lucide-react';

export function WorkflowModal({
  isOpen,
  onClose,
  workflowType,
  documents = [],
  onSubmit,
  isLoading,
}) {
  const [prompt, setPrompt] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const readyDocs = documents.filter((d) => d.status === 'ready');

  const handleDocToggle = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (workflowType === 'compare' && selectedDocIds.length < 2) {
      setError('Please select at least 2 documents to compare.');
      return;
    }

    const payload = {};
    if (workflowType === 'summarize') {
      payload.prompt = prompt;
    } else if (workflowType === 'compare') {
      payload.documentIds = selectedDocIds;
      payload.prompt = prompt;
    } else if (workflowType === 'meeting_action_items') {
      payload.documentIds = selectedDocIds.length > 0 ? selectedDocIds : undefined;
      payload.prompt = prompt;
    } else if (workflowType === 'research_brief') {
      payload.topic = topic;
      payload.prompt = prompt;
    }

    onSubmit(payload);
  };

  const workflowMeta = {
    summarize: {
      title: 'Summarize Workspace',
      icon: FileText,
      color: 'indigo',
      desc: 'Synthesizes all ready documents in the workspace into an executive summary with key takeaways.',
    },
    compare: {
      title: 'Compare Documents',
      icon: GitCompare,
      color: 'cyan',
      desc: 'Performs cross-document structural analysis, isolating core similarities, differences, and takeaways.',
    },
    meeting_action_items: {
      title: 'Meeting Notes -> Action Items',
      icon: ListTodo,
      color: 'emerald',
      desc: 'Scans transcripts or meeting notes to extract concrete tasks, assigned owners, priority tracks, and deadlines.',
    },
    research_brief: {
      title: 'Generate Research Brief',
      icon: BookOpen,
      color: 'violet',
      desc: 'Produces a comprehensive themed research brief structured by key domain topics and conclusions.',
    },
  }[workflowType] || {
    title: 'Run AI Workflow',
    icon: Sparkles,
    color: 'indigo',
    desc: 'Execute 5-stage agentic workflow over workspace documents.',
  };

  const Icon = workflowMeta.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-dark-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {workflowMeta.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{workflowMeta.desc}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Research Brief Topic */}
          {workflowType === 'research_brief' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                Research Topic / Subject
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Vector Database Benchmarking & Retrieval Scalability"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          )}

          {/* Document selection for compare & action items */}
          {(workflowType === 'compare' || workflowType === 'meeting_action_items') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                {workflowType === 'compare'
                  ? 'Select Documents to Compare (Min 2 required)'
                  : 'Filter by Documents (Optional)'}
              </label>

              {readyDocs.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
                  No ready documents in this workspace yet. Upload documents first.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {readyDocs.map((doc) => {
                    const isSelected = selectedDocIds.includes(doc.id);
                    return (
                      <button
                        type="button"
                        key={doc.id}
                        onClick={() => handleDocToggle(doc.id)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-900 dark:text-white font-medium'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50/70 dark:bg-dark-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <span className="truncate pr-2">{doc.originalName}</span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Custom instructions / prompt */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
              Custom Instructions / Focus (Optional)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="e.g., Focus specifically on architectural security and SLA requirements..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Running 5-Stage Agent...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Execute Workflow
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

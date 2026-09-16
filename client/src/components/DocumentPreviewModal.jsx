import React, { useState } from 'react';
import { X, FileText, Layers, Hash, BookOpen, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export function DocumentPreviewModal({ isOpen, onClose, document: doc }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'text' | 'chunks'

  if (!isOpen || !doc) return null;

  const chunks = doc.chunks || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-dark-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {doc.originalName}
                </h3>
                <StatusBadge status={doc.status} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                <span>{(doc.size / 1024).toFixed(1)} KB</span>
                <span>•</span>
                <span>Type: {doc.fileType?.toUpperCase()}</span>
                <span>•</span>
                <span>{chunks.length} Chunks</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-dark-950/30">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'summary'
                ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Executive Summary
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'text'
                ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Extracted Text
          </button>

          <button
            onClick={() => setActiveTab('chunks')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-semibold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'chunks'
                ? 'border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Indexed Chunks ({chunks.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {doc.processingError && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-600 dark:text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Processing Warning/Error:</span>
                <span>{doc.processingError}</span>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200 dark:border-white/10 leading-relaxed text-sm text-slate-800 dark:text-slate-200">
              {doc.summary || 'No summary generated yet for this document.'}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200 dark:border-white/10 font-mono text-xs text-slate-800 dark:text-slate-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
              {doc.extractedText || 'No text extracted.'}
            </div>
          )}

          {activeTab === 'chunks' && (
            <div className="space-y-3">
              {chunks.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No searchable chunks generated for this document.
                </div>
              ) : (
                chunks.map((chunk, idx) => (
                  <div
                    key={chunk.id || idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200 dark:border-white/10 space-y-2 hover:border-indigo-400 dark:hover:border-indigo-500/30 transition-colors shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-300 font-semibold">
                        <Hash className="w-3.5 h-3.5" /> Chunk #{chunk.chunkIndex + 1}
                      </span>
                      <span>~{chunk.tokenCountApprox || 0} tokens</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">
                      {chunk.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  FileText,
  GitCompare,
  ListTodo,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Copy,
  Check,
  Download,
} from 'lucide-react';

function convertOutputToMarkdown(type, output) {
  if (!output) return '';

  switch (type) {
    case 'ask':
      return `# Answer\n\n${output.answer || JSON.stringify(output)}`;

    case 'summarize': {
      let md = `# Executive Summary\n\n${output.summary || ''}\n\n## Key Takeaways\n\n`;
      (output.keyPoints || []).forEach((kp, idx) => {
        md += `${idx + 1}. ${kp}\n`;
      });
      return md;
    }

    case 'compare': {
      let md = `# Comparative Analysis\n\n${output.overview || ''}\n\n## Key Similarities\n\n`;
      (output.similarities || []).forEach((s) => {
        md += `- ${s}\n`;
      });
      md += `\n## Structural Differences\n\n`;
      (output.differences || []).forEach((d) => {
        md += `- ${d}\n`;
      });
      if (output.documentTakeaways?.length) {
        md += `\n## Document Takeaways\n\n`;
        output.documentTakeaways.forEach((t) => {
          md += `### ${t.documentName}\n${t.takeaway}\n\n`;
        });
      }
      return md;
    }

    case 'meeting_action_items': {
      let md = `# Meeting Synthesis\n\n${output.summary || ''}\n\n## Action Items\n\n`;
      md += `| Task | Owner | Priority | Due |\n| --- | --- | --- | --- |\n`;
      (output.actionItems || []).forEach((item) => {
        md += `| ${item.task} | ${item.owner || 'Unassigned'} | ${item.priority || 'Normal'} | ${item.dueNote || '-'} |\n`;
      });
      return md;
    }

    case 'research_brief': {
      let md = `# ${output.title || 'Research Brief'}\n\n## Executive Summary\n\n${output.executiveSummary || ''}\n\n`;
      (output.themes || []).forEach((theme, idx) => {
        md += `### ${idx + 1}. ${theme.heading}\n\n`;
        (theme.details || []).forEach((detail) => {
          md += `- ${detail}\n`;
        });
        md += '\n';
      });
      if (output.conclusion) {
        md += `## Conclusion\n\n${output.conclusion}\n`;
      }
      return md;
    }

    default:
      return JSON.stringify(output, null, 2);
  }
}

export function OutputCard({ type, output, title = 'Report' }) {
  const [copied, setCopied] = useState(false);

  if (!output) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/70 dark:bg-dark-900/40">
        No output generated yet.
      </div>
    );
  }

  const handleCopy = () => {
    const md = convertOutputToMarkdown(type, output);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format = 'md') => {
    let content = '';
    let mimeType = 'text/markdown';
    let filename = `${(title || 'report').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(output, null, 2);
      mimeType = 'application/json';
    } else {
      content = convertOutputToMarkdown(type, output);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-dark-900/60 backdrop-blur-xl shadow-glass overflow-hidden transition-colors">
      {/* Action Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-dark-950/40">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          Structured Agent Output
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors shadow-xs"
            title="Copy formatted markdown"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          <button
            onClick={() => handleDownload('md')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/40 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 transition-colors shadow-xs"
            title="Download report (.md)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .md</span>
          </button>

          <button
            onClick={() => handleDownload('json')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-xs font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors shadow-xs"
            title="Download raw JSON"
          >
            JSON
          </button>
        </div>
      </div>

      {/* Main Output Renderers */}
      <div className="p-6 space-y-6">
        {/* 1. Ask Workspace */}
        {type === 'ask' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Synthesized Answer
            </h4>
            <div className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 dark:bg-dark-950/40 p-5 rounded-xl border border-slate-200/80 dark:border-white/5">
              {output.answer || JSON.stringify(output)}
            </div>
          </div>
        )}

        {/* 2. Summarize Workspace */}
        {type === 'summarize' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Executive Summary
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-dark-950/40 p-4 rounded-xl border border-slate-200/80 dark:border-white/5 whitespace-pre-wrap">
                {output.summary || 'Summary unavailable.'}
              </p>
            </div>

            {output.keyPoints && output.keyPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider font-mono mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" /> Key Takeaways ({output.keyPoints.length})
                </h4>
                <div className="space-y-2">
                  {output.keyPoints.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-dark-950/40 border border-slate-200/80 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0 text-xs font-mono mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Compare Documents */}
        {type === 'compare' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                <GitCompare className="w-4 h-4" /> Comparative Overview
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-dark-950/40 p-4 rounded-xl border border-slate-200/80 dark:border-white/5 whitespace-pre-wrap">
                {output.overview || 'Comparison overview complete.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 space-y-3">
                <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Key Similarities
                </h5>
                <ul className="space-y-2">
                  {(output.similarities || []).map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 space-y-3">
                <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Structural Differences
                </h5>
                <ul className="space-y-2">
                  {(output.differences || []).map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {output.documentTakeaways && output.documentTakeaways.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider font-mono mb-3">
                  Document-Specific Takeaways
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {output.documentTakeaways.map((takeaway, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/5 space-y-1.5"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {takeaway.documentName || `Document #${idx + 1}`}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                        {takeaway.takeaway}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Meeting Notes -> Action Items */}
        {type === 'meeting_action_items' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4" /> Meeting Synthesis
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-dark-950/40 p-4 rounded-xl border border-slate-200/80 dark:border-white/5 whitespace-pre-wrap">
                {output.summary || 'Action items extracted from notes.'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-3">
                Extracted Action Items ({(output.actionItems || []).length})
              </h4>
              <div className="space-y-3">
                {(output.actionItems || []).map((item, idx) => {
                  const priorityClass =
                    {
                      High: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30',
                      Medium: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30',
                      Low: 'bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30',
                    }[item.priority] || 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30';

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-400 dark:hover:border-emerald-500/30 transition-colors shadow-xs"
                    >
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                          {item.task}
                        </span>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            Owner: {item.owner || 'Unassigned'}
                          </span>
                          {item.dueNote && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                              Due: {item.dueNote}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border shrink-0 ${priorityClass}`}
                      >
                        {item.priority || 'Normal'} Priority
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 5. Research Brief */}
        {type === 'research_brief' && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-mono uppercase text-violet-600 dark:text-violet-400 tracking-wider font-semibold">
                Document Intelligence Brief
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {output.title || 'Research Brief'}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-dark-950/40 p-4 rounded-xl border border-slate-200/80 dark:border-white/5 mt-3 whitespace-pre-wrap">
                {output.executiveSummary}
              </p>
            </div>

            <div className="space-y-4">
              {(output.themes || []).map((theme, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-dark-950/60 border border-slate-200/80 dark:border-white/5 space-y-2 shadow-xs"
                >
                  <h5 className="text-sm font-bold text-indigo-700 dark:text-cyan-300 flex items-center gap-2 font-mono">
                    <span>0{idx + 1}.</span> {theme.heading}
                  </h5>
                  <ul className="space-y-1.5 pl-4">
                    {(theme.details || []).map((detail, dIdx) => (
                      <li key={dIdx} className="text-xs text-slate-700 dark:text-slate-300 list-disc leading-relaxed">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {output.conclusion && (
              <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
                <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider font-mono mb-1">
                  Conclusion & Strategic Takeaway
                </h5>
                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                  {output.conclusion}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

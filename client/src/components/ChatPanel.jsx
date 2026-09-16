import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  User,
  Quote,
  Plus,
} from 'lucide-react';
import { api } from '../api';

export function ChatPanel({ workspaceId, documents = [] }) {
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const messagesEndRef = useRef(null);

  const loadThreads = async () => {
    try {
      const data = await api.chat.getThreads(workspaceId);
      setThreads(data);
      if (data.length > 0 && !activeThreadId) {
        setActiveThreadId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load chat threads:', err);
    }
  };

  const loadMessages = async (threadId) => {
    if (!threadId) {
      setMessages([]);
      return;
    }
    try {
      const data = await api.chat.getMessages(workspaceId, threadId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [workspaceId]);

  useEffect(() => {
    if (activeThreadId) {
      loadMessages(activeThreadId);
    } else {
      setMessages([]);
    }
  }, [activeThreadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleStartNewThread = () => {
    setActiveThreadId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isSending) return;

    const question = inputQuestion.trim();
    setInputQuestion('');
    setIsSending(true);

    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: question,
      citations: [],
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.chat.sendMessage(workspaceId, {
        question,
        threadId: activeThreadId,
      });

      if (!activeThreadId && response.threadId) {
        setActiveThreadId(response.threadId);
        loadThreads();
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.userMessage,
        response.assistantMessage,
      ]);
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Agent Error: ${err.message}. Please verify your workspace documents.`,
          citations: [],
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-dark-900/70 backdrop-blur-xl shadow-glass overflow-hidden transition-colors">
      {/* Header with Thread Switcher & + New Thread */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-dark-950/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
              Intelligence Chat
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Grounded in {documents.filter((d) => d.status === 'ready').length} ready docs
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {threads.length > 0 && (
            <select
              value={activeThreadId || ''}
              onChange={(e) => setActiveThreadId(e.target.value || null)}
              className="max-w-[140px] truncate px-2.5 py-1 rounded-lg bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">+ New Topic...</option>
              {threads.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleStartNewThread}
            className="p-1.5 rounded-lg bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors"
            title="Start New Chat Thread"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 dark:text-slate-400">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-white/5 border border-indigo-200 dark:border-white/10 mb-3 shadow-xs">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-cyan-400" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              Ask anything about your workspace documents
            </p>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              Planner retrieves candidate chunks, computes vector similarity scores, and synthesizes answers with citations.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg.id || idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 dark:bg-gradient-to-tr dark:from-indigo-600 dark:to-cyan-500 p-[1px] shrink-0 mt-0.5 shadow-xs">
                  <div className="w-full h-full bg-white dark:bg-dark-900 rounded-lg flex items-center justify-center border border-indigo-200 dark:border-transparent">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                  </div>
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
                    : 'bg-slate-100 dark:bg-dark-850 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Citations list for assistant messages */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10">
                    <span className="text-[11px] uppercase tracking-wider font-mono text-slate-500 dark:text-slate-400 block mb-1.5 flex items-center gap-1">
                      <Quote className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Grounded Citations ({msg.citations.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((c, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() => setActiveCitation(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all font-mono shadow-xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                          <span className="max-w-[130px] truncate">{c.documentName}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            ({Math.round((c.score || 0) * 100)}%)
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-white/10 p-[1px] shrink-0 mt-0.5">
                  <div className="w-full h-full bg-white dark:bg-dark-900 rounded-lg flex items-center justify-center border border-indigo-200 dark:border-transparent">
                    <User className="w-4 h-4 text-indigo-700 dark:text-slate-300" />
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {isSending && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-gradient-to-tr dark:from-indigo-600 dark:to-cyan-500 p-[1px] shrink-0 shadow-xs">
              <div className="w-full h-full bg-white dark:bg-dark-900 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-cyan-400 animate-spin-slow" />
              </div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-100 dark:bg-dark-850 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Planner & Retriever synthesizing context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-950/70">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            disabled={isSending}
            placeholder="Ask a question across workspace documents..."
            className="w-full pl-4 pr-12 py-3 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:outline-none focus:border-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors shadow-xs"
          />
          <button
            type="submit"
            disabled={!inputQuestion.trim() || isSending}
            className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Citation Popover Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-dark-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Quote className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  Citation: {activeCitation.documentName}
                </h4>
              </div>
              <button
                onClick={() => setActiveCitation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-white/5 font-mono text-xs text-slate-800 dark:text-slate-300 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap">
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

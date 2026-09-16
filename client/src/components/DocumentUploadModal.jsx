import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  File,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function DocumentUploadModal({ isOpen, onClose, onUpload, isUploading }) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setError('');
    const allowedExts = ['pdf', 'docx', 'txt', 'md', 'csv', 'png', 'jpg', 'jpeg', 'webp'];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (!ext || !allowedExts.includes(ext)) {
      setError(`Unsupported file format .${ext}. Supported: PDF, DOCX, TXT, MD, CSV, PNG, JPG, JPEG, WEBP`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds maximum upload limit of 10MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('file', selectedFile);
    onUpload(formData);
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-8 h-8 text-rose-500" />;
    if (ext === 'docx') return <FileText className="w-8 h-8 text-blue-500" />;
    if (ext === 'csv') return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return <ImageIcon className="w-8 h-8 text-amber-500" />;
    return <File className="w-8 h-8 text-indigo-500" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-dark-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-dark-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Upload Document</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                PDF, DOCX, TXT, MD, CSV, or Image (Max 10MB)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upload Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-500/5'
                : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-dark-950/40 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/50 dark:hover:bg-dark-950/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInput}
              accept=".pdf,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center text-center">
                {getFileIcon(selectedFile.name)}
                <span className="text-sm font-semibold text-slate-900 dark:text-white mt-3">{selectedFile.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB — Click or drop to change
                </span>
                <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Ingest
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 mb-3 shadow-xs">
                  <UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Drag and drop your file here, or{' '}
                  <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
                </span>
                <span className="text-xs text-slate-500 mt-2 font-mono">
                  Supported formats: PDF, DOCX, TXT, MD, CSV, PNG, JPG (OCR enabled)
                </span>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md transition-all disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Uploading & Chunking...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Upload & Ingest
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

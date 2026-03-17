import React, { useRef, useEffect, useState } from 'react';
import {
  Upload,
  FileText,
  Image,
  X,
  RefreshCw,
  Send,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import { parseFileContent, isFileTypeSupported, FileParsingError, getErrorMessage, getErrorSuggestions } from '../../utils/fileParsers';
import type { UploadedFile } from '../../types/termSheet';
import { formatFileSize } from '../../services/termSheetService';

interface Props {
  inputText: string;
  onInputTextChange: (text: string) => void;
  uploadedFile: UploadedFile | null;
  onFileChange: (file: UploadedFile | null) => void;
  isLoading: boolean;
  onAnalyze: () => void;
  onClear: () => void;
  analysisProgress: { stage: string; percent: number } | null;
  providerName: string;
  isImageUnsupported: boolean;
}

export const TermSheetInputPanel: React.FC<Props> = ({
  inputText,
  onInputTextChange,
  uploadedFile,
  onFileChange,
  isLoading,
  onAnalyze,
  onClear,
  analysisProgress,
  providerName,
  isImageUnsupported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorSuggestions, setErrorSuggestions] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [inputText]);

  const handleFileUpload = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(`File too large (${formatFileSize(file.size)}). Max: ${isImage ? '10MB' : '50MB'}.`);
      setErrorSuggestions(['Compress the file or convert to a more efficient format']);
      return;
    }

    if (!isFileTypeSupported(file)) {
      setError('Unsupported file type. Please upload PDF, DOCX, TXT, or an image.');
      setErrorSuggestions(['Convert to a supported format']);
      return;
    }

    setIsProcessingFile(true);
    setProcessingProgress(0);
    setError(null);
    setErrorSuggestions([]);

    const stages = [
      { stage: 'Reading file...', progress: 20 },
      { stage: 'Validating format...', progress: 40 },
      { stage: 'Extracting content...', progress: 70 },
      { stage: 'Finalizing...', progress: 90 },
    ];

    try {
      for (const s of stages) {
        setProcessingStage(s.stage);
        setProcessingProgress(s.progress);
        await new Promise(r => setTimeout(r, 150));
      }

      const parsed = await parseFileContent(file);

      setProcessingProgress(100);

      onFileChange({
        name: file.name,
        content: parsed.text,
        size: file.size,
        type: file.type || 'application/octet-stream',
        metadata: parsed.metadata,
        base64Content: parsed.base64Content,
        mimeType: parsed.mimeType,
      });

      if (parsed.metadata?.quality === 'low') {
        setError('Low quality content detected. Results may be less accurate.');
        setErrorSuggestions(['Try uploading a higher quality document', 'Consider converting to PDF']);
      }
    } catch (err) {
      if (err instanceof FileParsingError) {
        setError(getErrorMessage(err));
        setErrorSuggestions(getErrorSuggestions(err));
      } else {
        setError('Unexpected error processing file. Please try again.');
        setErrorSuggestions(['Check the file is not corrupted', 'Try a different format']);
      }
    } finally {
      setIsProcessingFile(false);
      setProcessingProgress(0);
      setProcessingStage('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFileUpload(files[0]);
  };

  const canAnalyze = (!!inputText.trim() || !!uploadedFile) && !isLoading && !isProcessingFile;

  const previewText = uploadedFile?.content
    ? uploadedFile.content.slice(0, 600) + (uploadedFile.content.length > 600 ? '...' : '')
    : '';

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-7 transition-all duration-300 cursor-pointer ${
          dragActive
            ? 'border-sky-500/50 bg-sky-500/5'
            : 'border-white/10 hover:border-white/20 bg-white/2'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onClick={() => !isProcessingFile && fileInputRef.current?.click()}
      >
        <div className="text-center pointer-events-none">
          <div className="flex justify-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-sky-400" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Image className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-white/90 mb-1">Upload Term Sheet</h3>
          <p className="text-white/35 text-xs">PDF, DOCX, TXT, or image — drag & drop or click</p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {['PDF', 'DOCX', 'TXT', 'PNG', 'JPG'].map(ext => (
              <span key={ext} className="px-2 py-0.5 bg-white/4 border border-white/8 rounded text-xs text-white/30">{ext}</span>
            ))}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); e.target.value = ''; }}
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
        />
      </div>

      {/* Image provider warning */}
      {uploadedFile?.base64Content && isImageUnsupported && (
        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300/80 text-xs leading-relaxed">
              <span className="font-semibold">{providerName}</span> does not support image analysis. Switch to Gemini in Settings, or paste the extracted text below.
            </p>
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {isProcessingFile && (
        <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-sky-400 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-white/70 mb-1.5">{processingStage}</p>
              <div className="h-1 bg-white/8 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-sky-400 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded file chip */}
      {uploadedFile && !isProcessingFile && (
        <div className="p-3 bg-white/3 border border-white/8 rounded-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {uploadedFile.type.startsWith('image/') ? (
                <Image className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
              ) : (
                <FileText className="w-4 h-4 text-white/50 flex-shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/85 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  {formatFileSize(uploadedFile.size)}
                  {uploadedFile.metadata?.wordCount ? ` • ~${uploadedFile.metadata.wordCount} words` : ''}
                  {uploadedFile.metadata?.pageCount ? ` • ${uploadedFile.metadata.pageCount} pages` : ''}
                  {uploadedFile.metadata?.quality ? ` • ${uploadedFile.metadata.quality} quality` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {previewText && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-1.5 text-white/30 hover:text-white hover:bg-white/8 rounded-lg transition-all"
                  title="Preview extracted text"
                >
                  {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                onClick={() => { onFileChange(null); setError(null); setErrorSuggestions([]); }}
                className="p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/8 rounded-lg transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {showPreview && previewText && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs font-medium text-white/30 uppercase tracking-wider mb-2">Extracted Content Preview</p>
              <p className="text-xs text-white/50 leading-relaxed font-mono">{previewText}</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white/75 text-sm">{error}</p>
              {errorSuggestions.length > 0 && (
                <ul className="mt-1.5 space-y-0.5">
                  {errorSuggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-white/45">
                      <span className="text-red-400/60 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Text Input */}
      <div>
        <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-2">
          Or paste term sheet text
        </label>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => onInputTextChange(e.target.value)}
          placeholder="Paste term sheet content here..."
          className="w-full p-4 bg-white/3 border border-white/8 hover:border-white/15 focus:border-white/20 rounded-xl text-white text-sm placeholder-white/25 focus:ring-1 focus:ring-white/15 outline-none resize-none transition-all leading-relaxed"
          rows={4}
          disabled={isProcessingFile || isLoading}
        />
        {inputText.length > 0 && (
          <p className="text-xs text-white/25 mt-1 text-right">{inputText.length} characters</p>
        )}
      </div>

      {/* Analysis progress */}
      {isLoading && analysisProgress && (
        <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <RefreshCw className="w-4 h-4 text-sky-400 animate-spin flex-shrink-0" />
            <p className="text-sm text-white/70">{analysisProgress.stage}</p>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Parse document', threshold: 15 },
              { label: 'Build prompt', threshold: 35 },
              { label: 'AI analysis', threshold: 75 },
              { label: 'Parse response', threshold: 90 },
              { label: 'Save results', threshold: 100 },
            ].map((step) => {
              const done = analysisProgress.percent >= step.threshold;
              const active = !done && analysisProgress.percent >= step.threshold - 25;
              return (
                <div key={step.label} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${
                    done ? 'bg-emerald-400' : active ? 'bg-sky-400 animate-pulse' : 'bg-white/15'
                  }`} />
                  <span className={`text-xs transition-colors ${
                    done ? 'text-white/50 line-through' : active ? 'text-white/70' : 'text-white/25'
                  }`}>
                    {step.label}
                  </span>
                  {done && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Analyze Term Sheet</span>
            </>
          )}
        </button>
        <button
          onClick={onClear}
          disabled={isLoading}
          className="px-3 py-2.5 text-white/35 hover:text-white hover:bg-white/8 rounded-xl transition-all border border-white/8 hover:border-white/15 disabled:opacity-30"
          title="Clear"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Tips */}
      {!uploadedFile && !inputText && (
        <div className="p-4 bg-white/2 border border-white/6 rounded-xl">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Info className="w-3.5 h-3.5" /> What I can detect
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-xs text-white/35">
            {[
              'Liquidation preferences',
              'Anti-dilution clauses',
              'Board control rights',
              'Vesting schedules',
              'Founder protections',
              'ESOP pool sizes',
              'Pro-rata rights',
              'Drag-along terms',
            ].map((tip) => (
              <div key={tip} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-white/20 flex-shrink-0" />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileCheck,
  ArrowLeft,
  TrendingUp,
  Users,
  Scale,
  Download,
  ArrowLeftRight,
  History,
  ChevronLeft,
  X,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { LLMService } from '../services/llmService';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import {
  analyzeTermSheet,
  saveAnalysis,
  loadHistory,
} from '../services/termSheetService';
import { TermSheetInputPanel } from './termSheet/TermSheetInputPanel';
import { TermSheetResultsPanel } from './termSheet/TermSheetResultsPanel';
import { TermSheetHistoryPanel } from './termSheet/TermSheetHistoryPanel';
import { CompareMode } from './termSheet/CompareMode';
import type {
  TermSheetAnalysis,
  PersonaView,
  UploadedFile,
  AnalysisHistoryRecord,
} from '../types/termSheet';

interface Props {
  onBack: () => void;
}

type AppMode = 'single' | 'compare';

export const TermSheetValidator: React.FC<Props> = ({ onBack }) => {
  const { provider, geminiKey, groqKey } = useApiSettings();

  const [mode, setMode] = useState<AppMode>('single');
  const [personaView, setPersonaView] = useState<PersonaView>('founder');

  const [inputText, setInputText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysis, setAnalysis] = useState<TermSheetAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ stage: string; percent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeHistoryId, setActiveHistoryId] = useState<string | undefined>(undefined);
  const [copiedSummary, setCopiedSummary] = useState(false);

  const [compareLeft, setCompareLeft] = useState<TermSheetAnalysis | null>(null);
  const [compareRight, setCompareRight] = useState<TermSheetAnalysis | null>(null);
  const [compareLeftLabel, setCompareLeftLabel] = useState('Term Sheet A');
  const [compareRightLabel, setCompareRightLabel] = useState('Term Sheet B');
  const [compareLeftInput, setCompareLeftInput] = useState('');
  const [compareLeftFile, setCompareLeftFile] = useState<UploadedFile | null>(null);
  const [compareRightInput, setCompareRightInput] = useState('');
  const [compareRightFile, setCompareRightFile] = useState<UploadedFile | null>(null);
  const [comparingLeft, setComparingLeft] = useState(false);
  const [comparingRight, setComparingRight] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AnalysisHistoryRecord[]>([]);

  const isGroq = provider === 'groq';
  const isImageUnsupported = isGroq;
  const llmService = new LLMService(provider, geminiKey, groqKey);

  const refreshHistory = useCallback(async () => {
    const records = await loadHistory();
    setHistory(records);
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const handleAnalyze = async () => {
    if ((!inputText.trim() && !uploadedFile) || isLoading) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setActiveHistoryId(undefined);

    try {
      const result = await analyzeTermSheet(
        llmService,
        { text: inputText || undefined, file: uploadedFile || undefined },
        personaView,
        (stage, percent) => setAnalysisProgress({ stage, percent })
      );
      setAnalysis(result);

      setAnalysisProgress({ stage: 'Saving to history...', percent: 95 });
      const savedId = await saveAnalysis(result, {
        fileName: uploadedFile?.name || 'Pasted Text',
        fileType: uploadedFile?.type || 'text/plain',
        fileSize: uploadedFile?.size || inputText.length,
        persona: personaView,
        provider: llmService.getProviderName(),
      });
      if (savedId) {
        setActiveHistoryId(savedId);
        await refreshHistory();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsLoading(false);
      setAnalysisProgress(null);
    }
  };

  const handleClear = () => {
    setInputText('');
    setUploadedFile(null);
    setAnalysis(null);
    setError(null);
    setActiveHistoryId(undefined);
  };

  const handleLoadHistory = (record: AnalysisHistoryRecord) => {
    setAnalysis(record.full_analysis);
    setPersonaView(record.persona_view as PersonaView);
    setActiveHistoryId(record.id);
    setInputText('');
    setUploadedFile(null);
    setError(null);
    if (window.innerWidth < 1024) setShowHistory(false);
  };

  const handleCompareAnalyze = async (side: 'left' | 'right') => {
    const isLeft = side === 'left';
    const inputTxt = isLeft ? compareLeftInput : compareRightInput;
    const file = isLeft ? compareLeftFile : compareRightFile;

    if (!inputTxt.trim() && !file) return;

    if (isLeft) setComparingLeft(true);
    else setComparingRight(true);

    try {
      const result = await analyzeTermSheet(
        llmService,
        { text: inputTxt || undefined, file: file || undefined },
        personaView,
        () => {}
      );

      if (isLeft) {
        setCompareLeft(result);
        setCompareLeftLabel(file?.name || 'Term Sheet A');
      } else {
        setCompareRight(result);
        setCompareRightLabel(file?.name || 'Term Sheet B');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison analysis failed.');
    } finally {
      if (isLeft) setComparingLeft(false);
      else setComparingRight(false);
    }
  };

  const downloadAnalysis = () => {
    if (!analysis) return;
    const text = [
      `TERM SHEET ANALYSIS REPORT`,
      `Generated: ${new Date().toLocaleDateString()} — Persona: ${personaView.toUpperCase()}`,
      `Founder-Friendliness Score: ${analysis.friendliness_score}/100`,
      ``,
      `SUMMARY`,
      analysis.plain_summary,
      ``,
      `KEY TERMS`,
      ...Object.entries(analysis.extracted_terms).map(([k, v]) => `  ${k.replace(/_/g, ' ')}: ${v}`),
      ``,
      `RED FLAGS (${analysis.red_flags.length})`,
      ...analysis.red_flags.map(f => `  [${f.severity.toUpperCase()}] ${f.clause}: ${f.issue}`),
      ``,
      `SUGGESTIONS`,
      ...analysis.suggestions.map((s, i) => `  ${i + 1}. ${s}`),
      ``,
      `NEGOTIATION TACTICS`,
      ...analysis.negotiation_tactics.map(t => `  [${t.priority.toUpperCase()}] ${t.topic}\n    Ask: ${t.suggested_ask}\n    Why: ${t.rationale}`),
      ``,
      `MISSING SECTIONS`,
      analysis.missing_sections.join(', '),
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `term-sheet-analysis-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copySummary = async () => {
    if (!analysis) return;
    await navigator.clipboard.writeText(analysis.plain_summary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const sourceText = uploadedFile?.content || inputText;

  return (
    <div className="min-h-screen chat-galaxy-bg flex flex-col relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-sky-500 rounded-full animate-cosmic-drift opacity-30" />
        <div className="absolute top-3/4 left-3/4 w-1 h-1 bg-sky-300 rounded-full animate-cosmic-drift opacity-20" style={{ animationDelay: '5s' }} />
        <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-sky-400 rounded-full animate-cosmic-drift opacity-25" style={{ animationDelay: '10s' }} />
        <div className="absolute bottom-1/4 right-1/6 w-1 h-1 bg-sky-200 rounded-full animate-cosmic-drift opacity-20" style={{ animationDelay: '15s' }} />
      </div>

      {/* Header */}
      <div className="chat-navbar-glass px-4 lg:px-6 py-3 relative z-10 flex-shrink-0">
        <div className="flex items-center justify-between max-w-screen-xl mx-auto gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-white/60 hover:text-white hover:bg-white/8 rounded-lg transition-all border border-white/8 hover:border-white/15"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-sky-600 to-sky-400 rounded-xl flex items-center justify-center shadow-lg shadow-sky-900/30">
                <FileCheck className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-white leading-none">Term Sheet Validator</h1>
                <p className="text-white/40 text-xs mt-0.5">AI-powered legal document analysis</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode toggle */}
            <div className="flex items-center bg-white/4 border border-white/8 rounded-lg p-0.5">
              <button
                onClick={() => setMode('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'single' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Analyze</span>
              </button>
              <button
                onClick={() => setMode('compare')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'compare' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compare</span>
              </button>
            </div>

            {/* Persona selector — only in single mode with results */}
            {mode === 'single' && (
              <div className="flex items-center bg-white/4 border border-white/8 rounded-lg p-0.5">
                {(['founder', 'investor', 'legal'] as PersonaView[]).map((p) => {
                  const Icon = p === 'founder' ? TrendingUp : p === 'investor' ? Users : Scale;
                  return (
                    <button
                      key={p}
                      onClick={() => setPersonaView(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${
                        personaView === p ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{p}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Export actions */}
            {analysis && mode === 'single' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={copySummary}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/8 rounded-lg transition-all border border-white/8 hover:border-white/15"
                  title="Copy summary"
                >
                  {copiedSummary ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={downloadAnalysis}
                  className="p-2 text-white/50 hover:text-white hover:bg-white/8 rounded-lg transition-all border border-white/8 hover:border-white/15"
                  title="Download as text"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* History toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                showHistory
                  ? 'bg-white/10 text-white border-white/15'
                  : 'text-white/40 hover:text-white/70 border-white/8 hover:border-white/15'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
              {history.length > 0 && (
                <span className="bg-white/10 text-white/60 text-xs px-1.5 py-0.5 rounded-full">{history.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="relative z-10 px-4 lg:px-6 pt-3 max-w-screen-xl mx-auto w-full">
          <div className="flex items-start gap-3 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
            <span className="text-red-400 text-sm flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-white/30 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex relative z-10 max-w-screen-xl mx-auto w-full overflow-hidden">

        {/* History sidebar */}
        {showHistory && (
          <div className="w-56 xl:w-64 flex-shrink-0 border-r border-white/5 overflow-y-auto">
            <div className="p-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">History</p>
                <button onClick={() => setShowHistory(false)} className="p-1 text-white/25 hover:text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
            <TermSheetHistoryPanel
              history={history}
              onLoad={handleLoadHistory}
              onHistoryChange={refreshHistory}
              activeId={activeHistoryId}
            />
          </div>
        )}

        {/* SINGLE MODE */}
        {mode === 'single' && (
          <>
            {/* Input column */}
            <div className={`${analysis ? 'w-80 xl:w-96 flex-shrink-0 border-r border-white/5' : 'flex-1 max-w-2xl mx-auto'} overflow-y-auto`}>
              <div className="p-4 lg:p-6">
                <TermSheetInputPanel
                  inputText={inputText}
                  onInputTextChange={setInputText}
                  uploadedFile={uploadedFile}
                  onFileChange={setUploadedFile}
                  isLoading={isLoading}
                  onAnalyze={handleAnalyze}
                  onClear={handleClear}
                  analysisProgress={analysisProgress}
                  providerName={llmService.getProviderName()}
                  isImageUnsupported={isImageUnsupported}
                />
              </div>
            </div>

            {/* Results column */}
            {analysis && (
              <div className="flex-1 min-w-0 overflow-y-auto">
                <div className="p-4 lg:p-6 h-full">
                  <TermSheetResultsPanel
                    analysis={analysis}
                    personaView={personaView}
                    sourceText={sourceText}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* COMPARE MODE */}
        {mode === 'compare' && (
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {!compareLeft || !compareRight ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {/* Left */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/70">Term Sheet A</h3>
                    {compareLeft && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> Analyzed
                      </span>
                    )}
                  </div>
                  <TermSheetInputPanel
                    inputText={compareLeftInput}
                    onInputTextChange={setCompareLeftInput}
                    uploadedFile={compareLeftFile}
                    onFileChange={setCompareLeftFile}
                    isLoading={comparingLeft}
                    onAnalyze={() => handleCompareAnalyze('left')}
                    onClear={() => { setCompareLeftInput(''); setCompareLeftFile(null); setCompareLeft(null); }}
                    analysisProgress={null}
                    providerName={llmService.getProviderName()}
                    isImageUnsupported={isImageUnsupported}
                  />
                </div>

                {/* Right */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/70">Term Sheet B</h3>
                    {compareRight && (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> Analyzed
                      </span>
                    )}
                  </div>
                  <TermSheetInputPanel
                    inputText={compareRightInput}
                    onInputTextChange={setCompareRightInput}
                    uploadedFile={compareRightFile}
                    onFileChange={setCompareRightFile}
                    isLoading={comparingRight}
                    onAnalyze={() => handleCompareAnalyze('right')}
                    onClear={() => { setCompareRightInput(''); setCompareRightFile(null); setCompareRight(null); }}
                    analysisProgress={null}
                    providerName={llmService.getProviderName()}
                    isImageUnsupported={isImageUnsupported}
                  />
                </div>

                {(compareLeft || compareRight) && (
                  <div className="lg:col-span-2 text-center">
                    <p className="text-white/30 text-sm">
                      {compareLeft && !compareRight
                        ? 'Analyze Term Sheet B to compare'
                        : !compareLeft && compareRight
                        ? 'Analyze Term Sheet A to compare'
                        : ''}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">Comparison Results</h2>
                  <button
                    onClick={() => { setCompareLeft(null); setCompareRight(null); }}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>New comparison</span>
                  </button>
                </div>
                <CompareMode
                  left={compareLeft}
                  right={compareRight}
                  leftLabel={compareLeftLabel}
                  rightLabel={compareRightLabel}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

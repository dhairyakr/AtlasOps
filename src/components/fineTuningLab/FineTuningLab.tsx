import React, { useState, useCallback, useEffect } from 'react';
import { ArrowLeft, Sliders, Play, Loader2, Clock, Hash, PanelLeftClose, PanelLeftOpen, History, Copy, Check, Zap, Cpu } from 'lucide-react';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { getLabSessionId, mergeAnonymousSessionToUser } from '../../utils/sessionUtils';
import { FineTuningPipelineDiagram } from './FineTuningPipelineDiagram';
import { FineTuningConceptPanel } from './FineTuningConceptPanel';
import { supabase } from '../../services/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FineTuningLabProps {
  onBack: () => void;
}

type SidebarTab = 'pipeline' | 'concepts' | 'history';
type ActiveTab = 'compare' | 'diff' | 'stats';

interface ComparisonResult {
  label: string;
  temp: number;
  output: string;
  latencyMs: number;
  tokenEstimate: number;
  color: string;
  borderColor: string;
}

interface HistoryRun {
  id: string;
  prompt: string;
  top_p: number;
  top_k: number;
  max_tokens: number;
  results: ComparisonResult[];
  created_at: string;
}

const PRESETS = [
  { name: 'Factual', temps: [0.1, 0.3, 0.5], topP: 0.8, desc: 'Precise, deterministic' },
  { name: 'Balanced', temps: [0.3, 0.7, 1.0], topP: 0.95, desc: 'General purpose' },
  { name: 'Creative', temps: [0.7, 1.2, 1.8], topP: 1.0, desc: 'Maximum variety' },
];

const BASE_CONFIGS = [
  { label: 'Config A', color: 'from-sky-500 to-cyan-500', borderColor: 'border-sky-500/30', textColor: 'text-sky-300' },
  { label: 'Config B', color: 'from-teal-500 to-emerald-500', borderColor: 'border-teal-500/30', textColor: 'text-teal-300' },
  { label: 'Config C', color: 'from-rose-500 to-orange-500', borderColor: 'border-rose-500/30', textColor: 'text-rose-300' },
];

function computeWordStats(text: string) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const unique = new Set(words);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / Math.max(words.length, 1);
  return {
    wordCount: words.length,
    uniqueRatio: unique.size / Math.max(words.length, 1),
    sentenceCount: sentences.length,
    avgWordLen: avgWordLen,
  };
}

function simpleDiff(a: string, b: string): Array<{ text: string; type: 'same' | 'added' | 'removed' }> {
  const wordsA = a.split(/\s+/).filter(Boolean).slice(0, 150);
  const wordsB = b.split(/\s+/).filter(Boolean).slice(0, 150);
  const result: Array<{ text: string; type: 'same' | 'added' | 'removed' }> = [];
  let ia = 0; let ib = 0;
  while (ia < wordsA.length || ib < wordsB.length) {
    if (ia >= wordsA.length) { result.push({ text: wordsB[ib++], type: 'added' }); continue; }
    if (ib >= wordsB.length) { result.push({ text: wordsA[ia++], type: 'removed' }); continue; }
    if (wordsA[ia] === wordsB[ib]) { result.push({ text: wordsA[ia], type: 'same' }); ia++; ib++; }
    else { result.push({ text: wordsA[ia++], type: 'removed' }); result.push({ text: wordsB[ib++], type: 'added' }); }
  }
  return result;
}

export const FineTuningLab: React.FC<FineTuningLabProps> = ({ onBack }) => {
  const { provider, geminiKey, groqKey } = useApiSettings();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [topK, setTopK] = useState(40);
  const [topP, setTopP] = useState(0.95);
  const [maxTokens, setMaxTokens] = useState(512);
  const [temperatures, setTemperatures] = useState([0.1, 0.7, 1.6]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('compare');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionId] = useState(() => getLabSessionId('finetuning_lab', user?.id));

  useEffect(() => {
    if (user?.id) mergeAnonymousSessionToUser('finetuning_lab', 'finetuning_lab_runs', 'session_id', user.id);
  }, [user?.id]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    const { data } = await supabase.from('finetuning_lab_runs').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(15);
    if (data) setHistory(data as HistoryRun[]);
    setHistoryLoading(false);
  }, [sessionId]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const runComparison = useCallback(async () => {
    if (!prompt.trim()) return;
    setRunning(true);
    setError(null);
    setResults([]);
    setPipelineStep(1);

    try {
      const runWithTemp = async (config: typeof BASE_CONFIGS[0], temp: number): Promise<ComparisonResult> => {
        const llm = new LLMService(provider, geminiKey, groqKey);
        const start = Date.now();
        const output = await llm.generateResponse(prompt, undefined, undefined, undefined, {
          temperature: temp,
          topP,
          ...(provider === 'gemini' ? { topK } : {}),
          maxTokens,
        });
        const latencyMs = Date.now() - start;
        return {
          label: config.label,
          temp,
          output,
          latencyMs,
          tokenEstimate: Math.round(output.length / 4),
          color: config.color,
          borderColor: config.borderColor,
        };
      };

      setPipelineStep(3);
      const [r1, r2, r3] = await Promise.all(
        BASE_CONFIGS.map((config, i) => runWithTemp(config, temperatures[i] ?? config.label === 'Config A' ? 0.1 : config.label === 'Config B' ? 0.7 : 1.6))
      );
      const newResults = [r1, r2, r3];
      setResults(newResults);
      setPipelineStep(4);

      await supabase.from('finetuning_lab_runs').insert({
        session_id: sessionId,
        prompt,
        top_p: topP,
        top_k: topK,
        max_tokens: maxTokens,
        results: newResults,
      });
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed');
      setPipelineStep(-1);
    } finally {
      setRunning(false);
    }
  }, [provider, geminiKey, groqKey, prompt, topK, topP, maxTokens, temperatures, sessionId, loadHistory]);

  const copyResult = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setTemperatures(preset.temps);
    setTopP(preset.topP);
  };

  const loadHistoryRun = (run: HistoryRun) => {
    setPrompt(run.prompt);
    setTopP(run.top_p);
    setTopK(run.top_k);
    setMaxTokens(run.max_tokens);
    setResults(run.results || []);
    setSidebarTab('pipeline');
  };

  const allStats = results.map(r => computeWordStats(r.output));

  return (
    <div className="h-full flex flex-col chat-galaxy-bg text-white overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[10, 20, 35, 50, 65, 80, 90].map((left, i) => (
          <div key={i} className="thought-particle" style={{ left: `${left}%`, animationDelay: `${i * 3}s` }} />
        ))}
      </div>

      <header className="relative z-10 chat-navbar-glass flex items-center gap-4 px-6 py-4">
        <button onClick={onBack} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-cosmic-glow animate-glow avatar-orb">
            <Sliders className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold gradient-text leading-none">Fine-Tuning & Model Behavior</h1>
            <p className="text-xs text-white/50 mt-0.5">Temperature, sampling & generation parameters</p>
          </div>
        </div>
        <div className="flex-1" />
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${provider === 'gemini' ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
          {provider === 'gemini' ? <Zap className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
          {provider === 'gemini' ? 'Gemini' : 'Groq'}
        </div>
        <button onClick={() => setSidebarOpen(o => !o)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all btn-hover-lift backdrop-blur-sm">
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden">
          {/* Left: controls */}
          <div className="border-r border-white/10 flex flex-col min-h-0">
            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar min-h-0 space-y-5">
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  rows={4}
                  placeholder="Enter a prompt to compare across temperature settings..."
                  className="w-full rounded-xl bg-white/4 border border-white/10 text-white/85 text-xs p-3 resize-none focus:outline-none focus:border-amber-500/40 transition-all placeholder:text-white/20 leading-relaxed"
                />
              </div>

              {/* Presets */}
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2 block">Quick Presets</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESETS.map(p => (
                    <button key={p.name} onClick={() => applyPreset(p)}
                      className="rounded-xl bg-white/4 border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/8 p-2.5 text-left transition-all">
                      <div className="text-xs font-semibold text-white/80 mb-0.5">{p.name}</div>
                      <div className="text-xs text-white/35">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Temperature per config */}
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3 block">Temperature Per Run</label>
                <div className="space-y-3">
                  {BASE_CONFIGS.map((c, i) => (
                    <div key={c.label} className={`rounded-xl bg-white/3 border ${c.borderColor} p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.label}</span>
                        <span className="text-xs font-mono text-white/60">T={temperatures[i]?.toFixed(1)}</span>
                      </div>
                      <input
                        type="range" min={0} max={2} step={0.1}
                        value={temperatures[i] ?? 0.7}
                        onChange={e => setTemperatures(prev => { const n = [...prev]; n[i] = Number(e.target.value); return n; })}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sampling params */}
              <div className="space-y-4">
                {[
                  { label: 'Top-K', value: topK, min: 1, max: 100, step: 1, set: setTopK, desc: 'Sample from K most likely tokens' },
                  { label: 'Max Tokens', value: maxTokens, min: 64, max: 2048, step: 64, set: setMaxTokens, desc: 'Maximum response length' },
                ].map(slider => (
                  <div key={slider.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">{slider.label}</label>
                      <span className="text-xs font-mono text-white/60">{slider.value}</span>
                    </div>
                    <input type="range" min={slider.min} max={slider.max} step={slider.step}
                      value={slider.value} onChange={e => slider.set(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer" />
                    <p className="text-xs text-white/25 mt-1">{slider.desc}</p>
                  </div>
                ))}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Top-P</label>
                    <span className="text-xs font-mono text-white/60">{topP.toFixed(2)}</span>
                  </div>
                  <input type="range" min={0} max={1} step={0.01} value={topP}
                    onChange={e => setTopP(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer" />
                  <p className="text-xs text-white/25 mt-1">Nucleus sampling probability mass</p>
                </div>
              </div>

              <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">Real Parameters</span>
                </div>
                <p className="text-xs text-white/45 leading-relaxed">
                  Temperature, Top-P and Max Tokens are sent directly to the {provider === 'gemini' ? 'Gemini' : 'Groq'} API. Results are genuinely different — not simulations.
                </p>
              </div>

              <button
                onClick={runComparison}
                disabled={running || !prompt.trim()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {running ? 'Running All...' : 'Run & Compare'}
              </button>
            </div>
          </div>

          {/* Right: results */}
          <div className="flex flex-col min-h-0">
            <div className="flex-1 p-5 overflow-y-auto hide-scrollbar min-h-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Results</h2>
                  <p className="text-xs text-white/40 mt-0.5">Three configs run in parallel with real API parameters</p>
                </div>
                {results.length > 0 && (
                  <div className="flex gap-1 rounded-lg bg-white/5 border border-white/10 p-0.5">
                    {(['compare', 'diff', 'stats'] as ActiveTab[]).map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-2.5 py-1 rounded-md text-xs transition-all capitalize ${activeTab === tab ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/60'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-500/8 border border-red-500/20 p-4 mb-4">
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              {running && results.length === 0 && (
                <div className="rounded-xl bg-white/4 border border-white/10 p-8 flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-sm text-white/50">Running 3 parallel generations with real temperature values...</p>
                </div>
              )}

              {results.length === 0 && !running && !error && (
                <div className="flex flex-col items-center justify-center h-48 text-white/20">
                  <Sliders className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">Enter a prompt and click Run & Compare</p>
                </div>
              )}

              {activeTab === 'compare' && results.length > 0 && (
                <div className="space-y-4">
                  {results.map((r, idx) => (
                    <div key={r.label} className={`rounded-xl bg-white/3 border ${r.borderColor} overflow-hidden`}>
                      <div className={`flex items-center justify-between px-4 py-2.5`}>
                        <div>
                          <span className={`text-xs font-bold bg-gradient-to-r ${r.color} bg-clip-text text-transparent`}>{r.label}</span>
                          <span className="text-xs text-white/30 ml-2 font-mono">T={r.temp}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-white/40"><Hash className="w-3 h-3" />~{r.tokenEstimate}</span>
                          <span className="flex items-center gap-1 text-xs text-white/40"><Clock className="w-3 h-3" />{(r.latencyMs / 1000).toFixed(1)}s</span>
                          <button onClick={() => copyResult(r.output, idx)} className="p-1 rounded hover:bg-white/10 transition-all text-white/40 hover:text-white">
                            {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className={`h-px bg-gradient-to-r ${r.color} opacity-20`} />
                      <div className="p-4">
                        <div className="prose prose-invert prose-xs max-w-none text-white/75 text-xs leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.output}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'diff' && results.length >= 2 && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/3 border border-white/10 p-4">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Config A vs Config C — Word Diff</p>
                    <div className="text-xs leading-relaxed flex flex-wrap gap-1">
                      {simpleDiff(results[0].output, results[2].output).map((token, i) => (
                        <span key={i} className={
                          token.type === 'added' ? 'bg-emerald-500/20 text-emerald-300 rounded px-0.5' :
                          token.type === 'removed' ? 'bg-red-500/20 text-red-300 rounded px-0.5 line-through opacity-60' :
                          'text-white/60'
                        }>{token.text}</span>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-3">
                      <span className="flex items-center gap-1 text-xs text-emerald-300"><span className="w-2 h-2 rounded bg-emerald-500/40 inline-block" /> Unique to Config C</span>
                      <span className="flex items-center gap-1 text-xs text-red-300"><span className="w-2 h-2 rounded bg-red-500/40 inline-block" /> Unique to Config A</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/3 border border-white/10 p-4">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Config A vs Config B — Word Diff</p>
                    <div className="text-xs leading-relaxed flex flex-wrap gap-1">
                      {simpleDiff(results[0].output, results[1].output).map((token, i) => (
                        <span key={i} className={
                          token.type === 'added' ? 'bg-sky-500/20 text-sky-300 rounded px-0.5' :
                          token.type === 'removed' ? 'bg-white/10 text-white/30 rounded px-0.5 line-through opacity-60' :
                          'text-white/60'
                        }>{token.text}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && results.length > 0 && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/3 border border-white/10 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-xs font-semibold text-white/60">Output Statistics</p>
                    </div>
                    <div className="p-4 space-y-4">
                      {results.map((r, i) => {
                        const stats = allStats[i];
                        return (
                          <div key={r.label}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs font-bold bg-gradient-to-r ${r.color} bg-clip-text text-transparent`}>{r.label} (T={r.temp})</span>
                              <span className="text-xs text-white/40 font-mono">{stats.wordCount} words</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-2">
                              {[
                                { label: 'Vocab Diversity', value: `${(stats.uniqueRatio * 100).toFixed(0)}%` },
                                { label: 'Sentences', value: stats.sentenceCount },
                                { label: 'Avg Word Len', value: stats.avgWordLen.toFixed(1) },
                              ].map(stat => (
                                <div key={stat.label} className="rounded-lg bg-white/4 border border-white/8 p-2 text-center">
                                  <div className="text-sm font-bold text-white">{stat.value}</div>
                                  <div className="text-xs text-white/30 mt-0.5">{stat.label}</div>
                                </div>
                              ))}
                            </div>
                            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                              <div className={`h-full rounded-full bg-gradient-to-r ${r.color} transition-all duration-700`}
                                style={{ width: `${Math.min(stats.uniqueRatio * 200, 100)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/3 border border-white/10 p-4">
                    <p className="text-xs font-semibold text-white/60 mb-3">Latency Comparison</p>
                    {results.map(r => (
                      <div key={r.label} className="flex items-center gap-3 mb-2">
                        <span className={`text-xs font-semibold bg-gradient-to-r ${r.color} bg-clip-text text-transparent w-16 flex-shrink-0`}>{r.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${r.color}`}
                            style={{ width: `${Math.min((r.latencyMs / Math.max(...results.map(x => x.latencyMs), 1)) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-white/40 font-mono w-12 text-right">{(r.latencyMs / 1000).toFixed(1)}s</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 border-l border-white/10 flex-shrink-0 flex flex-col overflow-hidden relative" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(60px)' }}>
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.04] via-transparent to-orange-500/[0.02] pointer-events-none" />
            <div className="flex-1 overflow-y-auto hide-scrollbar p-4 relative">
              <div className="flex gap-1 mb-5 rounded-xl glass-premium border border-white/10 p-1">
                {(['pipeline', 'concepts', 'history'] as SidebarTab[]).map(tab => (
                  <button key={tab} onClick={() => { setSidebarTab(tab); if (tab === 'history') loadHistory(); }}
                    className={`flex-1 text-xs py-1.5 rounded-lg transition-all duration-200 font-medium capitalize ${sidebarTab === tab ? 'bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-white border border-amber-500/30' : 'text-white/40 hover:text-white/60'}`}>
                    {tab === 'history' ? <History className="w-3 h-3 mx-auto" /> : tab}
                  </button>
                ))}
              </div>

              {sidebarTab === 'pipeline' && (
                <div className="space-y-6">
                  <FineTuningPipelineDiagram activeStep={pipelineStep} />
                  <div className="rounded-xl glass-premium border border-amber-500/20 p-4">
                    <p className="text-xs font-semibold text-white/60 mb-2">About Model Behavior</p>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Temperature, Top-P, and Max Tokens are sent directly to the {provider === 'gemini' ? 'Gemini' : 'Groq'} API. Results show genuine model variance at different parameter settings.
                    </p>
                  </div>
                </div>
              )}

              {sidebarTab === 'concepts' && <FineTuningConceptPanel />}

              {sidebarTab === 'history' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Run History</p>
                  {historyLoading && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-amber-400 animate-spin" /></div>}
                  {!historyLoading && history.length === 0 && (
                    <p className="text-xs text-white/25 text-center py-4">No runs yet. Run a comparison to save history.</p>
                  )}
                  {history.map(run => (
                    <button key={run.id} onClick={() => loadHistoryRun(run)}
                      className="w-full text-left rounded-xl bg-white/3 border border-white/8 hover:border-amber-500/30 p-3 transition-all">
                      <p className="text-xs text-white/70 truncate mb-1.5">{run.prompt}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30">{new Date(run.created_at).toLocaleDateString()}</span>
                        <span className="text-xs text-white/20 font-mono">T=[{(run.results || []).map((r: ComparisonResult) => r.temp).join(', ')}]</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};

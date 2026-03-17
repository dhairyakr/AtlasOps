import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, GitMerge, Plus, X, Search, Loader2, PanelLeftClose, PanelLeftOpen, Database, History, Download, Copy, Check, Save, Trash2, BarChart2, Grid2x2 as Grid, ChevronDown, RefreshCw, Zap, Cpu } from 'lucide-react';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { getLabSessionId, mergeAnonymousSessionToUser } from '../../utils/sessionUtils';
import { EmbeddingsPipelineDiagram } from './EmbeddingsPipelineDiagram';
import { EmbeddingsConceptPanel } from './EmbeddingsConceptPanel';
import { supabase } from '../../services/supabaseClient';

interface EmbeddingsLabProps {
  onBack: () => void;
}

interface SimilarityResult {
  sentence: string;
  score: number;
  index: number;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  results: SimilarityResult[];
  corpus_sentences: string[];
  created_at: string;
  top_k: number;
}

interface SavedCorpus {
  id: string;
  corpus_name: string;
  sentences: string[];
  updated_at: string;
}

type SidebarTab = 'pipeline' | 'concepts' | 'history' | 'corpora';
type ViewMode = 'list' | 'matrix';

function scoreToColor(score: number): string {
  const r = Math.round(255 * (1 - score));
  const g = Math.round(200 * score);
  return `rgb(${r},${g},60)`;
}

function scoreToTextColor(score: number): string {
  return score > 0.5 ? 'text-white' : 'text-white/70';
}

export const EmbeddingsLab: React.FC<EmbeddingsLabProps> = ({ onBack }) => {
  const { provider, geminiKey, groqKey } = useApiSettings();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [sentences, setSentences] = useState<string[]>([
    'The cat sat on the warm mat by the fireplace.',
    'A dog played fetch in the sunny park all afternoon.',
    'Machine learning models learn patterns from large datasets.',
    'Deep neural networks can recognize images with high accuracy.',
    'The stock market fell sharply due to rising interest rates.',
    'Investors are worried about inflation affecting their portfolios.',
  ]);
  const [newSentence, setNewSentence] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(3);
  const [results, setResults] = useState<SimilarityResult[]>([]);
  const [matrix, setMatrix] = useState<number[][]>([]);
  const [loading, setLoading] = useState(false);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [corpusName, setCorpusName] = useState('');
  const [savedCorpora, setSavedCorpora] = useState<SavedCorpus[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savingCorpus, setSavingCorpus] = useState(false);

  const sessionId = useRef(getLabSessionId('embeddings_lab', user?.id));

  useEffect(() => {
    loadHistory();
    loadCorpora();
  }, []);

  useEffect(() => {
    if (user?.id) mergeAnonymousSessionToUser('embeddings_lab', 'embeddings_lab_searches', 'session_id', user.id);
  }, [user?.id]);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const { data } = await supabase
        .from('embeddings_lab_searches')
        .select('*')
        .eq('session_id', sessionId.current)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setSearchHistory(data as SearchHistoryItem[]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadCorpora() {
    const { data } = await supabase
      .from('embeddings_lab_corpora')
      .select('*')
      .eq('session_id', sessionId.current)
      .order('updated_at', { ascending: false });
    if (data) setSavedCorpora(data as SavedCorpus[]);
  }

  async function saveCorpus() {
    if (!corpusName.trim()) return;
    setSavingCorpus(true);
    try {
      const existing = savedCorpora.find(c => c.corpus_name === corpusName.trim());
      if (existing) {
        await supabase
          .from('embeddings_lab_corpora')
          .update({ sentences, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('embeddings_lab_corpora')
          .insert({ session_id: sessionId.current, corpus_name: corpusName.trim(), sentences });
      }
      setCorpusName('');
      await loadCorpora();
    } finally {
      setSavingCorpus(false);
    }
  }

  async function deleteCorpus(id: string) {
    await supabase.from('embeddings_lab_corpora').delete().eq('id', id);
    setSavedCorpora(prev => prev.filter(c => c.id !== id));
  }

  function loadCorpusIntoEditor(corpus: SavedCorpus) {
    setSentences(corpus.sentences);
    setResults([]);
    setMatrix([]);
  }

  const getLLM = useCallback(() => {
    return new LLMService(provider, geminiKey, groqKey);
  }, [provider, geminiKey, groqKey]);

  async function computeSimilarity(a: string, b: string, llm: LLMService): Promise<number> {
    const prompt = `Rate the semantic similarity between these two sentences on a scale from 0.00 to 1.00, where 0 means completely unrelated and 1 means identical meaning. Return ONLY a decimal number, nothing else.

Sentence A: "${a}"
Sentence B: "${b}"

Score (0.00-1.00):`;
    const raw = await llm.generateResponse(prompt, undefined, undefined, undefined, { temperature: 0.1, maxTokens: 16 });
    const match = raw.match(/(\d+(?:\.\d+)?)/);
    const val = match ? parseFloat(match[1]) : 0;
    return Math.min(1, Math.max(0, val));
  }

  async function runSearch() {
    if (!query.trim() || sentences.length === 0) return;
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const llm = getLLM();
      const scores = await Promise.all(
        sentences.map((s, i) => computeSimilarity(query, s, llm).then(score => ({ sentence: s, score, index: i })))
      );
      const sorted = [...scores].sort((a, b) => b.score - a.score).slice(0, topK);
      setResults(sorted);

      await supabase.from('embeddings_lab_searches').insert({
        session_id: sessionId.current,
        query: query.trim(),
        corpus_sentences: sentences,
        results: sorted,
        top_k: topK,
      });
      await loadHistory();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  }

  async function buildMatrix() {
    if (sentences.length < 2) return;
    setMatrixLoading(true);
    setMatrix([]);
    setError('');
    try {
      const llm = getLLM();
      const n = sentences.length;
      const grid: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        grid[i][i] = 1;
        for (let j = i + 1; j < n; j++) {
          const s = await computeSimilarity(sentences[i], sentences[j], llm);
          grid[i][j] = s;
          grid[j][i] = s;
        }
      }
      setMatrix(grid);
      setViewMode('matrix');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Matrix build failed.');
    } finally {
      setMatrixLoading(false);
    }
  }

  function addSentence() {
    const trimmed = newSentence.trim();
    if (trimmed && !sentences.includes(trimmed)) {
      setSentences(prev => [...prev, trimmed]);
      setNewSentence('');
      setResults([]);
      setMatrix([]);
    }
  }

  function removeSentence(i: number) {
    setSentences(prev => prev.filter((_, idx) => idx !== i));
    setResults([]);
    setMatrix([]);
  }

  function addBulk() {
    const lines = bulkInput.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    setSentences(prev => {
      const combined = [...prev, ...lines.filter(l => !prev.includes(l))];
      return combined;
    });
    setBulkInput('');
    setShowBulk(false);
    setResults([]);
    setMatrix([]);
  }

  function exportCSV() {
    if (results.length === 0) return;
    const rows = [['Rank', 'Score', 'Sentence'], ...results.map((r, i) => [String(i + 1), r.score.toFixed(4), `"${r.sentence.replace(/"/g, '""')}"`])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'embeddings_search_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyResults() {
    const text = results.map((r, i) => `${i + 1}. [${(r.score * 100).toFixed(1)}%] ${r.sentence}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function loadHistoryItem(item: SearchHistoryItem) {
    setSentences(item.corpus_sentences);
    setQuery(item.query);
    setResults(item.results);
    setTopK(item.top_k);
    setMatrix([]);
    setViewMode('list');
  }

  const sidebarTabs: { id: SidebarTab; icon: React.ElementType; label: string }[] = [
    { id: 'pipeline', icon: GitMerge, label: 'Pipeline' },
    { id: 'concepts', icon: Database, label: 'Concepts' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'corpora', icon: Save, label: 'Corpora' },
  ];

  const shortLabel = (s: string, max = 22) => s.length > max ? s.slice(0, max) + '…' : s;

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/8 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <GitMerge className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">Embeddings Lab</h1>
            <p className="text-xs text-white/40">Vector similarity, clustering &amp; semantic search</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${provider === 'gemini' ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
            {provider === 'gemini' ? <Zap className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
            {provider === 'gemini' ? 'Gemini' : 'Groq'}
          </div>
          <div className="flex items-center bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              <BarChart2 className="w-3 h-3" /> Results
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${viewMode === 'matrix' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'}`}
            >
              <Grid className="w-3 h-3" /> Matrix
            </button>
          </div>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 hover:bg-white/8 rounded-lg transition-colors"
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4 text-white/50" /> : <PanelLeftOpen className="w-4 h-4 text-white/50" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
          )}

          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Corpus ({sentences.length} sentences)</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulk(v => !v)}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors border border-white/10 rounded-lg px-2 py-1"
                >
                  Bulk Import
                </button>
                <div className="flex items-center gap-1.5">
                  <input
                    value={corpusName}
                    onChange={e => setCorpusName(e.target.value)}
                    placeholder="Corpus name…"
                    className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white placeholder-white/30 outline-none w-28"
                  />
                  <button
                    onClick={saveCorpus}
                    disabled={!corpusName.trim() || savingCorpus}
                    className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-lg px-2 py-1 transition-colors disabled:opacity-40 flex items-center gap-1"
                  >
                    {savingCorpus ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </button>
                </div>
              </div>
            </div>

            {showBulk && (
              <div className="space-y-2">
                <textarea
                  value={bulkInput}
                  onChange={e => setBulkInput(e.target.value)}
                  placeholder="Paste sentences here, one per line…"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none resize-none focus:border-emerald-500/40"
                />
                <div className="flex gap-2">
                  <button onClick={addBulk} className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-lg px-3 py-1.5 transition-colors">
                    Add {bulkInput.split('\n').filter(l => l.trim()).length} sentences
                  </button>
                  <button onClick={() => setShowBulk(false)} className="text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-lg px-3 py-1.5 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {sentences.map((s, i) => (
                <div key={i} className="flex items-start gap-2 group">
                  <span className="text-xs text-white/20 w-5 flex-shrink-0 pt-1">{i + 1}</span>
                  <span className="flex-1 text-xs text-white/70 leading-relaxed">{s}</span>
                  <button
                    onClick={() => removeSentence(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-500/20 rounded text-red-400 flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newSentence}
                onChange={e => setNewSentence(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSentence()}
                placeholder="Add a sentence to the corpus…"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-emerald-500/40"
              />
              <button
                onClick={addSentence}
                disabled={!newSentence.trim()}
                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl border border-emerald-500/20 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Semantic Search</p>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !loading && runSearch()}
                placeholder="Enter a query to find semantically similar sentences…"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-500/40"
              />
              <button
                onClick={runSearch}
                disabled={loading || !query.trim() || sentences.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>

            <div className="flex items-center gap-4">
              <label className="text-xs text-white/40">Top-K results:</label>
              <input
                type="range" min={1} max={Math.min(sentences.length, 10)} value={topK}
                onChange={e => setTopK(parseInt(e.target.value))}
                className="w-32 accent-emerald-500"
              />
              <span className="text-xs text-emerald-400 font-mono">{topK}</span>
            </div>

            <button
              onClick={buildMatrix}
              disabled={matrixLoading || sentences.length < 2}
              className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 border border-white/10 hover:border-white/20 rounded-xl px-3 py-2 transition-colors disabled:opacity-40"
            >
              {matrixLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Grid className="w-3.5 h-3.5" />}
              Build Similarity Matrix ({sentences.length}×{sentences.length})
              {matrixLoading && <span className="text-white/30">Computing {sentences.length * (sentences.length - 1) / 2} pairs…</span>}
            </button>
          </div>

          {viewMode === 'list' && results.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  Top-{results.length} Results for "{shortLabel(query, 40)}"
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={copyResults} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-lg px-2 py-1 transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button onClick={exportCSV} className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-lg px-2 py-1 transition-colors">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {results.map((r, i) => (
                  <div key={r.index} className="flex items-start gap-3 p-3 rounded-xl bg-white/4 border border-white/6">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: scoreToColor(r.score) + '33', color: scoreToColor(r.score) }}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 leading-relaxed">{r.sentence}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.score * 100}%`, backgroundColor: scoreToColor(r.score) }} />
                        </div>
                        <span className="text-xs font-mono font-semibold" style={{ color: scoreToColor(r.score) }}>
                          {(r.score * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'matrix' && matrix.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  Similarity Matrix ({matrix.length}×{matrix.length})
                </p>
                <button
                  onClick={() => setViewMode('list')}
                  className="text-xs text-white/40 hover:text-white/70 border border-white/10 rounded-lg px-2 py-1 transition-colors"
                >
                  Back to List
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="text-xs border-collapse">
                  <thead>
                    <tr>
                      <th className="w-24 p-1" />
                      {sentences.map((_, j) => (
                        <th key={j} className="p-1 text-center text-white/30 font-mono w-14">S{j + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <tr key={i}>
                        <td className="p-1 pr-2 text-right text-white/40 max-w-24 truncate">{shortLabel(sentences[i], 18)}</td>
                        {row.map((score, j) => (
                          <td key={j} className="p-0.5">
                            <div
                              className={`w-12 h-8 rounded flex items-center justify-center text-xs font-mono font-bold ${scoreToTextColor(score)}`}
                              style={{ backgroundColor: scoreToColor(score) + '55', border: `1px solid ${scoreToColor(score)}33` }}
                              title={`S${i + 1} vs S${j + 1}: ${(score * 100).toFixed(1)}%`}
                            >
                              {score.toFixed(2)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-white/30">Low similarity</span>
                <div className="flex-1 h-2 rounded-full" style={{ background: 'linear-gradient(to right, rgb(255,60,60), rgb(255,200,60), rgb(0,200,60))' }} />
                <span className="text-xs text-white/30">High similarity</span>
              </div>
            </div>
          )}

          {viewMode === 'matrix' && matrixLoading && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-8 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-sm text-white/50">Building similarity matrix…</p>
              <p className="text-xs text-white/30">Computing {sentences.length * (sentences.length - 1) / 2} pairwise scores</p>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="w-72 border-l border-white/8 flex flex-col flex-shrink-0">
            <div className="flex border-b border-white/8">
              {sidebarTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${sidebarTab === tab.id ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-white/30 hover:text-white/60'}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {sidebarTab === 'pipeline' && <EmbeddingsPipelineDiagram />}
              {sidebarTab === 'concepts' && <EmbeddingsConceptPanel />}

              {sidebarTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Search History</p>
                    <button onClick={loadHistory} className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white/60 transition-colors">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                  {loadingHistory ? (
                    <div className="flex justify-center pt-4">
                      <Loader2 className="w-4 h-4 animate-spin text-white/30" />
                    </div>
                  ) : searchHistory.length === 0 ? (
                    <p className="text-xs text-white/25 text-center pt-6">No searches yet</p>
                  ) : (
                    searchHistory.map(item => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className="w-full text-left rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 p-3 space-y-1 transition-colors"
                      >
                        <p className="text-xs text-white/70 truncate font-medium">"{shortLabel(item.query, 28)}"</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/30">{item.corpus_sentences.length} sentences · Top-{item.top_k}</span>
                          <span className="text-xs text-white/20">{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        {item.results[0] && (
                          <p className="text-xs text-emerald-400/70 truncate">Best: {(item.results[0].score * 100).toFixed(1)}% — {shortLabel(item.results[0].sentence, 24)}</p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {sidebarTab === 'corpora' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Saved Corpora</p>
                  {savedCorpora.length === 0 ? (
                    <p className="text-xs text-white/25 text-center pt-6">No saved corpora yet.<br />Name and save your current corpus above.</p>
                  ) : (
                    savedCorpora.map(corpus => (
                      <div
                        key={corpus.id}
                        className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-white/70 truncate">{corpus.corpus_name}</p>
                          <button onClick={() => deleteCorpus(corpus.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400/50 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-xs text-white/30">{corpus.sentences.length} sentences</p>
                        <button
                          onClick={() => loadCorpusIntoEditor(corpus)}
                          className="w-full text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 rounded-lg py-1.5 transition-colors"
                        >
                          Load into Editor
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

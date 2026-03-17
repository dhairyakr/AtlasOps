import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Loader2, AlertCircle, ChevronDown, ChevronUp, BookOpen,
  Sparkles, Clock, CheckCircle2, AlertTriangle, XCircle,
  Cpu, ArrowRight, Hash, SlidersHorizontal
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import {
  RagChunk, RagDocument, saveQuery, RagQuery,
  hybridPreFilter, keywordScore
} from '../../services/ragService';

interface RetrievedChunk extends RagChunk {
  relevance_score: number;
  document_title: string;
  relevance_reason?: string;
}

interface QueryResult {
  query: string;
  chunks: RetrievedChunk[];
  answer: string;
  confidenceScore: string;
  followUpQuestions: string[];
  timestamp: Date;
  retrievalStrategy: string;
}

interface RagQueryPanelProps {
  sessionId: string;
  chunks: RagChunk[];
  documents: RagDocument[];
  onPipelineStep: (step: number) => void;
  onQuerySaved?: (q: RagQuery) => void;
}

type RetrievalStrategy = 'hybrid' | 'keyword' | 'semantic';

const CONFIDENCE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string; border: string }> = {
  high: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    label: 'High confidence',
    color: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
  },
  medium: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Medium confidence',
    color: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
  },
  low: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    label: 'Low confidence',
    color: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
  },
};

const ChunkCard: React.FC<{ chunk: RetrievedChunk; rank: number }> = ({ chunk, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const scoreColor =
    chunk.relevance_score >= 0.7
      ? 'from-emerald-500 to-teal-500'
      : chunk.relevance_score >= 0.4
      ? 'from-amber-500 to-orange-500'
      : 'from-red-500 to-rose-500';

  const chunkTypeColors: Record<string, string> = {
    paragraph: 'text-sky-400/70 bg-sky-500/8',
    list: 'text-amber-400/70 bg-amber-500/8',
    code: 'text-green-400/70 bg-green-500/8',
    table: 'text-rose-400/70 bg-rose-500/8',
    heading: 'text-teal-400/70 bg-teal-500/8',
  };

  const typeStyle = chunkTypeColors[chunk.chunk_type ?? 'paragraph'] ?? chunkTypeColors.paragraph;

  return (
    <div className="rounded-xl border border-white/10 bg-white/4 overflow-hidden hover:border-white/18 transition-all duration-200">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/4 transition-colors"
      >
        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${scoreColor} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold shadow-sm`}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-xs font-medium text-white/70 truncate">{chunk.document_title}</p>
            {chunk.chunk_type && chunk.chunk_type !== 'paragraph' && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${typeStyle} flex-shrink-0 capitalize`}>
                {chunk.chunk_type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Hash className="w-3 h-3 text-white/20 flex-shrink-0" />
            <p className="text-xs text-white/25">Chunk {chunk.chunk_index + 1}</p>
            {chunk.section_heading && (
              <>
                <span className="text-white/15">·</span>
                <p className="text-xs text-white/30 truncate italic">{chunk.section_heading}</p>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex flex-col items-end">
            <span className={`text-xs font-bold bg-gradient-to-r ${scoreColor} bg-clip-text text-transparent`}>
              {Math.round(chunk.relevance_score * 100)}%
            </span>
            <span className="text-xs text-white/25">match</span>
          </div>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-white/25" /> : <ChevronDown className="w-3.5 h-3.5 text-white/25" />}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-white/6 pt-2.5 space-y-2">
          {chunk.relevance_reason && (
            <p className="text-xs text-white/40 italic bg-teal-500/5 border border-teal-500/12 rounded-lg p-2 leading-relaxed">
              {chunk.relevance_reason}
            </p>
          )}
          <p className="text-xs text-white/50 leading-relaxed font-mono bg-black/25 rounded-lg p-2.5 whitespace-pre-wrap break-words">
            {chunk.chunk_text}
          </p>
        </div>
      )}
    </div>
  );
};

export const RagQueryPanel: React.FC<RagQueryPanelProps> = ({
  sessionId,
  chunks,
  documents,
  onPipelineStep,
  onQuerySaved,
}) => {
  const [query, setQuery] = useState('');
  const { provider, geminiKey, groqKey } = useApiSettings();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retrievalStrategy, setRetrievalStrategy] = useState<RetrievalStrategy>('hybrid');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.2);
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [result]);

  const buildDocTitle = (chunkDocId: string) => {
    const doc = documents.find(d => d.id === chunkDocId);
    return doc ? doc.title : 'Unknown Document';
  };

  const runQuery = async () => {
    if (!query.trim() || loading || chunks.length === 0) return;
    setError(null);
    setLoading(true);
    setResult(null);

    const llm = new LLMService(provider, geminiKey, groqKey);

    try {
      onPipelineStep(3);

      let candidates: RagChunk[];
      if (retrievalStrategy === 'keyword') {
        setLoadingStep('Keyword filtering…');
        const scored = chunks.map(c => ({ chunk: c, score: keywordScore(query, c.chunk_keywords ?? []) }));
        scored.sort((a, b) => b.score - a.score);
        candidates = scored.slice(0, 15).map(s => s.chunk);
      } else if (retrievalStrategy === 'semantic') {
        setLoadingStep('Preparing all chunks for semantic re-ranking…');
        candidates = chunks.slice(0, 30);
      } else {
        setLoadingStep('Hybrid pre-filtering…');
        candidates = hybridPreFilter(query, chunks, 25);
      }

      setLoadingStep('Semantic re-ranking…');

      const chunkListText = candidates
        .map((c, i) => `[CHUNK_${i}|ID:${c.id}|DOC:${c.document_id}|IDX:${c.chunk_index}]\n${c.chunk_text}`)
        .join('\n\n---\n\n');

      const retrievalPrompt = `You are a precision retrieval engine for a RAG system. Score the relevance of each chunk to the user query.

USER QUERY: "${query}"

CHUNKS (${candidates.length} candidates):
${chunkListText}

Return a JSON array:
[
  {"chunk_index": 0, "relevance_score": 0.85, "reason": "One sentence explaining relevance"},
  {"chunk_index": 2, "relevance_score": 0.72, "reason": "Contains specific data about X"}
]

Rules:
- Only include chunks with relevance_score > ${confidenceThreshold}
- Return at most 5 chunks
- relevance_score: float 0.0–1.0
- reason: ONE concise sentence, max 15 words
- chunk_index: 0-based position in the list above
- Return ONLY the JSON array, no explanation, no markdown`;

      const retrievalResponse = await llm.generateResponse(retrievalPrompt, undefined, undefined, undefined, { temperature: 0.1 });

      let scored: Array<{ chunk_index: number; relevance_score: number; reason?: string }> = [];
      try {
        const cleaned = retrievalResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        scored = JSON.parse(cleaned);
      } catch {
        const matches = retrievalResponse.match(/\{[^}]+\}/g);
        if (matches) {
          scored = matches.map(m => { try { return JSON.parse(m); } catch { return null; } }).filter(Boolean);
        }
      }

      const retrievedChunks: RetrievedChunk[] = scored
        .filter(s => s && typeof s.chunk_index === 'number' && s.chunk_index < candidates.length)
        .map(s => ({
          ...candidates[s.chunk_index],
          relevance_score: Math.min(1, Math.max(0, s.relevance_score)),
          document_title: buildDocTitle(candidates[s.chunk_index].document_id),
          relevance_reason: s.reason,
        }))
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, 5);

      if (retrievedChunks.length === 0) {
        throw new Error('No relevant chunks found above the confidence threshold. Try lowering the threshold or rephrasing your question.');
      }

      onPipelineStep(4);
      setLoadingStep('Generating grounded answer…');

      const context = retrievedChunks
        .map((c, i) => `[Source ${i + 1} - "${c.document_title}", Chunk #${c.chunk_index + 1}]\n${c.chunk_text}`)
        .join('\n\n---\n\n');

      const generationPrompt = `You are a knowledgeable AI assistant. Answer the user's question based ONLY on the provided context.

CONTEXT FROM KNOWLEDGE BASE:
${context}

USER QUESTION: ${query}

Instructions:
- Answer ONLY from the context above. Do not use outside knowledge.
- Cite sources inline as [Source N] when referencing specific chunks
- If the context doesn't contain enough information, say so clearly
- Be concise but comprehensive. Use markdown where appropriate.
- After the answer, add a separator "---" then output a JSON object (no code blocks):
{"confidence":"high|medium|low","followups":["question1","question2","question3"]}`;

      onPipelineStep(5);
      const rawAnswer = await llm.generateResponse(generationPrompt, undefined, undefined, undefined, { temperature: 0.3 });

      let answerText = rawAnswer;
      let confidenceScore = 'medium';
      let followUpQuestions: string[] = [];

      const separatorIdx = rawAnswer.lastIndexOf('---');
      if (separatorIdx !== -1) {
        answerText = rawAnswer.slice(0, separatorIdx).trim();
        const jsonPart = rawAnswer.slice(separatorIdx + 3).trim();
        try {
          const parsed = JSON.parse(jsonPart.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
          if (['high', 'medium', 'low'].includes(parsed.confidence)) confidenceScore = parsed.confidence;
          if (Array.isArray(parsed.followups)) followUpQuestions = parsed.followups.slice(0, 3);
        } catch {
          // keep defaults
        }
      }

      const newResult: QueryResult = {
        query,
        chunks: retrievedChunks,
        answer: answerText,
        confidenceScore,
        followUpQuestions,
        timestamp: new Date(),
        retrievalStrategy,
      };

      setResult(newResult);
      setQuery('');

      const saved = await saveQuery(
        sessionId,
        query,
        retrievedChunks.map(c => c.id),
        answerText,
        confidenceScore,
        followUpQuestions,
        retrievalStrategy
      );
      if (saved && onQuerySaved) onQuerySaved(saved);

      onPipelineStep(6);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed.');
      onPipelineStep(-1);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const noChunks = chunks.length === 0;

  const suggestedQueries = [
    'Summarize the main topics covered',
    'What are the key findings or conclusions?',
    'Explain the most important concepts',
    'What methodology or approach is described?',
  ];

  const strategyLabels: Record<RetrievalStrategy, string> = {
    hybrid: 'Hybrid (Keyword + Semantic)',
    keyword: 'Keyword-only (BM25)',
    semantic: 'Semantic-only',
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Query &amp; Retrieval</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {noChunks ? 'Upload a document first' : `${chunks.length} chunks · ${strategyLabels[retrievalStrategy]}`}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(s => !s)}
          className={`flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${showSettings ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-white/40 border-white/10 hover:text-white/70 hover:border-white/20'}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Settings
        </button>
      </div>

      {showSettings && (
        <div className="rounded-xl border border-white/10 bg-white/3 p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Retrieval Strategy</p>
            <div className="flex gap-1.5 flex-wrap">
              {(['hybrid', 'keyword', 'semantic'] as RetrievalStrategy[]).map(s => (
                <button
                  key={s}
                  onClick={() => setRetrievalStrategy(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${retrievalStrategy === s ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'text-white/40 border-white/10 hover:text-white/70'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30">
              {retrievalStrategy === 'hybrid' && 'Keyword pre-filtering + LLM semantic re-ranking. Best for most use cases.'}
              {retrievalStrategy === 'keyword' && 'BM25-style keyword matching only. Fast, good for exact terminology.'}
              {retrievalStrategy === 'semantic' && 'Pure LLM semantic scoring. Best for conceptual or paraphrase queries.'}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Confidence Threshold</p>
              <span className="text-xs font-mono text-amber-400">{confidenceThreshold.toFixed(2)}</span>
            </div>
            <input
              type="range" min={0} max={0.9} step={0.05} value={confidenceThreshold}
              onChange={e => setConfidenceThreshold(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
            <p className="text-xs text-white/30">Chunks below this score are excluded. Lower = more results, higher = stricter.</p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {!result && !loading && !error && (
          <div className="flex flex-col items-center justify-center h-full gap-5 py-10">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-amber-400/60" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white/50">Ask anything about your documents</p>
              <p className="text-xs text-white/25 mt-1 max-w-xs">
                {noChunks
                  ? 'Upload a document in the Knowledge Base panel first'
                  : `${strategyLabels[retrievalStrategy]} retrieval across ${chunks.length} chunks`}
              </p>
            </div>
            {!noChunks && (
              <div className="flex flex-col gap-1.5 w-full max-w-sm">
                {suggestedQueries.map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="text-xs px-3 py-2 rounded-xl border border-white/8 bg-white/3 text-white/40 hover:text-white/70 hover:border-white/18 hover:bg-white/6 transition-all text-left flex items-center gap-2"
                  >
                    <ArrowRight className="w-3 h-3 flex-shrink-0 text-amber-500/50" />
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Cpu className="w-7 h-7 text-amber-400/70 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm text-white/60 font-semibold">Running RAG Pipeline</p>
              <p className="text-xs text-white/30 mt-1">{loadingStep || 'Initializing…'}</p>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl bg-red-500/8 border border-red-500/20 p-4">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300">Query Failed</p>
              <p className="text-xs text-red-400/70 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/4 border border-white/8 p-3 flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-amber-400 text-xs font-bold">Q</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white/80 font-medium leading-relaxed">{result.query}</p>
                <p className="text-xs text-white/25 mt-1">Strategy: {strategyLabels[result.retrievalStrategy]}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                <p className="text-xs font-semibold text-white/45 uppercase tracking-widest">
                  Retrieved Sources ({result.chunks.length})
                </p>
                <span className="text-xs text-white/22">{chunks.length} chunks searched</span>
              </div>
              <div className="space-y-2">
                {result.chunks.map((chunk, i) => (
                  <ChunkCard key={chunk.id} chunk={chunk} rank={i + 1} />
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-400 to-emerald-500" />
                <p className="text-xs font-semibold text-white/45 uppercase tracking-widest">Generated Answer</p>
                <Sparkles className="w-3 h-3 text-teal-400/55" />
                {(() => {
                  const conf = CONFIDENCE_CONFIG[result.confidenceScore] ?? CONFIDENCE_CONFIG.medium;
                  return (
                    <span className={`ml-auto flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${conf.bg} ${conf.border} border ${conf.color}`}>
                      {conf.icon}
                      {conf.label}
                    </span>
                  );
                })()}
              </div>
              <div className="rounded-xl bg-white/4 border border-white/8 p-4">
                <div className="prose prose-sm prose-invert max-w-none text-white/78 text-sm leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
                </div>
              </div>
            </div>

            {result.followUpQuestions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-2">Follow-up questions</p>
                <div className="space-y-1.5">
                  {result.followUpQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(q)}
                      className="w-full text-left text-xs px-3 py-2 rounded-xl border border-teal-500/15 bg-teal-500/5 text-teal-300/65 hover:text-teal-300 hover:border-teal-500/30 hover:bg-teal-500/10 transition-all flex items-center gap-2"
                    >
                      <ArrowRight className="w-3 h-3 flex-shrink-0" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex gap-3 items-end pt-2 border-t border-white/8">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); runQuery(); } }}
          placeholder={noChunks ? 'Upload a document first…' : 'Ask a question about your documents… (Enter to send)'}
          disabled={loading || noChunks}
          rows={2}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-amber-500/40 disabled:opacity-40 text-white placeholder-white/30 transition-colors"
        />
        <button
          onClick={runQuery}
          disabled={loading || !query.trim() || noChunks}
          className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

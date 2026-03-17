import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, BookOpen, FlaskConical, BarChart2, PanelLeftClose, PanelLeftOpen,
  History, Layers, Database, Zap, Cpu
} from 'lucide-react';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { mergeAnonymousSessionToUser } from '../../utils/sessionUtils';
import { RagDocumentPanel } from './RagDocumentPanel';
import { RagQueryPanel } from './RagQueryPanel';
import { RagPipelineDiagram } from './RagPipelineDiagram';
import { RagConceptPanel } from './RagConceptPanel';
import {
  getOrCreateSessionId,
  getDocuments,
  getChunksBySession,
  getQueryHistory,
  RagDocument,
  RagChunk,
  RagQuery,
} from '../../services/ragService';

interface RagLabProps {
  onBack: () => void;
}

type SidebarTab = 'pipeline' | 'concepts' | 'history' | 'chunks';

export const RagLab: React.FC<RagLabProps> = ({ onBack }) => {
  const { provider } = useApiSettings();
  const { user } = useAuth();
  const [sessionId] = useState(() => getOrCreateSessionId(user?.id));
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [chunks, setChunks] = useState<RagChunk[]>([]);
  const [queryHistory, setQueryHistory] = useState<RagQuery[]>([]);
  const [pipelineStep, setPipelineStep] = useState(-1);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pipeline');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) mergeAnonymousSessionToUser('rag_lab', 'rag_documents', 'session_id', user.id);
  }, [user?.id]);

  useEffect(() => {
    const load = async () => {
      const [docs, chks, hist] = await Promise.all([
        getDocuments(sessionId),
        getChunksBySession(sessionId),
        getQueryHistory(sessionId),
      ]);
      setDocuments(docs);
      setChunks(chks);
      setQueryHistory(hist);
      setLoading(false);
    };
    load();
  }, [sessionId]);

  const handleDocumentAdded = useCallback(async (doc: RagDocument) => {
    setDocuments(prev => [doc, ...prev]);
    const allChunks = await getChunksBySession(sessionId);
    setChunks(allChunks);
  }, [sessionId]);

  const handleDocumentDeleted = useCallback((docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setChunks(prev => prev.filter(c => c.document_id !== docId));
  }, []);

  const handleQuerySaved = useCallback((q: RagQuery) => {
    setQueryHistory(prev => [q, ...prev.slice(0, 19)]);
  }, []);

  const totalWords = documents.reduce((acc, d) => acc + d.word_count, 0);

  const sidebarTabs: { id: SidebarTab; icon: React.ElementType; label: string }[] = [
    { id: 'pipeline', icon: FlaskConical, label: 'Pipeline' },
    { id: 'concepts', icon: BookOpen, label: 'Concepts' },
    { id: 'history', icon: History, label: 'History' },
    { id: 'chunks', icon: Layers, label: 'Chunks' },
  ];

  const chunkTypeColors: Record<string, string> = {
    paragraph: 'text-sky-400 bg-sky-500/10',
    list: 'text-amber-400 bg-amber-500/10',
    code: 'text-green-400 bg-green-500/10',
    table: 'text-rose-400 bg-rose-500/10',
    heading: 'text-teal-400 bg-teal-500/10',
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/8 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white">RAG Lab</h1>
            <p className="text-xs text-white/40">Retrieval-Augmented Generation — NLP, retrieval &amp; LLMs</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs text-white/40">
            <span>{documents.length} docs</span>
            <span className="w-px h-3 bg-white/15" />
            <span>{chunks.length} chunks</span>
            <span className="w-px h-3 bg-white/15" />
            <span>{totalWords.toLocaleString()} words</span>
            <span className="w-px h-3 bg-white/15" />
            <span>{queryHistory.length} queries</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${provider === 'gemini' ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
            {provider === 'gemini' ? <Zap className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
            {provider === 'gemini' ? 'Gemini' : 'Groq'}
          </div>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 hover:bg-white/8 rounded-lg transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4 text-white/50" /> : <PanelLeftOpen className="w-4 h-4 text-white/50" />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
              <FlaskConical className="w-6 h-6 text-amber-400" />
            </div>
            <p className="text-sm text-white/40">Loading RAG Lab…</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
            <div className="border-r border-white/8 overflow-y-auto p-5">
              <RagDocumentPanel
                sessionId={sessionId}
                documents={documents}
                onDocumentAdded={handleDocumentAdded}
                onDocumentDeleted={handleDocumentDeleted}
                onPipelineStep={setPipelineStep}
              />
            </div>
            <div className="overflow-y-auto p-5">
              <RagQueryPanel
                sessionId={sessionId}
                chunks={chunks}
                documents={documents}
                onPipelineStep={setPipelineStep}
                onQuerySaved={handleQuerySaved}
              />
            </div>
          </div>

          {sidebarOpen && (
            <div className="w-72 border-l border-white/8 flex flex-col flex-shrink-0">
              <div className="flex border-b border-white/8">
                {sidebarTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSidebarTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors ${sidebarTab === tab.id ? 'text-amber-400 border-b-2 border-amber-500' : 'text-white/30 hover:text-white/60'}`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {sidebarTab === 'pipeline' && (
                  <div className="space-y-5">
                    <RagPipelineDiagram activeStep={pipelineStep} />
                    <div>
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Session Stats</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Documents', value: documents.length, color: 'text-sky-400' },
                          { label: 'Chunks', value: chunks.length, color: 'text-teal-400' },
                          { label: 'Words', value: totalWords > 999 ? `${(totalWords / 1000).toFixed(1)}k` : totalWords, color: 'text-amber-400' },
                          { label: 'Queries', value: queryHistory.length, color: 'text-rose-400' },
                        ].map(stat => (
                          <div key={stat.label} className="rounded-xl border border-white/8 bg-white/3 p-3">
                            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-white/30">{stat.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {sidebarTab === 'concepts' && <RagConceptPanel />}

                {sidebarTab === 'history' && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Query History</p>
                    {queryHistory.length === 0 ? (
                      <p className="text-xs text-white/25 text-center pt-6">No queries yet</p>
                    ) : (
                      queryHistory.map(q => (
                        <div key={q.id} className="rounded-xl border border-white/8 bg-white/3 p-3 space-y-1.5">
                          <p className="text-xs font-medium text-white/70 line-clamp-2">"{q.query_text}"</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                              q.confidence_score === 'high' ? 'bg-emerald-500/15 text-emerald-400' :
                              q.confidence_score === 'low' ? 'bg-red-500/15 text-red-400' :
                              'bg-amber-500/15 text-amber-400'
                            }`}>{q.confidence_score}</span>
                            <span className="text-xs text-white/25">{q.chunks_retrieved} chunks</span>
                            <span className="text-xs text-white/20">{new Date(q.created_at).toLocaleDateString()}</span>
                          </div>
                          {q.follow_up_questions && q.follow_up_questions.length > 0 && (
                            <p className="text-xs text-white/30 truncate italic">{q.follow_up_questions[0]}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {sidebarTab === 'chunks' && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Chunk Browser ({chunks.length})</p>
                    {chunks.length === 0 ? (
                      <p className="text-xs text-white/25 text-center pt-6">No chunks yet.<br />Upload a document to see chunks.</p>
                    ) : (
                      <div className="space-y-2">
                        {chunks.slice(0, 50).map(chunk => {
                          const doc = documents.find(d => d.id === chunk.document_id);
                          const typeStyle = chunkTypeColors[chunk.chunk_type ?? 'paragraph'] ?? chunkTypeColors.paragraph;
                          return (
                            <div key={chunk.id} className="rounded-xl border border-white/8 bg-white/3 p-2.5 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-white/40 truncate">{doc?.title ?? 'Unknown'} #{chunk.chunk_index + 1}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeStyle}`}>{chunk.chunk_type ?? 'para'}</span>
                              </div>
                              <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{chunk.chunk_text}</p>
                              {chunk.chunk_keywords && chunk.chunk_keywords.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {chunk.chunk_keywords.slice(0, 4).map(kw => (
                                    <span key={kw} className="text-xs text-white/25 bg-white/5 rounded px-1 py-0.5">{kw}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {chunks.length > 50 && (
                          <p className="text-xs text-white/25 text-center">…and {chunks.length - 50} more chunks</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

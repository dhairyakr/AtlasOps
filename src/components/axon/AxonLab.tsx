import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Brain, Network, Sparkles, Loader2, MessageCircle } from 'lucide-react';
import { AxonService, AxonCapture, AxonConnection, AxonCluster, AxonSynthesis, AxonSearchResult } from '../../services/axonService';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { AxonCaptureBar } from './AxonCaptureBar';
import { AxonMemoryCard } from './AxonMemoryCard';
import { AxonSearchBar } from './AxonSearchBar';
import { AxonGraph } from './AxonGraph';
import { AxonSynthesisPanel } from './AxonSynthesisPanel';

interface AxonLabProps {
  onBack: () => void;
}

type AxonView = 'capture' | 'graph' | 'synthesis';

function getOrCreateSessionId(): string {
  const key = 'axon-session-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `axon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export const AxonLab: React.FC<AxonLabProps> = ({ onBack }) => {
  const { provider, geminiKey, groqKey } = useApiSettings();
  const serviceRef = useRef<AxonService | null>(null);

  const [view, setView] = useState<AxonView>('capture');
  const [captures, setCaptures] = useState<AxonCapture[]>([]);
  const [connections, setConnections] = useState<AxonConnection[]>([]);
  const [clusters, setClusters] = useState<AxonCluster[]>([]);
  const [synthesis, setSynthesis] = useState<AxonSynthesis | null>(null);
  const [searchResult, setSearchResult] = useState<AxonSearchResult | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingSynthesis, setIsGeneratingSynthesis] = useState(false);
  const [isBuildingClusters, setIsBuildingClusters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [panelVisible, setPanelVisible] = useState(true);

  useEffect(() => {
    const llm = new LLMService(provider, geminiKey, groqKey);
    const sessionId = getOrCreateSessionId();
    serviceRef.current = new AxonService(llm, sessionId);

    const init = async () => {
      setIsLoading(true);
      const svc = serviceRef.current!;
      const [caps, conns, clusts, syn] = await Promise.all([
        svc.loadCaptures(),
        svc.loadConnections(),
        svc.loadClusters(),
        svc.loadLatestSynthesis(),
      ]);
      setCaptures(caps);
      setConnections(conns);
      setClusters(clusts);
      setSynthesis(syn);
      setIsLoading(false);
    };

    init();
  }, [provider, geminiKey, groqKey]);

  const handleSaveCapture = useCallback(async (
    text: string,
    type: AxonCapture['capture_type'],
    isVoice: boolean
  ) => {
    if (!serviceRef.current) return;
    setIsSaving(true);
    const newCapture = await serviceRef.current.saveCapture(text, type, isVoice);
    if (newCapture) {
      setCaptures(prev => [newCapture, ...prev]);
    }
    setIsSaving(false);
  }, []);

  const handleDeleteCapture = useCallback(async (id: string) => {
    if (!serviceRef.current) return;
    await serviceRef.current.deleteCapture(id);
    setCaptures(prev => prev.filter(c => c.id !== id));
    setConnections(prev => prev.filter(c => c.source_id !== id && c.target_id !== id));
    if (searchResult) {
      setSearchResult(prev => prev ? {
        ...prev,
        captures: prev.captures.filter(c => c.id !== id)
      } : null);
    }
  }, [searchResult]);

  const handleFindConnections = useCallback(async (id: string) => {
    if (!serviceRef.current) return;
    setConnectingId(id);
    const newConns = await serviceRef.current.discoverConnections(id, captures);
    if (newConns.length > 0) {
      setConnections(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        return [...prev, ...newConns.filter(c => !existingIds.has(c.id))];
      });
    }
    setConnectingId(null);
  }, [captures]);

  const handleSearch = useCallback(async (query: string) => {
    if (!serviceRef.current) return;
    setIsSearching(true);
    const result = await serviceRef.current.semanticSearch(query, captures);
    setSearchResult(result);
    setIsSearching(false);
  }, [captures]);

  const handleGenerateSynthesis = useCallback(async () => {
    if (!serviceRef.current) return;
    setIsGeneratingSynthesis(true);
    const syn = await serviceRef.current.generateDailySynthesis(captures);
    if (syn) setSynthesis(syn);
    setIsGeneratingSynthesis(false);
  }, [captures]);

  const handleBuildClusters = useCallback(async () => {
    if (!serviceRef.current) return;
    setIsBuildingClusters(true);
    const newClusters = await serviceRef.current.buildClusters(captures);
    setClusters(newClusters);
    setIsBuildingClusters(false);
  }, [captures]);

  const displayCaptures = searchResult ? searchResult.captures : captures;
  const searchHighlightIds = searchResult ? searchResult.captures.map(c => c.id) : undefined;

  const navItems = [
    { id: 'capture' as AxonView, icon: MessageCircle, label: 'Memory' },
    { id: 'graph' as AxonView, icon: Network, label: 'Graph' },
    { id: 'synthesis' as AxonView, icon: Sparkles, label: 'Synthesis' },
  ];

  return (
    <div className="min-h-screen flex flex-col text-white relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(15,12,30,1) 0%, rgba(5,5,12,1) 100%)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `rgba(${180 + Math.floor(Math.random() * 75)},${100 + Math.floor(Math.random() * 80)},${50 + Math.floor(Math.random() * 100)},${0.2 + Math.random() * 0.4})`,
              animation: `cosmic-drift ${12 + Math.random() * 20}s ${Math.random() * -20}s linear infinite`,
            }}
          />
        ))}
      </div>

      <header className="relative z-20 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', background: 'rgba(5,5,12,0.7)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70 transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center relative"
              style={{ background: 'rgba(217,119,6,0.18)', border: '1px solid rgba(217,119,6,0.28)' }}
            >
              <Brain className="w-3.5 h-3.5 text-amber-400" />
              <div className="absolute inset-0 rounded-lg animate-pulse" style={{ background: 'rgba(217,119,6,0.08)' }} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold text-white/90 tracking-wide">Axon</h1>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold tracking-widest text-amber-400/60 uppercase"
                  style={{ background: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.15)' }}>
                  Exocortex
                </span>
              </div>
              <p className="text-[10px] text-white/25 leading-none mt-0.5">Personal knowledge graph</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {navItems.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setView(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                view === id ? 'text-amber-400' : 'text-white/35 hover:text-white/55'
              }`}
              style={view === id ? {
                background: 'rgba(217,119,6,0.14)',
                boxShadow: '0 0 12px rgba(217,119,6,0.15)',
              } : {}}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {captures.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-white/40">{captures.length}</span>
                <span className="text-white/20">memories</span>
              </div>
            )}
            {connections.length > 0 && (
              <div className="text-xs text-white/20">
                {connections.length} synapses
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="relative">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'rgba(217,119,6,0.3)' }} />
            </div>
            <p className="text-xs text-white/30">Loading your exocortex...</p>
          </div>
        ) : (
          <>
            {view === 'capture' && (
              <div className="h-full flex">
                <div className={`flex flex-col transition-all duration-500 ${panelVisible ? 'w-full lg:w-[420px]' : 'w-0 overflow-hidden'} flex-shrink-0 border-r`}
                  style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(5,5,12,0.6)', backdropFilter: 'blur(8px)' }}
                >
                  <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    <AxonSearchBar
                      onSearch={handleSearch}
                      isSearching={isSearching}
                      onClear={() => setSearchResult(null)}
                      hasResults={!!searchResult}
                    />

                    {searchResult && (
                      <div className="rounded-xl p-3 space-y-2"
                        style={{ background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)' }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-400/70" />
                          <span className="text-[10px] font-semibold text-amber-400/80 uppercase tracking-wider">Memory Synthesis</span>
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">{searchResult.synthesis}</p>
                        <p className="text-[10px] text-white/25">{searchResult.captures.length} relevant capture{searchResult.captures.length !== 1 ? 's' : ''}</p>
                      </div>
                    )}

                    <AxonCaptureBar onSave={handleSaveCapture} isSaving={isSaving} />

                    {displayCaptures.length === 0 && !searchResult && (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="relative mb-4">
                          <Brain className="w-12 h-12 text-white/8" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 rounded-full border border-amber-400/10 animate-ping" />
                          </div>
                        </div>
                        <p className="text-white/25 text-sm font-medium">Your exocortex awaits</p>
                        <p className="text-white/15 text-xs mt-1 max-w-[200px]">Capture your first thought and watch the neural web form.</p>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      {displayCaptures.map(capture => (
                        <AxonMemoryCard
                          key={capture.id}
                          capture={capture}
                          onDelete={handleDeleteCapture}
                          onFindConnections={handleFindConnections}
                          isConnecting={connectingId === capture.id}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-1 relative min-h-0 overflow-hidden">
                  {captures.length > 0 ? (
                    <div className="absolute inset-0 p-4">
                      <AxonGraph
                        captures={captures}
                        connections={connections}
                        clusters={clusters}
                        onBuildClusters={handleBuildClusters}
                        isBuildingClusters={isBuildingClusters}
                        highlightIds={searchHighlightIds}
                      />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Network className="w-16 h-16 text-white/5 mx-auto mb-3" />
                        <p className="text-white/15 text-sm">Graph will appear here</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setPanelVisible(v => !v)}
                    className="absolute top-4 left-4 z-10 p-2 rounded-lg text-white/30 hover:text-white/60 transition-all duration-200"
                    style={{ background: 'rgba(5,5,15,0.7)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
                  >
                    <ArrowLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${!panelVisible ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {view === 'graph' && (
              <div className="h-full p-4">
                <AxonGraph
                  captures={captures}
                  connections={connections}
                  clusters={clusters}
                  onBuildClusters={handleBuildClusters}
                  isBuildingClusters={isBuildingClusters}
                  highlightIds={searchHighlightIds}
                />
              </div>
            )}

            {view === 'synthesis' && (
              <div className="h-full overflow-y-auto">
                <div className="max-w-2xl mx-auto p-6">
                  <AxonSynthesisPanel
                    synthesis={synthesis}
                    captureCount={captures.length}
                    onGenerate={handleGenerateSynthesis}
                    isGenerating={isGeneratingSynthesis}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

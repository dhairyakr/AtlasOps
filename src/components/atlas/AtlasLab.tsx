import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Globe, Loader2 } from 'lucide-react';
import { AtlasService, AtlasQuery, AtlasWatchlistEntry, AtlasSignal, IntelBrief, extractRegions } from '../../services/atlasService';
import { LLMService } from '../../services/llmService';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { AtlasQueryBar } from './AtlasQueryBar';
import { AtlasIntelBrief } from './AtlasIntelBrief';
import { AtlasSignalFeed } from './AtlasSignalFeed';
import { AtlasWorldMap } from './AtlasWorldMap';
import { AtlasWatchlist } from './AtlasWatchlist';
import { ErrorBoundary } from '../ErrorBoundary';
import { COUNTRY_CONFIGS, COUNTRY_LIST } from '../../data/atlasCountries';

interface AtlasLabProps {
  onBack: () => void;
}

function getOrCreateAtlasSessionId(): string {
  const key = 'atlas-session-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `atlas-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export const AtlasLab: React.FC<AtlasLabProps> = ({ onBack }) => {
  const { provider, geminiKey, groqKey, serperKey } = useApiSettings();
  const serviceRef = useRef<AtlasService | null>(null);

  const [selectedCountryId, setSelectedCountryId] = useState<string>('india');
  const [currentBrief, setCurrentBrief] = useState<{ brief: IntelBrief; query: AtlasQuery } | null>(null);
  const [signals, setSignals] = useState<AtlasSignal[]>([]);
  const [watchlist, setWatchlist] = useState<AtlasWatchlistEntry[]>([]);
  const [highlightedRegions, setHighlightedRegions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const llm = new LLMService(provider, geminiKey, groqKey);
    const sessionId = getOrCreateAtlasSessionId();
    serviceRef.current = new AtlasService(llm, sessionId, serperKey);

    const init = async () => {
      setIsInitializing(true);
      const svc = serviceRef.current!;
      const [sigs, wl] = await Promise.all([
        svc.loadRecentSignals(),
        svc.loadWatchlist(),
      ]);
      setSignals(sigs);
      setWatchlist(wl);
      setIsInitializing(false);
    };

    init();
  }, [provider, geminiKey, groqKey, serperKey]);

  const handleQuery = useCallback(async (question: string) => {
    if (!serviceRef.current) return;
    setIsLoading(true);
    const regions = extractRegions(question);
    setHighlightedRegions(regions);

    try {
      const result = await serviceRef.current.generateIntelBrief(question);
      setCurrentBrief({ brief: result.brief, query: result.query });

      if (result.signals.length > 0) {
        setSignals(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          return [...result.signals.filter(s => !existingIds.has(s.id)), ...prev].slice(0, 80);
        });
      }
    } catch (err) {
      console.error('Atlas query failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSaveToWatchlist = useCallback(async () => {
    if (!serviceRef.current || !currentBrief) return;
    await serviceRef.current.saveToWatchlist(
      currentBrief.query.question,
      currentBrief.query.regions,
      currentBrief.query.brief
    );
    const wl = await serviceRef.current.loadWatchlist();
    setWatchlist(wl);
  }, [currentBrief]);

  const handleRemoveFromWatchlist = useCallback(async (id: string) => {
    if (!serviceRef.current) return;
    await serviceRef.current.removeFromWatchlist(id);
    setWatchlist(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleRegionClick = useCallback((regionQuery: string) => {
    handleQuery(`What is the current situation and key risks in ${regionQuery}?`);
  }, [handleQuery]);

  return (
    <div className="min-h-screen flex flex-col chat-galaxy-bg text-white relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="thought-particle" style={{ left: '10%', animationDelay: '0s' }}></div>
        <div className="thought-particle" style={{ left: '20%', animationDelay: '3s' }}></div>
        <div className="thought-particle" style={{ left: '35%', animationDelay: '6s' }}></div>
        <div className="thought-particle" style={{ left: '50%', animationDelay: '9s' }}></div>
        <div className="thought-particle" style={{ left: '65%', animationDelay: '12s' }}></div>
        <div className="thought-particle" style={{ left: '80%', animationDelay: '15s' }}></div>
        <div className="thought-particle" style={{ left: '90%', animationDelay: '18s' }}></div>
      </div>

      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm text-white/50 hover:text-white/80 transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(20,184,166,0.2)', border: '1px solid rgba(20,184,166,0.3)' }}
            >
              <Globe className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white/90 leading-none">Atlas</h1>
              <p className="text-[10px] text-white/30 mt-0.5">World Intelligence Dashboard</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-white/25">
          {signals.length > 0 && <span>{signals.length} signals tracked</span>}
          {watchlist.length > 0 && <span>{watchlist.length} on watchlist</span>}
        </div>
      </header>

      {isInitializing ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-teal-400 animate-spin" />
        </div>
      ) : (
        <main className="flex-1 overflow-auto relative z-10 px-6 py-6 space-y-6">
          <AtlasQueryBar
            onQuery={handleQuery}
            isLoading={isLoading}
            isLiveMode={!!serperKey}
            onSaveToWatchlist={handleSaveToWatchlist}
            hasCurrentQuery={!!currentBrief}
          />

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 space-y-5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {COUNTRY_LIST.map(c => {
                  const isActive = selectedCountryId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCountryId(c.id)}
                      className="px-3 py-1.5 rounded-lg transition-all duration-200"
                      style={isActive ? {
                        background: 'rgba(20,184,166,0.15)',
                        border: '1px solid rgba(20,184,166,0.45)',
                        color: '#5eead4',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        letterSpacing: '0.18em',
                        fontWeight: 700,
                        boxShadow: '0 0 10px rgba(20,184,166,0.18)',
                      } : {
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        color: 'rgba(255,255,255,0.30)',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        letterSpacing: '0.18em',
                        fontWeight: 600,
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              <ErrorBoundary fallback={
                <div className="w-full rounded-2xl flex items-center justify-center text-white/40 text-sm"
                  style={{ background: 'rgba(2,8,18,0.95)', border: '1px solid rgba(255,255,255,0.07)', aspectRatio: '2/1' }}>
                  Map could not be loaded
                </div>
              }>
                <AtlasWorldMap
                  signals={signals}
                  highlightedRegions={highlightedRegions}
                  onRegionClick={handleRegionClick}
                  country={COUNTRY_CONFIGS[selectedCountryId]}
                />
              </ErrorBoundary>

              {isLoading && (
                <div className="flex flex-col items-center gap-3 py-8"
                  style={{ background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: '1rem' }}
                >
                  <div className="flex gap-1.5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.12}s` }} />
                    ))}
                  </div>
                  <p className="text-sm text-teal-400/70">
                    {serperKey ? 'Gathering live intelligence signals...' : 'Generating intelligence assessment...'}
                  </p>
                </div>
              )}

              {currentBrief && !isLoading && (
                <AtlasIntelBrief brief={currentBrief.brief} query={currentBrief.query} />
              )}
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex-1 rounded-2xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  minHeight: '300px',
                  maxHeight: '600px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <AtlasSignalFeed signals={signals} />
              </div>
            </div>
          </div>

          <AtlasWatchlist
            entries={watchlist}
            onRefresh={handleQuery}
            onRemove={handleRemoveFromWatchlist}
            isLoading={isLoading}
          />
        </main>
      )}
    </div>
  );
};

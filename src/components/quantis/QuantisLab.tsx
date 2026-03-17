import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, TrendingUp, AlertCircle, X } from 'lucide-react';
import { useApiSettings } from '../../contexts/ApiSettingsContext';
import { LLMService } from '../../services/llmService';
import {
  QuantisService, QuantisAnalysis, DiscoveryStock, PricePoint,
  QuantisWatchlistEntry, fetchPriceHistory, fetchCurrentPrice,
} from '../../services/quantisService';
import { QuantisQueryBar } from './QuantisQueryBar';
import { QuantisDiscoveryPanel } from './QuantisDiscoveryPanel';
import { QuantisAnalysisBrief } from './QuantisAnalysisBrief';
import { QuantisWatchlist } from './QuantisWatchlist';
import { QuantisRecentPanel } from './QuantisRecentPanel';

interface QuantisLabProps {
  onBack: () => void;
}

type ViewMode = 'empty' | 'discovery' | 'analysis';

const STATUS_DISCOVER = ['Searching the web...', 'Matching your criteria...', 'Building stock list...'];
const STATUS_ANALYZE = [
  'Fetching financial data...', 'Classifying sector...', 'Running Graham safety checks...',
  'Computing financial health composite...', 'Detecting commodity cycle...', 'Classifying Lynch type...',
  'Running 3-model valuation...', 'Scoring peer comparison...', 'Analysing Porter\'s forces...',
  'Scoring 12 factors...', 'Generating investment brief...',
];

function getSessionId(): string {
  const key = 'quantis_session_id';
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

export const QuantisLab: React.FC<QuantisLabProps> = ({ onBack }) => {
  const { provider, geminiKey, groqKey, serperKey } = useApiSettings();
  const sessionId = useMemo(() => getSessionId(), []);

  const llm = useMemo(() => new LLMService(provider, geminiKey, groqKey), [provider, geminiKey, groqKey]);
  const service = useMemo(() => new QuantisService(llm, sessionId, serperKey), [llm, sessionId, serperKey]);

  const [view, setView] = useState<ViewMode>('empty');
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [lastCriteria, setLastCriteria] = useState('');

  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryStock[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<QuantisAnalysis | null>(null);
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [livePrice, setLivePrice] = useState<{ price: number; currency: string } | null>(null);

  const [watchlist, setWatchlist] = useState<QuantisWatchlistEntry[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<QuantisAnalysis[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    service.loadWatchlist().then(setWatchlist);
    service.loadRecentAnalyses().then(setRecentAnalyses);
  }, [service]);

  const withStatus = (steps: string[], intervalMs = 2000) => {
    let i = 0;
    setStatusText(steps[0]);
    const t = setInterval(() => { i = (i + 1) % steps.length; setStatusText(steps[i]); }, intervalMs);
    return () => clearInterval(t);
  };

  const handleDiscover = async (criteria: string) => {
    setIsLoading(true);
    setErrorText(null);
    setLastCriteria(criteria);
    const stop = withStatus(STATUS_DISCOVER);
    try {
      const stocks = await service.discoverStocks(criteria);
      setDiscoveryResults(stocks);
      setCurrentAnalysis(null);
      setView('discovery');
    } finally {
      stop(); setIsLoading(false); setStatusText('');
    }
  };

  const handleAnalyze = async (ticker: string, exchange: string) => {
    setIsLoading(true);
    setErrorText(null);
    setView('analysis');
    const stop = withStatus(STATUS_ANALYZE, 2500);
    try {
      const [analysis, history, price] = await Promise.all([
        service.analyzeStock(ticker, exchange),
        fetchPriceHistory(ticker, exchange),
        fetchCurrentPrice(ticker, exchange),
      ]);
      if (analysis) {
        setCurrentAnalysis(analysis);
        setPriceData(history);
        setLivePrice(price);
        setRecentAnalyses(prev => [analysis, ...prev.filter(a => a.id !== analysis.id)].slice(0, 20));
      }
    } catch (err: any) {
      setErrorText(err?.message || `Error analysing "${ticker}". Please check your API key and try again.`);
      setView('empty');
    } finally {
      stop(); setIsLoading(false); setStatusText('');
    }
  };

  const handleSaveToWatchlist = async () => {
    if (!currentAnalysis) return;
    await service.addToWatchlist(currentAnalysis);
    setWatchlist(await service.loadWatchlist());
  };

  const handleRemoveFromWatchlist = async (id: string) => {
    await service.removeFromWatchlist(id);
    setWatchlist(prev => prev.filter(e => e.id !== id));
  };

  const handleSelectRecent = (analysis: QuantisAnalysis) => {
    setCurrentAnalysis(analysis);
    setView('analysis');
    fetchPriceHistory(analysis.ticker, analysis.exchange).then(setPriceData);
    fetchCurrentPrice(analysis.ticker, analysis.exchange).then(setLivePrice);
  };

  const isOnWatchlist = currentAnalysis ? watchlist.some(e => e.ticker === currentAnalysis.ticker) : false;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #070b12 0%, #0a1020 50%, #071215 100%)' }}>
      <header className="flex items-center gap-4 px-4 sm:px-6 py-4 border-b flex-shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/50 hover:text-white/80 transition-all duration-200" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)' }}>
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Quantis</h1>
            <p className="text-[10px] text-white/35 leading-none mt-0.5">Stock Discovery & Deep Analysis</p>
          </div>
        </div>
        <div className="ml-auto">
          {serperKey ? (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(20,184,166,0.1)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.2)' }}>Live Web Search</span>
          ) : (
            <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.15)' }}>AI-Only Mode</span>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 flex-shrink-0 border-r overflow-y-auto p-4 space-y-6 hidden lg:block" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <QuantisWatchlist entries={watchlist} onReanalyze={handleAnalyze} onRemove={handleRemoveFromWatchlist} />
          <QuantisRecentPanel analyses={recentAnalyses} currentId={currentAnalysis?.id} onSelect={handleSelectRecent} />
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <QuantisQueryBar onDiscover={handleDiscover} onAnalyze={handleAnalyze} isLoading={isLoading} statusText={statusText} hasSerperKey={!!serperKey} />

          {errorText && !isLoading && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300/80 flex-1 leading-relaxed">{errorText}</p>
              <button onClick={() => setErrorText(null)} className="text-red-400/50 hover:text-red-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {view === 'empty' && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)' }}>
                <TrendingUp className="w-8 h-8 text-teal-400/40" />
              </div>
              <div className="text-center">
                <p className="text-white/40 text-sm font-semibold">Discover & Analyze Stocks</p>
                <p className="text-white/20 text-xs mt-1 max-w-xs">Search by criteria to find matching stocks, or enter a ticker for a deep 12-factor fundamental analysis</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-sm w-full mt-2">
                {[
                  { label: 'Discovery', desc: 'Find stocks by criteria' },
                  { label: '12-Factor Scorecard', desc: 'Deep fundamental analysis' },
                  { label: 'Graham + Lynch', desc: 'Classic investing frameworks' },
                  { label: '3-Model Valuation', desc: 'PE + EV/EBITDA + DCF blend' },
                  { label: 'Sector-Aware Engine', desc: 'Metals vs FMCG vs Tech' },
                  { label: 'Peer Comparison', desc: 'Company vs industry averages' },
                ].map((f, i) => (
                  <div key={i} className="rounded-xl border p-3" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-xs font-semibold text-teal-400/60">{f.label}</p>
                    <p className="text-[11px] text-white/25 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'discovery' && !isLoading && (
            <QuantisDiscoveryPanel stocks={discoveryResults} onAnalyze={handleAnalyze} criteria={lastCriteria} />
          )}

          {view === 'analysis' && !isLoading && currentAnalysis && (
            <QuantisAnalysisBrief
              analysis={currentAnalysis}
              priceData={priceData}
              currentPrice={livePrice}
              isOnWatchlist={isOnWatchlist}
              onSaveToWatchlist={handleSaveToWatchlist}
            />
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.2)' }}>
                  <TrendingUp className="w-8 h-8 text-teal-400 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-semibold text-white/60">{statusText}</p>
                <div className="flex gap-1 justify-center">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#14b8a6', animationDelay: `${i * 0.12}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

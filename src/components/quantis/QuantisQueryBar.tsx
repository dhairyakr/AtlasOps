import React, { useState } from 'react';
import { Search, TrendingUp, Loader2, ChevronDown } from 'lucide-react';

type QueryMode = 'discover' | 'analyze';
const EXCHANGES = ['NSE', 'BSE', 'NYSE', 'NASDAQ'] as const;

interface QuantisQueryBarProps {
  onDiscover: (criteria: string) => void;
  onAnalyze: (ticker: string, exchange: string) => void;
  isLoading: boolean;
  statusText: string;
  hasSerperKey: boolean;
}

export const QuantisQueryBar: React.FC<QuantisQueryBarProps> = ({
  onDiscover, onAnalyze, isLoading, statusText, hasSerperKey,
}) => {
  const [mode, setMode] = useState<QueryMode>('discover');
  const [criteria, setCriteria] = useState('');
  const [ticker, setTicker] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [showDrop, setShowDrop] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (mode === 'discover') {
      if (criteria.trim()) onDiscover(criteria.trim());
    } else {
      if (ticker.trim()) onAnalyze(ticker.trim().toUpperCase(), exchange);
    }
  };

  return (
    <div
      className="rounded-2xl border p-4 sm:p-5"
      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div
          className="inline-flex rounded-xl p-0.5"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
        >
          {(['discover', 'analyze'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-1.5 rounded-[10px] text-xs font-semibold transition-all duration-200 ${mode === m ? 'text-black' : 'text-white/50 hover:text-white/70'}`}
              style={mode === m ? { background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)' } : {}}
            >
              {m === 'discover' ? 'Discover Stocks' : 'Analyze Stock'}
            </button>
          ))}
        </div>
        {!hasSerperKey && (
          <span className="text-[10px] text-amber-400/70 border border-amber-400/20 rounded-lg px-2 py-1" style={{ background: 'rgba(251,191,36,0.06)' }}>
            Add Serper key for live web data
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        {mode === 'discover' ? (
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={criteria}
              onChange={e => setCriteria(e.target.value)}
              placeholder="e.g. profitable Indian pharma with low debt and high ROE"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(20,184,166,0.5)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder="e.g. RELIANCE, AAPL, INFY"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none transition-all duration-200 font-mono"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(20,184,166,0.5)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDrop(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/80 transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', minWidth: '90px' }}
              >
                {exchange}
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              </button>
              {showDrop && (
                <div
                  className="absolute top-full mt-1 right-0 rounded-xl overflow-hidden z-50"
                  style={{ background: 'rgba(10,15,25,0.96)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)' }}
                >
                  {EXCHANGES.map(ex => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => { setExchange(ex); setShowDrop(false); }}
                      className="w-full px-4 py-2 text-sm text-left transition-all"
                      style={{ color: exchange === ex ? '#14b8a6' : 'rgba(255,255,255,0.7)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (mode === 'discover' ? !criteria.trim() : !ticker.trim())}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)', minWidth: '100px' }}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs truncate">{statusText || 'Loading'}</span></>
          ) : (
            <><Search className="w-4 h-4" /><span>{mode === 'discover' ? 'Discover' : 'Analyze'}</span></>
          )}
        </button>
      </form>

      {isLoading && statusText && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1 h-1 rounded-full animate-bounce" style={{ background: '#14b8a6', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <span className="text-xs text-teal-400/70">{statusText}</span>
        </div>
      )}
    </div>
  );
};

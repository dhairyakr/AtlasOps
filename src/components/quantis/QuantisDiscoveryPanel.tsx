import React from 'react';
import { TrendingUp, ArrowRight, Building2 } from 'lucide-react';
import { DiscoveryStock } from '../../services/quantisService';

interface QuantisDiscoveryPanelProps {
  stocks: DiscoveryStock[];
  onAnalyze: (ticker: string, exchange: string) => void;
  criteria: string;
}

const VERDICT_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  avoid: { label: 'Avoid', bg: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  overvalued: { label: 'Overvalued', bg: 'rgba(239,68,68,0.12)', color: '#f87171', border: 'rgba(239,68,68,0.25)' },
  watchlist: { label: 'Watchlist', bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  good_buy: { label: 'Good Buy', bg: 'rgba(34,197,94,0.15)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  strong_buy: { label: 'Strong Buy', bg: 'rgba(20,184,166,0.15)', color: '#14b8a6', border: 'rgba(20,184,166,0.3)' },
};

const EXCHANGE_COLORS: Record<string, string> = {
  NSE: '#14b8a6', BSE: '#0ea5e9', NYSE: '#8b5cf6', NASDAQ: '#f59e0b',
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 7 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 w-16 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(score / 10) * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-white/50 w-4 text-right">{score}</span>
    </div>
  );
}

export const QuantisDiscoveryPanel: React.FC<QuantisDiscoveryPanelProps> = ({ stocks, onAnalyze, criteria }) => {
  if (!stocks.length) return null;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">Discovery Results</p>
          <p className="text-sm text-white/60 mt-0.5">
            Found <span className="text-teal-400 font-semibold">{stocks.length} stocks</span> matching "{criteria}"
          </p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)' }}>
          <TrendingUp className="w-3 h-3 text-teal-400" />
          <span className="text-[10px] text-teal-400 font-semibold">Click any card to deep-analyze</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stocks.map((stock, i) => {
          const vc = VERDICT_CONFIG[stock.verdict] || VERDICT_CONFIG.watchlist;
          const exColor = EXCHANGE_COLORS[stock.exchange] || '#14b8a6';
          return (
            <button
              key={`${stock.ticker}-${i}`}
              onClick={() => onAnalyze(stock.ticker, stock.exchange)}
              className="group text-left rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(20,184,166,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(20,184,166,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
                    <Building2 className="w-4 h-4 text-white/60" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-white font-mono">{stock.ticker}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: `${exColor}20`, color: exColor, border: `1px solid ${exColor}40` }}>{stock.exchange}</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-tight truncate max-w-[140px]">{stock.company_name}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0" style={{ background: vc.bg, color: vc.color, border: `1px solid ${vc.border}` }}>{vc.label}</span>
              </div>

              <div className="inline-block text-[10px] px-2 py-0.5 rounded-md mb-2 text-white/40" style={{ background: 'rgba(255,255,255,0.05)' }}>{stock.sector}</div>
              <p className="text-xs text-white/55 leading-relaxed mb-3 line-clamp-2">{stock.thesis}</p>

              <div className="space-y-1.5">
                <ScoreBar label="Business" score={stock.quick_scores?.business ?? 0} />
                <ScoreBar label="Financials" score={stock.quick_scores?.financials ?? 0} />
                <ScoreBar label="Valuation" score={stock.quick_scores?.valuation ?? 0} />
              </div>

              <div className="mt-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-[10px] text-teal-400">Deep Analysis</span>
                <ArrowRight className="w-3 h-3 text-teal-400" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

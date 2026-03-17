import React from 'react';
import { Bookmark, Trash2, RefreshCw, TrendingUp } from 'lucide-react';
import { QuantisWatchlistEntry } from '../../services/quantisService';

interface QuantisWatchlistProps {
  entries: QuantisWatchlistEntry[];
  onReanalyze: (ticker: string, exchange: string) => void;
  onRemove: (id: string) => void;
}

const VERDICT_COLORS: Record<string, string> = {
  avoid: '#ef4444', overvalued: '#f87171', watchlist: '#f59e0b', good_buy: '#22c55e', strong_buy: '#14b8a6',
};
const VERDICT_LABELS: Record<string, string> = {
  avoid: 'Avoid', overvalued: 'Overvalued', watchlist: 'Watch', good_buy: 'Good Buy', strong_buy: 'Strong Buy',
};

export const QuantisWatchlist: React.FC<QuantisWatchlistProps> = ({ entries, onReanalyze, onRemove }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Bookmark className="w-3.5 h-3.5 text-teal-400" />
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Watchlist</p>
      {entries.length > 0 && (
        <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(20,184,166,0.15)', color: '#14b8a6' }}>{entries.length}</span>
      )}
    </div>
    {entries.length === 0 ? (
      <div className="rounded-xl border p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed' }}>
        <TrendingUp className="w-5 h-5 text-white/15 mx-auto mb-2" />
        <p className="text-[11px] text-white/25 leading-relaxed">Save analyses to track stocks here</p>
      </div>
    ) : (
      <div className="space-y-1.5">
        {entries.map(entry => {
          const color = VERDICT_COLORS[entry.verdict] || '#f59e0b';
          return (
            <div
              key={entry.id}
              className="group flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white/80 font-mono">{entry.ticker}</span>
                  <span className="text-[9px] font-bold" style={{ color }}>{VERDICT_LABELS[entry.verdict] || 'Watch'}</span>
                </div>
                <p className="text-[10px] text-white/35 truncate">{entry.company_name || entry.exchange}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button onClick={() => onReanalyze(entry.ticker, entry.exchange)} className="p-1 rounded-lg transition-all duration-200 hover:text-teal-400" style={{ color: 'rgba(255,255,255,0.35)' }} title="Re-analyze">
                  <RefreshCw className="w-3 h-3" />
                </button>
                <button onClick={() => onRemove(entry.id)} className="p-1 rounded-lg transition-all duration-200 hover:text-red-400" style={{ color: 'rgba(255,255,255,0.25)' }} title="Remove">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

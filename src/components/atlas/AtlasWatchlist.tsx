import React from 'react';
import { Bookmark, RefreshCw, Trash2, MapPin } from 'lucide-react';
import { AtlasWatchlistEntry } from '../../services/atlasService';

interface AtlasWatchlistProps {
  entries: AtlasWatchlistEntry[];
  onRefresh: (question: string) => void;
  onRemove: (id: string) => void;
  isLoading: boolean;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const AtlasWatchlist: React.FC<AtlasWatchlistProps> = ({
  entries, onRefresh, onRemove, isLoading
}) => {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Bookmark className="w-3.5 h-3.5 text-teal-400/60" />
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Watchlist</span>
        <span className="ml-auto text-[10px] text-white/20">{entries.length} saved</span>
      </div>

      <div className="divide-y divide-white/4">
        {entries.map(entry => (
          <div key={entry.id} className="flex items-center gap-3 px-4 py-3 group hover:bg-white/[0.015] transition-all duration-200">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/65 truncate">{entry.question}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {entry.regions.slice(0, 2).map(r => (
                  <span key={r} className="flex items-center gap-0.5 text-[10px] text-teal-400/50">
                    <MapPin className="w-2 h-2" />{r}
                  </span>
                ))}
                <span className="text-[10px] text-white/20">{formatDate(entry.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <button
                onClick={() => onRefresh(entry.question)}
                disabled={isLoading}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 disabled:opacity-50"
                style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', color: 'rgba(20,184,166,0.8)' }}
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => onRemove(entry.id)}
                className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400/80 transition-all duration-200"
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

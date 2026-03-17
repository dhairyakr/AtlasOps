import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Radio } from 'lucide-react';
import { AtlasSignal, SIGNAL_CATEGORIES } from '../../services/atlasService';

interface AtlasSignalFeedProps {
  signals: AtlasSignal[];
}

const severityDot: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

const TrendIcon: React.FC<{ trend: string }> = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-3 h-3 text-red-400" />;
  if (trend === 'down') return <TrendingDown className="w-3 h-3 text-emerald-400" />;
  return <Minus className="w-3 h-3 text-white/30" />;
};

function formatTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const AtlasSignalFeed: React.FC<AtlasSignalFeedProps> = ({ signals }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', ...SIGNAL_CATEGORIES];
  const filtered = activeCategory === 'All'
    ? signals
    : signals.filter(s => s.category === activeCategory);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <Radio className="w-3.5 h-3.5 text-teal-400/70" />
        <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Signal Feed</span>
        <span className="ml-auto text-[10px] text-white/25">{signals.length} signals</span>
      </div>

      <div className="flex items-center gap-1 mb-3 flex-wrap flex-shrink-0">
        {categories.map(cat => (
          <button key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 ${
              activeCategory === cat ? 'text-teal-300' : 'text-white/30 hover:text-white/50'
            }`}
            style={activeCategory === cat
              ? { background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.2)' }
              : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1 cyber-scrollbar"
      >
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Radio className="w-8 h-8 text-white/10 mb-2" />
            <p className="text-white/25 text-xs">No signals in this category yet.</p>
            <p className="text-white/15 text-[10px] mt-1">Run an intelligence query to populate the feed.</p>
          </div>
        )}

        {filtered.map(signal => (
          <div key={signal.id}
            className="group p-3 rounded-xl border transition-all duration-200 hover:border-white/15"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5"
                  style={{ background: severityDot[signal.severity] || '#eab308' }} />
                <span className="text-[10px] font-semibold text-white/40 uppercase">{signal.category}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <TrendIcon trend={signal.trend} />
                <span className="text-[10px] text-white/20">{formatTime(signal.created_at)}</span>
              </div>
            </div>
            <p className="text-xs text-white/65 leading-relaxed">{signal.summary}</p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] text-teal-400/50">{signal.region}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

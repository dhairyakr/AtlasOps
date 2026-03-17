import React from 'react';
import { Clock } from 'lucide-react';
import { QuantisAnalysis } from '../../services/quantisService';

interface QuantisRecentPanelProps {
  analyses: QuantisAnalysis[];
  currentId?: string;
  onSelect: (analysis: QuantisAnalysis) => void;
}

const VERDICT_COLORS: Record<string, string> = {
  avoid: '#ef4444', overvalued: '#f87171', watchlist: '#f59e0b', good_buy: '#22c55e', strong_buy: '#14b8a6',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const QuantisRecentPanel: React.FC<QuantisRecentPanelProps> = ({ analyses, currentId, onSelect }) => {
  if (!analyses.length) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-3.5 h-3.5 text-white/30" />
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Recent</p>
      </div>
      <div className="space-y-1">
        {analyses.slice(0, 10).map(a => {
          const isActive = a.id === currentId;
          return (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-200"
              style={{
                background: isActive ? 'rgba(20,184,166,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isActive ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.05)'}`,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: VERDICT_COLORS[a.verdict] || '#f59e0b' }} />
              <span className="text-[11px] font-bold text-white/70 font-mono flex-1">{a.ticker}</span>
              <span className="text-[9px] text-white/25">{timeAgo(a.created_at)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

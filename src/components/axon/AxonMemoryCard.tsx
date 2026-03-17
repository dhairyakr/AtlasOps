import React, { useState } from 'react';
import { Mic, Lightbulb, Eye, MessageCircle, BookOpen, Trash2, Network, ChevronDown } from 'lucide-react';
import { AxonCapture } from '../../services/axonService';

interface AxonMemoryCardProps {
  capture: AxonCapture;
  onDelete: (id: string) => void;
  onFindConnections: (id: string) => void;
  isConnecting?: boolean;
}

const TYPE_CONFIG: Record<string, {
  icon: React.FC<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  glow: string;
}> = {
  Voice: { icon: Mic, color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)', glow: 'rgba(56,189,248,0.15)' },
  Idea: { icon: Lightbulb, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', glow: 'rgba(245,158,11,0.15)' },
  Observation: { icon: Eye, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', glow: 'rgba(16,185,129,0.15)' },
  Thought: { icon: MessageCircle, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)', glow: 'rgba(148,163,184,0.1)' },
  Reflection: { icon: BookOpen, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', glow: 'rgba(244,63,94,0.15)' },
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export const AxonMemoryCard: React.FC<AxonMemoryCardProps> = ({
  capture, onDelete, onFindConnections, isConnecting
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = TYPE_CONFIG[capture.capture_type] || TYPE_CONFIG.Thought;
  const Icon = config.icon;
  const isLong = capture.raw_text.length > 140;
  const displayText = isLong && !isExpanded
    ? capture.raw_text.slice(0, 140) + '...'
    : capture.raw_text;

  return (
    <div
      className="group relative rounded-xl border transition-all duration-300 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.025)',
        borderColor: 'rgba(255,255,255,0.07)',
        borderLeft: `2px solid ${config.color}50`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${config.color}30`;
        (e.currentTarget as HTMLDivElement).style.background = `rgba(255,255,255,0.04)`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${config.glow}`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.025)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
      }}
    >
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: config.bg, border: `1px solid ${config.border}` }}
            >
              <Icon className="w-3 h-3" style={{ color: config.color }} />
            </div>
            {capture.summary_tag && (
              <span className="text-xs text-white/50 truncate font-medium">{capture.summary_tag}</span>
            )}
          </div>
          <span className="text-[10px] text-white/20 flex-shrink-0 tabular-nums">
            {formatRelativeTime(capture.created_at)}
          </span>
        </div>

        <p className="text-xs text-white/70 leading-relaxed mb-2">{displayText}</p>

        {isLong && (
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="flex items-center gap-1 text-[10px] mb-2 transition-colors duration-200"
            style={{ color: config.color + '80' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = config.color; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = config.color + '80'; }}
          >
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            {isExpanded ? 'Show less' : `+${capture.raw_text.length - 140} more`}
          </button>
        )}

        {capture.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {capture.tags.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md text-white/30"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
          <button
            onClick={() => onFindConnections(capture.id)}
            disabled={isConnecting}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 disabled:opacity-40"
            style={{
              background: config.bg,
              border: `1px solid ${config.border}`,
              color: config.color,
            }}
          >
            <Network className="w-2.5 h-2.5" />
            {isConnecting ? 'Connecting...' : 'Find links'}
          </button>

          <button
            onClick={() => onDelete(capture.id)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-200"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.12)',
              color: 'rgba(239,68,68,0.6)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.15)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.9)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.6)';
            }}
          >
            <Trash2 className="w-2.5 h-2.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

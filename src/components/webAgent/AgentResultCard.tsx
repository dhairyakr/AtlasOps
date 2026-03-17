import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Zap, Link2, BarChart3 } from 'lucide-react';
import { AgentResult } from '../../services/agentService';

interface AgentResultCardProps {
  result: AgentResult;
  goal: string;
}

export const AgentResultCard: React.FC<AgentResultCardProps> = ({ result, goal }) => {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
        <p className="text-sm font-semibold text-emerald-300 mb-1">Research Summary</p>
        <p className="text-white/85 text-sm leading-relaxed">{result.summary}</p>
      </div>

      {result.items && result.items.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Top Results</p>
          </div>
          <div className="space-y-2">
            {result.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-lg bg-white/10 text-white/40 text-xs font-bold flex items-center justify-center mt-0.5">
                    {item.rank}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white/90 leading-tight">{item.title}</p>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 text-white/30 hover:text-cyan-400 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-white/55 mt-1 leading-relaxed">{item.description}</p>
                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(item.metadata).map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/60"
                          >
                            <span className="text-white/35">{key}:</span> {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.actions && result.actions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Take Action</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {result.actions.map((action, idx) => (
              <a
                key={idx}
                href={action.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all duration-200 group"
              >
                <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-200">{action.label}</p>
                  <p className="text-xs text-amber-300/60 truncate">{action.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {result.links && result.links.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="w-4 h-4 text-sky-400" />
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest">Reference Links</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white/90 hover:border-white/25 hover:bg-white/10 transition-all text-xs"
              >
                {link.label}
                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
              </a>
            ))}
          </div>
        </div>
      )}

      {result.raw && (
        <div>
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            {showRaw ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showRaw ? 'Hide' : 'Show'} raw results
          </button>
          {showRaw && (
            <pre className="mt-2 p-3 rounded-xl bg-black/30 text-xs text-white/50 overflow-x-auto whitespace-pre-wrap border border-white/8">
              {result.raw}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

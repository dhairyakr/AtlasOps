import React from 'react';
import { SearchSource } from '../types/chat';
import { ExternalLink, X } from 'lucide-react';

interface SearchResultsPanelProps {
  sources: SearchSource[];
  onClose: () => void;
}

export const SearchResultsPanel: React.FC<SearchResultsPanelProps> = ({ sources, onClose }) => {
  if (sources.length === 0) return null;

  return (
    <div className="mt-4 p-4 glass-premium rounded-2xl border border-neo-tech-quantum-cyan/30 animate-slide-up shadow-neural-glow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white flex items-center space-x-2">
          <span>Web Search Sources</span>
          <span className="text-xs bg-neo-tech-quantum-cyan/20 text-neo-tech-quantum-cyan px-2 py-1 rounded">
            {sources.length} result{sources.length !== 1 ? 's' : ''}
          </span>
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          title="Close sources"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-r from-neo-tech-quantum-cyan to-neo-tech-plasma-blue flex items-center justify-center text-white/80 font-semibold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white group-hover:text-neo-tech-quantum-cyan transition-colors line-clamp-2">
                {source.title}
              </h4>
              <p className="text-sm text-white/60 mt-1 line-clamp-2">
                {source.snippet}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-xs text-white/50">
                  {source.source}
                </span>
                <ExternalLink className="w-3 h-3 text-white/40 group-hover:text-neo-tech-quantum-cyan transition-colors" />
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-white/10">
        <p className="text-xs text-white/50">
          Click on any source to visit the webpage. The AI used these results to provide current information.
        </p>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Search, Loader2, Wifi, WifiOff, Bookmark } from 'lucide-react';

interface AtlasQueryBarProps {
  onQuery: (question: string) => Promise<void>;
  isLoading: boolean;
  isLiveMode: boolean;
  onSaveToWatchlist: () => void;
  hasCurrentQuery: boolean;
}

const EXAMPLE_QUERIES = [
  'What is the current geopolitical tension in the South China Sea?',
  'What are the economic risks facing Europe this quarter?',
  'Assess the stability of the Sahel region',
  'What cyber threats are emerging from state actors?',
  'How is climate change affecting food security in South Asia?',
];

export const AtlasQueryBar: React.FC<AtlasQueryBarProps> = ({
  onQuery, isLoading, isLiveMode, onSaveToWatchlist, hasCurrentQuery
}) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    await onQuery(question.trim());
  };

  const handleExample = (q: string) => {
    setQuestion(q);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.12)',
          }}
        >
          <Search className="w-5 h-5 text-white/30 flex-shrink-0" />
          <input
            type="text"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask an intelligence question — region, topic, threat, trend..."
            className="flex-1 bg-transparent text-white/85 placeholder-white/25 outline-none text-sm"
            disabled={isLoading}
          />

          <div className="flex items-center gap-2">
            {hasCurrentQuery && (
              <button
                type="button"
                onClick={onSaveToWatchlist}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200"
                style={{ background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.2)', color: 'rgba(20,184,166,0.8)' }}
                title="Save to watchlist"
              >
                <Bookmark className="w-3 h-3" />
                Save
              </button>
            )}

            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${
              isLiveMode
                ? 'text-emerald-400 border border-emerald-400/20'
                : 'text-slate-400 border border-slate-400/20'
            }`}
              style={isLiveMode ? { background: 'rgba(16,185,129,0.08)' } : { background: 'rgba(255,255,255,0.04)' }}
            >
              {isLiveMode ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
              {isLiveMode ? 'Live Signals' : 'Reasoned Analysis'}
            </div>

            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 disabled:opacity-40"
              style={{ background: 'rgba(20,184,166,0.9)', color: 'white' }}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      </form>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] text-white/20 flex-shrink-0">Try:</span>
        {EXAMPLE_QUERIES.map((q, i) => (
          <button
            key={i}
            onClick={() => handleExample(q)}
            className="text-[10px] px-2.5 py-1 rounded-lg text-white/35 hover:text-white/60 transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {q.length > 45 ? q.slice(0, 45) + '...' : q}
          </button>
        ))}
      </div>
    </div>
  );
};

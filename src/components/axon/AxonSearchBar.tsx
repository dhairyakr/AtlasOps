import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface AxonSearchBarProps {
  onSearch: (query: string) => Promise<void>;
  isSearching: boolean;
  onClear: () => void;
  hasResults: boolean;
}

export const AxonSearchBar: React.FC<AxonSearchBarProps> = ({
  onSearch, isSearching, onClear, hasResults
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    await onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.03)',
          borderColor: 'rgba(255,255,255,0.10)',
        }}
      >
        <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search your memory... find connections across notes"
          className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 outline-none"
        />
        <div className="flex items-center gap-2">
          {hasResults && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-white/30 hover:text-white/60 transition-all duration-200"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-40"
            style={{ background: 'rgba(217,119,6,0.8)', color: 'white' }}
          >
            {isSearching ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Search className="w-3 h-3" />
            )}
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </form>
  );
};

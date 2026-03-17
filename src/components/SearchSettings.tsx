import React, { useState, useRef, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

interface SearchSettingsProps {
  onClose: () => void;
  onSave: (searchApiKey: string, searchEngineId: string) => void;
  initialSearchApiKey?: string;
  initialSearchEngineId?: string;
}

export const SearchSettings: React.FC<SearchSettingsProps> = ({
  onClose,
  onSave,
  initialSearchApiKey = '',
  initialSearchEngineId = '',
}) => {
  const [searchApiKey, setSearchApiKey] = useState(initialSearchApiKey);
  const [searchEngineId, setSearchEngineId] = useState(initialSearchEngineId);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showEngineId, setShowEngineId] = useState(false);
  const [error, setError] = useState('');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && overlayRef.current === event.target) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSave = () => {
    setError('');

    if (!searchApiKey.trim()) {
      setError('Google Search API key is required');
      return;
    }

    if (!searchEngineId.trim()) {
      setError('Custom Search Engine ID is required');
      return;
    }

    onSave(searchApiKey.trim(), searchEngineId.trim());
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="glass-premium rounded-3xl border border-white/20 shadow-cosmic-glow max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold gradient-text">Web Search Setup</h2>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-white font-medium mb-2">
              Google Search API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={searchApiKey}
                onChange={(e) => setSearchApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full px-4 py-3 input-field-glass rounded-lg outline-none transition-all"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showApiKey ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-sm text-white/60 mt-2">
              Get your API key from{' '}
              <a
                href="https://console.cloud.google.com/apis/library/customsearch.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neo-tech-quantum-cyan hover:text-neo-tech-quantum-cyan/80 underline"
              >
                Google Cloud Console
              </a>
            </p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">
              Custom Search Engine ID
            </label>
            <div className="relative">
              <input
                type={showEngineId ? 'text' : 'password'}
                value={searchEngineId}
                onChange={(e) => setSearchEngineId(e.target.value)}
                placeholder="Enter your Custom Search Engine ID"
                className="w-full px-4 py-3 input-field-glass rounded-lg outline-none transition-all"
              />
              <button
                onClick={() => setShowEngineId(!showEngineId)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showEngineId ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-sm text-white/60 mt-2">
              Create one at{' '}
              <a
                href="https://programmablesearchengine.google.com/cse/create/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neo-tech-quantum-cyan hover:text-neo-tech-quantum-cyan/80 underline"
              >
                Google Programmable Search
              </a>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all border border-white/20"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-neo-tech-quantum-cyan to-neo-tech-plasma-blue text-white font-medium rounded-lg hover:opacity-90 transition-all shadow-neural-glow"
            >
              Save Settings
            </button>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <p className="text-xs text-white/60">
              Your search credentials are stored locally and never sent to our servers.
              They're only used to make API calls to Google's search services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

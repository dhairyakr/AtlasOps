import React, { useState, useRef, useEffect } from 'react';
import { Settings, Key, Eye, EyeOff, Check } from 'lucide-react';

const ABSTRACT_KEY_STORAGE = 'osint_abstract_api_key';

interface OsintSettingsPanelProps {
  onAbstractKeyChange: (key: string) => void;
}

export const OsintSettingsPanel: React.FC<OsintSettingsPanelProps> = ({ onAbstractKeyChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [abstractKey, setAbstractKey] = useState(() => localStorage.getItem(ABSTRACT_KEY_STORAGE) || '');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(ABSTRACT_KEY_STORAGE) || '';
    if (stored) onAbstractKeyChange(stored);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem(ABSTRACT_KEY_STORAGE, abstractKey);
    onAbstractKeyChange(abstractKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const maskedValue = abstractKey
    ? abstractKey.slice(0, 4) + '••••••••' + abstractKey.slice(-4)
    : '';

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(p => !p)}
        title="OSINT Settings"
        className="p-1.5 rounded-lg transition-all duration-200"
        style={{
          background: isOpen ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.04)',
          border: isOpen ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: isOpen ? '#22d3ee' : 'rgba(255,255,255,0.4)',
        }}
      >
        <Settings className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-xl p-4 w-72"
          style={{
            background: 'rgba(8,12,16,0.97)',
            border: '1px solid rgba(34,211,238,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.1)' }}>
              <Settings className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-xs font-semibold text-white/80 tracking-wide">OSINT Settings</span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <Key className="w-3 h-3 text-cyan-400/60" />
              <label className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'rgba(34,211,238,0.5)', fontFamily: 'monospace' }}>
                AbstractAPI Key
              </label>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={abstractKey}
                onChange={e => setAbstractKey(e.target.value)}
                placeholder="your-abstractapi-key"
                className="w-full text-xs rounded-lg px-3 py-2 pr-8 font-mono outline-none transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.8)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
              />
              <button
                onClick={() => setShowKey(p => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 transition-colors duration-150"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.25)'; }}
              >
                {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>

            {abstractKey && !showKey && (
              <p className="text-[10px] mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>{maskedValue}</p>
            )}

            <p className="text-[10px] mt-1.5 leading-relaxed" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Used for live phone carrier lookups. Free tier available at abstractapi.com.
            </p>

            <button
              onClick={handleSave}
              className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
              style={{
                background: saved ? 'rgba(16,185,129,0.15)' : 'rgba(34,211,238,0.1)',
                border: saved ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(34,211,238,0.2)',
                color: saved ? '#10b981' : '#22d3ee',
              }}
            >
              {saved ? <Check className="w-3 h-3" /> : <Key className="w-3 h-3" />}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

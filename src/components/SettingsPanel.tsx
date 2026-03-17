import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Settings, X, Eye, EyeOff, CheckCircle, AlertCircle, Zap, Cpu, Key, Search, ChevronDown, Sparkles } from 'lucide-react';
import { useApiSettings, LLMProvider } from '../contexts/ApiSettingsContext';
import { LLMService } from '../services/llmService';

interface SettingsPanelProps {
  className?: string;
  variant?: 'default' | 'banner';
}

interface PanelPosition {
  top: number;
  right: number;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ className = '', variant = 'default' }) => {
  const {
    provider, geminiKey, groqKey, serperKey,
    setProvider, setGeminiKey, setGroqKey, setSerperKey,
  } = useApiSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [localGemini, setLocalGemini] = useState(geminiKey);
  const [localGroq, setLocalGroq] = useState(groqKey);
  const [localSerper, setLocalSerper] = useState(serperKey);
  const [showGemini, setShowGemini] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [showSerper, setShowSerper] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [panelPos, setPanelPos] = useState<PanelPosition>({ top: 0, right: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLocalGemini(geminiKey);
      setLocalGroq(groqKey);
      setLocalSerper(serperKey);
      setErrors({});
      setSaved(false);
      updatePosition();
    }
  }, [isOpen, geminiKey, groqKey, serperKey, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedButton = buttonRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);
      if (!clickedButton && !clickedPanel) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (localGemini.trim() && !LLMService.validateGeminiKey(localGemini.trim())) {
      newErrors.gemini = 'Must start with "AIza" and be valid length';
    }
    if (localGroq.trim() && !LLMService.validateGroqKey(localGroq.trim())) {
      newErrors.groq = 'Must start with "gsk_"';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    if (localGemini.trim()) setGeminiKey(localGemini.trim());
    if (localGroq.trim()) setGroqKey(localGroq.trim());
    setSerperKey(localSerper.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setIsOpen(false);
    }, 1200);
  };

  const isProviderConfigured = (p: LLMProvider) => {
    if (p === 'gemini') return LLMService.validateGeminiKey(geminiKey);
    return LLMService.validateGroqKey(groqKey);
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '';
    return key.slice(0, 6) + '••••••••' + key.slice(-4);
  };

  const suppressAutofillProps = {
    autoComplete: 'new-password',
    'data-lpignore': 'true',
    'data-1p-ignore': '',
    'data-bwignore': '',
  };

  const panel = isOpen ? (
    <div
      ref={panelRef}
      className="animate-scale-in"
      style={{
        position: 'fixed',
        top: panelPos.top,
        right: panelPos.right,
        width: 340,
        zIndex: 2147483647,
      }}
    >
      <div
        className="rounded-[24px] border border-white/15 overflow-hidden relative"
        style={{
          background: 'rgba(8, 8, 18, 0.82)',
          backdropFilter: 'blur(60px) saturate(200%)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.55), 0 0 80px rgba(138,43,226,0.12), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
          <div
            className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-25 animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, rgba(138,43,226,0.5) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full opacity-20 animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, rgba(0,206,209,0.4) 0%, transparent 70%)', animationDelay: '2s' }}
          />
          <div
            className="absolute top-1/2 -right-8 w-24 h-24 rounded-full opacity-15 animate-pulse-slow"
            style={{ background: 'radial-gradient(circle, rgba(255,105,180,0.4) 0%, transparent 70%)', animationDelay: '1s' }}
          />
        </div>

        <div
          className="flex items-center justify-between px-5 py-4 relative z-10"
          style={{
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(to right, rgba(138,43,226,0.12), rgba(255,105,180,0.08), rgba(0,206,209,0.10))',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(138,43,226,0.25)', border: '1px solid rgba(138,43,226,0.3)' }}
            >
              <Key className="w-3.5 h-3.5 text-violet-300" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">API Settings</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-xl text-white/40 hover:text-white/80 transition-all duration-200 hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto relative z-10">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Active Provider</p>
            <div className="grid grid-cols-2 gap-2.5">
              {(['gemini', 'groq'] as LLMProvider[]).map((p) => {
                const configured = isProviderConfigured(p);
                const isActive = provider === p;
                const isCyan = p === 'gemini';
                return (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`relative flex items-center gap-2.5 px-3 py-3 rounded-[16px] border transition-all duration-300 text-left hover:scale-[1.03] group ${
                      isActive
                        ? isCyan
                          ? 'border-cyan-400/35 text-cyan-200'
                          : 'border-amber-400/35 text-amber-200'
                        : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/75'
                    }`}
                    style={isActive ? {
                      background: isCyan
                        ? 'linear-gradient(135deg, rgba(0,206,209,0.14) 0%, rgba(0,191,255,0.08) 100%)'
                        : 'linear-gradient(135deg, rgba(251,191,36,0.14) 0%, rgba(245,158,11,0.08) 100%)',
                      boxShadow: isCyan
                        ? '0 0 24px rgba(0,206,209,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
                        : '0 0 24px rgba(251,191,36,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                    }}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                        isActive
                          ? isCyan ? 'text-cyan-300' : 'text-amber-300'
                          : 'text-white/40 group-hover:text-white/60'
                      }`}
                      style={isActive ? {
                        background: isCyan ? 'rgba(0,206,209,0.25)' : 'rgba(251,191,36,0.25)',
                        border: isCyan ? '1px solid rgba(0,206,209,0.3)' : '1px solid rgba(251,191,36,0.3)',
                      } : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {p === 'gemini' ? <Zap className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold capitalize">{p}</p>
                      <p className={`text-xs truncate mt-0.5 ${configured ? 'text-emerald-400' : 'text-white/30'}`}>
                        {configured ? 'configured' : 'not set'}
                      </p>
                    </div>
                    {isActive && (
                      <div
                        className={`absolute top-2 right-2 w-2 h-2 rounded-full animate-breathe ${
                          configured ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                        style={{ boxShadow: configured ? '0 0 6px rgba(52,211,153,0.6)' : '0 0 6px rgba(251,191,36,0.6)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="h-px w-full animate-fade-in-up"
            style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)', animationDelay: '0.1s' }}
          />

          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.12s' }}>
            <KeyField
              label="Gemini API Key"
              icon={<Zap className="w-3 h-3 text-cyan-400" />}
              accentColor="cyan"
              isValid={LLMService.validateGeminiKey(geminiKey)}
              show={showGemini}
              setShow={setShowGemini}
              maskedValue={maskKey(geminiKey)}
              hasExistingKey={!!geminiKey}
              localValue={localGemini}
              setLocalValue={(v) => { setLocalGemini(v); setErrors(prev => ({ ...prev, gemini: '' })); }}
              placeholder="AIza..."
              error={errors.gemini}
              suppressAutofillProps={suppressAutofillProps}
            />

            <KeyField
              label="Groq API Key"
              icon={<Cpu className="w-3 h-3 text-amber-400" />}
              accentColor="amber"
              isValid={LLMService.validateGroqKey(groqKey)}
              show={showGroq}
              setShow={setShowGroq}
              maskedValue={maskKey(groqKey)}
              hasExistingKey={!!groqKey}
              localValue={localGroq}
              setLocalValue={(v) => { setLocalGroq(v); setErrors(prev => ({ ...prev, groq: '' })); }}
              placeholder="gsk_..."
              error={errors.groq}
              suppressAutofillProps={suppressAutofillProps}
            />

            <div>
              <KeyField
                label="Serper API Key"
                icon={<Search className="w-3 h-3 text-emerald-400" />}
                accentColor="emerald"
                isValid={!!serperKey}
                show={showSerper}
                setShow={setShowSerper}
                maskedValue={maskKey(serperKey)}
                hasExistingKey={!!serperKey}
                localValue={localSerper}
                setLocalValue={setLocalSerper}
                placeholder="serper key..."
                labelSuffix={<span className="ml-auto text-xs text-white/25">for web search</span>}
                suppressAutofillProps={suppressAutofillProps}
              />
              <p className="text-xs text-white/25 mt-1.5 leading-relaxed">
                Used by Web Research Agent & Agents Lab. Get free key at serper.dev
              </p>
            </div>
          </div>

          <div className="animate-fade-in-up" style={{ animationDelay: '0.18s' }}>
            <button
              onClick={handleSave}
              className={`w-full py-3 rounded-[14px] text-sm font-bold transition-all duration-300 relative overflow-hidden group ${
                saved ? '' : 'hover:scale-[1.02] active:scale-[0.98]'
              }`}
              style={saved ? {
                background: 'linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(16,185,129,0.15) 100%)',
                border: '1px solid rgba(52,211,153,0.35)',
                color: 'rgb(110,231,183)',
                boxShadow: '0 0 24px rgba(52,211,153,0.15)',
              } : {
                background: 'linear-gradient(135deg, rgba(0,206,209,0.25) 0%, rgba(138,43,226,0.20) 50%, rgba(255,105,180,0.18) 100%)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: 'white',
                boxShadow: '0 4px 24px rgba(138,43,226,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {!saved && (
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(0,206,209,0.15) 0%, rgba(138,43,226,0.12) 50%, rgba(255,105,180,0.12) 100%)' }}
                />
              )}
              {saved ? (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <CheckCircle className="w-4 h-4" /> Saved
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <Sparkles className="w-3.5 h-3.5" />
                  Save Settings
                </span>
              )}
            </button>
          </div>

          <p className="text-xs text-white/20 text-center animate-fade-in-up" style={{ animationDelay: '0.22s' }}>
            Keys are stored in your browser's local storage only.
          </p>
        </div>
      </div>
    </div>
  ) : null;

  const configured = isProviderConfigured(provider);
  const isCyan = provider === 'gemini';

  const bannerTrigger = (
    <button
      ref={buttonRef}
      onClick={() => setIsOpen(!isOpen)}
      className={`group relative flex items-center gap-3 px-5 py-3.5 rounded-[18px] border transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]`}
      style={isOpen ? {
        background: isCyan
          ? 'linear-gradient(135deg, rgba(0,206,209,0.22) 0%, rgba(0,150,200,0.15) 100%)'
          : 'linear-gradient(135deg, rgba(251,191,36,0.22) 0%, rgba(245,120,0,0.15) 100%)',
        border: `1px solid ${isCyan ? 'rgba(0,206,209,0.4)' : 'rgba(251,191,36,0.4)'}`,
        boxShadow: isCyan
          ? '0 0 28px rgba(0,206,209,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
          : '0 0 28px rgba(251,191,36,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
      } : {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
      title="API Settings"
    >
      <div
        className={`w-9 h-9 rounded-[13px] flex items-center justify-center flex-shrink-0 transition-all duration-300`}
        style={isOpen ? {
          background: isCyan ? 'rgba(0,206,209,0.25)' : 'rgba(251,191,36,0.25)',
          border: `1px solid ${isCyan ? 'rgba(0,206,209,0.35)' : 'rgba(251,191,36,0.35)'}`,
        } : {
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <Key className={`w-4 h-4 transition-all duration-500 ${isOpen ? (isCyan ? 'text-cyan-300' : 'text-amber-300') : 'text-white/60 group-hover:text-white/90'}`} />
      </div>
      <div className="text-left min-w-0">
        <p className={`text-sm font-bold leading-tight transition-colors duration-300 ${isOpen ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>
          API Keys
        </p>
        <p className={`text-xs leading-tight mt-0.5 transition-colors duration-300 ${configured ? 'text-emerald-400' : 'text-amber-400'}`}>
          {configured ? 'Configured' : 'Not configured'}
        </p>
      </div>
      <div
        className={`w-2 h-2 rounded-full flex-shrink-0 ml-1 transition-all duration-300 ${configured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}
        style={configured ? { boxShadow: '0 0 6px rgba(52,211,153,0.7)' } : { boxShadow: '0 0 6px rgba(251,191,36,0.7)' }}
      />
    </button>
  );

  const defaultTrigger = (
    <button
      ref={buttonRef}
      onClick={() => setIsOpen(!isOpen)}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-300 group ${
        isOpen
          ? 'text-white'
          : 'text-white/70 hover:text-white hover:scale-[1.03]'
      }`}
      style={isOpen ? {
        background: 'linear-gradient(135deg, rgba(0,206,209,0.2) 0%, rgba(138,43,226,0.18) 100%)',
        border: '1px solid rgba(255,255,255,0.25)',
        boxShadow: '0 0 20px rgba(138,43,226,0.2), inset 0 1px 0 rgba(255,255,255,0.15)',
        backdropFilter: 'blur(20px)',
      } : {
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
      }}
      title="API Settings"
    >
      <Settings className={`w-3.5 h-3.5 transition-transform duration-500 ${isOpen ? 'rotate-90' : 'group-hover:rotate-45'}`} />
      <span className="hidden sm:inline">Settings</span>
      <div
        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
          configured ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
        }`}
        style={configured ? { boxShadow: '0 0 5px rgba(52,211,153,0.7)' } : {}}
      />
    </button>
  );

  return (
    <div className={className}>
      {variant === 'banner' ? bannerTrigger : defaultTrigger}
      {createPortal(panel, document.body)}
    </div>
  );
};

interface KeyFieldProps {
  label: string;
  icon: React.ReactNode;
  accentColor: 'cyan' | 'amber' | 'emerald';
  isValid: boolean;
  show: boolean;
  setShow: (v: boolean) => void;
  maskedValue: string;
  hasExistingKey: boolean;
  localValue: string;
  setLocalValue: (v: string) => void;
  placeholder: string;
  error?: string;
  labelSuffix?: React.ReactNode;
  suppressAutofillProps: Record<string, string>;
}

const accentMap = {
  cyan: {
    focus: 'focus:border-cyan-400/50',
    glow: '0 0 12px rgba(0,206,209,0.15)',
    iconBg: 'rgba(0,206,209,0.15)',
    iconBorder: 'rgba(0,206,209,0.25)',
  },
  amber: {
    focus: 'focus:border-amber-400/50',
    glow: '0 0 12px rgba(251,191,36,0.15)',
    iconBg: 'rgba(251,191,36,0.15)',
    iconBorder: 'rgba(251,191,36,0.25)',
  },
  emerald: {
    focus: 'focus:border-emerald-400/50',
    glow: '0 0 12px rgba(52,211,153,0.15)',
    iconBg: 'rgba(52,211,153,0.15)',
    iconBorder: 'rgba(52,211,153,0.25)',
  },
};

const KeyField: React.FC<KeyFieldProps> = ({
  label, icon, accentColor, isValid, show, setShow, maskedValue,
  hasExistingKey, localValue, setLocalValue, placeholder, error,
  labelSuffix, suppressAutofillProps,
}) => {
  const accent = accentMap[accentColor];

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <div
          className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: accent.iconBg, border: `1px solid ${accent.iconBorder}` }}
        >
          {icon}
        </div>
        <label className="text-xs font-semibold text-white/60">{label}</label>
        {isValid && <CheckCircle className="w-3 h-3 text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.5))' }} />}
        {labelSuffix}
      </div>

      {!show && hasExistingKey && (
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-2 transition-all duration-200 hover:border-white/15"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span className="text-xs text-white/45 font-mono">{maskedValue}</span>
          <button
            onClick={() => setShow(true)}
            className="text-xs text-white/35 hover:text-white/65 flex items-center gap-1 transition-all duration-200 hover:scale-105"
          >
            <ChevronDown className="w-3 h-3" /> Edit
          </button>
        </div>
      )}

      {(show || !hasExistingKey) && (
        <div className="relative group">
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2.5 rounded-xl text-white text-xs placeholder-white/20 outline-none transition-all duration-200 font-mono pr-9 ${accent.focus}`}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              ...(!show ? { WebkitTextSecurity: 'disc' } as React.CSSProperties : {}),
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.boxShadow = accent.glow;
              (e.target as HTMLInputElement).style.borderColor = accentColor === 'cyan' ? 'rgba(0,206,209,0.4)' : accentColor === 'amber' ? 'rgba(251,191,36,0.4)' : 'rgba(52,211,153,0.4)';
            }}
            onBlur={(e) => {
              (e.target as HTMLInputElement).style.boxShadow = 'none';
              (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.10)';
            }}
            {...suppressAutofillProps}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-all duration-200"
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 mt-1.5 px-1">
          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

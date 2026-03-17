import React, { useState } from 'react';
import { MessageCircle, Mic, FileCheck, FlaskConical, PenLine, Bot, Sliders, GitMerge, Scale, Image, Globe, Zap, Cpu, PhoneCall, Eye, EyeOff, CheckCircle, AlertCircle, ChevronDown, ArrowLeft, Brain, Crosshair, User } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useApiSettings } from '../contexts/ApiSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { LLMService } from '../services/llmService';


export type AppMode = 'chat' | 'voice' | 'hybrid' | 'termSheetValidator' | 'ragLab' | 'promptLab' | 'agentsLab' | 'fineTuningLab' | 'embeddingsLab' | 'ethicsLab' | 'multimodalLab' | 'webAgent' | 'outboundVoiceAgent' | 'atlas' | 'axon' | 'osint';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onLogout: () => void;
  onGoBack: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange, onGoBack }) => {
  useTheme();
  const {
    provider, geminiKey, groqKey, serperKey,
    setGeminiKey, setGroqKey, setSerperKey, isSaved, resetConfig,
  } = useApiSettings();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    resetConfig();
  };

  const [isButtonClicked, setIsButtonClicked] = useState<string | null>(null);

  const [showGemini, setShowGemini] = useState(false);
  const [showGroq, setShowGroq] = useState(false);
  const [showSerper, setShowSerper] = useState(false);
  const [keyErrors, setKeyErrors] = useState<Record<string, string>>({});

  const suppressAutofillProps = {
    autoComplete: 'new-password' as const,
    'data-lpignore': 'true',
    'data-1p-ignore': '',
    'data-bwignore': '',
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '';
    return key.slice(0, 6) + '••••••••' + key.slice(-4);
  };

  const handleGeminiChange = (val: string) => {
    setGeminiKey(val);
    if (val.trim() && !LLMService.validateGeminiKey(val.trim())) {
      setKeyErrors(prev => ({ ...prev, gemini: 'Must start with "AIza" and be valid length' }));
    } else {
      setKeyErrors(prev => ({ ...prev, gemini: '' }));
    }
  };

  const handleGroqChange = (val: string) => {
    setGroqKey(val);
    if (val.trim() && !LLMService.validateGroqKey(val.trim())) {
      setKeyErrors(prev => ({ ...prev, groq: 'Must start with "gsk_"' }));
    } else {
      setKeyErrors(prev => ({ ...prev, groq: '' }));
    }
  };

  const handleClick = (modeId: AppMode) => {
    setIsButtonClicked(modeId);
    onModeChange(modeId);
    setTimeout(() => setIsButtonClicked(null), 300);
  };

  const modes = [
    {
      id: 'chat' as AppMode,
      name: 'Enhanced Chat',
      description: 'Text + Multi-modal with code highlighting',
      icon: MessageCircle,
      gradient: 'from-neo-tech-quantum-cyan to-blue-500',
      bgGradient: 'from-neo-tech-quantum-cyan/20 to-blue-500/20',
      glowColor: 'rgba(0, 206, 209, 0.4)',
      cardClass: 'enhanced-chat-glow',
      section: 'core',
    },
    {
      id: 'voice' as AppMode,
      name: 'Voice Assistant',
      description: 'Hands-free voice interaction · Groq only',
      icon: Mic,
      gradient: 'from-neo-tech-neon-violet to-purple-500',
      bgGradient: 'from-neo-tech-neon-violet/20 to-purple-500/20',
      glowColor: 'rgba(138, 43, 226, 0.4)',
      cardClass: 'voice-assistant-glow',
      section: 'core',
    },

    {
      id: 'webAgent' as AppMode,
      name: 'Web Research Agent',
      description: 'Search · analyze · act on real web data · Groq only',
      icon: Globe,
      gradient: 'from-cyan-500 to-emerald-500',
      bgGradient: 'from-cyan-500/20 to-emerald-500/20',
      glowColor: 'rgba(6, 182, 212, 0.4)',
      cardClass: 'web-agent-glow',
      section: 'core',
    },
    {
      id: 'termSheetValidator' as AppMode,
      name: 'Term Sheet Validator',
      description: 'AI-powered legal document analysis',
      icon: FileCheck,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-500/20 to-teal-500/20',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      cardClass: 'term-sheet-glow',
      section: 'core',
    },
    {
      id: 'outboundVoiceAgent' as AppMode,
      name: 'InsightVoice',
      description: 'Autonomous AI outbound call agent · Groq only',
      icon: PhoneCall,
      gradient: 'from-sky-500 to-emerald-500',
      bgGradient: 'from-sky-500/20 to-emerald-500/20',
      glowColor: 'rgba(14, 165, 233, 0.4)',
      cardClass: 'web-agent-glow',
      section: 'core',
    },
    {
      id: 'ragLab' as AppMode,
      name: 'RAG Lab',
      description: 'Interactive RAG pipeline — NLP, retrieval & LLMs',
      icon: FlaskConical,
      gradient: 'from-teal-400 to-cyan-500',
      bgGradient: 'from-teal-400/20 to-cyan-500/20',
      glowColor: 'rgba(45, 212, 191, 0.4)',
      cardClass: 'rag-lab-glow',
      section: 'labs',
    },
    {
      id: 'promptLab' as AppMode,
      name: 'Prompt Engineering',
      description: 'Few-shot, chain-of-thought & template library',
      icon: PenLine,
      gradient: 'from-sky-500 to-cyan-400',
      bgGradient: 'from-sky-500/20 to-cyan-400/20',
      glowColor: 'rgba(14, 165, 233, 0.4)',
      cardClass: 'prompt-lab-glow',
      section: 'labs',
    },
    {
      id: 'agentsLab' as AppMode,
      name: 'AI Agents Lab',
      description: 'ReAct loops, tool use & multi-step reasoning',
      icon: Bot,
      gradient: 'from-violet-500 to-purple-500',
      bgGradient: 'from-violet-500/20 to-purple-500/20',
      glowColor: 'rgba(139, 92, 246, 0.4)',
      cardClass: 'agents-lab-glow',
      section: 'labs',
    },
    {
      id: 'fineTuningLab' as AppMode,
      name: 'Fine-Tuning Lab',
      description: 'Temperature, RLHF & generation parameters',
      icon: Sliders,
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-500/20 to-orange-500/20',
      glowColor: 'rgba(245, 158, 11, 0.4)',
      cardClass: 'finetuning-lab-glow',
      section: 'labs',
    },
    {
      id: 'embeddingsLab' as AppMode,
      name: 'Embeddings Lab',
      description: 'Vector similarity, clustering & semantic search',
      icon: GitMerge,
      gradient: 'from-emerald-500 to-teal-400',
      bgGradient: 'from-emerald-500/20 to-teal-400/20',
      glowColor: 'rgba(16, 185, 129, 0.4)',
      cardClass: 'embeddings-lab-glow',
      section: 'labs',
    },
    {
      id: 'ethicsLab' as AppMode,
      name: 'AI Ethics Lab',
      description: 'Bias testing, red teaming & hallucination detection',
      icon: Scale,
      gradient: 'from-rose-500 to-pink-500',
      bgGradient: 'from-rose-500/20 to-pink-500/20',
      glowColor: 'rgba(244, 63, 94, 0.4)',
      cardClass: 'ethics-lab-glow',
      section: 'intelligence',
    },
    {
      id: 'multimodalLab' as AppMode,
      name: 'Multimodal Lab',
      description: 'Vision transformers, CLIP & image analysis, Gemini Only',
      icon: Image,
      gradient: 'from-sky-600 to-blue-600',
      bgGradient: 'from-sky-600/20 to-blue-600/20',
      glowColor: 'rgba(2, 132, 199, 0.4)',
      cardClass: 'multimodal-lab-glow',
      section: 'intelligence',
    },
    {
      id: 'atlas' as AppMode,
      name: 'Atlas',
      description: 'World intelligence dashboard & geopolitical signals',
      icon: Globe,
      gradient: 'from-slate-600 to-teal-600',
      bgGradient: 'from-slate-600/20 to-teal-600/20',
      glowColor: 'rgba(20, 184, 166, 0.4)',
      cardClass: 'web-agent-glow',
      section: 'intelligence',
    },
    {
      id: 'axon' as AppMode,
      name: 'Axon',
      description: 'Personal exocortex — capture, connect & synthesize',
      icon: Brain,
      gradient: 'from-stone-600 to-amber-600',
      bgGradient: 'from-stone-600/20 to-amber-600/20',
      glowColor: 'rgba(217, 119, 6, 0.4)',
      cardClass: 'finetuning-lab-glow',
      section: 'intelligence',
    },
    {
      id: 'osint' as AppMode,
      name: 'OSINT Suite',
      description: 'Open-source intelligence — recon, graph & reports',
      icon: Crosshair,
      gradient: 'from-cyan-600 to-teal-500',
      bgGradient: 'from-cyan-600/20 to-teal-500/20',
      glowColor: 'rgba(6, 182, 212, 0.4)',
      cardClass: 'web-agent-glow',
      section: 'intelligence',
    },
  ];

  const coreModes = modes.filter(m => m.section === 'core');
  const labsModes = modes.filter(m => m.section === 'labs');
  const intelligenceModes = modes.filter(m => m.section === 'intelligence');

  const renderCard = (mode: typeof modes[0], index: number) => {
    const Icon = mode.icon;
    const isActive = currentMode === mode.id;
    const isClicked = isButtonClicked === mode.id;
    return (
      <button
        key={mode.id}
        onClick={() => handleClick(mode.id)}
        className={`mode-card-portrait group relative flex flex-col items-center text-center transition-all duration-300 ${isClicked ? 'scale-95' : ''}`}
        style={{
          animationDelay: `${index * 0.1}s`,
          ...(isActive ? {
            borderColor: mode.glowColor.replace('0.4', '0.5'),
            boxShadow: `0 0 24px ${mode.glowColor.replace('0.4', '0.25')}`,
          } : {}),
        }}
      >
        <div
          className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 40%, ${mode.glowColor.replace('0.4', '0.07')} 0%, transparent 70%)`,
          }}
        />

        {isActive && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
            style={{ background: mode.glowColor.replace('0.4', '0.9'), boxShadow: `0 0 6px ${mode.glowColor}` }}
          />
        )}

        <div
          className="mode-card-icon-box flex items-center justify-center mb-4 transition-all duration-300"
          style={isActive ? { boxShadow: `0 0 20px ${mode.glowColor.replace('0.4', '0.5')}` } : {}}
        >
          <Icon className="w-7 h-7 text-white/85 group-hover:text-white transition-colors duration-300" />
        </div>

        <p className="text-[13px] font-semibold leading-snug mb-1.5 text-white/90 group-hover:text-white transition-colors duration-300 px-1">{mode.name}</p>
        <p className="text-[11px] text-white/40 leading-relaxed line-clamp-3 group-hover:text-white/55 transition-colors duration-300 px-1">{mode.description}</p>
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full mb-8 relative z-20 rounded-[24px] border overflow-hidden"
        style={{
          borderColor: 'rgba(255,255,255,0.10)',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none animate-pulse-slow"
          style={{
            background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.03) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 py-3 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1.5 rounded-xl border"
            style={{
              background: 'rgba(255,255,255,0.06)',
              borderColor: 'rgba(255,255,255,0.12)',
            }}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {provider === 'gemini' ? <Zap className="w-3 h-3 text-white/70" /> : <Cpu className="w-3 h-3 text-white/70" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold capitalize leading-none text-white/80">{provider}</p>
            </div>
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-400"
              style={{ boxShadow: '0 0 4px rgba(52,211,153,0.7)' }}
            />
          </div>

          <div className="hidden sm:block w-px self-stretch" style={{ background: 'rgba(255,255,255,0.07)' }} />

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {provider === 'gemini' ? (
              <CompactKeyField
                label="Gemini"
                accentColor="cyan"
                isValid={LLMService.validateGeminiKey(geminiKey)}
                show={showGemini}
                setShow={setShowGemini}
                maskedValue={maskKey(geminiKey)}
                hasExistingKey={!!geminiKey}
                value={geminiKey}
                onChange={handleGeminiChange}
                placeholder="AIza..."
                error={keyErrors.gemini}
                suppressAutofillProps={suppressAutofillProps}
              />
            ) : (
              <CompactKeyField
                label="Groq"
                accentColor="amber"
                isValid={LLMService.validateGroqKey(groqKey)}
                show={showGroq}
                setShow={setShowGroq}
                maskedValue={maskKey(groqKey)}
                hasExistingKey={!!groqKey}
                value={groqKey}
                onChange={handleGroqChange}
                placeholder="gsk_..."
                error={keyErrors.groq}
                suppressAutofillProps={suppressAutofillProps}
              />
            )}
            <CompactKeyField
              label="Serper"
              accentColor="emerald"
              isValid={!!serperKey}
              show={showSerper}
              setShow={setShowSerper}
              maskedValue={maskKey(serperKey)}
              hasExistingKey={!!serperKey}
              value={serperKey}
              onChange={setSerperKey}
              placeholder="serper key..."
              suppressAutofillProps={suppressAutofillProps}
            />
          </div>

          <div className="hidden sm:block w-px self-stretch" style={{ background: 'rgba(255,255,255,0.07)' }} />

          <div className="flex items-center gap-2 flex-shrink-0">
            {isSaved && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-emerald-300 border border-emerald-400/25 bg-emerald-400/8 transition-all">
                <CheckCircle className="w-2.5 h-2.5" />
                <span>Saved</span>
              </div>
            )}
            {user && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.12)',
                }}
              >
                {user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="avatar" className="w-4 h-4 rounded-full" />
                ) : (
                  <User className="w-3 h-3 text-white/60" />
                )}
                <span className="text-[10px] font-semibold text-white/70 max-w-[80px] truncate">
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors ml-0.5"
                >
                  ×
                </button>
              </div>
            )}
            <button
              onClick={onGoBack}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'; }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
        <div>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Core Modes</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {coreModes.map((mode, i) => renderCard(mode, i))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">AI Labs</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {labsModes.map((mode, i) => renderCard(mode, coreModes.length + i))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Intelligence Modules</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {intelligenceModes.map((mode, i) => renderCard(mode, coreModes.length + labsModes.length + i))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CompactKeyFieldProps {
  label: string;
  accentColor: 'cyan' | 'amber' | 'emerald';
  isValid: boolean;
  show: boolean;
  setShow: (v: boolean) => void;
  maskedValue: string;
  hasExistingKey: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  suppressAutofillProps: Record<string, string>;
}

const CompactKeyField: React.FC<CompactKeyFieldProps> = ({
  label, accentColor, isValid, show, setShow, maskedValue,
  hasExistingKey, value, onChange, placeholder, error,
  suppressAutofillProps,
}) => {
  const accent = inlineAccentMap[accentColor];
  return (
    <div className="relative">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px] font-semibold text-white/50">{label}</span>
        {isValid && <CheckCircle className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />}
      </div>
      {!show && hasExistingKey ? (
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-[10px] text-white/35 font-mono truncate">{maskedValue}</span>
          <button onClick={() => setShow(true)} className="text-[10px] text-white/30 hover:text-white/60 flex items-center gap-0.5 transition-all duration-200 ml-1 flex-shrink-0">
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-2 py-1.5 rounded-lg text-white text-[10px] placeholder-white/20 outline-none transition-all duration-200 font-mono pr-6"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              ...(!show ? { WebkitTextSecurity: 'disc' } as React.CSSProperties : {}),
            }}
            onFocus={(e) => { e.target.style.boxShadow = accent.glow; e.target.style.borderColor = accent.focusBorder; }}
            onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.borderColor = 'rgba(255,255,255,0.10)'; }}
            {...suppressAutofillProps}
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/55 transition-all duration-200">
            {show ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1 mt-0.5">
          <AlertCircle className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />
          <p className="text-[10px] text-red-400 truncate">{error}</p>
        </div>
      )}
    </div>
  );
};

const inlineAccentMap = {
  cyan: {
    iconBg: 'rgba(0,206,209,0.15)',
    iconBorder: 'rgba(0,206,209,0.25)',
    focusBorder: 'rgba(0,206,209,0.4)',
    glow: '0 0 10px rgba(0,206,209,0.12)',
  },
  amber: {
    iconBg: 'rgba(251,191,36,0.15)',
    iconBorder: 'rgba(251,191,36,0.25)',
    focusBorder: 'rgba(251,191,36,0.4)',
    glow: '0 0 10px rgba(251,191,36,0.12)',
  },
  emerald: {
    iconBg: 'rgba(52,211,153,0.15)',
    iconBorder: 'rgba(52,211,153,0.25)',
    focusBorder: 'rgba(52,211,153,0.4)',
    glow: '0 0 10px rgba(52,211,153,0.12)',
  },
};


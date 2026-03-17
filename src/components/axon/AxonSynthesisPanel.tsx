import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, RefreshCw, Brain, AlertCircle, Lightbulb, GitBranch, HelpCircle, Zap, Target } from 'lucide-react';
import { AxonSynthesis } from '../../services/axonService';

interface AxonSynthesisPanelProps {
  synthesis: AxonSynthesis | null;
  captureCount: number;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
}

interface SynthesisSection {
  icon: React.FC<{ className?: string }>;
  title: string;
  color: string;
  bg: string;
  border: string;
  content: string;
}

function parseSections(content: string): SynthesisSection[] {
  const sectionDefs = [
    { key: 'Situation Summary', icon: Brain, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.15)' },
    { key: 'Key Patterns', icon: GitBranch, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.15)' },
    { key: 'Unresolved Questions', icon: HelpCircle, color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.15)' },
    { key: 'Emerging Insights', icon: Lightbulb, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)' },
    { key: 'Challenge for Reflection', icon: Target, color: '#f43f5e', bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.15)' },
  ];

  const sections: SynthesisSection[] = [];
  for (const def of sectionDefs) {
    const regex = new RegExp(`(?:\\*{1,2}${def.key}\\*{0,2}|#{1,3}\\s*${def.key})([\\s\\S]*?)(?=(?:\\*{1,2}(?:${sectionDefs.map(s => s.key).join('|')}))|#{1,3}|$)`, 'i');
    const match = content.match(regex);
    if (match) {
      const rawContent = match[1].trim().replace(/^\*+|\*+$/gm, '').trim();
      if (rawContent.length > 10) {
        sections.push({ ...def, title: def.key, content: rawContent });
      }
    }
  }

  if (sections.length === 0) {
    return [{
      icon: Brain,
      title: 'Synthesis',
      color: '#94a3b8',
      bg: 'rgba(148,163,184,0.08)',
      border: 'rgba(148,163,184,0.15)',
      content,
    }];
  }

  return sections;
}

function useTypewriter(text: string, active: boolean, speed = 12) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) { setDisplayed(text); return; }
    indexRef.current = 0;
    setDisplayed('');
    const tick = () => {
      if (indexRef.current < text.length) {
        indexRef.current += Math.max(1, Math.floor(speed / 4));
        setDisplayed(text.slice(0, indexRef.current));
        rafRef.current = setTimeout(tick, speed);
      }
    };
    rafRef.current = setTimeout(tick, 80);
    return () => { if (rafRef.current) clearTimeout(rafRef.current); };
  }, [text, active]);

  return displayed;
}

const AnimatedSection: React.FC<{
  section: SynthesisSection;
  index: number;
  isNew: boolean;
}> = ({ section, index, isNew }) => {
  const [visible, setVisible] = useState(false);
  const Icon = section.icon;
  const text = useTypewriter(section.content, isNew && visible, 8);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  const displayContent = isNew ? text : section.content;

  const lines = displayContent.split('\n').filter(l => l.trim());

  return (
    <div
      className="rounded-2xl p-4 transition-all duration-500"
      style={{
        background: section.bg,
        border: `1px solid ${section.border}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        boxShadow: visible ? `0 0 24px ${section.color}0a` : 'none',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: section.bg, border: `1px solid ${section.border}` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: section.color }} />
        </div>
        <h3 className="text-xs font-bold tracking-wide uppercase"
          style={{ color: section.color, letterSpacing: '0.06em' }}>
          {section.title}
        </h3>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${section.border}, transparent)` }} />
      </div>

      <div className="space-y-1.5">
        {lines.map((line, i) => {
          const isBullet = line.match(/^[-•*]\s/);
          const cleanLine = isBullet ? line.replace(/^[-•*]\s/, '') : line;
          return (
            <div key={i} className={isBullet ? 'flex gap-2' : ''}>
              {isBullet && (
                <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: section.color, opacity: 0.6 }} />
              )}
              <p className="text-xs text-white/65 leading-relaxed">{cleanLine}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const AxonSynthesisPanel: React.FC<AxonSynthesisPanelProps> = ({
  synthesis, captureCount, onGenerate, isGenerating
}) => {
  const [isNew, setIsNew] = useState(false);
  const prevSynthesisId = useRef<string | null>(null);

  useEffect(() => {
    if (synthesis && synthesis.id !== prevSynthesisId.current) {
      setIsNew(true);
      prevSynthesisId.current = synthesis.id;
      const timer = setTimeout(() => setIsNew(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [synthesis]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  };

  if (captureCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="relative mb-4">
          <Brain className="w-12 h-12 text-white/8" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-amber-400/10 animate-ping" />
          </div>
        </div>
        <p className="text-white/25 text-sm">No captures to synthesize yet.</p>
        <p className="text-white/15 text-xs mt-1">Add some memories and return here for AI-powered insights.</p>
      </div>
    );
  }

  const sections = synthesis ? parseSections(synthesis.content) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white/85 tracking-wide">Neural Synthesis</h3>
          <p className="text-xs text-white/30 mt-0.5">
            {captureCount} capture{captureCount !== 1 ? 's' : ''} analyzed
            {synthesis && (
              <span className="ml-2 text-white/20">· {formatDate(synthesis.created_at)}</span>
            )}
          </p>
        </div>
        <button
          onClick={async () => { await onGenerate(); }}
          disabled={isGenerating || captureCount === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-40 flex-shrink-0"
          style={{
            background: 'rgba(217,119,6,0.85)',
            color: 'white',
            boxShadow: isGenerating ? 'none' : '0 0 16px rgba(217,119,6,0.25)',
          }}
        >
          {isGenerating ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {isGenerating ? 'Synthesizing...' : synthesis ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      {!synthesis && !isGenerating && (
        <div className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.12)' }}
        >
          <AlertCircle className="w-4 h-4 text-amber-400/50 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-white/55">No synthesis generated yet.</p>
            <p className="text-[11px] text-white/30 mt-0.5 leading-relaxed">
              Click "Generate" to get an AI analysis of your {captureCount} captures — patterns, insights, unresolved questions, and challenges for reflection.
            </p>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="rounded-2xl p-8 flex flex-col items-center gap-5"
          style={{ background: 'rgba(217,119,6,0.04)', border: '1px solid rgba(217,119,6,0.12)' }}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.25)' }}
            >
              <Brain className="w-5 h-5 text-amber-400" />
            </div>
            <div className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: 'rgba(217,119,6,0.4)' }} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm text-amber-400/80 font-medium">Synthesizing your mind...</p>
            <p className="text-xs text-white/30">Analyzing {captureCount} captures for patterns and insights</p>
          </div>
          <div className="flex gap-2">
            {['patterns', 'connections', 'insights'].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] text-white/30"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  animation: `pulse ${1 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                <Zap className="w-2.5 h-2.5 text-amber-400/50" />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {synthesis && !isGenerating && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">
              Based on {synthesis.capture_count} capture{synthesis.capture_count !== 1 ? 's' : ''}
            </span>
          </div>

          {sections.map((section, i) => (
            <AnimatedSection key={section.title} section={section} index={i} isNew={isNew} />
          ))}
        </div>
      )}
    </div>
  );
};

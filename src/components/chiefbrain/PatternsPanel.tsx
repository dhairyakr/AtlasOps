import React, { useState, useCallback } from 'react';
import {
  Activity, Brain, TrendingUp, Clock, DollarSign, MessageSquare, Heart, Repeat2,
  AlertTriangle, Star, Sparkles, RefreshCw, XCircle, Plus, X, CheckCircle, Shield
} from 'lucide-react';
import { Pattern, PatternCategory, Memory } from './types';
import { ChiefBrainAI } from '../../services/chiefbrainAI';
import { Toast } from './useChiefBrain';

interface Props {
  patterns: Pattern[];
  memories: Memory[];
  onAddPattern: (p: Omit<Pattern, 'id' | 'user_id' | 'created_at'>) => Promise<Pattern | null>;
  onUpdatePattern: (id: string, updates: Partial<Pattern>) => Promise<void>;
  onDismissPattern: (id: string) => Promise<void>;
  getAI: () => ChiefBrainAI | null;
  addToast: (msg: string, type?: Toast['type']) => void;
}

const categoryConfig: Record<PatternCategory, { label: string; color: string; icon: React.FC<{ size?: number; className?: string }> }> = {
  regret: { label: 'Regret', color: '#ef4444', icon: AlertTriangle },
  energy: { label: 'Energy', color: '#10b981', icon: Activity },
  decision: { label: 'Decision', color: '#3b82f6', icon: Brain },
  communication: { label: 'Communication', color: '#f59e0b', icon: MessageSquare },
  financial: { label: 'Financial', color: '#06b6d4', icon: DollarSign },
  behavior: { label: 'Behavior', color: '#64748b', icon: Repeat2 },
  preference: { label: 'Preference', color: '#ec4899', icon: Star },
  relationship: { label: 'Relationship', color: '#84cc16', icon: Heart },
};

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full bg-white/[0.07] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="text-white/30 text-xs w-8 text-right">{Math.round(value * 100)}%</span>
    </div>
  );
}

export function PatternsPanel({ patterns, memories, onAddPattern, onUpdatePattern, onDismissPattern, getAI, addToast }: Props) {
  const [filterCat, setFilterCat] = useState<PatternCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'confidence' | 'evidence' | 'recent'>('confidence');
  const [discovering, setDiscovering] = useState(false);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [validationNotes, setValidationNotes] = useState<Record<string, string>>({});
  const [showDismissed, setShowDismissed] = useState(false);

  const [form, setForm] = useState({
    pattern_text: '',
    category: 'behavior' as PatternCategory,
  });

  const active = patterns.filter(p => p.is_active);
  const dismissed = patterns.filter(p => !p.is_active);

  const filtered = (showDismissed ? dismissed : active)
    .filter(p => filterCat === 'all' || p.category === filterCat)
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence_score - a.confidence_score;
      if (sortBy === 'evidence') return b.evidence_count - a.evidence_count;
      return new Date(b.last_confirmed_at).getTime() - new Date(a.last_confirmed_at).getTime();
    });

  const categoryBreakdown = active.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleDiscoverPatterns = useCallback(async () => {
    const ai = getAI();
    if (!ai) { addToast('Configure an AI API key to discover patterns', 'info'); return; }
    if (memories.length < 3) { addToast('Need at least 3 memories to discover patterns', 'info'); return; }
    setDiscovering(true);
    addToast('Analyzing your memories for behavioral patterns...', 'info');
    try {
      const newPatterns = await ai.extractPatterns(memories, active);
      if (newPatterns.length === 0) {
        addToast('No new patterns found — your model is up to date', 'info');
      } else {
        for (const p of newPatterns) {
          await onAddPattern({
            ...p,
            is_active: true,
            supporting_memory_ids: p.supporting_memory_ids || [],
            first_observed_at: p.first_observed_at || new Date().toISOString(),
            last_confirmed_at: p.last_confirmed_at || new Date().toISOString(),
          });
        }
        addToast(`Discovered ${newPatterns.length} new pattern${newPatterns.length > 1 ? 's' : ''}`, 'success');
      }
    } catch {
      addToast('Pattern discovery failed', 'error');
    }
    setDiscovering(false);
  }, [getAI, memories, active, onAddPattern, addToast]);

  const handleValidate = useCallback(async (pattern: Pattern) => {
    const ai = getAI();
    if (!ai) { addToast('Configure an AI API key to validate patterns', 'info'); return; }
    setValidatingId(pattern.id);
    try {
      const result = await ai.validatePattern(pattern, memories);
      await onUpdatePattern(pattern.id, {
        confidence_score: result.updated_confidence,
        last_confirmed_at: new Date().toISOString(),
        evidence_count: pattern.evidence_count + 1,
      });
      setValidationNotes(prev => ({ ...prev, [pattern.id]: result.validation_note }));
      addToast('Pattern validated and updated', 'success');
    } catch {
      addToast('Validation failed', 'error');
    }
    setValidatingId(null);
  }, [getAI, memories, onUpdatePattern, addToast]);

  const handleAddManual = useCallback(async () => {
    if (!form.pattern_text.trim()) { addToast('Pattern text required', 'info'); return; }
    const now = new Date().toISOString();
    await onAddPattern({
      pattern_text: form.pattern_text,
      category: form.category,
      confidence_score: 0.5,
      evidence_count: 1,
      is_active: true,
      supporting_memory_ids: [],
      first_observed_at: now,
      last_confirmed_at: now,
    });
    setForm({ pattern_text: '', category: 'behavior' });
    setShowAdd(false);
    addToast('Pattern added', 'success');
  }, [form, onAddPattern, addToast]);

  const handleDismiss = useCallback(async (id: string) => {
    await onDismissPattern(id);
    addToast('Pattern dismissed', 'info');
  }, [onDismissPattern, addToast]);

  const handleRestore = useCallback(async (id: string) => {
    await onUpdatePattern(id, { is_active: true });
    addToast('Pattern restored', 'success');
  }, [onUpdatePattern, addToast]);

  const totalEvidence = active.reduce((s, p) => s + p.evidence_count, 0);
  const avgConfidence = active.length > 0 ? Math.round(active.reduce((s, p) => s + p.confidence_score, 0) / active.length * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Behavioral Patterns</h2>
          <p className="text-white/40 text-sm mt-0.5">
            {active.length} active · {totalEvidence} evidence points · {avgConfidence}% avg confidence
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-all text-white/60 text-sm"
          >
            <Plus size={13} /> Add
          </button>
          <button
            onClick={handleDiscoverPatterns}
            disabled={discovering}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' }}
          >
            {discovering ? (
              <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            {discovering ? 'Discovering...' : 'Discover'}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">Add Pattern Manually</span>
            <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white/50"><X size={14} /></button>
          </div>
          <textarea
            value={form.pattern_text}
            onChange={e => setForm(p => ({ ...p, pattern_text: e.target.value }))}
            placeholder="You tend to... (describe the behavioral pattern)"
            className="w-full h-20 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 resize-none outline-none"
          />
          <div>
            <span className="text-white/30 text-xs mb-1.5 block">Category</span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(categoryConfig) as PatternCategory[]).map(cat => {
                const cfg = categoryConfig[cat];
                return (
                  <button key={cat} onClick={() => setForm(p => ({ ...p, category: cat }))}
                    className="px-2.5 py-1 rounded-lg text-xs border transition-all capitalize"
                    style={form.category === cat ? { color: cfg.color, background: cfg.color + '15', borderColor: cfg.color + '40' } : { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.08)' }}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-white/40 text-sm">Cancel</button>
            <button onClick={handleAddManual} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(16,185,129,0.3))', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              Add Pattern
            </button>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="text-white/30 text-xs mb-3 uppercase tracking-wider">Pattern Distribution</div>
          <div className="space-y-2">
            {(Object.keys(categoryBreakdown) as PatternCategory[]).map(cat => {
              const cfg = categoryConfig[cat];
              const count = categoryBreakdown[cat] || 0;
              const pct = active.length > 0 ? (count / active.length) * 100 : 0;
              const Icon = cfg.icon;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: cfg.color + '15' }}>
                    <Icon size={10} style={{ color: cfg.color }} />
                  </div>
                  <span className="text-white/50 text-xs w-24 shrink-0">{cfg.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                  <span className="text-white/30 text-xs w-4 shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setFilterCat('all')} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${filterCat === 'all' ? 'bg-white/[0.07] border-white/20 text-white/60' : 'border-white/[0.05] text-white/30'}`}>
            All ({showDismissed ? dismissed.length : active.length})
          </button>
          {(Object.keys(categoryConfig) as PatternCategory[])
            .filter(c => (showDismissed ? dismissed : active).some(p => p.category === c))
            .map(cat => {
              const cfg = categoryConfig[cat];
              const count = (showDismissed ? dismissed : active).filter(p => p.category === cat).length;
              const isActive = filterCat === cat;
              return (
                <button key={cat} onClick={() => setFilterCat(isActive ? 'all' : cat)} className="px-2.5 py-1.5 rounded-lg text-xs border transition-all" style={isActive ? { color: cfg.color, background: cfg.color + '15', borderColor: cfg.color + '40' } : { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.06)' }}>
                  {cfg.label} ({count})
                </button>
              );
            })}
        </div>
        <button onClick={() => { setShowDismissed(v => !v); setFilterCat('all'); }} className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${showDismissed ? 'bg-white/[0.05] border-white/15 text-white/50' : 'border-white/[0.05] text-white/25'}`}>
          {showDismissed ? `Active (${active.length})` : `Dismissed (${dismissed.length})`}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-white/25 text-xs">Sort:</span>
        {[
          { key: 'confidence', label: 'Confidence' },
          { key: 'evidence', label: 'Evidence' },
          { key: 'recent', label: 'Recent' },
        ].map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key as typeof sortBy)} className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${sortBy === s.key ? 'bg-white/[0.07] border-white/15 text-white/60' : 'border-white/[0.05] text-white/25'}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(pattern => {
          const cfg = categoryConfig[pattern.category];
          const Icon = cfg.icon;
          const isValidating = validatingId === pattern.id;
          const note = validationNotes[pattern.id];
          return (
            <div key={pattern.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-white/[0.1] transition-all">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: cfg.color + '15', border: `1px solid ${cfg.color}30` }}>
                  <Icon size={14} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-md font-medium capitalize" style={{ color: cfg.color, background: cfg.color + '12', border: `1px solid ${cfg.color}25` }}>
                      {cfg.label}
                    </span>
                    <span className="text-white/20 text-xs">{pattern.evidence_count} data points</span>
                    <span className="text-white/15 text-xs ml-auto">First seen {new Date(pattern.first_observed_at).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed mb-3">{pattern.pattern_text}</p>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white/25 text-xs w-20">Confidence</span>
                      <ConfidenceBar value={pattern.confidence_score} color={cfg.color} />
                    </div>
                  </div>
                  {note && (
                    <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-3">
                      <Shield size={11} className="text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-white/50 text-xs leading-relaxed">{note}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {!showDismissed && (
                      <>
                        <button
                          onClick={() => handleValidate(pattern)}
                          disabled={isValidating}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition-all disabled:opacity-50"
                        >
                          {isValidating ? (
                            <div className="w-2.5 h-2.5 border border-white/20 border-t-white/50 rounded-full animate-spin" />
                          ) : (
                            <CheckCircle size={11} />
                          )}
                          {isValidating ? 'Validating...' : 'Validate'}
                        </button>
                        <button
                          onClick={() => handleDismiss(pattern.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 transition-all"
                        >
                          <XCircle size={11} /> Dismiss
                        </button>
                      </>
                    )}
                    {showDismissed && (
                      <button
                        onClick={() => handleRestore(pattern.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-emerald-500/20 text-emerald-400/60 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
                      >
                        <RefreshCw size={11} /> Restore
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Brain size={28} className="text-white/10 mx-auto mb-3" />
          {showDismissed ? (
            <div className="text-white/30 text-sm">No dismissed patterns</div>
          ) : (
            <>
              <div className="text-white/30 text-sm">No patterns yet</div>
              <div className="text-white/15 text-xs mt-1 mb-4">Add more memories and run AI Discovery</div>
              <button
                onClick={handleDiscoverPatterns}
                disabled={discovering}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' }}
              >
                <Sparkles size={13} /> {discovering ? 'Discovering...' : 'Discover Patterns'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

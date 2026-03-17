import React, { useState, useCallback } from 'react';
import {
  Target, AlertTriangle, CheckCircle, Circle, Plus, X, Trash2,
  Calendar, Sparkles, ChevronDown, ChevronUp, Check, RefreshCw
} from 'lucide-react';
import { Goal, GoalHorizon, GoalStatus, Pattern, Memory } from './types';
import { ChiefBrainAI } from '../../services/chiefbrainAI';
import { Toast } from './useChiefBrain';

interface Props {
  goals: Goal[];
  patterns: Pattern[];
  memories: Memory[];
  onAddGoal: (goal: Omit<Goal, 'id' | 'user_id'>) => Promise<Goal | null>;
  onUpdateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  onDeleteGoal: (id: string) => Promise<void>;
  getAI: () => ChiefBrainAI | null;
  addToast: (msg: string, type?: Toast['type']) => void;
}

const horizonColors: Record<GoalHorizon, { bg: string; text: string; border: string }> = {
  today: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  week: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  month: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
  quarter: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  year: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20' },
  life: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
};

const horizons: GoalHorizon[] = ['today', 'week', 'month', 'quarter', 'year', 'life'];

export function GoalsPanel({ goals, patterns, memories, onAddGoal, onUpdateGoal, onDeleteGoal, getAI, addToast }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [filterHorizon, setFilterHorizon] = useState<GoalHorizon | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [generatingMilestones, setGeneratingMilestones] = useState<Set<string>>(new Set());
  const [generatingAdvice, setGeneratingAdvice] = useState<Set<string>>(new Set());
  const [advice, setAdvice] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: '', description: '', horizon: 'quarter' as GoalHorizon,
    target_date: '', generateMilestones: true,
  });

  const activeGoals = goals.filter(g => g.status === 'active');
  const driftingCount = activeGoals.filter(g => g.drift_alert).length;
  const avgProgress = activeGoals.length > 0 ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress_percent, 0) / activeGoals.length) : 0;

  const filtered = goals.filter(g => filterHorizon === 'all' || g.horizon === filterHorizon);

  const handleAddGoal = useCallback(async () => {
    if (!form.title.trim()) { addToast('Title required', 'info'); return; }
    const now = new Date().toISOString();
    let milestones: { text: string; done: boolean }[] = [];

    if (form.generateMilestones) {
      const ai = getAI();
      if (ai) {
        setGeneratingMilestones(prev => new Set(prev).add('new'));
        try {
          milestones = await ai.generateGoalMilestones({ title: form.title, description: form.description, horizon: form.horizon });
        } catch { /* skip */ }
        setGeneratingMilestones(prev => { const s = new Set(prev); s.delete('new'); return s; });
      }
    }

    await onAddGoal({
      title: form.title,
      description: form.description,
      horizon: form.horizon,
      status: 'active',
      progress_percent: 0,
      drift_alert: false,
      drift_message: '',
      target_date: form.target_date || null,
      milestones,
      related_memory_ids: [],
      created_at: now,
      updated_at: now,
    });
    setForm({ title: '', description: '', horizon: 'quarter', target_date: '', generateMilestones: true });
    setShowAdd(false);
  }, [form, onAddGoal, getAI, addToast]);

  const handleGetAdvice = useCallback(async (goal: Goal) => {
    const ai = getAI();
    if (!ai) { addToast('Configure AI key first', 'info'); return; }
    setGeneratingAdvice(prev => new Set(prev).add(goal.id));
    try {
      const text = await ai.getGoalAdvice(goal, patterns, memories);
      setAdvice(prev => ({ ...prev, [goal.id]: text }));
    } catch {
      addToast('Failed to get advice', 'error');
    } finally {
      setGeneratingAdvice(prev => { const s = new Set(prev); s.delete(goal.id); return s; });
    }
  }, [getAI, patterns, memories, addToast]);

  const handleToggleMilestone = useCallback(async (goal: Goal, idx: number) => {
    const updated = goal.milestones.map((m, i) => i === idx ? { ...m, done: !m.done } : m);
    const doneCount = updated.filter(m => m.done).length;
    const newProgress = updated.length > 0 ? Math.round((doneCount / updated.length) * 100) : goal.progress_percent;
    await onUpdateGoal(goal.id, { milestones: updated, progress_percent: newProgress });
  }, [onUpdateGoal]);

  const handleProgressChange = useCallback(async (goal: Goal, val: number) => {
    await onUpdateGoal(goal.id, { progress_percent: val });
  }, [onUpdateGoal]);

  const handleStatusChange = useCallback(async (id: string, status: GoalStatus) => {
    await onUpdateGoal(id, { status });
  }, [onUpdateGoal]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Goals</h2>
          <p className="text-white/40 text-sm mt-0.5">{activeGoals.length} active · {driftingCount} drifting · {avgProgress}% avg progress</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-all text-white/60 text-sm">
          <Plus size={14} /> New Goal
        </button>
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-4 space-y-4">
          <span className="text-white/70 text-sm font-medium">New Goal</span>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Goal title" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" className="w-full h-16 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 resize-none outline-none" />
          <div className="flex flex-wrap gap-1.5">
            {horizons.map(h => (
              <button key={h} onClick={() => setForm(p => ({ ...p, horizon: h }))}
                className={`px-2.5 py-1.5 rounded-lg text-xs border capitalize transition-all ${form.horizon === h ? `${horizonColors[h].bg} ${horizonColors[h].text} ${horizonColors[h].border}` : 'text-white/35 border-white/10'}`}>
                {h}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/30 text-xs mb-1 block">Target date (optional)</label>
              <input type="date" value={form.target_date} onChange={e => setForm(p => ({ ...p, target_date: e.target.value }))} className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-2.5 text-white/70 text-sm outline-none" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <button onClick={() => setForm(p => ({ ...p, generateMilestones: !p.generateMilestones }))} className={`w-4 h-4 rounded border transition-all ${form.generateMilestones ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                {form.generateMilestones && <Check size={10} className="text-white m-auto" />}
              </button>
              <span className="text-white/40 text-xs">AI-generate milestones</span>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-white/40 text-sm">Cancel</button>
            <button onClick={handleAddGoal} disabled={generatingMilestones.has('new')} className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(16,185,129,0.3))', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              {generatingMilestones.has('new') ? 'Generating milestones...' : 'Create Goal'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilterHorizon('all')} className={`px-2.5 py-1.5 rounded-lg text-xs transition-all ${filterHorizon === 'all' ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}>
          All ({goals.length})
        </button>
        {horizons.filter(h => goals.some(g => g.horizon === h)).map(h => (
          <button key={h} onClick={() => setFilterHorizon(filterHorizon === h ? 'all' : h)}
            className={`px-2.5 py-1.5 rounded-lg text-xs capitalize transition-all border ${filterHorizon === h ? `${horizonColors[h].bg} ${horizonColors[h].text} ${horizonColors[h].border}` : 'text-white/30 border-transparent hover:text-white/50'}`}>
            {h} ({goals.filter(g => g.horizon === h).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-white/25 text-sm">No goals yet — set your first one above</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(goal => {
            const hc = horizonColors[goal.horizon];
            const isExpanded = expandedId === goal.id;
            const isGettingAdvice = generatingAdvice.has(goal.id);

            return (
              <div key={goal.id} className={`rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-white/[0.12] bg-white/[0.04]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'}`}>
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : goal.id)}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/80 text-sm font-medium">{goal.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border capitalize ${hc.bg} ${hc.text} ${hc.border}`}>{goal.horizon}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border capitalize ${goal.status === 'active' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : goal.status === 'paused' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-white/30 bg-white/5 border-white/10'}`}>{goal.status}</span>
                        {goal.drift_alert && <AlertTriangle size={12} className="text-amber-400" />}
                      </div>
                      {goal.description && <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{goal.description}</p>}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${goal.progress_percent}%`, background: goal.drift_alert ? '#f59e0b' : 'linear-gradient(90deg, #3b82f6, #10b981)' }} />
                        </div>
                        <span className="text-white/40 text-xs shrink-0">{goal.progress_percent}%</span>
                      </div>
                      {goal.drift_alert && goal.drift_message && (
                        <p className="text-amber-400/70 text-xs mt-1.5">{goal.drift_message}</p>
                      )}
                      {goal.target_date && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <Calendar size={10} className="text-white/20" />
                          <span className="text-white/25 text-xs">{new Date(goal.target_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      {confirmDelete === goal.id ? (
                        <>
                          <button onClick={() => { onDeleteGoal(goal.id); setConfirmDelete(null); }} className="p-1.5 rounded-lg text-red-400"><Check size={13} /></button>
                          <button onClick={() => setConfirmDelete(null)} className="p-1.5 rounded-lg text-white/30"><X size={13} /></button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(goal.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      )}
                      <div className="p-1 text-white/20">{isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="h-px bg-white/[0.05]" />

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/40 text-xs uppercase tracking-wide">Progress</span>
                        <span className="text-white/50 text-xs">{goal.progress_percent}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={goal.progress_percent}
                        onChange={e => handleProgressChange(goal, +e.target.value)}
                        className="w-full accent-blue-500" />
                    </div>

                    {goal.milestones.length > 0 && (
                      <div>
                        <span className="text-white/40 text-xs uppercase tracking-wide block mb-2">Milestones</span>
                        <div className="space-y-1.5">
                          {goal.milestones.map((m, idx) => (
                            <button key={idx} onClick={() => handleToggleMilestone(goal, idx)}
                              className="flex items-center gap-2 w-full text-left hover:bg-white/[0.02] rounded-lg p-1.5 transition-colors group">
                              {m.done ? <CheckCircle size={14} className="text-emerald-400 shrink-0" /> : <Circle size={14} className="text-white/25 shrink-0 group-hover:text-white/50 transition-colors" />}
                              <span className={`text-sm ${m.done ? 'text-white/30 line-through' : 'text-white/65'}`}>{m.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white/30 text-xs">Status:</span>
                      {(['active', 'paused', 'completed', 'abandoned'] as GoalStatus[]).map(s => (
                        <button key={s} onClick={() => handleStatusChange(goal.id, s)}
                          className={`px-2.5 py-1 rounded-lg text-xs border capitalize transition-all ${goal.status === s ? 'bg-white/10 text-white/80 border-white/20' : 'text-white/30 border-white/10 hover:border-white/20'}`}>
                          {s}
                        </button>
                      ))}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-blue-400" />
                          <span className="text-white/40 text-xs uppercase tracking-wide">AI Strategic Advice</span>
                        </div>
                        <button onClick={() => handleGetAdvice(goal)} disabled={isGettingAdvice} className="flex items-center gap-1 text-xs text-blue-400/60 hover:text-blue-400 transition-colors disabled:opacity-40">
                          <RefreshCw size={11} className={isGettingAdvice ? 'animate-spin' : ''} />
                          {advice[goal.id] ? 'Refresh' : 'Get Advice'}
                        </button>
                      </div>
                      {isGettingAdvice ? (
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center gap-2">
                          <div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                          <span className="text-white/30 text-xs">Analyzing patterns and memories...</span>
                        </div>
                      ) : advice[goal.id] ? (
                        <div className="p-3 rounded-xl bg-blue-500/[0.05] border border-blue-500/10">
                          <p className="text-white/60 text-xs leading-relaxed whitespace-pre-wrap">{advice[goal.id]}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

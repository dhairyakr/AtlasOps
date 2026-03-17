import React, { useState, useCallback } from 'react';
import {
  Zap, CheckCircle, XCircle, ThumbsDown, ChevronDown, ChevronUp,
  Lock, Shield, Eye, Bot, Plus, X, Sparkles
} from 'lucide-react';
import { ChiefAction, ConsentTier, ActionStatus, ActionType } from './types';
import { ChiefBrainAI } from '../../services/chiefbrainAI';
import { Toast } from './useChiefBrain';

interface Props {
  actions: ChiefAction[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRegret: (id: string) => Promise<void>;
  onAddAction: (action: Omit<ChiefAction, 'id' | 'user_id' | 'created_at'>) => Promise<ChiefAction | null>;
  getAI: () => ChiefBrainAI | null;
  addToast: (msg: string, type?: Toast['type']) => void;
}

const tierConfig: Record<ConsentTier, { label: string; icon: React.FC<{ size?: number; className?: string }>; color: string; desc: string }> = {
  autonomous: { label: 'Autonomous', icon: Bot, color: '#10b981', desc: 'Executes immediately' },
  auto_draft: { label: 'Auto-Draft', icon: Zap, color: '#3b82f6', desc: '30-min delay' },
  draft_review: { label: 'Draft & Review', icon: Eye, color: '#f59e0b', desc: 'Requires approval' },
  always_confirm: { label: 'Always Confirm', icon: Lock, color: '#ef4444', desc: 'Explicit approval' },
};

const statusColors: Record<ActionStatus, string> = {
  pending: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  in_progress: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
  regretted: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

const actionTypes: ActionType[] = ['email_reply', 'schedule', 'cancel_meeting', 'financial_flag', 'travel_booking', 'document_draft', 'reminder', 'research', 'follow_up'];

export function ActionsPanel({ actions, onApprove, onReject, onRegret, onAddAction, getAI, addToast }: Props) {
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [generatingAction, setGeneratingAction] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', action_type: 'reminder' as ActionType, consent_tier: 'draft_review' as ConsentTier,
  });

  const filtered = actions.filter(a => {
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'completed') return a.status === 'completed' || a.status === 'rejected' || a.status === 'regretted';
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const pendingCount = actions.filter(a => a.status === 'pending').length;
  const regretRate = actions.filter(a => a.status === 'completed' || a.status === 'regretted').length > 0
    ? Math.round(actions.filter(a => a.regret_logged).length / actions.filter(a => a.status === 'completed' || a.status === 'regretted').length * 100)
    : 0;

  const handleCreateAction = useCallback(async () => {
    if (!form.title.trim()) { addToast('Title required', 'info'); return; }
    const ai = getAI();
    let aiOutput = '';

    if (ai) {
      setGeneratingAction(true);
      try {
        aiOutput = await ai.generateText(`You are an intelligent executive assistant. Generate the actual output/draft for this action task.

Action Title: ${form.title}
Description: ${form.description}
Type: ${form.action_type}

Write the concrete output for this action (e.g., the email body, the meeting summary, the research findings, the reminder text). Be direct and useful. Return plain text only, no preamble.`);
      } catch { /* skip */ }
      setGeneratingAction(false);
    }

    await onAddAction({
      action_type: form.action_type,
      title: form.title,
      description: form.description,
      consent_tier: form.consent_tier,
      status: 'pending',
      ai_output: aiOutput,
      user_feedback: '',
      regret_logged: false,
      confidence_score: 0.8,
      context_memory_ids: [],
      scheduled_for: null,
      completed_at: null,
    });
    setForm({ title: '', description: '', action_type: 'reminder', consent_tier: 'draft_review' });
    setShowAdd(false);
  }, [form, onAddAction, getAI, addToast]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Action Queue</h2>
          <p className="text-white/40 text-sm mt-0.5">{pendingCount} pending · {regretRate}% regret rate</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-all text-white/60 text-sm">
          <Plus size={14} /> New Action
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {Object.entries(tierConfig).map(([tier, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={tier} className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} style={{ color: cfg.color }} />
                <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
              </div>
              <p className="text-white/30 text-xs">{cfg.desc}</p>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-white/[0.1] bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm font-medium">New Action</span>
            <button onClick={() => setShowAdd(false)} className="text-white/30 hover:text-white/50"><X size={14} /></button>
          </div>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Action title" className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 outline-none" />
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description / context" className="w-full h-16 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-white/70 text-sm placeholder-white/20 resize-none outline-none" />
          <div>
            <span className="text-white/30 text-xs mb-1.5 block">Action type</span>
            <div className="flex flex-wrap gap-1.5">
              {actionTypes.map(t => (
                <button key={t} onClick={() => setForm(p => ({ ...p, action_type: t }))}
                  className={`px-2.5 py-1 rounded-lg text-xs border capitalize transition-all ${form.action_type === t ? 'bg-white/10 text-white/80 border-white/20' : 'text-white/30 border-white/10 hover:border-white/20'}`}>
                  {t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-white/30 text-xs mb-1.5 block">Consent tier</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(tierConfig).map(([tier, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button key={tier} onClick={() => setForm(p => ({ ...p, consent_tier: tier as ConsentTier }))}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all"
                    style={form.consent_tier === tier ? { background: cfg.color + '15', borderColor: cfg.color + '40', color: cfg.color } : { color: 'rgba(255,255,255,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Icon size={11} />{cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-white/40 text-sm">Cancel</button>
            <button onClick={handleCreateAction} disabled={generatingAction} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(16,185,129,0.3))', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
              {generatingAction ? <><div className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />Generating...</> : <><Sparkles size={12} />Create & Draft</>}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {(['pending', 'completed', 'all'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs capitalize transition-all ${filter === f ? 'bg-white/10 text-white/80' : 'text-white/30 hover:text-white/50'}`}>
            {f === 'pending' ? `Pending (${pendingCount})` : f === 'completed' ? `History (${actions.filter(a => a.status !== 'pending').length})` : `All (${actions.length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-white/25 text-sm">No actions for this filter</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(action => {
            const tier = tierConfig[action.consent_tier];
            const TierIcon = tier.icon;
            const isExpanded = expandedId === action.id;

            return (
              <div key={action.id} className={`rounded-2xl border transition-all duration-200 ${isExpanded ? 'border-white/[0.12] bg-white/[0.04]' : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'}`}>
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : action.id)}>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: tier.color + '15', border: `1px solid ${tier.color}30` }}>
                      <TierIcon size={13} style={{ color: tier.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/80 text-sm font-medium">{action.title}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-md border ${statusColors[action.status]}`}>{action.status}</span>
                        {action.regret_logged && <span className="text-orange-400/70 text-xs">regretted</span>}
                      </div>
                      <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{action.description}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-white/25 text-xs" style={{ color: tier.color + 'cc' }}>{tier.label}</span>
                        <span className="text-white/15 text-xs">·</span>
                        <span className="text-white/25 text-xs">{Math.round(action.confidence_score * 100)}% confidence</span>
                        <span className="text-white/15 text-xs">·</span>
                        <span className="text-white/20 text-xs capitalize">{action.action_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-white/20">{isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="h-px bg-white/[0.05]" />
                    <p className="text-white/50 text-sm leading-relaxed">{action.description}</p>

                    {action.ai_output && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles size={12} className="text-amber-400" />
                          <span className="text-white/30 text-xs uppercase tracking-wide">AI Output</span>
                        </div>
                        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                          <p className="text-white/65 text-sm leading-relaxed whitespace-pre-wrap">{action.ai_output}</p>
                        </div>
                      </div>
                    )}

                    {action.user_feedback && (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-white/30 text-xs">Your feedback: </span>
                        <span className="text-white/50 text-xs">{action.user_feedback}</span>
                      </div>
                    )}

                    {action.completed_at && (
                      <p className="text-white/20 text-xs">Completed: {new Date(action.completed_at).toLocaleString()}</p>
                    )}

                    <div className="flex gap-2 flex-wrap justify-end">
                      {action.status === 'pending' && (
                        <>
                          <button onClick={() => onReject(action.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 transition-all">
                            <XCircle size={13} /> Reject
                          </button>
                          <button onClick={() => onApprove(action.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 transition-all">
                            <CheckCircle size={13} /> Approve & Execute
                          </button>
                        </>
                      )}
                      {action.status === 'completed' && !action.regret_logged && (
                        <button onClick={() => onRegret(action.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-orange-400 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/15 transition-all">
                          <ThumbsDown size={13} /> Log Regret
                        </button>
                      )}
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
